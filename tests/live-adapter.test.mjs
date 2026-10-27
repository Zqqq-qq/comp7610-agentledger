import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import ganache from 'ganache';import solc from 'solc';import '../web/vendor/ethers.umd.min.js';
import {loadCommunity,sendCommunity,reader} from '../web/social-chain.js';
const e=globalThis.ethers;
test('live adapter reads and writes real EVM social records through JSON-RPC, with shared provenance',async()=>{
 const server=ganache.server({logging:{quiet:true},chain:{chainId:11155111},wallet:{totalAccounts:2}});await server.listen(0,'127.0.0.1');
 const rpc='http://127.0.0.1:'+server.address().port;const provider=new e.JsonRpcProvider(rpc,undefined,{cacheTimeout:-1});const a=await provider.getSigner(0),b=await provider.getSigner(1);
 const artifact=JSON.parse(await fs.readFile('web/generated/AgentCommunity.json','utf8'));const originalFetch=globalThis.fetch;
 globalThis.fetch=(url,...args)=>url==='./generated/AgentCommunity.json'?Promise.resolve(new Response(JSON.stringify(artifact),{headers:{'Content-Type':'application/json'}})):originalFetch(url,...args);
 try{
 const source=await fs.readFile('contracts/IdentityRegistry.sol','utf8');const out=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'I.sol':{content:source}},settings:{evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}}))).contracts['I.sol'].IdentityRegistry;
 const identity=await new e.ContractFactory(out.abi,'0x'+out.evm.bytecode.object,a).deploy();await identity.waitForDeployment();
 const c=await new e.ContractFactory(artifact.abi,artifact.bytecode,a).deploy(await identity.getAddress());await c.waitForDeployment();const address=await c.getAddress(),registry=await identity.getAddress();
 await(await identity.register('https://example.com/a')).wait();await(await identity.connect(b).register('https://example.com/b')).wait();
 const send=(signer,action)=>sendCommunity(address,registry,rpc,signer,action);
 await send(a,{type:'membership',circleId:2,joined:true});await send(b,{type:'membership',circleId:2,joined:true});
 await send(a,{type:'post',circleId:2,agentId:1,kind:1,title:'Live task',body:'Need a complementary partner.'});
 await send(b,{type:'reply',postId:1,agentId:2,body:'Happy to translate.'});await send(a,{type:'follow',target:await b.getAddress(),active:true});
 await send(a,{type:'invite',postId:1,guest:await b.getAddress(),hostAgentId:1,guestAgentId:2,title:'Live team',hostRole:'Research',guestRole:'Translate'});
 await send(b,{type:'respond',teamId:1,accept:true});await send(a,{type:'work',teamId:1,title:'Live shared work',summary:'Both roles recorded.',uri:'https://example.com/work'});await send(b,{type:'reviewWork',workId:1,approve:true});
 const s=await loadCommunity(address,await a.getAddress(),1,registry,rpc);
 assert.equal(s.posts[0].title,'Live task');assert.equal(s.replies[0].author,await b.getAddress());assert.equal(s.teams[0].status,2);assert.equal(s.works[0].status,2);assert.equal(s.counts.members[1],2);assert.equal(s.follows[0].target,await b.getAddress());assert.equal(s.memberships[2][0],await a.getAddress());
 await assert.rejects(reader(address,await b.getAddress(),rpc),/different identity/);
 }finally{globalThis.fetch=originalFetch;provider.destroy();await server.close();}
});
