import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import solc from 'solc';
import ganache from 'ganache';
import '../web/vendor/ethers.umd.min.js';
import {escrowService,jobFromReceipt} from '../web/escrow-core.js';
import {verifyLink,readLinks,encodeLink,decodeLink,teamCounterparty,MAX_LINK_REPLIES} from '../web/escrow-links.js';
const e=globalThis.ethers;

test('real EVM escrow lifecycle and cross-reader community references',async t=>{
 const sources={};for(const name of ['IdentityRegistry','AgentCommunity','JobEscrow','MockUSDC'])sources[name+'.sol']={content:await fs.readFile('contracts/'+name+'.sol','utf8')};
 const out=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources,settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}})));
 assert.deepEqual((out.errors||[]).filter(x=>x.severity==='error'),[]);
 const rpc=ganache.provider({logging:{quiet:true},chain:{chainId:11155111},wallet:{totalAccounts:3}});
 const provider=new e.BrowserProvider(rpc,undefined,{cacheTimeout:-1});
 try {
 const a=await provider.getSigner(0),b=await provider.getSigner(1),c=await provider.getSigner(2),A=await a.getAddress(),B=await b.getAddress(),C=await c.getAddress();
 async function deploy(name,args=[]){const x=out.contracts[name+'.sol'][name];const obj=await new e.ContractFactory(x.abi,x.evm.bytecode.object,a).deploy(...args);await obj.waitForDeployment();return obj;}
 const identity=await deploy('IdentityRegistry'),community=await deploy('AgentCommunity',[await identity.getAddress()]),escrow=await deploy('JobEscrow',[await identity.getAddress()]),token=await deploy('MockUSDC');
 await(await identity.register('https://example.com/a')).wait();await(await identity.connect(b).register('https://example.com/b')).wait();
 for(const actor of [a,b,c])await(await community.connect(actor).setMembership(2,true)).wait();
 await(await community.createPost(2,1,1,'Paid research','Need translation')).wait();
 await(await community.inviteTeam(1,B,1,2,'Research team','Research','Translate')).wait();await(await community.connect(b).respondTeam(1,true)).wait();
 const address=await escrow.getAddress(),T=await token.getAddress();
 const service=escrowService({sdk:e,escrow,token,identity,provider,escrowAddress:address,tokenAddress:T});
 const input={provider:B,providerAgentId:'2',amount:'1',minutes:'60',reviewWindow:'60'};
 const digest='0x'+'11'.repeat(32);
 async function create(){const approved=await service.approve(a,input);if(approved.tx)await approved.tx.wait();const receipt=await(await service.create(a,input)).wait();return jobFromReceipt(receipt,address,escrow.interface);}
 await(await token.mint(A,100000000n)).wait();
 let id;
 await t.test('approval, actual JobCreated ID, submission and payout execute on-chain',async()=>{
  await assert.rejects(service.create(a,input),/Approve/);
  id=await create();assert.equal(id,1n);assert.equal(await token.balanceOf(address),1000000n);
  await assert.rejects(service.perform('submit',a,id,digest));
  await assert.rejects(service.create(a,{...input,provider:A}));
  await assert.rejects(service.create(a,{...input,providerAgentId:'1'}));
  await(await service.perform('submit',b,id,digest)).wait();
  await assert.rejects(escrow.connect(c).release(id));
  await(await service.perform('release',a,id)).wait();assert.equal(await token.balanceOf(B),1000000n);
  await assert.rejects(escrow.release(id));await assert.rejects(escrow.refund(id));
 });
 const link={version:1,chainId:11155111,community:await community.getAddress(),postId:'1',teamId:'1',escrow:address,jobId:String(id)};
 const context={provider,community,escrow,link,author:A,token:T};
 await t.test('references require real jobs, source task, client, partner and matching Agent',async()=>{
  assert.equal((await verifyLink(context)).job.status,3n);
  await assert.rejects(verifyLink({...context,author:C}));
  await assert.rejects(verifyLink({...context,link:{...link,jobId:'999'}}));
  await assert.rejects(verifyLink({...context,token:C}));
  assert.throws(()=>teamCounterparty({status:1,host:A,guest:B},A));
  assert.throws(()=>teamCounterparty({status:2,host:A,guest:B},C));
  assert.equal(decodeLink('not a reference',e),null);
  assert.equal(decodeLink(encodeLink(link,e),e).jobId,'1');
  assert.throws(()=>encodeLink({...link,chainId:1},e));
  assert.throws(()=>encodeLink({...link,jobId:'0'},e));
 });
 await t.test('forged and duplicate references ignored; a fresh reader recovers the canonical link',async()=>{
  await(await community.connect(c).createReply(1,0,encodeLink(link,e))).wait();
  await(await community.createReply(1,0,encodeLink(link,e))).wait();
  await(await community.createReply(1,0,encodeLink(link,e))).wait();
  const freshProvider=new e.BrowserProvider(rpc,undefined,{cacheTimeout:-1});
  try {
   const independentCommunity=community.connect(freshProvider),independentEscrow=escrow.connect(freshProvider);
   const result=await readLinks({provider:freshProvider,community:independentCommunity,escrow:independentEscrow,sdk:e,token:T});
   assert.equal(result.records.length,1);assert.equal(result.records[0].replyId,2);assert.equal(result.rejected,2);
   assert.equal(result.records[0].link.teamId,'1');assert.equal(result.records[0].job.status,3n);
  } finally {freshProvider.destroy();}
  await assert.rejects(readLinks({provider,community:{replyCount:async()=>BigInt(MAX_LINK_REPLIES+1)},escrow,sdk:e}),/scan limit/);
 });
 await t.test('no-delivery refund and silent-client claim move balances exactly once',async()=>{
  const refundId=await create();await assert.rejects(service.perform('refund',a,refundId));
  const refundBefore=await token.balanceOf(A);await rpc.request({method:'evm_increaseTime',params:[3601]});await rpc.request({method:'evm_mine',params:[]});
  await(await service.perform('refund',a,refundId)).wait();assert.equal(await token.balanceOf(A),refundBefore+1000000n);
  const claimId=await create();await(await service.perform('submit',b,claimId,digest)).wait();await assert.rejects(service.perform('refund',a,claimId));await assert.rejects(service.perform('claim',b,claimId));
  const before=await token.balanceOf(B);await rpc.request({method:'evm_increaseTime',params:[61]});await rpc.request({method:'evm_mine',params:[]});
  await(await service.perform('claim',b,claimId)).wait();assert.equal(await token.balanceOf(B),before+1000000n);await assert.rejects(escrow.connect(b).claim(claimId));
 });
 } finally {provider.destroy();await rpc.disconnect();}
});
