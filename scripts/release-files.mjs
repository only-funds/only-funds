import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const privateName = /(^|\/)(?:\.env(?!\.example$)(?:\..*)?|id_rsa[^/]*|id_ed25519[^/]*|[^/]+\.(?:pem|key|p12|pfx|sqlite(?:-.*)?|db(?:-.*)?))$/i;
const privateDirectory = /(^|\/)(?:\.git|node_modules|\.doctrees|\.playwright-cli|playwright-report|test-results|\.venv[^/]*|__pycache__)(\/|$)|^server\/data\//;
const staticExtensions = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.svg', '.webp', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.mp4', '.woff', '.woff2', '.ttf', '.eot', '.txt', '.inv']);
const cacheNames = new Set(['.doctrees', '.buildinfo', '.DS_Store']);

export function inspectPublicFile(name, bytes, secrets = []) {
  const findings = [];
  if (privateName.test(name) || privateDirectory.test(name)) findings.push('private file or cache');
  const text = bytes.toString('utf8');
  const rules = [
    ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
    ['GitHub credential', /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/],
    ['API credential', /sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}/],
    ['cloud access key', /(?:AKIA|ASIA)[A-Z0-9]{16}/],
    ['personal filesystem path', /(?:\/Users\/[^/\s"'<>]+\/|\/home\/[^/\s"'<>]+\/|\/var\/folders\/|[A-Z]:\\Users\\[^\\\s]+\\)/],
  ];
  for (const [label, pattern] of rules) if (pattern.test(text)) findings.push(label);
  if (secrets.some(secret => secret.length >= 12 && bytes.includes(Buffer.from(secret)))) findings.push('local server secret');
  return [...new Set(findings)];
}

// Validate the entire input before creating an output. Never dereference symlinks.
export async function collectStaticFiles(root) {
  const files = [];
  async function walk(relative = '') {
    for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
      const name = path.posix.join(relative, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Refusing symlink: ${name}`);
      if (privateName.test(name)) throw new Error(`Refusing private file: ${name}`);
      if (cacheNames.has(entry.name)) continue;
      if (entry.isFile() && entry.name.endsWith('.map')) continue;
      if (entry.name.startsWith('.') || privateDirectory.test(name)) throw new Error(`Refusing hidden/private path: ${name}`);
      if (entry.isDirectory()) await walk(name);
      else if (entry.isFile() && staticExtensions.has(path.extname(name).toLowerCase())) {
        const findings = inspectPublicFile(name, await readFile(path.join(root, name)));
        if (findings.length) throw new Error(`Refusing ${name}: ${findings.join(', ')}`);
        files.push(name);
      } else throw new Error(`Refusing non-static file: ${name}`);
    }
  }
  if (!(await lstat(root)).isDirectory()) throw new Error('Build input must be a directory');
  await walk();
  for (const required of ['index.html', 'manual/index.html']) {
    if (!files.includes(required)) throw new Error(`Missing ${required}; build the client and manual first`);
  }
  return files.sort();
}
