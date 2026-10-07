#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
export function validateDraft(draft) {
  if (typeof draft.title !== 'string' || !draft.title.trim() || draft.title.length > 160) throw new Error('Draft needs a title of 1–160 characters.');
  if (typeof draft.body !== 'string' || !draft.body.trim() || draft.body.length > 20000) throw new Error('Draft needs a body of 1–20000 characters.');
  if (!['note','paper','video'].includes(draft.kind)) throw new Error('kind must be note, paper, or video.');
  if (!Array.isArray(draft.tags) || draft.tags.length > 6 || draft.tags.some(t => typeof t !== 'string' || !t.trim() || t.length > 30)) throw new Error('Use at most 6 nonempty tags, each at most 30 characters.');
  if (!Array.isArray(draft.sources) || draft.sources.length > 12) throw new Error('Use at most 12 sources.');
  for (const source of draft.sources) if (!source.label || source.label.length > 160 || !['http:','https:'].includes(new URL(source.url).protocol)) throw new Error('Each source needs a title and HTTP(S) URL.');
  return draft;
}
export function validateServer(address) {
  const url = new URL(address);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Server must be an origin with no path or credentials.');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(url.hostname))) throw new Error('Use HTTPS for remote servers. HTTP is allowed only on loopback.');
  return url.origin;
}
async function main() {
  const {values}=parseArgs({options:{draft:{type:'string'},video:{type:'string'},poster:{type:'string'},publish:{type:'boolean',default:false},'dry-run':{type:'boolean',default:false}}});
  if (!values.draft) throw new Error('Usage: node creator_toolchains/publish.mjs --draft draft.json [--video video.mp4] [--poster image.png] [--publish]');
  const input = JSON.parse(await readFile(values.draft,'utf8'));
  // Allowlist fields; never forward arbitrary JSON properties to the API.
  const draft = validateDraft({title:input.title,body:input.body,kind:values.video?'video':input.kind,tags:input.tags || [],sources:input.sources || []});
  if (draft.kind === 'video' && !values.video) throw new Error('Video drafts need --video.');
  const mediaFiles=[];
  for (const [field,filename] of [['mediaId',values.video],['posterId',values.poster]]) { if (!filename) continue; const ext=filename.split('.').pop().toLowerCase();const mime={mp4:'video/mp4',webm:'video/webm',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg'}[ext];if (!mime || (field==='mediaId'&&!mime.startsWith('video/')) || (field==='posterId'&&!mime.startsWith('image/'))) throw new Error('Use MP4/WebM for video, PNG/JPEG for poster.');const info=await stat(filename);if(!info.isFile()||info.size>100*1024*1024)throw new Error('Each media file must be at most 100 MB.');mediaFiles.push({field,filename,mime}); }
  if(!values.publish || values['dry-run']) { console.log(JSON.stringify({mode:'dry-run',title:draft.title,kind:draft.kind,sourceCount:draft.sources.length,media:mediaFiles.map(f=>f.filename),message:'Validated locally. Nothing uploaded. Add --publish after reviewing the draft.'},null,2)); return; }
  const origin=validateServer(process.env.ONLYFUNDS_SERVER || '');const token=process.env.ONLYFUNDS_TOKEN;if(!token)throw new Error('Set ONLYFUNDS_TOKEN in your local environment. Never put it in the draft or commit it.');
  async function call(endpoint,body) {const headers={Authorization:`Bearer ${token}`};if(!(body instanceof FormData))headers['Content-Type']='application/json';const response=await fetch(`${origin}/api${endpoint}`,{method:'POST',headers,body:body instanceof FormData?body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(120000)});const result=await response.json();if(!response.ok)throw new Error(result.error || `HTTP ${response.status}`);return result;}
  for (const item of mediaFiles) {const form=new FormData();form.append('file',new Blob([await readFile(item.filename)],{type:item.mime}),item.filename.split(/[\\/]/).pop());draft[item.field]=(await call('/media',form)).id;}
  const post=await call('/posts',draft);console.log(JSON.stringify({published:true,postId:post.id,title:post.title,server:origin},null,2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error=>{ console.error(error.message); process.exitCode=1; });
