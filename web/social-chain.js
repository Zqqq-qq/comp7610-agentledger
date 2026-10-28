import { DEPLOYMENT } from './config.js';
import {verifyDeployment} from './deployment-evidence.js';
const sdk=()=>globalThis.ethers;
let artifact;
export async function communityArtifact(){if(!artifact){const r=await fetch('./generated/AgentCommunity.json');if(!r.ok)throw new Error('Community build artifact is missing. Run the compiler first.');artifact=await r.json();}return artifact;}
export async function reader(address,registry=DEPLOYMENT.identity,rpc=DEPLOYMENT.rpcUrl){
 const e=sdk();if(!e.isAddress(address)||address===e.ZeroAddress)throw new Error('Configure the community contract first.');
 const request=new e.FetchRequest(rpc);request.timeout=12000;
 const p=new e.JsonRpcProvider(request,11155111,{staticNetwork:true,batchMaxCount:10,cacheTimeout:0});
 try{
 if(BigInt(await p.send('eth_chainId',[]))!==11155111n)throw new Error('The RPC is not Ethereum Sepolia.');
 if(await p.getCode(address)==='0x')throw new Error('No community contract exists at this address on Sepolia.');
 const c=new e.Contract(address,(await communityArtifact()).abi,p);
 if((await c.identity()).toLowerCase()!==registry.toLowerCase())throw new Error('This community uses a different identity registry.');
 if(Number(await c.CIRCLE_COUNT())!==3)throw new Error('This is not a compatible community contract.');
 return {c,p};
 }catch(error){p.destroy();throw error;}
}
export async function loadCommunity(address,account,limit,registry,rpc){
 const {c,p}=await reader(address,registry,rpc);
 try{
 const block=await p.getBlockNumber(), at={blockTag:block};
 const [np,nr,nt,nw,nu,fc,...mc]=await Promise.all([c.postCount(at),c.replyCount(at),c.teamCount(at),c.workCount(at),c.participantCount(at),c.followCount(at),...[1,2,3].map(i=>c.memberCount(i,at))]);
 const counts={posts:Number(np),replies:Number(nr),teams:Number(nt),works:Number(nw),people:Number(nu),follows:Number(fc),members:mc.map(Number)};
 const convert=(x,id)=>Object.fromEntries([['id',id],...Object.entries(x.toObject()).map(([k,v])=>[k,typeof v==='bigint'?Number(v):v])]);
 async function records(n,get,max){const ids=Array.from({length:Math.min(n,max)},(_,i)=>n-i);const out=[];for(let i=0;i<ids.length;i+=10){out.push(...await Promise.all(ids.slice(i,i+10).map(async id=>convert(await get(id,at),id))));}return out.reverse();}
 const [posts,replies,teams,works]=await Promise.all([records(counts.posts,c.getPost,limit),records(counts.replies,c.getReply,limit*2),records(counts.teams,c.getTeam,limit),records(counts.works,c.getWork,limit)]);
 // Include referenced records so older teams retain a traceable provenance.
 const missingTeams=[...new Set(works.map(w=>w.teamId))].filter(id=>!teams.some(t=>t.id===id));
 for(const id of missingTeams)teams.push(convert(await c.getTeam(id,at),id));
 const missingPosts=[...new Set([...teams.map(t=>t.postId),...replies.map(r=>r.postId)])].filter(id=>!posts.some(p=>p.id===id));
 for(const id of missingPosts)posts.push(convert(await c.getPost(id,at),id));
 posts.sort((a,b)=>a.id-b.id);teams.sort((a,b)=>a.id-b.id);
 const people=[];for(let i=0;i<Math.min(counts.people,limit);i+=10)people.push(...await Promise.all(Array.from({length:Math.min(10,counts.people-i)},(_,j)=>c.getParticipant(counts.people-1-i-j,at))));
 for(const who of [...posts.map(p=>p.author),...replies.map(r=>r.author),...teams.flatMap(t=>[t.host,t.guest]),...(account?[account]:[])])if(!people.some(p=>p.toLowerCase()===who.toLowerCase()))people.push(who);
 const memberships={1:[],2:[],3:[]},follows=[],followStats={};
 if(account){await Promise.all([1,2,3].map(async n=>{if(await c.member(n,account,at))memberships[n].push(account);}));}
 for(let i=0;i<people.length;i+=8)await Promise.all(people.slice(i,i+8).map(async who=>{
 const [a,b,incoming,outgoing]=await Promise.all([account?c.following(account,who,at):false,account?c.following(who,account,at):false,c.followerCount(who,at),c.followingCount(who,at)]);
 if(a)follows.push({follower:account,target:who});if(b)follows.push({follower:who,target:account});followStats[who.toLowerCase()]={followers:Number(incoming),following:Number(outgoing)};
 }));
 return {posts,replies,teams,works,memberships,follows,owners:{},people,followStats,counts,block};
 }finally{p.destroy();}
}
export async function sendCommunity(address,registry,rpc,signer,action,onPending){
 const e=sdk(),{c,p}=await reader(address,registry,rpc);
 try{
 const write=c.connect(signer);let tx;const a=action;
 const uriCheck=u=>{const v=new URL(u);if(!['http:','https:','ipfs:'].includes(v.protocol)||v.username||v.password)throw new Error('Use a public HTTP(S) or IPFS work URL.');};
 switch(a.type){
 case 'membership':tx=await write.setMembership(a.circleId,a.joined);break;
 case 'post':tx=await write.createPost(a.circleId,a.agentId,a.kind,a.title,a.body);break;
 case 'reply':tx=await write.createReply(a.postId,a.agentId,a.body);break;
 case 'follow':tx=await write.setFollow(a.target,a.active);break;
 case 'invite':tx=await write.inviteTeam(a.postId,a.guest,a.hostAgentId,a.guestAgentId,a.title,a.hostRole,a.guestRole);break;
 case 'respond':tx=await write.respondTeam(a.teamId,a.accept);break;
 case 'cancel':tx=await write.cancelTeam(a.teamId);break;
 case 'work':uriCheck(a.uri);tx=await write.proposeWork(a.teamId,a.title,a.summary,a.uri);break;
 case 'reviewWork':tx=await write.reviewWork(a.workId,a.approve);break;
 default:throw new Error('Unknown community operation.');
 }
 onPending?.(tx.hash);let receipt;
 try{receipt=await tx.wait(1);}catch(error){if(error.code==='TRANSACTION_REPLACED'&&!error.cancelled&&error.receipt?.status===1)receipt=error.receipt;else throw error;}
 if(receipt?.status!==1)throw new Error('The community transaction did not succeed.');
 return receipt.hash||tx.hash;
 }finally{p.destroy();}
}
export async function deployCommunity(registry,signer,onPending,onEvidence){
 const e=sdk(),provider=signer.provider;
 if(!provider||BigInt(await provider.send('eth_chainId',[]))!==11155111n)throw new Error('Switch your wallet to Ethereum Sepolia before deploying.');
 if(!e.isAddress(registry)||registry===e.ZeroAddress||await provider.getCode(registry)==='0x')throw new Error('IdentityRegistry has no contract code on Sepolia.');
 const a=await communityArtifact(),c=await new e.ContractFactory(a.abi,a.bytecode,signer).deploy(registry),tx=c.deploymentTransaction();
 onPending?.(tx.hash);await c.waitForDeployment();const address=await c.getAddress();
 // Deployment already exists if evidence reading fails. Preserve its address/hash for recovery.
 try{const evidence=await verifyDeployment({provider,sdk:e,artifact:a,registry,transactionHash:tx.hash,address});onEvidence?.(evidence);}
 catch(error){onEvidence?.({schema:'agentledger-deployment-evidence-v1',status:'deployed-verification-pending',address,transactionHash:tx.hash,identity:registry,error:String(error.message||error)});}
 return address;
}
