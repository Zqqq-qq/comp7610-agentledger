import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,PERSONAS,seedState} from '../web/social-core.js';
import {collaborationPortfolio,relevantActivity,portfolioOrders} from '../web/social-insights.js';
const [a,b,c]=PERSONAS.map(p=>p.address);
function fixture(){const s=seedState();s.replies=[];s.teams.push({id:2,postId:1,host:a,guest:b,status:1,createdAt:50,title:'Invite'}, {id:3,postId:1,host:a,guest:c,status:3,createdAt:60});s.works.push({id:2,teamId:1,author:a,status:1,createdAt:70,title:'Review'}, {id:3,teamId:3,author:a,status:1,createdAt:80,title:'Ended team'}, {id:4,teamId:99,author:a,status:2,createdAt:90,title:'Missing provenance'});s.replies.push({id:8,postId:2,author:b,body:'Reply',createdAt:100},{id:9,postId:2,author:a,body:'Self reply',createdAt:101},{id:10,postId:99,author:b,body:'Missing post',createdAt:102});return s;}
test('portfolio requires wallet participation and confirmed work with team provenance',()=>{
 const s=fixture();assert.deepEqual(collaborationPortfolio(s,a.toUpperCase()).works.map(x=>x.work.id),[1]);assert.equal(collaborationPortfolio(s,b).partners[0].address,a);assert.equal(collaborationPortfolio(s,c).works.length,0);assert.equal(collaborationPortfolio(s,a).partners[0].count,1);assert.deepEqual(collaborationPortfolio(s,''),{partners:[],works:[],posts:[]});assert.equal(collaborationPortfolio(emptyState(),a).works.length,0);
});
test('activity switches recipient; pending actions exclude self review, terminal teams and self replies',()=>{
 const s=fixture();const bs=relevantActivity(s,b);assert.ok(bs.some(x=>x.key==='team:2'));assert.ok(bs.some(x=>x.key==='work:2'));assert.ok(!bs.some(x=>x.key==='work:3'));const as=relevantActivity(s,a);assert.ok(as.some(x=>x.key==='reply:8'));assert.ok(!as.some(x=>['work:2','reply:9','reply:10','team:2'].includes(x.key)));assert.deepEqual(relevantActivity(s,''),[]);assert.deepEqual(relevantActivity(s,c),[]);
 s.teams.find(x=>x.id===2).status=2;s.works.find(x=>x.id===2).status=2;assert.ok(!relevantActivity(s,b).some(x=>['team:2','work:2'].includes(x.key)));
});
test('reply activity points at the source post and sorts by creation, without inventing an unread state',()=>{
 const s=fixture();const xs=relevantActivity(s,a);assert.ok(xs.every((x,i)=>!i||Number(xs[i-1].createdAt)>=Number(x.createdAt)));const r=xs.find(x=>x.key==='reply:8');assert.equal(r.id,2);assert.equal(r.replyId,8);assert.equal(r.kind,'reply');assert.ok(!('unread' in r));
});
test('order projection separates counterparties and deduplicates verified contract/job identities',()=>{
 const r=(escrow,id,client,provider,status)=>({link:{escrow,jobId:id},job:{client,provider,status}});
 const rows=[r(a,'5',a,b,3),r(a.toUpperCase(),'5',a,b,3),r(b,'5',a,c,4),r(a,'6',b,c,1)];
 assert.equal(portfolioOrders(rows,a).length,2);assert.equal(portfolioOrders(rows,b).length,2);assert.deepEqual(portfolioOrders(rows,''),[]);assert.deepEqual(portfolioOrders([],a),[]);assert.equal(portfolioOrders(rows,c).find(x=>x.link.escrow===b).job.status,4);
});
