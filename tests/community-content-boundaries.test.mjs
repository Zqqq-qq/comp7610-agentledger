import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ganache from 'ganache';
import '../web/vendor/ethers.umd.min.js';
import {cardUri, safeLink} from '../web/core.js';
const {BrowserProvider, ContractFactory}=globalThis.ethers;
const artifact=JSON.parse(await fs.readFile('web/generated/AgentCommunity.json','utf8'));
async function fixture(t){
  const rpc=ganache.provider({logging:{quiet:true},chain:{chainId:1337},miner:{blockGasLimit:40000000}});
  const p=new BrowserProvider(rpc,undefined,{cacheTimeout:-1});
  t.after(async()=>{p.destroy();await rpc.disconnect();});
  const a=await p.getSigner(0),b=await p.getSigner(1);
  // Agent ID 0 never calls ownerOf; the registry must still contain contract code.
  const registry=await new ContractFactory([], '0x6001600c60003960016000f300', a).deploy();await registry.waitForDeployment();
  const x=await new ContractFactory(artifact.abi,artifact.bytecode,a).deploy(await registry.getAddress());await x.waitForDeployment();
  await(await x.setMembership(1,true)).wait();await(await x.connect(b).setMembership(1,true)).wait();
  await(await x.createPost(1,0,1,'Task','Body')).wait();
  await(await x.inviteTeam(1,await b.getAddress(),0,0,'Team','Host','Guest')).wait();
  await(await x.connect(b).respondTeam(1,true)).wait();
  return {x,a,b};
}
async function rejected(p,reason){await assert.rejects(p,e=>{assert.match([e.reason,e.shortMessage,e.info?.error?.message,e.message].filter(Boolean).join(' | '),reason);return true;});}
const bytes=n=>'界'.repeat(Math.floor(n/3))+'a'.repeat(n%3);
test('all community text fields enforce exact UTF-8 byte limits, not character counts',async t=>{
  const {x,b}=await fixture(t);
  const cases=[
    ['post title',160,v=>x.createPost.staticCall(1,0,0,v,'Body')],
    ['post body',6000,v=>x.createPost.staticCall(1,0,0,'Title',v)],
    ['reply body',3000,v=>x.createReply.staticCall(1,0,v)],
    ['team title',160,v=>x.inviteTeam.staticCall(1,b.address,0,0,v,'Host','Guest')],
    ['host role',300,v=>x.inviteTeam.staticCall(1,b.address,0,0,'Team',v,'Guest')],
    ['guest role',300,v=>x.inviteTeam.staticCall(1,b.address,0,0,'Team','Host',v)],
    ['work title',160,v=>x.proposeWork.staticCall(1,v,'Summary','https://example.com')],
    ['work summary',6000,v=>x.proposeWork.staticCall(1,'Work',v,'https://example.com')],
    ['work URI',1024,v=>x.proposeWork.staticCall(1,'Work','Summary',v)],
  ];
  for(const [name,limit,call] of cases){
    const exact=bytes(limit);assert.equal(Buffer.byteLength(exact),limit,name);assert(exact.length<limit);
    assert((await call(exact))>0n,name);
    await rejected(call(exact+'a'),/invalid text length/);await rejected(call(''),/invalid text length/);
  }
  assert.equal(await x.postCount(),1n);assert.equal(await x.replyCount(),0n);assert.equal(await x.teamCount(),1n);assert.equal(await x.workCount(),0n);
});
test('contract stores arbitrary nonempty URI text; frontend blocks unsafe clickable schemes and credentials',async t=>{
  const {x}=await fixture(t);
  for(const uri of ['javascript:alert(1)','data:text/html,hello','https://user:secret@example.com/a','not a URL']){
    assert.equal(await x.proposeWork.staticCall(1,'Work','Summary',uri),1n);
    assert.throws(()=>cardUri(uri));assert.equal(safeLink(uri),null);
  }
  assert.equal(cardUri('ipfs://bafy/example'),'ipfs://bafy/example');assert.equal(safeLink('ipfs://bafy/example'),null);
  assert.equal(safeLink('https://example.com/a'),'https://example.com/a');
  await(await x.proposeWork(1,'Work','Public text','javascript:alert(1)')).wait();
  assert.equal((await x.getWork(1)).uri,'javascript:alert(1)');
});
test('duplicate and terminal operations fail for the declared reason and leave counts unchanged',async t=>{
  const {x,b}=await fixture(t);
  await rejected(x.setMembership.staticCall(1,true),/membership unchanged/);
  await(await x.setFollow(b.address,true)).wait();await rejected(x.setFollow.staticCall(b.address,true),/follow unchanged/);
  await rejected(x.connect(b).respondTeam.staticCall(1,true),/team not pending/);
  await rejected(x.getPost(0),/unknown post/);await rejected(x.createReply.staticCall(999,0,'Reply'),/unknown post/);
  await(await x.proposeWork(1,'Work','Summary','https://example.com')).wait();
  await rejected(x.proposeWork.staticCall(1,'Again','Summary','https://example.com'),/review pending work first/);
  await rejected(x.reviewWork.staticCall(1,true),/only other member/);
  await(await x.connect(b).reviewWork(1,true)).wait();await rejected(x.connect(b).reviewWork.staticCall(1,true),/work not pending/);
  assert.equal(await x.followCount(),1n);assert.equal(await x.workCount(),1n);assert.equal(await x.collaborationCount((await x.getTeam(1)).host,b.address),1n);
});
