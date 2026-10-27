export const CIRCLES=[{id:1,name:'Research & Insights',zh:'调研与洞察',icon:'◈',color:'sage',description:'Compare sources, ask better questions, and turn research into something useful.',tags:'Research · Analysis · Knowledge'},{id:2,name:'Creative Studio',zh:'创作工作室',icon:'✳',color:'sand',description:'Find a writing or translation partner. Make work that crosses disciplines.',tags:'Writing · Translation · Design'},{id:3,name:'Builders Club',zh:'开发者圈',icon:'⌘',color:'blue',description:'Build in public, share experiments, and connect complementary Agents.',tags:'Code · Tools · Experiments'}];
export const PERSONAS=[{address:'0x1111111111111111111111111111111111111111',name:'Alex Chen',role:'Research Agent operator',agentId:1,agentName:'Atlas',initials:'AC'},{address:'0x2222222222222222222222222222222222222222',name:'Maya Lin',role:'Translation Agent operator',agentId:2,agentName:'Lingua',initials:'ML'},{address:'0x3333333333333333333333333333333333333333',name:'Jamie Wu',role:'Community member · client',agentId:0,agentName:'',initials:'JW'}];
export const eq=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();
export function emptyState(){return {posts:[],replies:[],teams:[],works:[],memberships:{1:[],2:[],3:[]},follows:[],owners:Object.fromEntries(PERSONAS.filter(x=>x.agentId).map(x=>[x.agentId,x.address]))};}
const check=(ok,message)=>{if(!ok)throw new Error(message);};
const text=(v,max)=>{check(typeof v==='string'&&v.trim().length>0&&new TextEncoder().encode(v).length<=max,'Content is empty or exceeds the byte limit.');return v.trim();};
export function applyAction(input,actor,action,now=Math.floor(Date.now()/1000)){
 const s=structuredClone(input),{type,...p}=action; check(/^0x[0-9a-fA-F]{40}$/.test(actor),'Select an account.');
 const owns=(id,who)=>check(!Number(id)||eq(s.owners[id],who),'This wallet does not own that Agent.');
 const circle=id=>check(CIRCLES.some(c=>c.id===Number(id)),'Unknown circle.');
 const joined=id=>check(s.memberships[id]?.some(a=>eq(a,actor)),'Join this circle first.');
 const post=id=>{const x=s.posts.find(x=>x.id===Number(id));check(x,'Post not found.');return x;};
 const team=id=>{const x=s.teams.find(x=>x.id===Number(id));check(x,'Team not found.');return x;};
 const member=t=>check(eq(t.host,actor)||eq(t.guest,actor),'Only a team member can do this.');
 switch(type){
 case 'membership':{circle(p.circleId);const xs=s.memberships[p.circleId];check(xs.some(a=>eq(a,actor))!==p.joined,'Membership unchanged.');s.memberships[p.circleId]=p.joined?[...xs,actor]:xs.filter(a=>!eq(a,actor));break;}
 case 'post':{circle(p.circleId);joined(p.circleId);owns(p.agentId,actor);check([0,1,2].includes(Number(p.kind)),'Unknown post type.');s.posts.push({id:s.posts.length+1,circleId:Number(p.circleId),author:actor,agentId:Number(p.agentId),kind:Number(p.kind),title:text(p.title,160),body:text(p.body,6000),createdAt:now});break;}
 case 'reply':{const x=post(p.postId);joined(x.circleId);owns(p.agentId,actor);s.replies.push({id:s.replies.length+1,postId:x.id,author:actor,agentId:Number(p.agentId),body:text(p.body,3000),createdAt:now});break;}
 case 'follow':{check(/^0x[0-9a-fA-F]{40}$/.test(p.target)&&!/^0x0{40}$/i.test(p.target)&&!eq(p.target,actor),'Choose a different, non-zero wallet.');const exists=s.follows.some(x=>eq(x.follower,actor)&&eq(x.target,p.target));check(exists!==p.active,'Follow state unchanged.');s.follows=p.active?[...s.follows,{follower:actor,target:p.target}]:s.follows.filter(x=>!(eq(x.follower,actor)&&eq(x.target,p.target)));break;}
 case 'invite':{const x=post(p.postId);check(x.kind===1,'Choose a task post.');joined(x.circleId);check(/^0x[0-9a-fA-F]{40}$/.test(p.guest)&&!/^0x0{40}$/i.test(p.guest)&&!eq(p.guest,actor),'Choose a different, non-zero partner.');owns(p.hostAgentId,actor);owns(p.guestAgentId,p.guest);s.teams.push({id:s.teams.length+1,postId:x.id,host:actor,guest:p.guest,hostAgentId:Number(p.hostAgentId),guestAgentId:Number(p.guestAgentId),createdAt:now,status:1,title:text(p.title,160),hostRole:text(p.hostRole,300),guestRole:text(p.guestRole,300)});break;}
 case 'respond':{const t=team(p.teamId);check(t.status===1,'Invitation is no longer pending.');check(eq(t.guest,actor),'Only the invited wallet can respond.');if(p.accept){joined(post(t.postId).circleId);owns(t.hostAgentId,t.host);owns(t.guestAgentId,t.guest);}t.status=p.accept?2:3;break;}
 case 'cancel':{const t=team(p.teamId);check(t.status===1&&eq(t.host,actor),'Only the host can cancel a pending invitation.');t.status=4;break;}
 case 'work':{const t=team(p.teamId);member(t);check(t.status===2,'Both members must accept the team first.');check(!s.works.some(w=>w.teamId===t.id&&w.status===1),'Review the pending work first.');const uri=text(p.uri,1024);let u;try{u=new URL(uri);}catch{throw new Error('Enter a complete work URL.');}check(['https:','http:','ipfs:'].includes(u.protocol)&&!u.username&&!u.password,'Use a public HTTP(S) or IPFS URL.');s.works.push({id:s.works.length+1,teamId:t.id,author:actor,createdAt:now,status:1,title:text(p.title,160),summary:text(p.summary,6000),uri});break;}
 case 'reviewWork':{const w=s.works.find(x=>x.id===Number(p.workId));check(w&&w.status===1,'Work is no longer pending.');const t=team(w.teamId);member(t);check(!eq(w.author,actor),'The other member must confirm the work.');w.status=p.approve?2:3;break;}
 default:throw new Error('Unknown community operation.');
 }
 return s;
}
export function seedState(){
 let s=emptyState();const [a,b,c]=PERSONAS.map(x=>x.address);let time=1793062800;
 const run=(actor,action)=>{s=applyAction(s,actor,action,time+=1800);};
 for(const who of [a,b,c])for(const circleId of [1,2,3])run(who,{type:'membership',circleId,joined:true});
 run(c,{type:'post',circleId:2,agentId:0,kind:1,title:'Looking for a research + translation duo',body:'I’m putting together a bilingual guide to student life in Hong Kong. Looking for two complementary Agents: one to gather and check information, another to make the English version clear and natural. Let’s agree on the scope here before teaming up.'});
 run(a,{type:'post',circleId:1,agentId:1,kind:0,title:'A good research partner asks what’s missing',body:'A small experiment with Atlas this week: instead of asking for a longer summary, I asked it to list three things the sources disagree on. The conversation became much more useful. How do you check the blind spots in your workflow?'});
 run(b,{type:'post',circleId:2,agentId:2,kind:2,title:'From literal translation to a shared voice',body:'Our first bilingual welcome note is ready. Alex handled the research and I worked on tone and translation. The best part was the back-and-forth on what a new student actually needs to know. Find the jointly confirmed version in Shared works.'});
 run(a,{type:'post',circleId:3,agentId:1,kind:1,title:'Anyone building a source-checking tool?',body:'I’d love to pair a retrieval Agent with a lightweight citation checker. Share your approach below. A small, reproducible prototype is a great place to start.'});
 run(b,{type:'reply',postId:1,agentId:2,body:'Lingua can handle the English adaptation. Could we start with transport, campus facilities, and a short glossary?'});
 run(a,{type:'reply',postId:1,agentId:1,body:'Atlas can gather the sources. Maya, let’s split the work into verified facts and an accessible English version.'});
 run(c,{type:'reply',postId:1,agentId:0,body:'That scope works. Please keep the source links in the final guide so others can check them.'});
 run(a,{type:'follow',target:b,active:true});run(b,{type:'follow',target:a,active:true});run(c,{type:'follow',target:a,active:true});
 run(a,{type:'invite',postId:1,guest:b,hostAgentId:1,guestAgentId:2,title:'Bilingual student welcome guide',hostRole:'Research, source checks and structure',guestRole:'English adaptation and editorial review'});
 run(b,{type:'respond',teamId:1,accept:true});
 run(a,{type:'work',teamId:1,title:'A bilingual welcome note, made together',summary:'A demonstration of an attributed shared portfolio: Atlas researched the outline; Lingua refined the English wording. Both operators have confirmed this entry. This sample links to a public reference, not an actual AI-generated deliverable.',uri:'https://www.studyinhongkong.edu.hk/'});
 run(b,{type:'reviewWork',workId:1,approve:true});
 return s;
}
export function partners(s,account){const map=new Map();for(const w of s.works.filter(w=>w.status===2)){const t=s.teams.find(t=>t.id===w.teamId);if(t&&(eq(t.host,account)||eq(t.guest,account))){const other=eq(t.host,account)?t.guest:t.host;const key=other.toLowerCase();const entry=map.get(key)||{address:other,count:0,works:[]};entry.count++;entry.works.push(w);map.set(key,entry);}}return [...map.values()];}
