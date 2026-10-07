import { randomBytes } from 'node:crypto';
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const target = fileURLToPath(new URL('.env', import.meta.url));
if (existsSync(target)) { console.log('server/.env already exists; preserved.'); process.exit(0); }
const secret = () => randomBytes(24).toString('hex');
writeFileSync(target, `LAB_NAME="My Research Lab"\nSESSION_SECRET=${secret()}\nSTUDENT_INVITE_CODE=${secret()}\nBOSS_INVITE_CODE=${secret()}\nALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173,https://only-funds.github.io\nLAB_DOMAIN=serve.mylab.org\nACME_EMAIL=admin@mylab.org\nPORT=8787\n`, { mode: 0o600, flag: 'wx' });
console.log('Created server/.env with unique secrets. Read it locally to obtain invite codes. Never commit it.');
