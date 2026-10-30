import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ganache from 'ganache';
import '../web/vendor/ethers.umd.min.js';
import {applyAction,emptyState,PERSONAS} from '../web/social-core.js';
const {BrowserProvider,ContractFactory}=globalThis.ethers;
const artifact=JSON.parse(await fs.readFile('web/generated/AgentCommunity.json','utf8'));
// Independent B1/B2 review (ffmitrg): lock behaviours that the earlier review text described ambiguously.
async function fixture(t){
  const rpc=ganache.provider({logging:{quiet:true},chain:{chainId:1337},miner:{blockGasLimit:40000000}});
  const p=new BrowserProvider(rpc,undefined,{cacheTimeout:-1});
  t.after(async()=>{p.destroy();await rpc.disconnect();});
  const [a,b,c]=await Promise.all([0,1,2].map(i=>p.getSigner(i)));
  const registry=await new ContractFactory([],'0x6001600c60003960016000f300',a).deploy();await registry.waitForDeployment();
  const x=await new ContractFactory(artifact.abi,artifact.bytecode,a).deploy(await registry.getAddress());await x.waitForDeployment();
  for(const s of [a,b,c])await(await x.connect(s).setMembership(1,true)).wait();
  return {x,a,b,c,A:await a.getAddress(),B:await b.getAddress(),C:await c.getAddress()};
}
async function rejected(p,reason){await assert.rejects(p,e=>{assert.match([e.reason,e.shortMessage,e.info?.error?.message,e.message].filter(Boolean).join(' | '),reason);return true;});}

test('any circle member, not only the task author, can host a team on a task post',async t=>{
  const {x,b,c,A,C}=await fixture(t);
  await(await x.createPost(1,0,1,'Task by A','Body')).wait();
  // C did not write post 1, yet becomes host of a team built from it.
  await(await x.connect(c).inviteTeam(1,await b.getAddress(),0,0,'Team','Host','Guest')).wait();
  const team=await x.getTeam(1);
  assert.equal(team.host,C);assert.notEqual(team.host,A);
  await(await x.connect(b).respondTeam(1,true)).wait();
  assert.equal((await x.getTeam(1)).status,2n);
  // The demo sandbox mirrors this: Jamie (author) is not the host in the seeded team.
  const [alex,maya,jamie]=PERSONAS.map(p=>p.address);let s=emptyState();
  for(const who of [alex,maya,jamie])s=applyAction(s,who,{type:'membership',circleId:1,joined:true});
  s=applyAction(s,jamie,{type:'post',circleId:1,agentId:0,kind:1,title:'T',body:'B'});
  s=applyAction(s,alex,{type:'invite',postId:1,guest:maya,hostAgentId:0,guestAgentId:0,title:'T',hostRole:'h',guestRole:'g'});
  assert.equal(s.teams[0].host,alex);
});

test('post kind range and task-only invitations are enforced by the contract, not only by the UI',async t=>{
  const {x,B}=await fixture(t);
  await rejected(x.createPost.staticCall(1,0,3,'Title','Body'),/invalid post kind/);
  await(await x.createPost(1,0,0,'Discussion','Body')).wait();
  await rejected(x.inviteTeam.staticCall(1,B,0,0,'Team','Host','Guest'),/task post required/);
});

test('whitespace-only text: contract stores it, demo sandbox rejects and trims',async t=>{
  const {x}=await fixture(t);
  await(await x.createPost(1,0,0,'   ',' \n ')).wait();
  const post=await x.getPost(1);assert.equal(post.title,'   ');assert.equal(post.body,' \n ');
  const [alex]=PERSONAS.map(p=>p.address);let s=emptyState();
  s=applyAction(s,alex,{type:'membership',circleId:1,joined:true});
  assert.throws(()=>applyAction(s,alex,{type:'post',circleId:1,agentId:0,kind:0,title:'   ',body:'x'}),/empty/);
  assert.equal(applyAction(s,alex,{type:'post',circleId:1,agentId:0,kind:0,title:'  Hi  ',body:'x'}).posts[0].title,'Hi');
});

test('a guest can be invited before joining; the circle check happens only at acceptance',async t=>{
  const {x,b,B}=await fixture(t);
  await(await x.createPost(1,0,1,'Task','Body')).wait();
  await(await x.connect(b).setMembership(1,false)).wait();
  await(await x.inviteTeam(1,B,0,0,'Team','Host','Guest')).wait();
  await rejected(x.connect(b).respondTeam.staticCall(1,true),/join circle first/);
  await(await x.connect(b).respondTeam(1,false)).wait();
  assert.equal((await x.getTeam(1)).status,3n);
});

test('live write adapter trims text the same way the demo does',async()=>{
  const {normalizeText}=await import('../web/social-core.js');
  assert.deepEqual(normalizeText({type:'post',circleId:1,title:'  Hi ',body:'\nBody '}),{type:'post',circleId:1,title:'Hi',body:'Body'});
  assert.throws(()=>normalizeText({type:'reply',postId:1,body:'   '}),/empty/);
  assert.throws(()=>normalizeText({type:'invite',title:'T',hostRole:'h',guestRole:'界'.repeat(101)}),/byte limit/);
  const passthrough={type:'membership',circleId:1,joined:true};assert.equal(normalizeText(passthrough),passthrough);
});
