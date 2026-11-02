import {eq,partners} from './social-core.js';

const wallet = a => /^0x[0-9a-f]{40}$/i.test(a || '') && !/^0x0{40}$/i.test(a);
const member = (t,a) => eq(t.host,a) || eq(t.guest,a);
// These are projections of loaded community records, never an all-time score.
export function collaborationPortfolio(s,address) {
  if (!wallet(address)) return {partners:[],works:[],posts:[]};
  const teams=new Map(s.teams.map(t=>[Number(t.id),t]));
  return {
    partners:partners(s,address),
    works:s.works.filter(w=>Number(w.status)===2 && teams.has(Number(w.teamId)) && member(teams.get(Number(w.teamId)),address)).map(w=>({work:w,team:teams.get(Number(w.teamId))})),
    posts:s.posts.filter(p=>eq(p.author,address)).sort((a,b)=>b.id-a.id),
  };
}
export function relevantActivity(s,address) {
  if (!wallet(address)) return [];
  const items=[];
  for(const t of s.teams) if(Number(t.status)===1 && eq(t.guest,address)) items.push({key:`team:${t.id}`,kind:'invitation',id:t.id,title:t.title,createdAt:t.createdAt});
  for(const w of s.works) {
    const t=s.teams.find(t=>Number(t.id)===Number(w.teamId));
    if(Number(w.status)===1 && t && Number(t.status)===2 && member(t,address) && !eq(w.author,address) && member(t,w.author)) items.push({key:`work:${w.id}`,kind:'review',id:w.id,title:w.title,createdAt:w.createdAt});
  }
  const posts=new Map(s.posts.filter(p=>eq(p.author,address)).map(p=>[Number(p.id),p]));
  for(const r of s.replies) if(posts.has(Number(r.postId)) && !eq(r.author,address)) items.push({key:`reply:${r.id}`,kind:'reply',id:r.postId,replyId:r.id,title:posts.get(Number(r.postId)).title,author:r.author,createdAt:r.createdAt});
  return items.sort((a,b)=>Number(b.createdAt)-Number(a.createdAt)||a.key.localeCompare(b.key));
}
// Only pass readLinks().records here: a decoded or locally saved reference is not evidence.
export function portfolioOrders(verifiedRecords,address) {
  if(!wallet(address)) return [];
  const seen=new Set();
  return verifiedRecords.filter(r=>{
    if(!eq(r.job.client,address)&&!eq(r.job.provider,address))return false;
    const key=`${r.link.escrow.toLowerCase()}:${r.link.jobId}`;
    if(seen.has(key))return false;seen.add(key);return true;
  });
}
export const ORDER_STATES=['Unknown','Funded','Submitted','Completed','Refunded'];
