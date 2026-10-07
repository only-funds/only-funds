import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import sharp from 'sharp';
import { rm } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash, createHmac, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync, openSync, readSync, closeSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { DEFAULT_PLANS, isStudent, migrateCommunity, registerCommunity } from './community.mjs';
import { migrateLedger, registerLedger } from './ledger.mjs';

const derive = promisify(scrypt);
const hash = value => createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();
const id = () => randomUUID();
export const REWARDS = [
  { id: 'coffee', emoji: '☕', name: '续命咖啡', description: '一杯星巴克，拯救下一轮实验', value: '1 杯' },
  { id: 'tokens', emoji: '⚡', name: 'Token 自由', description: '老板报销的 OpenAI API 额度', value: '$100' },
  { id: 'meeting', emoji: '🏝️', name: '组会免战牌', description: '一次不用做 slides 的快乐', value: '1 次' },
  { id: 'gpu', emoji: '🖥️', name: 'GPU 包夜', description: '今晚，这张卡只属于你', value: '24 小时' },
  { id: 'review', emoji: '📝', name: '极速改稿券', description: '老板承诺 48 小时内给反馈', value: '48 小时' },
  { id: 'boba', emoji: '🧋', name: '全糖快乐', description: '奶茶里的糖不算实验误差', value: '1 杯' },
  { id: 'sleep', emoji: '😴', name: '睡到自然醒', description: '一个没有早会的上午', value: '半天' },
  { id: 'dinner', emoji: '🍜', name: '深夜食堂', description: '让实验有结果，让胃有着落', value: '1 顿' },
];
class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new ApiError(status, message); };
function str(value, field, max, min = 1) { if (typeof value !== 'string' || value.trim().length < min || value.length > max) fail(400, `${field}需为 ${min}–${max} 个字符`); return value.trim(); }
function safeEqual(a, b) { return typeof a === 'string' && typeof b === 'string' && timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b))); }
function sourceList(value) {
  if (!Array.isArray(value) || value.length > 12) fail(400, '来源最多 12 条');
  return value.map(item => { const label = str(item.label, '来源标题', 160); const url = str(item.url, '来源链接', 2048); let parsed; try { parsed = new URL(url); } catch { fail(400, '来源链接无效'); } if (!['https:', 'http:'].includes(parsed.protocol)) fail(400, '来源必须为 HTTP(S) 链接'); return { label, url }; });
}
export function createApp(config) {
  if (!config.secret || config.secret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters');
  if (!config.studentInvite || !config.bossInvite || config.studentInvite === config.bossInvite) throw new Error('Distinct student and boss invite codes are required');
  mkdirSync(config.dataDir, { recursive: true });
  const uploads = path.join(config.dataDir, 'uploads'); mkdirSync(uploads, { recursive: true });
  const db = new DatabaseSync(path.join(config.dataDir, 'onlyfunds.sqlite'));
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('creator','boss')), bio TEXT NOT NULL DEFAULT '', field TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tokens (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT NULL, name TEXT NOT NULL DEFAULT '', expires_at INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), filename TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, author_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, body TEXT NOT NULL, kind TEXT NOT NULL, tags TEXT NOT NULL, sources TEXT NOT NULL DEFAULT '[]', media_id TEXT REFERENCES media(id), poster_id TEXT REFERENCES media(id), created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reactions (user_id TEXT NOT NULL REFERENCES users(id), post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, kind TEXT NOT NULL CHECK(kind IN ('like','save')), PRIMARY KEY(user_id,post_id,kind));
    CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE, body TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS subscriptions (user_id TEXT NOT NULL REFERENCES users(id), creator_id TEXT NOT NULL REFERENCES users(id), PRIMARY KEY(user_id,creator_id));
    CREATE TABLE IF NOT EXISTS rewards (id TEXT PRIMARY KEY, sender_id TEXT NOT NULL REFERENCES users(id), recipient_id TEXT NOT NULL REFERENCES users(id), post_id TEXT REFERENCES posts(id) ON DELETE SET NULL, reward_id TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'promised', created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS posts_created ON posts(created_at);
    CREATE INDEX IF NOT EXISTS comments_post ON comments(post_id);
    CREATE INDEX IF NOT EXISTS tokens_user ON tokens(user_id);
    `);
  migrateCommunity(db);
  migrateLedger(db);
  const one = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const userView = (u, viewer) => {
    const current = now();
    const subscription = one('SELECT * FROM subscriptions WHERE user_id=? AND creator_id=? AND (expires_at IS NULL OR expires_at>?)', viewer || '', u.id, current);
    const plans = JSON.parse(u.plans);
    const viewing = viewer ? one('SELECT * FROM users WHERE id=?', viewer) : null;
    return { id: u.id, name: u.name, role: u.role, bio: u.bio, field: u.field, createdAt: u.created_at,
      academicType:u.academic_type,year:u.study_year,exchange:!!u.is_exchange,avatarUrl:signMedia(u.avatar_id),plans:plans.length?plans:DEFAULT_PLANS,studentOffer:!!u.student_offer,
      studentOfferAvailable:!!(viewing && isStudent(viewing) && isStudent(u) && u.student_offer && (!one('SELECT 1 FROM student_offers WHERE user_id=? AND creator_id=?',viewer,u.id)||subscription?.student_offer)),
      postCount:one('SELECT count(*) n FROM posts WHERE author_id=?',u.id).n,
      followerCount:one('SELECT count(*) n FROM subscriptions WHERE creator_id=? AND (expires_at IS NULL OR expires_at>?)',u.id,current).n,
      following:!!subscription,subscription:subscription?{plan:subscription.plan_snapshot?JSON.parse(subscription.plan_snapshot):DEFAULT_PLANS[0],studentOffer:!!subscription.student_offer,expiresAt:subscription.expires_at}:null };
  };
  const signMedia = mediaId => {
    if (!mediaId) return null;
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const signature = createHmac('sha256', config.secret).update(`${mediaId}:${expires}`).digest('hex');
    return `/api/media/${mediaId}?expires=${expires}&signature=${signature}`;
  };
  const postView = (p, viewer) => ({ id: p.id, author: userView(one('SELECT * FROM users WHERE id=?', p.author_id), viewer), title: p.title, body: p.body, kind: p.kind, tags: JSON.parse(p.tags), sources: JSON.parse(p.sources), mediaUrl: signMedia(p.media_id), posterUrl: signMedia(p.poster_id), createdAt: p.created_at, likes: one("SELECT count(*) n FROM reactions WHERE post_id=? AND kind='like'", p.id).n, liked: !!one("SELECT 1 FROM reactions WHERE post_id=? AND user_id=? AND kind='like'", p.id, viewer), saved: !!one("SELECT 1 FROM reactions WHERE post_id=? AND user_id=? AND kind='save'", p.id, viewer), comments: all('SELECT c.*, u.name, u.role, u.avatar_id FROM comments c JOIN users u ON u.id=c.user_id WHERE post_id=? ORDER BY created_at LIMIT 100', p.id).map(c => ({ id: c.id, body: c.body, createdAt: c.created_at, author: { id: c.user_id, name: c.name, role: c.role, avatarUrl: signMedia(c.avatar_id) } })), rewardCount: one('SELECT count(*) n FROM rewards WHERE post_id=?', p.id).n });
  const issueToken = (userId, kind, name = '') => {
    const token = `of_${randomBytes(32).toString('hex')}`;
    run('INSERT INTO tokens VALUES(?,?,?,?,?,?)', hash(token), userId, kind, name, Date.now() + (kind === 'session' ? 30 : 90) * 86400000, now());
    return token;
  };
  const app = express(); app.disable('x-powered-by');
  // Direct traffic is never trusted as a proxy. Enable only for the single Caddy hop.
  if (config.trustProxy) app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  const origins = config.origins || ['http://localhost:5173', 'http://127.0.0.1:5173'];
  app.use((req, res, next) => { if (req.headers.origin && !origins.includes(req.headers.origin)) return res.status(403).json({ error: '此客户端域名尚未加入服务器 ALLOWED_ORIGINS' }); next(); });
  app.use(cors({ origin: origins, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
  app.use(express.json({ limit: '256kb' }));
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const buckets = new Map();
  function limit(scope, maximum) { return (req, res, next) => {
    const key = `${scope}:${req.ip}`; const time = Date.now();
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.until < time) buckets.delete(k);
    const bucket = buckets.get(key) || { count: 0, until: time + 60000 };
    if (bucket.until < time) { bucket.count = 0; bucket.until = time + 60000; }
    bucket.count++; buckets.set(key, bucket);
    if (bucket.count > maximum) return res.status(429).set('Retry-After', '60').json({ error: '操作太频繁，请稍后再试' }); next();
  }; }
  app.use('/api', limit('api', 300));
  app.get('/api/health', (_req, res) => res.json({ service: 'onlyfunds', version: '0.1.0', labName: config.labName || 'My Research Lab', maxUploadMB: 100 }));
  app.use('/api/auth', limit('auth', 12));
  app.post('/api/auth/register', async (req, res) => {
    const name = str(req.body.name, '名字', 60); const email = str(req.body.email, '邮箱', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, '请输入有效邮箱');
    const password = str(req.body.password, '密码', 128, 10);
    const role = safeEqual(req.body.inviteCode, config.bossInvite) ? 'boss' : safeEqual(req.body.inviteCode, config.studentInvite) ? 'creator' : null;
    if (!role) fail(403, '邀请码不正确，请联系实验室管理员');
    const salt = randomBytes(16).toString('hex'); const key = (await derive(password, salt, 64)).toString('hex');
    const userId = id();
    try { run('INSERT INTO users (id,email,password,name,role,created_at) VALUES (?,?,?,?,?,?)', userId, email, `${salt}:${key}`, name, role, now()); } catch (err) { if (String(err).includes('UNIQUE')) fail(409, '这个邮箱已注册'); throw err; }
    run('UPDATE users SET academic_type=? WHERE id=?', role === 'boss' ? 'pi' : 'phd', userId);
    res.status(201).json({ token: issueToken(userId, 'session'), user: userView(one('SELECT * FROM users WHERE id=?', userId), userId) });
  });
  app.post('/api/auth/login', async (req, res) => {
    const email = str(req.body.email, '邮箱', 254).toLowerCase(); const password = str(req.body.password, '密码', 128);
    const user = one('SELECT * FROM users WHERE email=?', email);
    const [salt, expected] = (user?.password || `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
    const actual = (await derive(password, salt, 64)).toString('hex');
    if (!user || !safeEqual(actual, expected)) fail(401, '邮箱或密码不正确');
    res.json({ token: issueToken(user.id, 'session'), user: userView(user, user.id) });
  });
  // Signed, expiring media URLs support native video seeking without exposing session tokens.
  app.get('/api/media/:id', (req, res) => {
    const expires = Number(req.query.expires); const signature = String(req.query.signature || '');
    if (!Number.isInteger(expires) || expires < Date.now() / 1000 || expires > Date.now() / 1000 + 3610) fail(401, '媒体链接已过期，请刷新动态');
    const expected = createHmac('sha256', config.secret).update(`${req.params.id}:${expires}`).digest('hex');
    if (!safeEqual(signature, expected)) fail(401, '媒体链接无效');
    const media = one('SELECT * FROM media WHERE id=?', req.params.id); if (!media) fail(404, '媒体不存在');
    res.type(media.mime).sendFile(media.filename, { root: uploads, dotfiles: 'deny', headers: { 'Cache-Control': 'private, max-age=300' } });
  });
  app.use('/api', (req, _res, next) => {
    const token = req.headers.authorization?.replace(/^Bearer /, '') || '';
    const session = one('SELECT * FROM tokens WHERE hash=? AND expires_at>?', hash(token), Date.now());
    if (!session) fail(401, '请先登录实验室');
    req.auth = session; req.user = one('SELECT * FROM users WHERE id=?', session.user_id);
    if (session.kind === 'creator' && !(req.method === 'GET' || (req.method === 'POST' && ['/posts', '/media'].includes(req.path)))) fail(403, '创作者密钥仅允许读取和发布内容');
    next();
  });
  const creator = req => { if (req.user.role !== 'creator') fail(403, '只有创作者可以发布科研内容'); };
  const getPost = postId => { const p = one('SELECT * FROM posts WHERE id=?', postId); if (!p) fail(404, '动态不存在'); return p; };
  app.get('/api/me', (req, res) => res.json(userView(req.user, req.user.id)));
  app.patch('/api/me', (req, res) => { const name = str(req.body.name, '名字', 60); const bio = str(req.body.bio || '', '简介', 500, 0); const field = str(req.body.field || '', '研究方向', 100, 0); run('UPDATE users SET name=?,bio=?,field=? WHERE id=?', name, bio, field, req.user.id); res.json(userView(one('SELECT * FROM users WHERE id=?', req.user.id), req.user.id)); });
  app.post('/api/auth/logout', (req, res) => { run('DELETE FROM tokens WHERE hash=?', req.auth.hash); res.status(204).end(); });
  const {syncPeriods} = registerLedger({app,db,one,all,run,fail,str,defaults:REWARDS});
  const {rewardCatalog} = registerCommunity({app,db,one,all,run,userView,fail,str,defaults:REWARDS,syncPeriods});
  app.get('/api/creators', (req,res) => res.json(all('SELECT * FROM users ORDER BY created_at DESC').map(u => userView(u,req.user.id))));
  app.get('/api/posts', (req, res) => {
    const filters = []; const args = [];
    if (req.query.feed === 'following') { filters.push('p.author_id IN (SELECT creator_id FROM subscriptions WHERE user_id=? AND (expires_at IS NULL OR expires_at>?))'); args.push(req.user.id,now()); }
    if (req.query.feed === 'saved') { filters.push("p.id IN (SELECT post_id FROM reactions WHERE user_id=? AND kind='save')"); args.push(req.user.id); }
    if (req.query.author) { filters.push('p.author_id=?'); args.push(String(req.query.author)); }
    if (req.query.q) { filters.push('(p.title LIKE ? OR p.body LIKE ? OR p.tags LIKE ?)'); const q = `%${String(req.query.q).slice(0,100)}%`; args.push(q,q,q); }
    const limitCount = Math.min(50, Math.max(1, Number(req.query.limit) || 30)); const offset = Math.min(100000, Math.max(0, Number(req.query.offset) || 0));
    res.json(all(`SELECT p.* FROM posts p ${filters.length ? 'WHERE ' + filters.join(' AND ') : ''} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`, ...args, limitCount, offset).map(p => postView(p, req.user.id)));
  });
  app.get('/api/posts/:id', (req, res) => res.json(postView(getPost(req.params.id), req.user.id)));
  app.post('/api/posts', (req, res) => {
    creator(req); const title = str(req.body.title, '标题', 160); const body = str(req.body.body, '正文', 20000);
    const kind = req.body.kind || 'note'; if (!['note','video','paper'].includes(kind)) fail(400, '内容类型无效');
    const tags = req.body.tags || []; if (!Array.isArray(tags) || tags.length > 6) fail(400, '最多 6 个标签'); tags.forEach(t => str(t, '标签', 30));
    const sources = sourceList(req.body.sources || []);
    const ownedMedia = (mediaId, prefix) => { if (!mediaId) return null; const m = one('SELECT * FROM media WHERE id=? AND owner_id=?', String(mediaId), req.user.id); if (!m || !m.mime.startsWith(prefix)) fail(400, '请先上传自己的有效媒体文件'); return m.id; };
    const mediaId = ownedMedia(req.body.mediaId, 'video/'); const posterId = ownedMedia(req.body.posterId, 'image/'); if (kind === 'video' && !mediaId) fail(400, '视频动态需要上传视频');
    const postId = id(); run('INSERT INTO posts VALUES(?,?,?,?,?,?,?,?,?,?)', postId, req.user.id, title, body, kind, JSON.stringify(tags), JSON.stringify(sources), mediaId, posterId, now());
    res.status(201).json(postView(getPost(postId), req.user.id));
  });
  app.delete('/api/posts/:id', (req, res) => { const p = getPost(req.params.id); if (p.author_id !== req.user.id) fail(403, '只能删除自己的动态'); run('DELETE FROM posts WHERE id=?', p.id); res.status(204).end(); });
  app.post('/api/posts/:id/reactions', (req, res) => {
    const p = getPost(req.params.id); const { kind, active } = req.body; if (!['like','save'].includes(kind) || typeof active !== 'boolean') fail(400, '操作无效');
    if (active) run('INSERT OR IGNORE INTO reactions VALUES(?,?,?)', req.user.id, p.id, kind); else run('DELETE FROM reactions WHERE user_id=? AND post_id=? AND kind=?', req.user.id, p.id, kind);
    res.json(postView(p, req.user.id));
  });
  app.post('/api/posts/:id/comments', (req, res) => { const p = getPost(req.params.id); const body = str(req.body.body, '评论', 3000); run('INSERT INTO comments VALUES(?,?,?,?,?)', id(), req.user.id, p.id, body, now()); res.status(201).json(postView(p, req.user.id)); });
  app.post('/api/rewards', (req, res) => {
    if (req.user.role !== 'boss') fail(403, '只有老板可以发放奖励'); const p = getPost(str(req.body.postId, '动态 ID', 60));
    const reward = rewardCatalog(req.user.id).find(r => r.id === req.body.rewardId); if (!reward) fail(400, '奖励不存在'); const message = str(req.body.message || '', '寄语', 500, 0);
    const rewardId = id(); run('INSERT INTO rewards (id,sender_id,recipient_id,post_id,reward_id,message,status,created_at,reward_snapshot) VALUES(?,?,?,?,?,?,?,?,?)', rewardId, req.user.id, p.author_id, p.id, req.body.rewardId, message, 'promised', now(), JSON.stringify(reward));
    res.status(201).json({ id: rewardId, status: 'promised' });
  });
  app.get('/api/tokens', (req, res) => res.json(all("SELECT rowid id,name,created_at createdAt,expires_at expiresAt FROM tokens WHERE user_id=? AND kind='creator' AND expires_at>?", req.user.id, Date.now())));
  app.post('/api/tokens', (req, res) => { creator(req); const name = str(req.body.name, '密钥名称', 60); if (one("SELECT count(*) n FROM tokens WHERE user_id=? AND kind='creator' AND expires_at>?", req.user.id, Date.now()).n >= 10) fail(400, '最多 10 个有效密钥'); res.status(201).json({ token: issueToken(req.user.id, 'creator', name) }); });
  app.delete('/api/tokens/:id', (req, res) => { run("DELETE FROM tokens WHERE rowid=? AND user_id=? AND kind='creator'", req.params.id, req.user.id); res.status(204).end(); });
  const avatarUpload = multer({ storage: multer.diskStorage({ destination: uploads, filename: (_req,_file,cb)=>cb(null,id()) }), limits:{fileSize:2*1024*1024,files:1,fields:0}, fileFilter:(_req,file,cb)=>cb(null,['image/png','image/jpeg','image/webp'].includes(file.mimetype)) });
  app.post('/api/avatar', avatarUpload.single('file'), async (req,res) => {
    const f=req.file;if(!f)fail(400,'头像支持 PNG、JPEG、WebP，最大 2 MB');
    const mediaId=id(),filename=id(),destination=path.join(uploads,filename);
    try {
      const metadata=await sharp(f.path,{limitInputPixels:16000000}).metadata();
      if(!['png','jpeg','webp'].includes(metadata.format))fail(400,'头像格式无效');
      const info=await sharp(f.path,{limitInputPixels:16000000}).rotate().resize(320,320,{fit:'cover',withoutEnlargement:true}).webp({quality:78}).toFile(destination);
      run('INSERT INTO media VALUES(?,?,?,?,?,?)',mediaId,req.user.id,filename,'image/webp',info.size,now());
      res.status(201).json({id:mediaId,url:signMedia(mediaId),mime:'image/webp',size:info.size});
    } catch(e) { await rm(destination,{force:true});if(e instanceof ApiError)throw e;fail(400,'头像无法读取，请使用 1600 万像素以内的有效图片'); }
    finally { await rm(f.path,{force:true}); }
  });
  const upload = multer({ storage: multer.diskStorage({ destination: uploads, filename: (_req, _file, cb) => cb(null, id()) }), limits: { fileSize: 100 * 1024 * 1024, files: 1, fields: 0 }, fileFilter: (_req, file, cb) => cb(null, ['video/mp4', 'video/webm', 'image/jpeg', 'image/png'].includes(file.mimetype)) });
  app.post('/api/media', upload.single('file'), (req, res) => {
    const f = req.file; if (!f) fail(400, '支持 MP4、WebM、PNG、JPEG，最大 100 MB');
    if (req.user.role === 'boss' && !f.mimetype.startsWith('image/')) { unlinkSync(f.path); fail(403, '老板账号可上传头像图片，视频由创作者发布'); }
    // Validate actual magic bytes, not just the client-controlled MIME type.
    const b = Buffer.alloc(16); const fd = openSync(f.path, 'r'); try { readSync(fd, b, 0, 16, 0); } finally { closeSync(fd); }
    const valid = f.mimetype === 'video/mp4' ? b.subarray(4,8).toString() === 'ftyp' : f.mimetype === 'video/webm' ? b.subarray(0,4).toString('hex') === '1a45dfa3' : f.mimetype === 'image/png' ? b.subarray(0,8).toString('hex') === '89504e470d0a1a0a' : b.subarray(0,3).toString('hex') === 'ffd8ff';
    if (!valid) { unlinkSync(f.path); fail(400, '文件内容与格式不符'); }
    const mediaId = id(); run('INSERT INTO media VALUES(?,?,?,?,?,?)', mediaId, req.user.id, f.filename, f.mimetype, f.size, now()); res.status(201).json({ id: mediaId, url: signMedia(mediaId), mime: f.mimetype, size: f.size });
  });
  app.use('/api', (_req, _res) => fail(404, 'API 不存在'));
  app.use((err, _req, res, _next) => { if (err instanceof multer.MulterError) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? _req.path === '/api/avatar' ? '头像不能超过 2 MB' : '文件不能超过 100 MB' : '上传格式错误' }); const status = err.status || 500; if (status >= 500) console.error(err); res.status(status).json({ error: status >= 500 ? '服务器暂时无法完成操作' : err.message }); });
  return { app, db, close: () => db.close() };
}
