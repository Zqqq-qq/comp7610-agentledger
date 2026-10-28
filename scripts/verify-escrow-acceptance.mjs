// Read-only verification: no signer, wallet, private key or broadcast RPC.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import '../web/vendor/ethers.umd.min.js';
import {DEPLOYMENT} from '../web/config.js';
const e=globalThis.ethers,endpoint=process.env.SEPOLIA_RPC_URL||DEPLOYMENT.rpcUrl;
const output=process.argv[2]||'docs/project/evidence/escrow-sepolia-acceptance.json';
const index=JSON.parse(await fs.readFile('docs/project/evidence/escrow-transaction-index.json','utf8'));
const artifacts=Object.fromEntries(await Promise.all(['JobEscrow','MockUSDC'].map(async name=>[name,JSON.parse(await fs.readFile('web/generated/'+name+'.json','utf8'))])));
const escrow=DEPLOYMENT.escrow.toLowerCase(),token=DEPLOYMENT.token.toLowerCase();
const A='0xd3ce5196125cd6e25212de4d04911093d3f62d5d',B='0xe8bcb71a15ea106af0cd431c37c1002fed938e20';
const iface=new e.Interface(artifacts.JobEscrow.abi),ti=new e.Interface(artifacts.MockUSDC.abi),raw=[];
const allowed=new Set(['eth_chainId','eth_getBlockByNumber','eth_getTransactionByHash','eth_getTransactionReceipt','eth_getCode','eth_call']);
async function rpc(method,params,expectedError){
 assert(allowed.has(method));
 const request={jsonrpc:'2.0',id:raw.length+1,method,params};
 const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(25000)});
 const body=await response.json();raw.push({request,httpStatus:response.status,response:body});
 assert(response.ok);assert.equal(body.id,request.id);
 if(expectedError){assert(body.error?.message.includes(expectedError),JSON.stringify(body));return body;}
 if(body.error)throw Error(JSON.stringify(body.error));return body.result;
}
async function call(address,i,name,args,block,from){return i.decodeFunctionResult(name,await rpc('eth_call',[{to:address,data:i.encodeFunctionData(name,args),...(from?{from}:{})},block]));}
assert.equal(await rpc('eth_chainId',[]),'0xaa36a7');
const fixed=await rpc('eth_getBlockByNumber',['latest',false]);
const transactions=[];
for(const item of index){
 const receipt=await rpc('eth_getTransactionReceipt',[item.transactionHash]);assert(receipt,'Missing receipt');assert.equal(receipt.status,'0x1');
 const block=await rpc('eth_getBlockByNumber',[receipt.blockNumber,false]);assert.equal(block.hash,receipt.blockHash);
 const tx=await rpc('eth_getTransactionByHash',[item.transactionHash]);assert.equal(tx.blockHash,receipt.blockHash);
 if(item.step.startsWith('deploy-')){
  const name=item.step==='deploy-escrow'?'JobEscrow':'MockUSDC',a=artifacts[name],args=name==='JobEscrow'?[DEPLOYMENT.identity]:[];
  assert.equal(receipt.contractAddress.toLowerCase(),name==='JobEscrow'?escrow:token);
  const expected=(await new e.ContractFactory(a.abi,a.bytecode).getDeployTransaction(...args)).data;assert.equal(tx.input.toLowerCase(),expected.toLowerCase());
  let runtime=a.runtime;for(const ref of Object.values(a.immutableReferences).flat()){assert.equal(ref.length,32);const start=2+ref.start*2;runtime=runtime.slice(0,start)+DEPLOYMENT.identity.slice(2).toLowerCase().padStart(64,'0')+runtime.slice(start+64);}
  assert.equal((await rpc('eth_getCode',[receipt.contractAddress,fixed.number])).toLowerCase(),runtime.toLowerCase());
 }else{
  const isToken=item.step==='mint'||item.step.startsWith('approve-');assert.equal(receipt.to.toLowerCase(),isToken?token:escrow);
  const parsed=(isToken?ti:iface).parseTransaction({data:tx.input,value:tx.value});
  const expected=item.step==='mint'?'mint':item.step.split('-')[0]==='fund'?'createJob':item.step.split('-')[0];assert.equal(parsed.name,expected);
  if(item.step.startsWith('fund-')){const event=receipt.logs.filter(l=>l.address.toLowerCase()===escrow).map(l=>{try{return iface.parseLog(l);}catch{return null;}}).find(l=>l?.name==='JobCreated');assert(event);assert.equal(event.args.jobId,BigInt(item.step.match(/job(\d+)/)[1]));assert.equal(event.args.client.toLowerCase(),A);assert.equal(event.args.provider.toLowerCase(),B);assert.equal(event.args.amount,1000000n);assert.equal(event.args.providerAgentId,0n);}
 }
 transactions.push({...item,blockTimestamp:Number(BigInt(block.timestamp)),receipt});
}
assert.equal((await call(escrow,iface,'identity',[],fixed.number))[0].toLowerCase(),DEPLOYMENT.identity.toLowerCase());
assert.equal((await call(token,ti,'decimals',[],fixed.number))[0],6n);assert.equal((await call(token,ti,'symbol',[],fixed.number))[0],'mUSD');
const jobs=[];for(const id of [1,2,3])jobs.push({id,...(await call(escrow,iface,'jobs',[id],fixed.number)).toObject()});
assert.deepEqual(jobs.map(j=>Number(j.status)),[3,4,3]);assert.equal(jobs[1].submittedAt,0n);assert.equal(jobs[2].reviewWindow,60n);
for(const job of jobs){assert.equal(job.client.toLowerCase(),A);assert.equal(job.provider.toLowerCase(),B);assert.equal(job.token.toLowerCase(),token);assert.equal(job.amount,1000000n);}
for(const [id,file] of [[1,'job1-deliverable.md'],[3,'job3-deliverable.md']])assert.equal(jobs[id-1].deliverable,e.keccak256(await fs.readFile('docs/project/evidence/'+file)));
const refund=transactions.find(t=>t.step==='refund-job2'),claim=transactions.find(t=>t.step==='claim-job3');assert(BigInt(refund.blockTimestamp)>jobs[1].submitDeadline);assert(BigInt(claim.blockTimestamp)>jobs[2].submittedAt+jobs[2].reviewWindow);
const balances={};for(const address of [A,B,escrow])balances[address]=(await call(token,ti,'balanceOf',[address],fixed.number))[0];assert.deepEqual(Object.values(balances),[98000000n,2000000n,0n]);
const allowances={};for(const address of [A,B])allowances[address]=(await call(token,ti,'allowance',[address,escrow],fixed.number))[0];assert(Object.values(allowances).every(n=>n===0n));
// Historical rejection probes use explicit pinned blocks. Never silently fall back to latest.
const boundary=await rpc('eth_getBlockByNumber',[e.toQuantity(12010027),false]);assert.equal(BigInt(boundary.timestamp),jobs[2].submittedAt+jobs[2].reviewWindow);
await rpc('eth_call',[{from:B,to:escrow,data:iface.encodeFunctionData('claim',[3])},boundary.number],'review window open');
const funding2=transactions.find(t=>t.step==='fund-job2');await rpc('eth_call',[{from:A,to:escrow,data:iface.encodeFunctionData('refund',[2])},funding2.receipt.blockNumber],'deadline not passed');
for(const [method,id,from,reason] of [['release',1,A,'not submitted'],['refund',2,A,'not refundable'],['claim',3,B,'not submitted']])await rpc('eth_call',[{from,to:escrow,data:iface.encodeFunctionData(method,[id])},fixed.number],reason);
assert.equal((await rpc('eth_getBlockByNumber',[fixed.number,false])).hash,fixed.hash);
const result={observedAt:new Date().toISOString(),endpoint,chainId:11155111,fixedBlock:{number:Number(BigInt(fixed.number)),hash:fixed.hash,timestamp:Number(BigInt(fixed.timestamp))},contracts:{escrow,token,identity:DEPLOYMENT.identity},deploymentSourceReference:artifacts.JobEscrow.sourceReference,transactions,jobs,balances,allowances,limits:['All wallet confirmations were performed by Zqqq-qq; this script is read-only.','Jobs use Agent ID 0 (unlinked); these tests do not prove an Agent-linked order or community team reference.','eth_call probes have no signed transaction receipt and do not certify service quality.','Historical reproduction requires an RPC retaining the specified blocks; no latest fallback.','RPC responses, not Etherscan source-verification certification.'],raw};
await fs.writeFile(output,JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
console.log(JSON.stringify({output,fixedBlock:result.fixedBlock,successfulReceipts:transactions.length,statuses:jobs.map(j=>Number(j.status)),balances:Object.values(balances).map(String)}));
