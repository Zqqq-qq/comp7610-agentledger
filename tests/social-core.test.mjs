import test from 'node:test';import assert from 'node:assert/strict';
import {emptyState,seedState,applyAction,PERSONAS,partners} from '../web/social-core.js';
const [A,B,C]=PERSONAS.map(p=>p.address);const act=(s,a,p)=>applyAction(s,a,p,1793062800);
function fixture(){let s=emptyState();for(const a of [A,B,C])s=act(s,a,{type:'membership',circleId:2,joined:true});s=act(s,C,{type:'post',circleId:2,agentId:0,kind:1,title:'Task',body:'A bilingual guide'});return s;}
const invite={type:'invite',postId:1,guest:B,hostAgentId:1,guestAgentId:2,title:'Our team',hostRole:'Research',guestRole:'Translate'};
test('posting and replying require membership and correct represented Agent ownership',()=>{
 let s=emptyState();assert.throws(()=>act(s,A,{type:'post',circleId:2,agentId:1,kind:0,title:'x',body:'y'}),/Join/);
 s=fixture();assert.throws(()=>act(s,B,{type:'reply',postId:1,agentId:1,body:'hello'}),/own/);
 assert.equal(act(s,B,{type:'reply',postId:1,agentId:2,body:'hello'}).replies[0].author,B);
 assert.throws(()=>act(s,A,{type:'reply',postId:99,agentId:1,body:'hello'}),/not found/);
});
test('follow has no self-follow, duplicate or zero target; unfollow restores state',()=>{
 let s=fixture();for(const target of [A,'0x'+'0'.repeat(40)])assert.throws(()=>act(s,A,{type:'follow',target,active:true}));
 s=act(s,A,{type:'follow',target:B,active:true});assert.throws(()=>act(s,A,{type:'follow',target:B,active:true}));
 assert.equal(act(s,A,{type:'follow',target:B,active:false}).follows.length,0);
});
test('an invitation requires the recipient consent and current ownership on acceptance',()=>{
 let s=act(fixture(),A,invite);assert.throws(()=>act(s,C,{type:'respond',teamId:1,accept:true}),/invited wallet/);
 const changed=structuredClone(s);changed.owners[2]=C;assert.throws(()=>act(changed,B,{type:'respond',teamId:1,accept:true}),/own/);
 s=act(s,B,{type:'respond',teamId:1,accept:true});assert.equal(s.teams[0].status,2);assert.throws(()=>act(s,A,{type:'cancel',teamId:1}));
});
test('pending invitations can be declined by the guest or cancelled by the host',()=>{
 let s=act(fixture(),A,invite);assert.equal(act(s,B,{type:'respond',teamId:1,accept:false}).teams[0].status,3);assert.equal(act(s,A,{type:'cancel',teamId:1}).teams[0].status,4);
});
test('shared portfolio requires an active team and the other member confirmation',()=>{
 let s=act(fixture(),A,invite);const work={type:'work',teamId:1,title:'Guide',summary:'Both contributions',uri:'https://example.com/work'};
 assert.throws(()=>act(s,A,work),/accept/);s=act(s,B,{type:'respond',teamId:1,accept:true});assert.throws(()=>act(s,C,work),/member/);
 s=act(s,A,work);assert.equal(partners(s,A).length,0);assert.throws(()=>act(s,A,{type:'reviewWork',workId:1,approve:true}),/other member/);assert.throws(()=>act(s,C,{type:'reviewWork',workId:1,approve:true}),/member/);
 s=act(s,B,{type:'reviewWork',workId:1,approve:true});assert.equal(s.works[0].status,2);assert.equal(partners(s,A)[0].address,B);assert.equal(partners(s,A)[0].count,1);
 assert.throws(()=>act(s,B,{type:'reviewWork',workId:1,approve:true}));
});
test('a rejected work may be revised; pending duplicates and unsafe work links are rejected',()=>{
 let s=act(act(fixture(),A,invite),B,{type:'respond',teamId:1,accept:true});const work={type:'work',teamId:1,title:'Guide',summary:'Draft',uri:'https://example.com'};
 assert.throws(()=>act(s,A,{...work,uri:'javascript:alert(1)'}));s=act(s,A,work);assert.throws(()=>act(s,B,work),/pending/);s=act(s,B,{type:'reviewWork',workId:1,approve:false});assert.equal(partners(s,A).length,0);assert.equal(act(s,A,work).works.length,2);
});
test('demo samples derive social history from accepted teams and confirmed works',()=>{
 const s=seedState();assert.equal(s.posts.length,4);assert.equal(s.replies.length,3);assert.equal(s.teams[0].status,2);assert.equal(s.works[0].status,2);assert.equal(partners(s,A)[0].count,1);
});
