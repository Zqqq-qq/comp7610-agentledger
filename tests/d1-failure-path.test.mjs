import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import ganache from 'ganache';import solc from 'solc';import '../web/vendor/ethers.umd.min.js';

// D1 (#7) 验收：每一条拒绝路径都必须因为合约声明的那个原因被拒绝。
// 仅断言「会抛错」不足够——错误的拒绝理由（例如成员检查先于角色检查）同样会让测试变绿。

const {BrowserProvider,ContractFactory}=globalThis.ethers;
const artifact=JSON.parse(await fs.readFile('web/generated/AgentCommunity.json','utf8'));
const identitySource=await fs.readFile('contracts/IdentityRegistry.sol','utf8');
const compiled=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'I.sol':{content:identitySource}},settings:{evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}}))).contracts['I.sol'].IdentityRegistry;

function reasonOf(error){return [error?.reason,error?.shortMessage,error?.info?.error?.message,error?.error?.message,error?.message].filter(Boolean).join(' | ');}
async function rejectsWith(promise,pattern,label){await assert.rejects(promise,error=>{const raw=reasonOf(error);assert.match(raw,pattern,`${label} 被拒绝，但原因不是预期的：${raw}`);return true;});}

async function fixture(){
 const rpc=ganache.provider({logging:{quiet:true},wallet:{totalAccounts:3},chain:{chainId:1337}});
 const provider=new BrowserProvider(rpc,undefined,{cacheTimeout:-1});
 const [a,b,c]=await Promise.all([0,1,2].map(i=>provider.getSigner(i)));
 const deploy=async(abi,bytecode,args=[])=>{const x=await new ContractFactory(abi,bytecode,a).deploy(...args);await x.waitForDeployment();return x;};
 const identity=await deploy(compiled.abi,'0x'+compiled.evm.bytecode.object);
 const community=await deploy(artifact.abi,artifact.bytecode,[await identity.getAddress()]);
 await(await identity.register('https://example.com/a')).wait();
 await(await identity.connect(b).register('https://example.com/b')).wait();
 return {a,b,c,identity,community,close:async()=>{provider.destroy();await rpc.disconnect();}};
}

test('主流程：需求→回复→邀请→接受→提议作品→另一成员确认→合作履历',async()=>{const f=await fixture();try{
 const x=f.community,A=await f.a.getAddress(),B=await f.b.getAddress();
 await(await x.setMembership(2,true)).wait();
 await(await x.connect(f.b).setMembership(2,true)).wait();
 await(await x.createPost(2,0,1,'Bilingual guide','Need translation')).wait();
 assert.equal(await x.postCount(),1n);
 await(await x.connect(f.b).createReply(1,0,'I can cover zh→en')).wait();
 assert.equal(await x.replyCount(),1n);assert.equal((await x.getReply(1)).author,B);
 await(await x.inviteTeam(1,B,1,2,'Our team','Research','Translate')).wait();
 assert.equal((await x.getTeam(1)).status,1n);
 await(await x.connect(f.b).respondTeam(1,true)).wait();
 assert.equal((await x.getTeam(1)).status,2n);
 await(await x.proposeWork(1,'Guide v1','A drafts, B translates','https://example.com/guide')).wait();
 assert.equal((await x.getWork(1)).status,1n);
 await(await x.connect(f.b).reviewWork(1,true)).wait();
 assert.equal((await x.getWork(1)).status,2n);
 // 合作履历：双向各记一次，且只有双方确认后才产生
 assert.equal(await x.collaborationCount(A,B),1n);
 assert.equal(await x.collaborationCount(B,A),1n);
}finally{await f.close();}});

test('拒绝路径：未加入圈子不能发帖，也不能回复',async()=>{const f=await fixture();try{
 const x=f.community;
 await rejectsWith(x.createPost(2,0,1,'Task','Body'),/join circle first/,'未入圈发帖');
 // 建立一条他人可见的帖子后，用未入圈的 C 回复，确认拒绝原因是成员检查而非「未知帖子」
 await(await x.setMembership(2,true)).wait();
 await(await x.createPost(2,0,1,'Task','Body')).wait();
 await rejectsWith(x.connect(f.c).createReply(1,0,'hello'),/join circle first/,'未入圈回复');
 assert.equal(await x.postCount(),1n);assert.equal(await x.replyCount(),0n);
}finally{await f.close();}});

test('拒绝路径：第三钱包不能接受别人的邀请',async()=>{const f=await fixture();try{
 const x=f.community,B=await f.b.getAddress();
 await(await x.setMembership(2,true)).wait();
 await(await x.connect(f.b).setMembership(2,true)).wait();
 await(await x.connect(f.c).setMembership(2,true)).wait();
 await(await x.createPost(2,0,1,'Task','Body')).wait();
 await(await x.inviteTeam(1,B,1,2,'Our team','Research','Translate')).wait();
 // C 在圈内、受邀者 B 也在圈内：唯一失败点必须是「只有被邀请者能接受」
 await rejectsWith(x.connect(f.c).respondTeam(1,true),/only invited partner/,'第三钱包接受邀请');
 assert.equal((await x.getTeam(1)).status,1n);
 await(await x.connect(f.b).respondTeam(1,true)).wait();
 assert.equal((await x.getTeam(1)).status,2n);
}finally{await f.close();}});

test('拒绝路径：提议人不能确认自己的作品',async()=>{const f=await fixture();try{
 const x=f.community,B=await f.b.getAddress();
 await(await x.setMembership(2,true)).wait();
 await(await x.connect(f.b).setMembership(2,true)).wait();
 await(await x.createPost(2,0,1,'Task','Body')).wait();
 await(await x.inviteTeam(1,B,1,2,'Our team','Research','Translate')).wait();
 await(await x.connect(f.b).respondTeam(1,true)).wait();
 await(await x.proposeWork(1,'Guide','Summary','https://example.com')).wait();
 // A 是提议人，状态确为 Proposed：唯一失败点必须是「只能由另一名成员确认」
 await rejectsWith(x.reviewWork(1,true),/only other member/,'提议人自确认');
 assert.equal((await x.getWork(1)).status,1n);
 assert.equal(await x.collaborationCount(await f.a.getAddress(),B),0n);
}finally{await f.close();}});

test('拒绝路径：同一作品不能重复确认，已终态作品的任何复审都被拒绝',async()=>{const f=await fixture();try{
 const x=f.community,B=await f.b.getAddress();
 await(await x.setMembership(2,true)).wait();
 await(await x.connect(f.b).setMembership(2,true)).wait();
 await(await x.createPost(2,0,1,'Task','Body')).wait();
 await(await x.inviteTeam(1,B,1,2,'Our team','Research','Translate')).wait();
 await(await x.connect(f.b).respondTeam(1,true)).wait();
 await(await x.proposeWork(1,'Guide','Summary','https://example.com')).wait();
 await(await x.connect(f.b).reviewWork(1,true)).wait();
 assert.equal((await x.getWork(1)).status,2n);
 // 第二次确认：作品已不是 Proposed，失败原因是状态而非角色
 await rejectsWith(x.connect(f.b).reviewWork(1,true),/work not pending/,'重复确认');
 await rejectsWith(x.reviewWork(1,false),/work not pending/,'已确认作品请求修改');
 assert.equal(await x.collaborationCount(await f.a.getAddress(),B),1n);
}finally{await f.close();}});
