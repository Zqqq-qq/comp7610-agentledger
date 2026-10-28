import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import solc from 'solc';import ganache from 'ganache';
import '../web/vendor/ethers.umd.min.js';import {loadCommunity,sendCommunity,reader} from '../web/social-chain.js';import {errorMessage} from '../web/core.js';
const e=globalThis.ethers;
test('independent JSON-RPC sessions share community data and recover from failures',async t=>{
 const server=ganache.server({logging:{quiet:true},chain:{chainId:11155111},wallet:{totalAccounts:2}}),wrong=ganache.server({logging:{quiet:true},chain:{chainId:1}});
 await server.listen(0,'127.0.0.1');await wrong.listen(0,'127.0.0.1');
 const rpc='http://127.0.0.1:'+server.address().port,badRpc='http://127.0.0.1:'+wrong.address().port;
 const p1=new e.JsonRpcProvider(rpc,undefined,{cacheTimeout:-1}),p2=new e.JsonRpcProvider(rpc,undefined,{cacheTimeout:-1});
 const originalFetch=globalThis.fetch;let wrongClosed=false;
 try {
  const artifact=JSON.parse(await fs.readFile('web/generated/AgentCommunity.json','utf8'));
  globalThis.fetch=(url,...args)=>url==='./generated/AgentCommunity.json'?Promise.resolve(new Response(JSON.stringify(artifact))):originalFetch(url,...args);
  const a=await p1.getSigner(0),b=await p2.getSigner(1),A=await a.getAddress(),B=await b.getAddress();
  const content=await fs.readFile('contracts/IdentityRegistry.sol','utf8'),output=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'I.sol':{content}},settings:{evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}}))).contracts['I.sol'].IdentityRegistry;
  const identity=await new e.ContractFactory(output.abi,output.evm.bytecode.object,a).deploy();await identity.waitForDeployment();
  const registry=await identity.getAddress(),community=await new e.ContractFactory(artifact.abi,artifact.bytecode,a).deploy(registry);await community.waitForDeployment();const address=await community.getAddress();
  const send=(signer,action)=>sendCommunity(address,registry,rpc,signer,action);
  await send(a,{type:'membership',circleId:2,joined:true});await send(b,{type:'membership',circleId:1,joined:true});
  await send(a,{type:'post',circleId:2,agentId:0,kind:1,title:'Shared live task',body:'Read by two independent sessions'});
  await send(a,{type:'follow',target:B,active:true});
  await t.test('switching the read account updates membership and following without leaking prior permissions',async()=>{
   const first=await loadCommunity(address,A,40,registry,rpc),second=await loadCommunity(address,B,40,registry,rpc);
   assert.deepEqual(first.posts,second.posts);assert.deepEqual(first.counts,second.counts);
   assert.deepEqual(first.memberships[2],[A]);assert.deepEqual(second.memberships[2],[]);assert.deepEqual(second.memberships[1],[B]);
   assert.equal(first.followStats[B.toLowerCase()].followers,1);assert.equal(second.follows.some(f=>f.follower===B),false);
  });
  await t.test('wrong RPC network, missing code and mismatched identity fail explicitly',async()=>{
   await assert.rejects(reader(address,registry,badRpc),/not Ethereum Sepolia/);
   await assert.rejects(reader(B,registry,rpc),/No community contract/);
   await assert.rejects(reader(address,B,rpc),/different identity/);
   await assert.rejects(send({provider:{send:async()=> '0x1'}},{type:'membership',circleId:1,joined:true}),/signing wallet/);
  });
  await t.test('RPC outage rejects the read and a subsequent good endpoint recovers real shared records',async()=>{
   await wrong.close();wrongClosed=true;
   await assert.rejects(loadCommunity(address,A,40,registry,badRpc));
   assert.equal((await loadCommunity(address,A,40,registry,rpc)).posts[0].title,'Shared live task');
  });
  await t.test('wallet denial sends no transaction; retry from the second signer updates both readers',async()=>{
   let prompts=0;
   const denied=new Proxy(b,{get(target,key){if(key==='sendTransaction')return async()=>{prompts++;throw Object.assign(new Error('User rejected the request'),{code:4001});};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});
   await assert.rejects(send(denied,{type:'membership',circleId:2,joined:true}),error=>{assert.match(errorMessage(error),/rejected|cancelled/i);return true;});
   assert.equal(prompts,1);assert.equal(await community.member(2,B),false);
   await send(b,{type:'membership',circleId:2,joined:true});
   await send(b,{type:'reply',postId:1,agentId:0,body:'Seen and replied from independent wallet session B'});
   const freshA=await loadCommunity(address,A,40,registry,rpc),freshB=await loadCommunity(address,B,40,registry,rpc);
   assert.deepEqual(freshA.replies,freshB.replies);assert.equal(freshA.replies[0].author,B);assert.deepEqual(freshB.memberships[2],[B]);
  });
 }finally{globalThis.fetch=originalFetch;p1.destroy();p2.destroy();await server.close();if(!wrongClosed)await wrong.close();}
});
