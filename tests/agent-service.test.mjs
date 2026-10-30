import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import solc from 'solc';
import ganache from 'ganache';
import '../web/vendor/ethers.umd.min.js';
import {createAgent} from '../agent-service/agent.mjs';
import {payPerCall,chooseRequirement,encodePayment,X402_SCHEME} from '../web/x402.js';
import {parseCard,hirePrefill} from '../web/agent-card.js';
import {escrowService,jobFromReceipt,listOrders,orderSummary} from '../web/escrow-core.js';
const e=globalThis.ethers;

test('sample agent: card, automatic escrow delivery, orders view and x402 pay-per-call on a real EVM',async t=>{
 const sources={};for(const name of ['IdentityRegistry','JobEscrow','MockUSDC'])sources[name+'.sol']={content:await fs.readFile('contracts/'+name+'.sol','utf8')};
 const out=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources,settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}})));
 assert.deepEqual((out.errors||[]).filter(x=>x.severity==='error'),[]);
 const rpc=ganache.provider({logging:{quiet:true},chain:{chainId:11155111},wallet:{totalAccounts:3}});
 const provider=new e.BrowserProvider(rpc,undefined,{cacheTimeout:-1});
 const [a,b,c]=await Promise.all([0,1,2].map(i=>provider.getSigner(i)));const [A,B]=await Promise.all([a.getAddress(),b.getAddress()]);
 async function deploy(name,args=[]){const x=out.contracts[name+'.sol'][name];const obj=await new e.ContractFactory(x.abi,x.evm.bytecode.object,a).deploy(...args);await obj.waitForDeployment();return obj;}
 const identity=await deploy('IdentityRegistry'),escrow=await deploy('JobEscrow',[await identity.getAddress()]),token=await deploy('MockUSDC');
 const [I,E,T]=await Promise.all([identity,escrow,token].map(x=>x.getAddress()));
 await(await identity.register('https://example.com/a')).wait();await(await identity.connect(b).register('http://127.0.0.1/card')).wait();
 await(await token.mint(A,100000000n)).wait();
 const server=http.createServer((req,res)=>agent.handle(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/`;
 t.after(async()=>{server.close();provider.destroy();await rpc.disconnect();});
 await assert.rejects(createAgent({sdk:e,provider,signer:b,escrowAddress:E,tokenAddress:T,identityAddress:I,agentId:1,publicUrl:base}),/owned by/);
 const agent=await createAgent({sdk:e,provider,signer:b,escrowAddress:E,tokenAddress:T,identityAddress:I,agentId:2,publicUrl:base,price:'2.5',callPrice:'0.25',skills:'Translation, research'});

 await t.test('the served card follows agentledger-card-v1 and prefills a hire from ownerOf',async()=>{
  const card=parseCard(await(await fetch(base+'.well-known/agent-card.json')).text());
  assert.equal(card.schema,'agentledger-card-v1');assert.deepEqual(card.skills,['translation','research']);assert.equal(card.price,'2.5');
  assert.equal(card.x402,base+'x402/run');assert.equal(card.x402Price,'0.25');
  assert.deepEqual(hirePrefill({id:2n,owner:B},card),{provider:B,providerAgentId:'2',amount:'2.5',minutes:'60',reviewWindow:'600'});
 });

 let jobId;
 await t.test('a funded job for this Agent ID is delivered automatically with a verifiable digest',async()=>{
  const service=escrowService({sdk:e,escrow,token,identity,provider,escrowAddress:E,tokenAddress:T});
  const input={provider:B,providerAgentId:'2',amount:'2.5',minutes:'60',reviewWindow:'60'};
  const approved=await service.approve(a,input);if(approved.tx)await approved.tx.wait();
  jobId=jobFromReceipt(await(await service.create(a,input)).wait(),E,escrow.interface);
  // An unlinked job to the same wallet is skipped: the service only acts for its registered identity.
  const other=await service.approve(a,{...input,providerAgentId:'0'});if(other.tx)await other.tx.wait();
  await(await service.create(a,{...input,providerAgentId:'0'})).wait();
  const submitted=await agent.poll();
  assert.deepEqual(submitted.map(x=>x.jobId),[jobId]);
  assert.deepEqual(await agent.poll(),[]);
  const job=await escrow.jobs(jobId);assert.equal(job.status,2n);
  const body=await(await fetch(`${base}results/${jobId}`)).text();
  assert.equal(e.keccak256(e.toUtf8Bytes(body)),job.deliverable);assert.equal(JSON.parse(body).jobId,String(jobId));
  assert.equal((await fetch(base+'results/99')).status,404);
  assert.equal((await escrow.jobs(2n)).status,1n);
 });

 await t.test('My orders lists both roles with the next step; provider gets the review hand-off once paid',async()=>{
  await(await escrow.release(jobId)).wait();
  const block=await provider.getBlock('latest');
  const mine=await listOrders({escrow,account:A,batch:2});assert.deepEqual(mine.map(j=>j.id),[2n,1n]);
  const [paid]=await listOrders({escrow,account:B}).then(x=>x.filter(j=>j.id===jobId));
  assert.equal(orderSummary(paid,B,block.timestamp).reviewHandoff,true);
  assert.equal(orderSummary(paid,A,block.timestamp).next,'Paid. Ask the provider for a review authorization.');
  assert.match(orderSummary(mine[0],B,block.timestamp).next,/deliver and submit/);
  assert.equal(orderSummary(mine[0],await c.getAddress(),block.timestamp).role,'');
  assert.deepEqual(await listOrders({escrow,account:await c.getAddress()}),[]);
 });

 await t.test('x402: 402 offer, paid retry, single use, and escrow payouts cannot unlock calls',async()=>{
  const url=base+'x402/run?input=hello%20agent';
  const offer=await fetch(url);assert.equal(offer.status,402);
  const body=await offer.json();const req=chooseRequirement(body,{chainId:11155111,token:T,expectedPayTo:B});
  assert.equal(req.amount,250000n);assert.equal(req.scheme,X402_SCHEME);
  assert.throws(()=>chooseRequirement(body,{chainId:11155111,token:T,expectedPayTo:A}),/on-chain owner/);
  assert.throws(()=>chooseRequirement(body,{chainId:1,token:T}),/supported payment/);
  assert.throws(()=>chooseRequirement(body,{chainId:11155111,token:I}),/other than/);
  await assert.rejects(payPerCall({url,signer:a,sdk:e,token:T,chainId:11155111,expectedPayTo:B,confirm:()=>false}),/cancelled/);
  const before=await token.balanceOf(B);let announced;
  const result=await payPerCall({url,signer:a,sdk:e,token:T,chainId:11155111,expectedPayTo:B,onPayment:h=>announced=h});
  assert.equal(result.paid,true);assert.equal(result.paymentHash,announced);
  assert.deepEqual(result.body.result,{input:'hello agent',characters:11,words:2,upper:'HELLO AGENT'});
  assert.equal(await token.balanceOf(B)-before,250000n);
  assert.equal(JSON.parse(atob(result.settlement)).transaction,announced.toLowerCase());
  const replay=await fetch(url,{headers:{'X-PAYMENT':encodePayment(announced,req)}});
  assert.equal(replay.status,402);assert.match((await replay.json()).error,/already used/);
  // The escrow release earlier also sent mUSD to B, but from the escrow contract, not from the payer.
  const releaseHash=(await provider.send('eth_getBlockByNumber',['latest',false])).transactions[0];
  const logs=await provider.getLogs({address:T,fromBlock:0});
  const payout=logs.find(l=>e.getAddress('0x'+l.topics[1].slice(26))===E);assert.ok(payout&&releaseHash);
  const forged=await fetch(url,{headers:{'X-PAYMENT':encodePayment(payout.transactionHash,req)}});
  assert.equal(forged.status,402);assert.match((await forged.json()).error,/no matching/);
  const junk=await fetch(url,{headers:{'X-PAYMENT':'not-base64!'}});assert.equal(junk.status,402);
 });
});
