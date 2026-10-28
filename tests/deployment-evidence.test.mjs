import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import ganache from 'ganache';import solc from 'solc';
import '../web/vendor/ethers.umd.min.js';import {verifyDeployment} from '../web/deployment-evidence.js';import {deployCommunity} from '../web/social-chain.js';
const sdk=globalThis.ethers;
test('deployment evidence verifies real EVM receipt, bytecode and constructor',async t=>{
 const rpc=ganache.provider({logging:{quiet:true},chain:{chainId:11155111}}),provider=new sdk.BrowserProvider(rpc,undefined,{cacheTimeout:-1});
 const originalFetch=globalThis.fetch;
 try {
  const artifact=JSON.parse(await fs.readFile('web/generated/AgentCommunity.json','utf8'));
  globalThis.fetch=(url,...args)=>url==='./generated/AgentCommunity.json'?Promise.resolve(new Response(JSON.stringify(artifact))):originalFetch(url,...args);
  const signer=await provider.getSigner(0),content=await fs.readFile('contracts/IdentityRegistry.sol','utf8');
  const out=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'IdentityRegistry.sol':{content}},settings:{evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}}))).contracts['IdentityRegistry.sol'].IdentityRegistry;
  const registry=await new sdk.ContractFactory(out.abi,out.evm.bytecode.object,signer).deploy();await registry.waitForDeployment();
  let evidence,pending;
  const address=await deployCommunity(await registry.getAddress(),signer,hash=>pending=hash,x=>evidence=x);
  const args={provider,sdk,artifact,registry:await registry.getAddress(),transactionHash:pending,address};
  await t.test('browser deployment produces a portable verified record',async()=>{
   assert.equal(evidence.address,address);assert.equal(evidence.identity,args.registry);assert.equal(evidence.transactionHash,pending);assert.equal(evidence.chainId,11155111);assert.equal(evidence.evidenceType,'direct-creation-receipt-and-artifact-match');assert.ok(evidence.blockNumber>0);assert.ok(evidence.confirmations>=1);
   assert.equal(JSON.parse(JSON.stringify(evidence)).deployer,await signer.getAddress());
  });
  await t.test('independent verification rejects wrong address, constructor, artifact and missing receipt',async()=>{
   assert.equal((await verifyDeployment(args)).address,address);
   await assert.rejects(verifyDeployment({...args,address:args.registry}),/different community/);
   await assert.rejects(verifyDeployment({...args,registry:address}),/input differs/);
   await assert.rejects(verifyDeployment({...args,artifact:{...artifact,bytecode:artifact.bytecode+'00'}}),/input differs/);
   await assert.rejects(verifyDeployment({...args,transactionHash:'0x'+'00'.repeat(32)}),/confirmed receipt/);
   await assert.rejects(verifyDeployment({...args,transactionHash:'bad'}),/actual deployment/);
  });
  await t.test('wrong network fails before any wallet broadcast',async()=>{
   const wrongProvider={send:async()=> '0x1'};
   await assert.rejects(verifyDeployment({...args,provider:wrongProvider}),/Sepolia/);
   await assert.rejects(deployCommunity(args.registry,{provider:wrongProvider}),/Sepolia/);
  });
 }finally{globalThis.fetch=originalFetch;provider.destroy();await rpc.disconnect();}
});
