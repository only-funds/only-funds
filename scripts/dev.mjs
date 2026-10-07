import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
if (!existsSync('server/.env')) {
  console.error('Run npm run setup first to generate the lab configuration.');
  process.exit(1);
}
const children = [spawn(process.execPath, ['--env-file=server/.env', 'server/index.mjs'], { stdio: 'inherit' }), spawn('npm', ['run', 'dev', '--workspace', '@onlyfunds/client'], { stdio: 'inherit' })];
let stopping = false;
function stop(code = 0) { if (stopping) return; stopping = true; children.forEach(child => child.kill('SIGTERM')); process.exitCode = code; }
children.forEach(child => child.on('exit', code => stop(code ?? 0)));
process.on('SIGINT', () => stop()); process.on('SIGTERM', () => stop());
