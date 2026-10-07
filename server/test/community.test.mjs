import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { createApp } from '../app.mjs';
import { monthAt, periodsFor } from '../../shared/periods.mjs';

test('calendar subscription periods preserve the original day across short months',()=>{
  assert.equal(monthAt('2024-01-31T10:30:00.000Z',1),'2024-02-29T10:30:00.000Z');
  assert.equal(monthAt('2024-01-31T10:30:00.000Z',2),'2024-03-31T10:30:00.000Z');
  assert.equal(monthAt('2025-01-31T10:30:00.000Z',1),'2025-02-28T10:30:00.000Z');
  assert.equal(periodsFor('2025-01-31T10:30:00.000Z',null,'2025-03-01T00:00:00.000Z').length,2);
  assert.equal(periodsFor('2025-01-31T10:30:00.000Z','2025-02-07T10:30:00.000Z','2025-04-01T00:00:00.000Z').length,1);
});

test('community: plans, reverse funding, trials, compressed avatars, gift use and private ledger notifications persist',async()=>{
  const dataDir=await mkdtemp(path.join(tmpdir(),'onlyfunds-community-'));
  const config={dataDir,secret:'test-community-secret-at-least-32-chars',studentInvite:'student-invite',bossInvite:'boss-invite'};
  const service=createApp(config);const listener=service.app.listen(0,'127.0.0.1');await new Promise(r=>listener.once('listening',r));const base=`http://127.0.0.1:${listener.address().port}/api`;
  async function req(route,method='GET',body,token){const r=await fetch(base+route,{method,headers:{...(token?{Authorization:`Bearer ${token}`} :{}),...(body instanceof FormData?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body)});const text=await r.text();return {status:r.status,body:text?JSON.parse(text):null};}
  async function register(name,inviteCode=config.studentInvite){const r=await req('/auth/register','POST',{name,email:`${name}@lab.example`,password:'long-test-password',inviteCode});assert.equal(r.status,201);return r.body;}
  try{
    const a=await register('alice'),b=await register('bob'),pi=await register('prof',config.bossInvite);const at=a.token,bt=b.token,pt=pi.token;
    const plans=[{id:'steady',name:'中规中矩',monthlyUsd:3000,description:'按时交周报'},{id:'sponsor',name:'带资进组',monthlyUsd:-800,description:'反向资助'},{id:'free',name:'免费旁听',monthlyUsd:0,description:''}];
    const settings={academicType:'phd',year:3,exchange:true,plans,studentOffer:true};
    assert.equal((await req('/me/settings','PATCH',{...settings,academicType:'pi'},at)).status,400);
    assert.equal((await req('/me/settings','PATCH',{...settings,year:99},at)).status,400);
    assert.equal((await req('/me/settings','PATCH',{...settings,plans:[plans[0],plans[0]]},at)).status,400);
    assert.equal((await req('/me/settings','PATCH',settings,at)).status,200);
    const people=(await req('/creators','GET',undefined,bt)).body;assert.equal(people.length,3);assert.equal(people.find(p=>p.id===pi.user.id).academicType,'pi');assert.equal(people.find(p=>p.id===a.user.id).exchange,true);
    const route=`/creators/${a.user.id}/subscribe`;
    assert.equal((await req(route,'POST',{active:true},pt)).status,400);
    assert.equal((await req(route,'POST',{active:true,planId:'steady'},pt)).status,200);
    await req(route,'POST',{active:true,planId:'steady'},pt);
    let ledger=(await req('/ledger','GET',undefined,pt)).body;assert.equal(ledger.length,1);assert.equal(ledger[0].amountUsd,3000);assert.equal(ledger[0].recipientId,a.user.id);assert.equal(ledger[0].periodNumber,1);
    const firstBill=ledger[0].id;
    assert.equal((await req(`/ledger/subscriptions/${firstBill}`,'PATCH',{status:'fulfilled'},at)).status,403);
    assert.equal((await req(`/ledger/subscriptions/${firstBill}`,'PATCH',{status:'fulfilled',fulfilledAt:new Date().toISOString()},pt)).status,200);
    assert.equal((await req('/ledger','GET',undefined,bt)).body.length,0);
    await req('/me/settings','PATCH',{...settings,plans:plans.map(p=>({...p,monthlyUsd:p.id==='steady'?5000:p.monthlyUsd}))},at);
    assert.equal((await req('/creators','GET',undefined,pt)).body.find(p=>p.id===a.user.id).subscription.plan.monthlyUsd,3000);
    // A second period is generated lazily, once; it keeps the agreed price.
    const previous=monthAt(new Date().toISOString(),-1);service.db.prepare('UPDATE subscriptions SET started_at=? WHERE user_id=?').run(previous,pi.user.id);
    ledger=(await req('/ledger','GET',undefined,pt)).body;assert.equal(ledger.length,2);assert.equal(ledger.find(e=>e.periodNumber===2).amountUsd,3000);
    assert.equal((await req('/ledger','GET',undefined,pt)).body.length,2);
    assert.equal((await req(route,'POST',{active:true,planId:'student-offer'},pt)).status,403);
    const trial=await req(route,'POST',{active:true,planId:'student-offer'},bt);assert.equal(trial.status,200);assert.equal(trial.body.subscription.plan.monthlyUsd,0);const expires=trial.body.subscription.expiresAt;
    assert.equal((await req(route,'POST',{active:true,planId:'student-offer'},bt)).body.subscription.expiresAt,expires);
    assert.equal((await req(`/creators/${a.user.id}/followers`,'GET',undefined,at)).body.length,2);
    service.db.prepare('UPDATE subscriptions SET expires_at=? WHERE user_id=?').run('2020-01-01T00:00:00.000Z',b.user.id);
    assert.equal((await req('/creators','GET',undefined,bt)).body.find(p=>p.id===a.user.id).following,false);
    assert.equal((await req(route,'POST',{active:true,planId:'student-offer'},bt)).status,409);
    await req(route,'POST',{active:false},bt);
    assert.equal((await req(route,'POST',{active:true,planId:'student-offer'},bt)).status,409);
    await req(route,'POST',{active:true,planId:'sponsor'},pt);
    ledger=(await req('/ledger','GET',undefined,pt)).body;const reverse=ledger.find(e=>e.title==='带资进组');assert.equal(reverse.senderId,a.user.id);assert.equal(reverse.recipientId,pi.user.id);assert.equal(reverse.amountUsd,800);
    const post=(await req('/posts','POST',{title:'One real note',body:'Test data',kind:'note'},at)).body;
    assert.equal((await req('/reward-catalog','POST',{emoji:'two 🦆🦆',unit:'次',description:'debug'},pt)).status,400);
    const gift=(await req('/reward-catalog','POST',{emoji:'🦆',unit:'次',description:'老板亲自 debug'},pt)).body;
    assert.equal((await req('/reward-catalog','GET',undefined,at)).body.some(r=>r.id===gift.id),false);
    const reward=(await req('/rewards','POST',{postId:post.id,rewardId:gift.id,message:'来找我'},pt)).body;
    await req(`/reward-catalog/${gift.id}`,'DELETE',undefined,pt);
    assert.equal((await req('/rewards','GET',undefined,at)).body[0].reward.description,'老板亲自 debug');
    const use=`/rewards/${reward.id}/use`;
    assert.equal((await req(use,'POST',{note:'wrong person'},bt)).status,403);
    assert.equal((await req(use,'POST',{note:'sender cannot use'},pt)).status,403);
    assert.equal((await req(use,'POST',{note:'今晚需要救援'},at)).status,200);
    await req(use,'POST',{note:'重复点击'},at);
    const notices=(await req('/notifications','GET',undefined,pt)).body;assert.equal(notices.length,1);assert.equal(notices[0].note,'今晚需要救援');
    assert.equal((await req('/notifications','GET',undefined,bt)).body.length,0);
    await req('/notifications/read','POST',{ids:notices.map(n=>n.id)},bt);assert.equal((await req('/notifications','GET',undefined,pt)).body.length,1);
    const another=(await req('/rewards','POST',{postId:post.id,rewardId:'gpu'},pt)).body;await req(`/rewards/${another.id}/use`,'POST',{note:'明天跑模型'},at);
    await req('/notifications/read','POST',{ids:notices.map(n=>n.id)},pt);assert.equal((await req('/notifications','GET',undefined,pt)).body.length,1);
    const from=new Date(Date.now()-3600000).toISOString(),until=new Date(Date.now()+23*3600000).toISOString();
    assert.equal((await req(`/rewards/${another.id}`,'PATCH',{status:'fulfilled',fulfilledAt:until},pt)).status,400);
    assert.equal((await req(`/rewards/${another.id}`,'PATCH',{status:'fulfilled',fulfilledAt:from,fulfilledUntil:until},at)).status,403);
    assert.equal((await req(`/rewards/${another.id}`,'PATCH',{status:'fulfilled',fulfilledAt:from,fulfilledUntil:until},pt)).status,200);
    const received=(await req('/ledger','GET',undefined,at)).body.find(e=>e.id===another.id);assert.equal(received.fulfilledAt,from);assert.equal(received.fulfilledUntil,until);assert.equal(received.useNote,'明天跑模型');
    const bytes=await sharp({create:{width:1200,height:800,channels:3,background:'#db839b'}}).png().toBuffer();
    const form=new FormData();form.append('file',new Blob([bytes],{type:'image/png'}),'portrait.png');const avatar=await req('/avatar','POST',form,pt);assert.equal(avatar.status,201);assert.equal(avatar.body.mime,'image/webp');
    const media=service.db.prepare('SELECT * FROM media WHERE id=?').get(avatar.body.id);const image=await sharp(await readFile(path.join(dataDir,'uploads',media.filename))).metadata();assert.equal(image.width,320);assert.equal(image.height,320);assert.equal(image.format,'webp');
    assert.equal((await req('/me/settings','PATCH',{...settings,avatarId:avatar.body.id},at)).status,400);
    assert.equal((await req('/me/settings','PATCH',{...settings,academicType:'pi',avatarId:avatar.body.id},pt)).status,200);
    const bad=new FormData();bad.append('file',new Blob(['not an image'],{type:'image/png'}),'bad.png');assert.equal((await req('/avatar','POST',bad,pt)).status,400);
    const creatorKey=(await req('/tokens','POST',{name:'bot'},at)).body.token;assert.equal((await req('/notifications/read','POST',{ids:[]},creatorKey)).status,403);
    await new Promise(r=>listener.close(r));service.close();
    const reopened=createApp(config);assert.equal(reopened.db.prepare('PRAGMA user_version').get().user_version,3);assert.equal(reopened.db.prepare('SELECT fulfilled_until FROM rewards WHERE id=?').get(another.id).fulfilled_until,until);assert.equal(reopened.db.prepare('SELECT count(*) n FROM notifications WHERE read_at IS NULL').get().n,1);reopened.close();
  }finally{if(listener.listening){await new Promise(r=>listener.close(r));service.close();}await rm(dataDir,{recursive:true,force:true});}
});

test('v1 database migration preserves existing members, subscriptions and fulfilled gifts',async()=>{
  const {DatabaseSync}=await import('node:sqlite');const dataDir=await mkdtemp(path.join(tmpdir(),'onlyfunds-legacy-'));const legacy=new DatabaseSync(path.join(dataDir,'onlyfunds.sqlite'));
  legacy.exec(`CREATE TABLE users (id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL,bio TEXT NOT NULL DEFAULT '',field TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL);
    CREATE TABLE media (id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES users(id),filename TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE subscriptions (user_id TEXT NOT NULL REFERENCES users(id),creator_id TEXT NOT NULL REFERENCES users(id),PRIMARY KEY(user_id,creator_id));
    CREATE TABLE rewards (id TEXT PRIMARY KEY,sender_id TEXT NOT NULL REFERENCES users(id),recipient_id TEXT NOT NULL REFERENCES users(id),post_id TEXT,reward_id TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'promised',created_at TEXT NOT NULL);
    INSERT INTO users VALUES('old-student','old@lab.example','unused','Original student','creator','original bio','photonics','2025-01-01');
    INSERT INTO users VALUES('old-boss','pi@lab.example','unused','Original PI','boss','','','2025-01-01');
    INSERT INTO subscriptions VALUES('old-boss','old-student');
    INSERT INTO rewards VALUES('old-gift','old-boss','old-student',NULL,'coffee','already delivered','fulfilled','2025-02-01');
    PRAGMA user_version=1;`);legacy.close();
  try{const service=createApp({dataDir,secret:'legacy-migration-test-secret-with-32-chars',studentInvite:'students',bossInvite:'bosses'});assert.equal(service.db.prepare('PRAGMA user_version').get().user_version,3);assert.equal(service.db.prepare('SELECT bio FROM users WHERE id=?').get('old-student').bio,'original bio');assert.equal(service.db.prepare('SELECT academic_type FROM users WHERE id=?').get('old-boss').academic_type,'pi');assert.ok(service.db.prepare('SELECT series_id FROM subscriptions').get().series_id);const gift=service.db.prepare('SELECT * FROM rewards').get();assert.equal(gift.status,'fulfilled');assert.equal(gift.fulfilled_at,null);service.close();}finally{await rm(dataDir,{recursive:true,force:true});}
});
