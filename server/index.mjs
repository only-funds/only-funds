import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const { app, close } = createApp({
  dataDir: process.env.DATA_DIR || path.join(here, 'data'),
  secret: process.env.SESSION_SECRET,
  studentInvite: process.env.STUDENT_INVITE_CODE,
  bossInvite: process.env.BOSS_INVITE_CODE,
  labName: process.env.LAB_NAME || 'My Research Lab',
  origins: (process.env.ALLOWED_ORIGINS || 'http://127.0.0.1:5173,http://localhost:5173').split(',').map(s => s.trim()),
  trustProxy: process.env.TRUST_PROXY === '1',
});
const server = app.listen(Number(process.env.PORT || 8787), process.env.HOST || '127.0.0.1', () => console.log(`OnlyFunds API ready on port ${server.address().port}`));
function stop() { server.close(() => { close(); process.exit(0); }); }
process.on('SIGTERM', stop); process.on('SIGINT', stop);
