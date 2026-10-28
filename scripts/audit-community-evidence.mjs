// Read-only reproduction of PR #19 evidence. No signer, key or broadcast method.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import solc from 'solc';
import '../web/vendor/ethers.umd.min.js';

const e=globalThis.ethers;
const options=Object.fromEntries(process.argv.slice(2).reduce((out,value,index,args)=>{if(value.startsWith('--'))out.push([value.slice(2),args[index+1]]);return out;},[]));
const endpoint=options.rpc||'https://ethereum-sepolia.publicnode.com';
const url=new URL(endpoint);
if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('Use a public HTTP(S) RPC without credentials.');
const output=options.output||'docs/project/evidence/pr19-reproducible-audit.json';
const community='0x8cdc9987d46d140a982713b359286bc451262406';
const duplicate='0xe398d0103f693cd756e46b69d16ed9f4016968ac';
const identity='0x13ea93ecddeed63259792a39d7a4738a28b3e91d';
const actorA='0x4469dba9f67f878520949f6de646f586951e1723';
const actorB='0xfa2b712c28e9cfe7b6737c62f59fdf235ad85239';
const third='0xd3ce5196125cd6e25212de4d04911093d3f62d5d';
let fixedNumber,fixedTag;
const raw=[],allowed=new Set(['eth_chainId','eth_blockNumber','web3_clientVersion','eth_getBlockByNumber','eth_getCode','eth_getTransactionByHash','eth_getTransactionReceipt','eth_call']);
let requestId=0;
async function rpc(method,params,expectedRevert=false){
  assert(allowed.has(method),'Only read-only methods are allowed');
  const request={jsonrpc:'2.0',id:++requestId,method,params};
  const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(20000)});
  const body=await response.json();raw.push({request,httpStatus:response.status,response:body});
  assert.equal(body.id,request.id,'RPC response ID must match');
  if(body.error){if(!expectedRevert)await fs.writeFile(output+'.failed.json',JSON.stringify({status:'failed',endpoint,method,params,raw},null,2)+'\n');const error=Object.assign(new Error(body.error.message),{rpcError:body.error});throw error;}
  assert(response.ok,'RPC HTTP request failed');return body.result;
}
const artifact=JSON.parse(await fs.readFile('web/generated/AgentCommunity.json','utf8'));
const iface=new e.Interface(artifact.abi);
async function read(name,args=[],block=fixedTag,address=community){
  const result=await rpc('eth_call',[{to:address,data:iface.encodeFunctionData(name,args)},block]);
  return iface.decodeFunctionResult(name,result);
}
function findRevert(value){
  if(typeof value==='string'&&value.startsWith('0x08c379a0'))return value;
  if(value&&typeof value==='object')for(const child of Object.values(value)){const found=findRevert(child);if(found)return found;}
  return null;
}
async function callCase(label,from,name,args,expected){
  const params=[{from,to:community,data:iface.encodeFunctionData(name,args)},fixedTag];
  try{const result=await rpc('eth_call',params,Boolean(expected));assert.equal(expected,null,label+' unexpectedly succeeded');return {label,params,expected:'success',result,passed:true};}
  catch(error){if(!error.rpcError)throw error;assert(expected,label+' unexpectedly reverted');const data=findRevert(error.rpcError);assert(data,label+' missing raw Error(string) data');const [reason]=e.AbiCoder.defaultAbiCoder().decode(['string'],'0x'+data.slice(10));assert.equal(reason,expected,label);return {label,params,expected,rawError:error.rpcError,revertData:data,decodedReason:reason,passed:true};}
}
const chainId=await rpc('eth_chainId',[]);assert.equal(BigInt(chainId),11155111n);
const clientVersion=await rpc('web3_clientVersion',[]);
fixedNumber=options.block?Number(options.block):Number(BigInt(await rpc('eth_blockNumber',[])));
assert(Number.isSafeInteger(fixedNumber)&&fixedNumber>12006235,'Choose a valid block after the recorded setup transactions');fixedTag=e.toQuantity(fixedNumber);
const fixedBlock=await rpc('eth_getBlockByNumber',[fixedTag,false]);assert(fixedBlock?.hash,'Historical block unavailable');
assert.equal(Number(BigInt(fixedBlock.number)),fixedNumber);
const source=await fs.readFile('contracts/AgentCommunity.sol','utf8');
const gitBlob=text=>{const b=Buffer.from(text);return createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');};
const sourceGitBlob=gitBlob(source),artifactGitBlob=gitBlob(await fs.readFile('web/generated/AgentCommunity.json','utf8'));
assert.equal(sourceGitBlob,'1938bd55c3a84ca6c0c92075fb59c8dba05c7631','Use the pinned AgentCommunity source');
assert.equal(artifactGitBlob,'8ad4d097924d454ef3b40c0bf069304984a998ef','Use the pinned artifact');
const compilerInput={language:'Solidity',sources:{'AgentCommunity.sol':{content:source}},settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','evm.deployedBytecode.immutableReferences']}}}};
const compilation=JSON.parse(solc.compile(JSON.stringify(compilerInput)));
assert(!compilation.errors?.some(error=>error.severity==='error'),'Compilation failed');
const compiled=compilation.contracts['AgentCommunity.sol'].AgentCommunity;
assert.equal('0x'+compiled.evm.bytecode.object,artifact.bytecode,'Recompiled creation bytecode differs from committed artifact');
let patched=compiled.evm.deployedBytecode.object;
const immutableGroups=Object.values(compiled.evm.deployedBytecode.immutableReferences);
assert.equal(immutableGroups.length,1,'Only identity immutable is expected');
const references=immutableGroups.flat(),word=identity.slice(2).padStart(64,'0');
for(const reference of references){assert.equal(reference.length,32);const start=reference.start*2;patched=patched.slice(0,start)+word+patched.slice(start+reference.length*2);}
const expectedRuntime='0x'+patched,expectedInput=artifact.bytecode+e.AbiCoder.defaultAbiCoder().encode(['address'],[identity]).slice(2);
const deploymentHashes=['0x8a537cd6c49e68d4f2301683146bcabc0acc9a2bbde89e797b08dedb80a8ddc5','0x5f2f498b7013c5442ee8049c3ba3f3ea7550211167d204a7d2783f3a3620f9ca'];
const deployments=[];
for(const [index,address] of [community,duplicate].entries()){
  const code=await rpc('eth_getCode',[address,fixedTag]);assert.equal(code.toLowerCase(),expectedRuntime.toLowerCase(),'Runtime mismatch at '+address);
  const hash=deploymentHashes[index],tx=await rpc('eth_getTransactionByHash',[hash]),receipt=await rpc('eth_getTransactionReceipt',[hash]);
  assert(tx&&receipt,'Missing deployment');assert.equal(tx.to,null);assert.equal(tx.input.toLowerCase(),expectedInput.toLowerCase());
  assert.equal(receipt.status,'0x1');assert.equal(receipt.contractAddress.toLowerCase(),address);assert.equal(receipt.transactionHash,hash);
  const header=await rpc('eth_getBlockByNumber',[receipt.blockNumber,false]);assert.equal(header.hash,receipt.blockHash,'Receipt block hash mismatch');
  const linked=(await read('identity',[],fixedTag,address))[0];assert.equal(linked.toLowerCase(),identity);
  deployments.push({address,transactionHash:hash,blockNumber:Number(BigInt(receipt.blockNumber)),blockHash:receipt.blockHash,deployer:receipt.from,runtimeBytes:(code.length-2)/2,runtimeHash:e.keccak256(code),creationInputHash:e.keccak256(tx.input),creationInputMatches:true,runtimeMatches:true,gasUsedDecimal:BigInt(receipt.gasUsed).toString(),effectiveGasPriceWei:BigInt(receipt.effectiveGasPrice).toString(),feeWei:(BigInt(receipt.gasUsed)*BigInt(receipt.effectiveGasPrice)).toString(),feeETH:e.formatEther(BigInt(receipt.gasUsed)*BigInt(receipt.effectiveGasPrice)),receipt});
}
const snapshots=[];
for(const number of [fixedNumber]){
  const tag=e.toQuantity(number),header=await rpc('eth_getBlockByNumber',[tag,false]);assert(header?.hash);
  const counts={};for(const name of ['postCount','replyCount','teamCount','workCount'])counts[name]=(await read(name,[],tag))[0].toString();
  snapshots.push({blockNumber:number,blockHash:header.hash,counts});
}
assert.deepEqual([snapshots[0].counts.postCount,snapshots[0].counts.replyCount],['2','2']);
const earlierRecord=JSON.parse(await fs.readFile('docs/project/evidence/community-sepolia-live-records.json','utf8'));
const earlierHeader=await rpc('eth_getBlockByNumber',[e.toQuantity(earlierRecord.block),false]);
const earlierSnapshot={blockNumber:earlierRecord.block,blockHash:earlierHeader.hash,counts:{posts:earlierRecord.posts.length,replies:earlierRecord.replies.length},source:'committed PR #16 capture; only block header re-read in this audit',historicalStateRecomputed:false};
const preconditions={team2:(await read('getTeam',[2]))[0].toObject(),work2:(await read('getWork',[2]))[0].toObject(),work1:(await read('getWork',[1]))[0].toObject()};
assert.equal(preconditions.team2.status,1n);assert.equal(preconditions.work2.status,1n);assert.equal(preconditions.work1.status,2n);
const cases=[];
cases.push(await callCase('third-wallet-accepts-pending-team',third,'respondTeam',[2,true],'only invited partner'));
cases.push(await callCase('invited-wallet-accepts-same-pending-team',actorB,'respondTeam',[2,true],null));
cases.push(await callCase('author-self-confirms-proposed-work',actorA,'reviewWork',[2,true],'only other member'));
cases.push(await callCase('other-member-confirms-same-proposed-work',actorB,'reviewWork',[2,true],null));
cases.push(await callCase('nonmember-posts-circle-1',actorA,'createPost',[1,0,0,'Read-only evidence probe','No transaction is sent.'],'join circle first'));
cases.push(await callCase('same-author-posts-member-circle-2',actorA,'createPost',[2,0,0,'Read-only evidence probe','No transaction is sent.'],null));
cases.push(await callCase('repeat-confirm-confirmed-work',actorB,'reviewWork',[1,true],'work not pending'));
cases.push(await callCase('same-member-confirms-proposed-work-control',actorB,'reviewWork',[2,true],null));
const txHashes=['0xb9a220fbd6d651d82923eadc9ba917851fc185edeac1d3fe0169fc97ece47e5d','0x878cbd597b3af90139793fbe131096e5589cf6e9659905500eda80340cc2fffe','0x74be514cca1072da6a42b33eea4999e2af73666a93742ed7b7aca82470e3ef56','0x740ba01357883994dcb762233fe28ffa2284b9c36f2ef225c7a8ea56cb7225d8','0x7868a23a872b8b9a44fccc457e07d1076c9468d36ec06d33d873cb867784b856','0xa2242c711f386000a20d493dc197cb97682d9d69a38202587bb42465250bcbf1','0x0737ae588b9aac998053e017a36d83b4cfe063dac5fadb35195a640c73d920f6','0x71afaafbe92d0b8f713f85890d604474f718a4f8b457749dfb5f575c85fde58c','0xa3c0004180b12a218ec433b07863cdc330b978b5df3398a2cc7cd65d43623095','0x854afcdfcfa8d63550003c97ba6c1cdf31811e4b4bd8de304599a007b3607645','0x3bc6786768f1f083cc8df18ff3429076090d28105d4568911770ac25ed045a2c'];
const receipts=[];
for(const hash of txHashes){const receipt=await rpc('eth_getTransactionReceipt',[hash]);assert(receipt);assert.equal(receipt.status,'0x1');assert.equal(receipt.to.toLowerCase(),community);assert(Number(BigInt(receipt.blockNumber))<=fixedNumber);const header=await rpc('eth_getBlockByNumber',[receipt.blockNumber,false]);assert.equal(header.hash,receipt.blockHash);receipts.push(receipt);}
const collaboration={};for(const number of [fixedNumber]){const tag=e.toQuantity(number);collaboration[number]={aToB:(await read('collaborationCount',[actorA,actorB],tag))[0],bToA:(await read('collaborationCount',[actorB,actorA],tag))[0]};}
assert.equal(collaboration[fixedNumber].aToB,1n);assert.equal(collaboration[fixedNumber].bToA,1n);
const duplicateCounts={};for(const name of ['postCount','replyCount','teamCount','workCount'])duplicateCounts[name]=(await read(name,[],fixedTag,duplicate))[0].toString();
assert(Object.values(duplicateCounts).every(value=>value==='0'));
const after=await rpc('eth_getBlockByNumber',[fixedTag,false]);assert.equal(after.hash,fixedBlock.hash,'Pinned block changed during audit');
const result={schema:'agentledger-pr19-read-only-audit-v1',observedAt:new Date().toISOString(),endpoint,chainId:Number(BigInt(chainId)),clientVersion,fixedBlock:{number:fixedNumber,tag:fixedTag,hash:fixedBlock.hash},sourceReference:'583fd6d1a1932a56c508d1faef617868e8ccb85c',sourceGitBlob,artifactGitBlob,sourceKeccak256:e.keccak256(e.toUtf8Bytes(source)),compiler:solc.version(),settings:compilerInput.settings,immutableReferences:references,expectedRuntimeHash:e.keccak256(expectedRuntime),deployments,earlierSnapshot,snapshots,duplicateCounts,preconditions,cases,receipts,collaboration,limits:['eth_call does not broadcast and does not prove UI rejection handling.','All responses are from the stated endpoint, not local Ganache. Chain ID alone does not independently authenticate canonical network history.','Gas fields are preserved as RPC observations; no inference that Ethereum protocol gas rules changed.','This script is Codex-assisted reproduction, not approval by another group member.'],raw};
await fs.writeFile(output,JSON.stringify(result,(_,value)=>typeof value==='bigint'?value.toString():value,2)+'\n');
console.log(JSON.stringify({output,block:result.fixedBlock,cases:cases.length,successfulBusinessReceipts:receipts.length,deployments:deployments.map(d=>({address:d.address,runtimeMatches:d.runtimeMatches,gasUsed:d.gasUsedDecimal,feeETH:d.feeETH}))}));
