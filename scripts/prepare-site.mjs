import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectStaticFiles } from './release-files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'client/dist');
const output = path.join(root, 'output');
const target = path.join(output, 'site');
const files = await collectStaticFiles(source);
await mkdir(output, { recursive: true });
const staging = await mkdtemp(path.join(output, '.site-'));
try {
  for (const name of files) {
    const destination = path.join(staging, name);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(path.join(source, name), destination);
  }
  const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  let commit = 'uncommitted';
  try { commit = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
  await writeFile(path.join(staging, '.nojekyll'), '');
  await writeFile(path.join(staging, 'README.md'), `# 🧪 OnlyFunds · Web App\n\n[🌐 Open App](https://only-funds.github.io) · [📚 Manual](https://only-funds.github.io/manual/) · [🧑‍💻 Source](https://github.com/only-funds/only-funds)\n\nThis repository contains only the public static client and manual. Lab accounts, uploads, databases and credentials belong on each lab's private server. Demo members and research are fictional.\n\n| Release | Source commit |\n| --- | --- |\n| ${version} | ${commit} |\n\nBuild this bundle from the source repository with the documented release workflow. To publish, choose **Settings → Pages → Deploy from a branch → main → / (root)**. The .nojekyll file preserves the manual's static assets.\n`);
  await rm(target, { recursive: true, force: true });
  await rename(staging, target);
  console.log(`Prepared output/site: ${files.length} static files + README.md + .nojekyll (v${version}, ${commit}).`);
} catch (error) { await rm(staging, { recursive: true, force: true }); throw error; }
