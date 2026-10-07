import { randomUUID } from 'node:crypto';
import { periodsFor } from '../shared/periods.mjs';
export function migrateLedger(db) {
  if (db.prepare('PRAGMA user_version').get().user_version >= 3) return;
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`ALTER TABLE subscriptions ADD COLUMN started_at TEXT;
      ALTER TABLE subscriptions ADD COLUMN series_id TEXT;
      ALTER TABLE rewards ADD COLUMN used_at TEXT;
      ALTER TABLE rewards ADD COLUMN use_note TEXT NOT NULL DEFAULT '';
      ALTER TABLE rewards ADD COLUMN fulfilled_at TEXT;
      ALTER TABLE rewards ADD COLUMN fulfilled_until TEXT;
      CREATE TABLE subscription_periods (id TEXT PRIMARY KEY, series_id TEXT NOT NULL, period_no INTEGER NOT NULL, subscriber_id TEXT NOT NULL REFERENCES users(id), creator_id TEXT NOT NULL REFERENCES users(id), starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, plan_snapshot TEXT NOT NULL, status TEXT NOT NULL, fulfilled_at TEXT, UNIQUE(series_id,period_no));
      CREATE TABLE notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), reward_id TEXT NOT NULL REFERENCES rewards(id), created_at TEXT NOT NULL, read_at TEXT, UNIQUE(user_id,reward_id));
      CREATE INDEX notifications_owner ON notifications(user_id,read_at);
      PRAGMA user_version=3;`);
    for (const s of db.prepare('SELECT * FROM subscriptions').all()) db.prepare('UPDATE subscriptions SET started_at=?,series_id=? WHERE user_id=? AND creator_id=?').run(new Date().toISOString(),randomUUID(),s.user_id,s.creator_id);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}
export function registerLedger({app, db, one, all, run, fail, str, defaults}) {
  function syncPeriods(userId) {
    for (const s of all('SELECT * FROM subscriptions WHERE user_id=? OR creator_id=?',userId,userId)) {
      const plan = s.plan_snapshot ? JSON.parse(s.plan_snapshot) : { id:'legacy',name:'原有免费订阅',monthlyUsd:0,description:'' };
      for (const p of periodsFor(s.started_at,s.expires_at)) run('INSERT OR IGNORE INTO subscription_periods VALUES(?,?,?,?,?,?,?,?,?,?)',`${s.series_id}-${p.number}`,s.series_id,p.number,s.user_id,s.creator_id,p.start,p.end,JSON.stringify(plan),plan.monthlyUsd===0?'free':'promised',null);
    }
  }
  const rewardView = r => ({id:r.id,senderId:r.sender_id,senderName:r.sender_name,recipientId:r.recipient_id,recipientName:r.recipient_name,postId:r.post_id,rewardId:r.reward_id,reward:r.reward_snapshot?JSON.parse(r.reward_snapshot):defaults.find(g=>g.id===r.reward_id),message:r.message,status:r.status,createdAt:r.created_at,usedAt:r.used_at,useNote:r.use_note,fulfilledAt:r.fulfilled_at,fulfilledUntil:r.fulfilled_until});
  const rewardsFor = userId => all('SELECT r.*, s.name sender_name, t.name recipient_name FROM rewards r JOIN users s ON s.id=r.sender_id JOIN users t ON t.id=r.recipient_id WHERE sender_id=? OR recipient_id=? ORDER BY created_at DESC',userId,userId).map(rewardView);
  const iso = (value,label) => { if(typeof value!=='string'||value.length>40||!Number.isFinite(Date.parse(value))) fail(400,`${label}无效`); return new Date(value).toISOString(); };
  function fulfillment(body) {
    const start = body.fulfilledAt ? iso(body.fulfilledAt,'兑现开始时间') : new Date().toISOString();
    const end = body.fulfilledUntil ? iso(body.fulfilledUntil,'兑现结束时间') : null;
    if (Date.parse(start)>Date.now()+60000) fail(400,'兑现开始时间不能在未来');
    if (end && end < start) fail(400,'结束时间不能早于开始时间');
    return [start,end];
  }
  app.get('/api/rewards',(req,res)=>res.json(rewardsFor(req.user.id)));
  app.post('/api/rewards/:id/use',(req,res)=>{
    const r=one('SELECT * FROM rewards WHERE id=?',req.params.id);if(!r)fail(404,'奖励不存在');
    if(r.recipient_id!==req.user.id)fail(403,'只有收礼人可以使用这份礼物');
    if(r.used_at)return res.json({id:r.id,usedAt:r.used_at});
    if(r.status==='fulfilled')fail(409,'这份奖励已经兑现');
    const note=str(req.body.note||'','使用说明',300,0);const usedAt=new Date().toISOString();
    db.exec('BEGIN IMMEDIATE');try{
      run('UPDATE rewards SET used_at=?,use_note=? WHERE id=?',usedAt,note,r.id);
      run('INSERT OR IGNORE INTO notifications VALUES(?,?,?,?,NULL)',randomUUID(),r.sender_id,r.id,usedAt);
      db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e;}
    res.json({id:r.id,usedAt});
  });
  app.patch('/api/rewards/:id',(req,res)=>{
    const r=one('SELECT * FROM rewards WHERE id=?',req.params.id);if(!r)fail(404,'奖励不存在');if(r.sender_id!==req.user.id)fail(403,'只有发放者可以确认兑现');
    if(req.body.status!=='fulfilled')fail(400,'只能标记为已兑现');
    if(r.status!=='fulfilled'){const [start,end]=fulfillment(req.body);run("UPDATE rewards SET status='fulfilled',fulfilled_at=?,fulfilled_until=? WHERE id=?",start,end,r.id);}
    res.json({id:r.id,status:'fulfilled'});
  });
  app.get('/api/ledger',(req,res)=>{
    syncPeriods(req.user.id);
    const subscriptions=all('SELECT p.*,(SELECT min(starts_at) FROM subscription_periods p0 WHERE p0.series_id=p.series_id) subscription_start,s.name subscriber_name,c.name creator_name FROM subscription_periods p JOIN users s ON s.id=p.subscriber_id JOIN users c ON c.id=p.creator_id WHERE subscriber_id=? OR creator_id=?',req.user.id,req.user.id).map(p=>{
      const plan=JSON.parse(p.plan_snapshot),reverse=plan.monthlyUsd<0;
      return {id:p.id,kind:'subscription',title:plan.name,description:plan.description,emoji:'🔄',senderId:reverse?p.creator_id:p.subscriber_id,senderName:reverse?p.creator_name:p.subscriber_name,recipientId:reverse?p.subscriber_id:p.creator_id,recipientName:reverse?p.subscriber_name:p.creator_name,amountUsd:Math.abs(plan.monthlyUsd),value:`$${Math.abs(plan.monthlyUsd).toLocaleString('en-US')}`,createdAt:p.starts_at,periodNumber:p.period_no,periodStart:p.starts_at,periodEnd:p.ends_at,status:p.status,fulfilledAt:p.fulfilled_at,subscriptionCreator:p.creator_name,subscriptionStartedAt:p.subscription_start};
    });
    const rewards=rewardsFor(req.user.id).map(r=>({...r,kind:'reward',title:r.reward?.name||'灵感奖励',description:r.message||r.reward?.description||'',emoji:r.reward?.emoji||'🎁',value:r.reward?.value||''}));
    res.json([...subscriptions,...rewards].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
  });
  app.patch('/api/ledger/subscriptions/:id',(req,res)=>{
    const p=one('SELECT * FROM subscription_periods WHERE id=?',req.params.id);if(!p)fail(404,'账单不存在');
    const payer=JSON.parse(p.plan_snapshot).monthlyUsd<0?p.creator_id:p.subscriber_id;if(payer!==req.user.id)fail(403,'只有付款承诺方可以确认兑现');
    if(req.body.status!=='fulfilled')fail(400,'只能标记为已兑现');
    if(p.status==='promised'){const [start]=fulfillment(req.body);run("UPDATE subscription_periods SET status='fulfilled',fulfilled_at=? WHERE id=?",start,p.id);}
    res.json({id:p.id});
  });
  app.get('/api/notifications',(req,res)=>res.json(all('SELECT n.id,n.reward_id rewardId,n.created_at createdAt,r.use_note note,u.name recipientName FROM notifications n JOIN rewards r ON r.id=n.reward_id JOIN users u ON u.id=r.recipient_id WHERE n.user_id=? AND n.read_at IS NULL ORDER BY n.created_at DESC',req.user.id)));
  app.post('/api/notifications/read',(req,res)=>{
    if(!Array.isArray(req.body.ids)||req.body.ids.length>500||req.body.ids.some(id=>typeof id!=='string'||id.length>60))fail(400,'请指定要标记已读的通知');
    const at=new Date().toISOString();for(const id of req.body.ids)run('UPDATE notifications SET read_at=? WHERE id=? AND user_id=? AND read_at IS NULL',at,id,req.user.id);
    res.status(204).end();
  });
  return {syncPeriods};
}
