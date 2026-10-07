import { randomUUID } from 'node:crypto';
// Community settings and durable subscription terms. Account permissions stay in users.role.
export const DEFAULT_PLANS = [{ id: 'standard', name: '一起做研究', monthlyUsd: 0, description: '追更研究动态，一起交流新点子。' }];
export const isStudent = u => ['phd', 'masters', 'undergrad'].includes(u.academic_type);
export function migrateCommunity(db) {
  if (db.prepare('PRAGMA user_version').get().user_version >= 2) return;
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`ALTER TABLE users ADD COLUMN academic_type TEXT NOT NULL DEFAULT 'phd';
      ALTER TABLE users ADD COLUMN study_year INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE users ADD COLUMN is_exchange INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN avatar_id TEXT REFERENCES media(id);
      ALTER TABLE users ADD COLUMN plans TEXT NOT NULL DEFAULT '[]';
      ALTER TABLE users ADD COLUMN student_offer INTEGER NOT NULL DEFAULT 0;
      UPDATE users SET academic_type='pi' WHERE role='boss';
      ALTER TABLE subscriptions ADD COLUMN plan_snapshot TEXT;
      ALTER TABLE subscriptions ADD COLUMN expires_at TEXT;
      ALTER TABLE subscriptions ADD COLUMN student_offer INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE rewards ADD COLUMN reward_snapshot TEXT;
      CREATE TABLE student_offers (user_id TEXT NOT NULL REFERENCES users(id), creator_id TEXT NOT NULL REFERENCES users(id), claimed_at TEXT NOT NULL, PRIMARY KEY(user_id,creator_id));
      CREATE TABLE custom_rewards (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), emoji TEXT NOT NULL, unit TEXT NOT NULL, description TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE INDEX subscriptions_creator ON subscriptions(creator_id);
      PRAGMA user_version=2; COMMIT;`);
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}
export function registerCommunity({ app, one, all, run, db, userView, fail, str, defaults, syncPeriods }) {
  const findUser = userId => { const user = one('SELECT * FROM users WHERE id=?', userId); if (!user) fail(404, '组员不存在'); return user; };
  app.patch('/api/me/settings', (req, res) => {
    const { academicType, year, exchange, plans, studentOffer, avatarId } = req.body;
    if (!(req.user.role === 'boss' ? academicType === 'pi' : ['postdoc','phd','masters','undergrad'].includes(academicType))) fail(400, '请选择与账号身份相符的类型');
    if (!Number.isInteger(year) || year < 1 || year > 12) fail(400, '年级需为 1–12');
    if (typeof exchange !== 'boolean' || typeof studentOffer !== 'boolean') fail(400, '交换生和活动开关需为布尔值');
    if (!Array.isArray(plans) || plans.length < 1 || plans.length > 5) fail(400, '请设置 1–5 个订阅计划');
    const ids = new Set();
    const validated = plans.map(p => {
      if (!p || typeof p !== 'object') fail(400, '计划格式无效');
      const planId = str(p.id, '计划 ID', 60); if (!/^[a-zA-Z0-9_-]+$/.test(planId) || planId === 'student-offer' || ids.has(planId)) fail(400, '计划 ID 无效或重复'); ids.add(planId);
      if (!Number.isInteger(p.monthlyUsd) || Math.abs(p.monthlyUsd) > 100000) fail(400, '月费需为 -100000 到 100000 之间的整数美元');
      return { id: planId, name: str(p.name, '计划名', 30), monthlyUsd: p.monthlyUsd, description: str(p.description, '计划说明', 160, 0) };
    });
    let avatar = req.user.avatar_id;
    if (avatarId !== undefined) { const media = one("SELECT * FROM media WHERE id=? AND owner_id=? AND mime='image/webp'", String(avatarId), req.user.id); if (!media) fail(400, '请先通过头像接口上传自己的图片'); avatar = media.id; }
    run('UPDATE users SET academic_type=?,study_year=?,is_exchange=?,plans=?,student_offer=?,avatar_id=? WHERE id=?', academicType, year, +exchange, JSON.stringify(validated), +studentOffer, avatar, req.user.id);
    res.json(userView(findUser(req.user.id), req.user.id));
  });
  app.get('/api/creators/:id/followers', (req, res) => {
    findUser(req.params.id);
    res.json(all('SELECT u.* FROM users u JOIN subscriptions s ON s.user_id=u.id WHERE s.creator_id=? AND (s.expires_at IS NULL OR s.expires_at>?) ORDER BY u.name', req.params.id, new Date().toISOString()).map(u => userView(u, req.user.id)));
  });
  app.post('/api/creators/:id/subscribe', (req, res) => {
    const target = findUser(req.params.id); if (target.id === req.user.id) fail(400, '不能订阅自己');
    if (typeof req.body.active !== 'boolean') fail(400, 'active 必须是布尔值');
    syncPeriods(req.user.id);
    if (!req.body.active) { run('DELETE FROM subscriptions WHERE user_id=? AND creator_id=?', req.user.id, target.id); return res.json(userView(target, req.user.id)); }
    const plans = JSON.parse(target.plans); const available = plans.length ? plans : DEFAULT_PLANS;
    const planId = req.body.planId;
    let plan = available.find(p => p.id === planId); let expires = null; const offer = planId === 'student-offer';
    const existing = one('SELECT * FROM subscriptions WHERE user_id=? AND creator_id=?', req.user.id, target.id);
    if (offer) {
      if (!isStudent(req.user) || !isStudent(target) || !target.student_offer) fail(403, '这个活动仅限开启活动的学生之间订阅');
      const claimed = one('SELECT 1 FROM student_offers WHERE user_id=? AND creator_id=?', req.user.id, target.id);
      if (claimed) {
        if (existing?.student_offer && existing.expires_at > new Date().toISOString()) return res.json(userView(target, req.user.id));
        fail(409, '你已经领取过这位组员的免费活动');
      }
      plan = { id: 'student-offer', name: '限时免费 · 同门蹭学', monthlyUsd: 0, description: '免费追更 7 天，到期自动结束，不会自动转为付费计划。' };
      expires = new Date(Date.now() + 7 * 86400000).toISOString();
    } else if (!plan) {
      // Older clients may still follow the default free plan; never pick a paid plan implicitly.
      if (!planId && available.length === 1 && available[0].monthlyUsd === 0) plan = available[0];
      else fail(400, '请选择有效的订阅计划');
    }
    if (!offer && existing && !existing.student_offer && existing.plan_snapshot && JSON.parse(existing.plan_snapshot).id === plan.id) return res.json(userView(target, req.user.id));
    db.exec('BEGIN IMMEDIATE');
    try {
      run('INSERT INTO subscriptions (user_id,creator_id,plan_snapshot,expires_at,student_offer,started_at,series_id) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id,creator_id) DO UPDATE SET plan_snapshot=excluded.plan_snapshot,expires_at=excluded.expires_at,student_offer=excluded.student_offer,started_at=excluded.started_at,series_id=excluded.series_id', req.user.id, target.id, JSON.stringify(plan), expires, +offer, new Date().toISOString(), randomUUID());
      if (offer) run('INSERT INTO student_offers VALUES(?,?,?)', req.user.id, target.id, new Date().toISOString());
      syncPeriods(req.user.id);
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    res.json(userView(target, req.user.id));
  });
  const rewardView = r => ({ id: r.id, emoji: r.emoji, unit: r.unit, name: r.description, description: r.description, value: `1 ${r.unit}`, custom: true });
  const rewardCatalog = userId => [...defaults, ...all('SELECT * FROM custom_rewards WHERE owner_id=? ORDER BY created_at DESC', userId).map(rewardView)];
  app.get('/api/reward-catalog', (req, res) => res.json(rewardCatalog(req.user.id)));
  app.post('/api/reward-catalog', (req, res) => {
    if (one('SELECT count(*) n FROM custom_rewards WHERE owner_id=?', req.user.id).n >= 30) fail(400, '最多自定义 30 种奖励');
    const emoji = str(req.body.emoji, 'Emoji', 20); const unit = str(req.body.unit, '量词', 8); const description = str(req.body.description, '奖励介绍', 40);
    if ([...new Intl.Segmenter().segment(emoji)].length !== 1 || !/[\p{Extended_Pictographic}\p{Regional_Indicator}]/u.test(emoji)) fail(400, '请选择一个 Emoji');
    const reward = { id: randomUUID(), emoji, unit, description };
    run('INSERT INTO custom_rewards VALUES(?,?,?,?,?,?)', reward.id, req.user.id, emoji, unit, description, new Date().toISOString());
    res.status(201).json(rewardView(reward));
  });
  app.delete('/api/reward-catalog/:id', (req, res) => { run('DELETE FROM custom_rewards WHERE id=? AND owner_id=?', req.params.id, req.user.id); res.status(204).end(); });
  return { rewardCatalog };
}
