import { freshDemo, REWARDS } from './demo';
import { demoMedia } from './demo-media';
import { isStudent, plansOf } from './people';
import { periodsFor } from '../../shared/periods.mjs';
import type { Post, User, Reward, RewardInput, RewardRecord, PostInput, Token, CreatorSettings, LedgerEntry, Notice, Fulfillment } from './types';
const DEMO_KEY = 'onlyfunds.demo.v3';
export const SERVER_KEY = 'onlyfunds.server.v1';
const TOKEN_KEY = 'onlyfunds.session.v1';
function stored<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
let demo = stored(DEMO_KEY, freshDemo());
for(const person of demo.members)if(person.avatarUrl?.startsWith(`${import.meta.env.BASE_URL}avatars/`))person.avatarUrl=person.avatarUrl.replace(/\.png$/,'.webp').replace(/\/qiao\.webp$/, '/qiao-whale.webp');
const avatarNote = demo.posts.find(post => post.id === 'demo-qiao-3');
if (avatarNote) avatarNote.body = avatarNote.body.replace('这个紫头发同学怎么不来组会？', '这个吃白饭的鲸鱼同学怎么不来组会？');
function persist() { localStorage.setItem(DEMO_KEY, JSON.stringify(demo)); }
export let server = localStorage.getItem(SERVER_KEY) || '';
let token = sessionStorage.getItem(TOKEN_KEY) || '';
export const hasSession = () => !server || !!token;
const demoMe = () => demo.members.find(u=>u.id===demo.userId)!;
const activeSubscriptions = () => demo.subscriptions.filter(s=>!s.expiresAt || s.expiresAt > new Date().toISOString());
function demoPerson(person: User): User {
  const subscriptions=activeSubscriptions();const subscription=subscriptions.find(s=>s.userId===demo.userId&&s.creatorId===person.id);
  return structuredClone({...person,postCount:demo.posts.filter(p=>p.author.id===person.id).length,followerCount:subscriptions.filter(s=>s.creatorId===person.id).length,following:!!subscription,subscription:subscription||null,studentOfferAvailable:!!(isStudent(demoMe())&&isStudent(person)&&person.studentOffer&&(!demo.claimedOffers.includes(`${demo.userId}:${person.id}`)||subscription?.studentOffer))});
}
function demoPost(p: Post): Post { return structuredClone({...p,...demoMedia(p.id),rewardCount:demo.rewards.filter(r=>r.postId===p.id).length,comments:p.comments.map(c=>({...c,author:demo.members.find(m=>m.id===c.author.id)||c.author})),author:demoPerson(demo.members.find(u=>u.id===p.author.id)!),saved:(demo.saves[demo.userId]||[]).includes(p.id),liked:(demo.likes[demo.userId]||[]).includes(p.id)}); }
function demoCatalog() { return [...REWARDS,...(demo.catalogs[demo.userId]||[])]; }
function syncDemoPeriods() {
  for(const s of demo.subscriptions) for(const p of periodsFor(s.startedAt,s.expiresAt)) {
    const id=`${s.seriesId}-${p.number}`;if(demo.ledger.some(e=>e.id===id))continue;
    const reverse=s.plan.monthlyUsd<0;const from=demo.members.find(m=>m.id===(reverse?s.creatorId:s.userId))!;const to=demo.members.find(m=>m.id===(reverse?s.userId:s.creatorId))!;
    demo.ledger.push({id,kind:'subscription',title:s.plan.name,description:s.plan.description,emoji:'🔄',value:`$${Math.abs(s.plan.monthlyUsd).toLocaleString('en-US')}`,amountUsd:Math.abs(s.plan.monthlyUsd),senderId:from.id,senderName:from.name,recipientId:to.id,recipientName:to.name,subscriptionStartedAt:s.startedAt,periodNumber:p.number,periodStart:p.start,periodEnd:p.end,createdAt:p.start,status:s.plan.monthlyUsd===0?'free':'promised',subscriptionCreator:demo.members.find(m=>m.id===s.creatorId)!.name});
  }
}
function absoluteUser(u: User): User { return {...u,avatarUrl:u.avatarUrl?`${server}${u.avatarUrl}`:null}; }
export function normalizeServer(input: string): string {
  const url = new URL(input.includes('://') ? input : `https://${input}`);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) throw new Error('请输入服务器域名或 IP（可带端口），不要包含路径、密码或查询参数。');
  if (location.protocol === 'https:' && url.protocol !== 'https:') throw new Error('当前网站使用 HTTPS，请为实验室服务器配置 HTTPS 后再连接。');
  return url.origin;
}
export function setServer(value: string) { server = value; token = ''; sessionStorage.removeItem(TOKEN_KEY); localStorage.setItem(SERVER_KEY, value); }
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers); if (token) headers.set('Authorization', `Bearer ${token}`); if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  let response;
  try { response = await fetch(`${server}/api${endpoint}`, { ...options, headers, signal: AbortSignal.timeout(options.body instanceof FormData ? 120000 : 15000), credentials: 'omit', redirect: 'error' }); } catch { throw new Error('无法连接实验室，请检查地址、HTTPS 证书和服务器允许的客户端域名。'); }
  if (response.status === 401) { token = ''; sessionStorage.removeItem(TOKEN_KEY); window.dispatchEvent(new Event('onlyfunds:unauthorized')); }
  if (!response.ok) { const error = await response.json().catch(() => null); throw new Error(error?.error || `请求失败（${response.status}）`); }
  return response.status === 204 ? undefined as T : response.json();
}
function absolute(post: Post): Post { return { ...post, author: absoluteUser(post.author), comments: post.comments.map(c=>({...c,author:{...c.author,avatarUrl:c.author.avatarUrl?`${server}${c.author.avatarUrl}`:null}})), mediaUrl: post.mediaUrl ? `${server}${post.mediaUrl}` : null, posterUrl: post.posterUrl ? `${server}${post.posterUrl}` : null }; }
export async function checkServer(value: string): Promise<{ labName: string }> {
  const response = await fetch(`${value}/api/health`, { credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(10000) });
  const result = await response.json(); if (!response.ok || result.service !== 'onlyfunds') throw new Error('这个地址没有运行兼容的 OnlyFunds 服务端。'); return result;
}
export const api = {
  async me(): Promise<User> { return server ? absoluteUser(await request('/me')) : demoPerson(demoMe()); },
  async creators(): Promise<User[]> { return server ? (await request<User[]>('/creators')).map(absoluteUser) : demo.members.map(demoPerson); },
  async followers(userId:string): Promise<User[]> { return server ? (await request<User[]>(`/creators/${userId}/followers`)).map(absoluteUser) : activeSubscriptions().filter(s=>s.creatorId===userId).map(s=>demoPerson(demo.members.find(m=>m.id===s.userId)!)); },
  async posts(feed='all',q='',offset=0,author=''): Promise<Post[]> {
    if(server)return (await request<Post[]>(`/posts?${new URLSearchParams({feed,q,offset:String(offset),author})}`)).map(absolute);
    return demo.posts.map(demoPost).filter(p=>(!author||p.author.id===author)&&(feed!=='saved'||p.saved)&&(feed!=='following'||p.author.following)&&(!q||`${p.title} ${p.body} ${p.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase()))).slice(offset,offset+30);
  },
  async auth(mode:'login'|'register',fields:object): Promise<User> { const result=await request<{token:string;user:User}>(`/auth/${mode}`,{method:'POST',body:JSON.stringify(fields)});token=result.token;sessionStorage.setItem(TOKEN_KEY,token);return absoluteUser(result.user); },
  async logout() { if(server){try{await request('/auth/logout',{method:'POST'});}finally{token='';sessionStorage.removeItem(TOKEN_KEY);}} },
  async updateProfile(fields:Pick<User,'name'|'bio'|'field'>): Promise<User> { if(server)return absoluteUser(await request('/me',{method:'PATCH',body:JSON.stringify(fields)}));Object.assign(demoMe(),fields);persist();return demoPerson(demoMe()); },
  async updateSettings(fields:CreatorSettings): Promise<User> { if(server)return absoluteUser(await request('/me/settings',{method:'PATCH',body:JSON.stringify(fields)}));Object.assign(demoMe(),fields);persist();return demoPerson(demoMe()); },
  async demoAvatar(dataUrl:string) { if(server)throw new Error('请使用实验室头像上传');demoMe().avatarUrl=dataUrl;persist(); },
  async subscribe(user:User,planId?:string,active=true): Promise<User> {
    if(server)return absoluteUser(await request(`/creators/${user.id}/subscribe`,{method:'POST',body:JSON.stringify({active,planId})}));
    if(user.id===demo.userId)throw new Error('不能订阅自己');syncDemoPeriods();
    const person=demo.members.find(u=>u.id===user.id)!;const existing=activeSubscriptions().find(s=>s.userId===demo.userId&&s.creatorId===user.id);
    if(!active){demo.subscriptions=demo.subscriptions.filter(s=>s.userId!==demo.userId||s.creatorId!==user.id);persist();return demoPerson(person);}
    const offer=planId==='student-offer';let plan=plansOf(person).find(p=>p.id===planId);
    if(offer){if(!demoPerson(person).studentOfferAvailable)throw new Error('免费活动不可用');if(existing?.studentOffer)return demoPerson(person);plan={id:'student-offer',name:'限时免费 · 同门蹭学',monthlyUsd:0,description:'免费追更 7 天，到期自动结束，不会自动转为付费计划。'};demo.claimedOffers.push(`${demo.userId}:${user.id}`);}
    if(!plan)throw new Error('请选择订阅计划');
    if(existing?.plan.id===plan.id)return demoPerson(person);
    demo.subscriptions=demo.subscriptions.filter(s=>s.userId!==demo.userId||s.creatorId!==user.id);
    demo.subscriptions.push({userId:demo.userId,creatorId:user.id,plan:structuredClone(plan),studentOffer:offer,expiresAt:offer?new Date(Date.now()+7*86400000).toISOString():null,startedAt:new Date().toISOString(),seriesId:crypto.randomUUID()});syncDemoPeriods();persist();return demoPerson(person);
  },
  async react(post:Post,kind:'like'|'save'): Promise<Post> {
    if(server)return absolute(await request(`/posts/${post.id}/reactions`,{method:'POST',body:JSON.stringify({kind,active:kind==='like'?!post.liked:!post.saved})}));
    const target=demo.posts.find(p=>p.id===post.id)!;const collection=kind==='like'?demo.likes:demo.saves;const list=collection[demo.userId]||[];const active=!list.includes(post.id);collection[demo.userId]=active?[...list,post.id]:list.filter(id=>id!==post.id);if(kind==='like')target.likes+=active?1:-1;persist();return demoPost(target);
  },
  async comment(post:Post,body:string): Promise<Post> { if(server)return absolute(await request(`/posts/${post.id}/comments`,{method:'POST',body:JSON.stringify({body})}));const target=demo.posts.find(p=>p.id===post.id)!;target.comments.push({id:crypto.randomUUID(),body,author:demoMe(),createdAt:new Date().toISOString()});persist();return demoPost(target); },
  async publish(input:PostInput): Promise<Post> { if(server)return absolute(await request('/posts',{method:'POST',body:JSON.stringify(input)}));const post:Post={...input,id:crypto.randomUUID(),author:structuredClone(demoMe()),mediaUrl:null,posterUrl:null,liked:false,saved:false,likes:0,comments:[],rewardCount:0,createdAt:new Date().toISOString()};demo.posts.unshift(post);persist();return demoPost(post); },
  async remove(postId:string) { if(server)return request(`/posts/${postId}`,{method:'DELETE'});demo.posts=demo.posts.filter(p=>p.id!==postId);persist(); },
  async upload(file:File): Promise<{id:string}> { if(!server)throw new Error('连接实验室后即可上传视频。演示模式可发布文字。');const body=new FormData();body.append('file',file);return request('/media',{method:'POST',body}); },
  async uploadAvatar(file:File): Promise<{id:string}> { const body=new FormData();body.append('file',file);return request('/avatar',{method:'POST',body}); },
  async rewardCatalog(): Promise<Reward[]> { return server?request('/reward-catalog'):structuredClone(demoCatalog()); },
  async createReward(input:RewardInput): Promise<Reward> {
    if(server)return request('/reward-catalog',{method:'POST',body:JSON.stringify(input)});
    const r:Reward={...input,id:crypto.randomUUID(),name:input.description,value:`1 ${input.unit}`,custom:true};demo.catalogs[demo.userId]=[r,...(demo.catalogs[demo.userId]||[])];persist();return r;
  },
  async deleteReward(id:string) { if(server)return request(`/reward-catalog/${id}`,{method:'DELETE'});demo.catalogs[demo.userId]=(demo.catalogs[demo.userId]||[]).filter(r=>r.id!==id);persist(); },
  async reward(post:Post,rewardId:string,message:string) {
    if(server)return request('/rewards',{method:'POST',body:JSON.stringify({postId:post.id,rewardId,message})});
    if(demoMe().role!=='boss')throw new Error('只有老板可以发放奖励');const reward=demoCatalog().find(r=>r.id===rewardId);if(!reward)throw new Error('奖励不存在');
    demo.rewards.unshift({id:crypto.randomUUID(),senderId:demo.userId,senderName:demoMe().name,recipientId:post.author.id,recipientName:post.author.name,postId:post.id,rewardId,reward:structuredClone(reward),message,status:'promised',createdAt:new Date().toISOString()});demo.posts.find(p=>p.id===post.id)!.rewardCount++;persist();
  },
  async rewards(): Promise<RewardRecord[]> { return server?request('/rewards'):structuredClone(demo.rewards.filter(r=>r.senderId===demo.userId||r.recipientId===demo.userId)); },
  async useReward(id:string,note:string) {
    if(server)return request(`/rewards/${id}/use`,{method:'POST',body:JSON.stringify({note})});
    const r=demo.rewards.find(r=>r.id===id)!;if(r.recipientId!==demo.userId)throw new Error('只有收礼人可以使用');if(r.usedAt)return;if(r.status==='fulfilled')throw new Error('这份礼物已经兑现');r.usedAt=new Date().toISOString();r.useNote=note;demo.notifications.push({id:crypto.randomUUID(),userId:r.senderId,rewardId:r.id,createdAt:r.usedAt,recipientName:r.recipientName,note,read:false});persist();
  },
  async fulfill(rewardId:string,dates?:Fulfillment) { if(server)return request(`/rewards/${rewardId}`,{method:'PATCH',body:JSON.stringify({status:'fulfilled',...dates})});const r=demo.rewards.find(r=>r.id===rewardId)!;if(r.senderId!==demo.userId)throw new Error('只有发放者可以确认兑现');if(r.status==='fulfilled')return;r.status='fulfilled';r.fulfilledAt=dates?.fulfilledAt||new Date().toISOString();r.fulfilledUntil=dates?.fulfilledUntil;persist(); },
  async ledger(): Promise<LedgerEntry[]> {
    if(server)return request('/ledger');syncDemoPeriods();persist();const gifts:LedgerEntry[]=demo.rewards.map(r=>({...r,kind:'reward',title:r.reward?.name||REWARDS.find(g=>g.id===r.rewardId)?.name||'灵感奖励',description:r.message||r.reward?.description||'',emoji:r.reward?.emoji||'🎁',value:r.reward?.value||''}));return structuredClone([...demo.ledger,...gifts].filter(e=>e.senderId===demo.userId||e.recipientId===demo.userId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
  },
  async fulfillSubscription(id:string,dates:Fulfillment) { if(server)return request(`/ledger/subscriptions/${id}`,{method:'PATCH',body:JSON.stringify({status:'fulfilled',...dates})});const e=demo.ledger.find(e=>e.id===id)!;if(e.senderId!==demo.userId)throw new Error('只有付款承诺方可以确认');if(e.status!=='promised')return;e.status='fulfilled';e.fulfilledAt=dates.fulfilledAt;persist(); },
  async notifications(): Promise<Notice[]> { return server?request('/notifications'):structuredClone(demo.notifications.filter(n=>n.userId===demo.userId&&!n.read)); },
  async readNotifications(ids:string[]) { if(server)return request('/notifications/read',{method:'POST',body:JSON.stringify({ids})});demo.notifications.forEach(n=>{if(n.userId===demo.userId&&ids.includes(n.id))n.read=true;});persist(); },
  async tokens(): Promise<Token[]> { return server?request('/tokens'):[]; },
  async createToken(name:string): Promise<{token:string}> { if(!server)throw new Error('请连接实验室后创建发布密钥');return request('/tokens',{method:'POST',body:JSON.stringify({name})}); },
  async revokeToken(id:number) { return request(`/tokens/${id}`,{method:'DELETE'}); },
  switchDemo() { demo.userId=demo.userId==='demo-boss'?'demo-lin':'demo-boss';persist(); },
  resetDemo() { demo=freshDemo();persist(); },
};
