import { execFileSync } from 'node:child_process';
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectPublicFile } from './release-files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length && !(args.length === 1 && args[0] === '--staged') && !(args.length === 2 && args[0] === '--dir')) {
  throw new Error('Usage: npm run audit:release -- [--staged | --dir DIRECTORY]');
}
const staged = args[0] === '--staged';
const directory = args[0] === '--dir' ? path.resolve(root, args[1]) : null;
const secrets = [];
try {
  const env = await readFile(path.join(root, 'server/.env'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^(?:SESSION_SECRET|STUDENT_INVITE_CODE|BOSS_INVITE_CODE)=(.*)$/);
    if (match) secrets.push(match[1].trim().replace(/^(['"])(.*)\1$/, '$2'));
  }
} catch (error) { if (error.code !== 'ENOENT') throw error; }
let files;
if (directory) {
  files = [];
  async function walk(relative = '') {
    for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const name = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) await walk(name); else files.push(name);
    }
  }
  await walk();
} else {
  files = [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', ...(staged ? [] : ['--others', '--exclude-standard'])], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean))];
}
const findings = [];
for (const name of files) {
  let bytes;
  if (staged) {
    const mode = execFileSync('git', ['ls-files', '-s', '--', name], { cwd: root, encoding: 'utf8' }).slice(0, 6);
    if (mode !== '100644' && mode !== '100755') { findings.push({ file: name, rules: ['non-regular Git entry'] }); continue; }
    bytes = execFileSync('git', ['show', `:${name}`], { cwd: root, maxBuffer: 20 * 1024 * 1024 });
  } else {
    const target = path.join(directory || root, name);
    let info;
    try { info = await lstat(target); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (!info.isFile()) { findings.push({ file: name, rules: ['non-regular file'] }); continue; }
    bytes = await readFile(target);
  }
  const rules = inspectPublicFile(name, bytes, secrets);
  if (rules.length) findings.push({ file: name, rules });
}
// Report filenames and rule names only; never print matching content or credentials.
console.log(JSON.stringify({ mode: directory ? 'directory' : staged ? 'git-index' : 'git-candidates', files: files.length, findings }, null, 2));
if (findings.length) process.exitCode = 1;
