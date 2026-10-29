// Read-only fixed-block reproduction: node scripts/verify-team3-acceptance.mjs [--output new-file.json]
// Uses the repository's bundled ethers and ABI files. Never signs or sends transactions.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import '../web/vendor/ethers.umd.min.js';
import {readLinks} from '../web/escrow-links.js';
const repo=fileURLToPath(new URL('../',import.meta.url));
const dir=new URL('../docs/project/evidence/team3-job5/',import.meta.url);
const args=process.argv.slice(2);
assert(args.length===0||(args.length===2&&args[0]==='--output'&&args[1]),'Usage: node scripts/verify-team3-acceptance.mjs [--output new-file.json]');
const output=args.length?path.resolve(args[1]):null;
const archived=JSON.parse(await fs.readFile(new URL('acceptance.json',dir),'utf8'));
if(output)assert(!output.startsWith(fileURLToPath(dir)),'Write reproduction output outside the archived evidence directory.');
const e=globalThis.ethers;
const d={identity:'0x13eA93eCdDeed63259792A39d7a4738a28b3E91d',community:'0x8CDc9987D46D140a982713B359286bC451262406',escrow:'0x3C129b436247368dA71cC31512984c3DB17F1f63',token:'0x6a920b13d6396B7b58BfE562c274Ea76a6409C85'};
const A='0xD3Ce5196125cd6e25212de4D04911093D3F62D5d',B='0xE8bCb71A15ea106aF0CD431C37C1002FeD938e20';
const endpoint=process.env.SEPOLIA_RPC_URL||'https://ethereum-sepolia.publicnode.com';
const p=new e.JsonRpcProvider(endpoint,11155111,{staticNetwork:true});
const artifact=async name=>JSON.parse(await fs.readFile(path.join(repo,'web/generated',name+'.json'),'utf8'));
const c=new e.Contract(d.community,(await artifact('AgentCommunity')).abi,p);
const escrow=new e.Contract(d.escrow,(await artifact('JobEscrow')).abi,p);
const token=new e.Contract(d.token,(await artifact('MockUSDC')).abi,p);
const hash={accept:'0x75954ced4369fd82ecd9ce40d410c2d6e9005c9855f7af6ab194473daaf63d46',approve:'0xafab4fba0c46c76bac0da00bfd37d08cdf97bd0df1f3f33509de7f293aa04e10',fund:'0x591d029261a6aefbb1761eec080383e5f919e0dcef5e581c698aa03e93aa6f72',link:'0x86e974bfb368202532244598952557d9fb5abf23c27c848aa6c3ce655d7617b8',submit:'0xdfcf6ceb8677a6eea1783fc9d0dec96a1a4cdd8c801065c372730c1b1e72c00b',release:'0xd3579e0854b0f4e2b39ecd51e57a211ed5a8acec9b037effe9b7342e008e8b58'};
const same=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();
const serialize=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n';
const progress={successfulReceipts:0};
try {
  assert.equal(BigInt(await p.send('eth_chainId',[])),11155111n);
  const fixed=await p.getBlock(archived.fixedBlock.number);
  assert(fixed,'The RPC cannot read the recorded block; use an archive-capable SEPOLIA_RPC_URL. No latest fallback.');
  assert.equal(fixed.hash,archived.fixedBlock.hash);
  assert.equal(fixed.timestamp,archived.fixedBlock.timestamp);
  const at={blockTag:fixed.number};
  const team=await c.getTeam(3,at),post=await c.getPost(3,at),reply=await c.getReply(3,at),job=await escrow.jobs(5,at);
  assert.equal(team.status,2n);assert.equal(team.postId,3n);assert.equal(post.kind,1n);
  assert(same(team.host,A)&&same(team.guest,B)&&same(job.client,A)&&same(job.provider,B));
  assert.equal(job.providerAgentId,0n);assert.equal(job.status,3n);assert.equal(job.amount,1000000n);assert(same(job.token,d.token));
  assert.equal(job.submitDeadline,1793268600n);assert.equal(job.reviewWindow,600n);assert(job.submittedAt<=job.submitDeadline);
  assert(same(await c.identity(at),d.identity)&&same(await escrow.identity(at),d.identity));
  assert.equal(await token.decimals(at),6n);assert.equal(await token.symbol(at),'mUSD');
  const digest=e.keccak256(await fs.readFile(new URL('job5-deliverable.md',dir)));
  assert.equal(digest,job.deliverable);
  assert(same(reply.author,A));assert.equal(reply.postId,3n);
  // Keep the production link reader's scan and validation at the archived block.
  // Contract reads already take explicit blockTag; this adapter supplies only the two reader methods.
  const snapshotProvider={getBlockNumber:async()=>fixed.number,getNetwork:()=>p.getNetwork()};
  const linkScan=await readLinks({provider:snapshotProvider,community:c,escrow,sdk:e,token:d.token});
  assert.equal(linkScan.block,fixed.number);
  const matching=linkScan.records.filter(r=>r.link.teamId==='3'&&r.link.jobId==='5');
  assert.equal(matching.length,1);assert.equal(matching[0].replyId,3);
  const transactions=[];
  const expected={accept:[c,'respondTeam',B],approve:[token,'approve',A],fund:[escrow,'createJob',A],link:[c,'createReply',A],submit:[escrow,'submit',B],release:[escrow,'release',A]};
  for(const [step,h] of Object.entries(hash)) {
    const transaction=await p.getTransaction(h),receipt=await p.getTransactionReceipt(h);
    assert(receipt,'Receipt missing: '+step);assert.equal(receipt.status,1);
    const block=await p.getBlock(receipt.blockNumber);assert.equal(block.hash,receipt.blockHash);assert.equal(transaction.blockHash,receipt.blockHash);
    const [contract,method,sender]=expected[step];assert(same(transaction.to,await contract.getAddress()));assert(same(transaction.from,sender));assert.equal(transaction.chainId,11155111n);assert.equal(transaction.value,0n);
    const call=contract.interface.parseTransaction({data:transaction.data});assert.equal(call.name,method);
    const events=receipt.logs.map(log=>{for(const ctr of [c,escrow,token])if(same(log.address,ctr.target)){try{const parsed=ctr.interface.parseLog(log);if(parsed)return {address:log.address,name:parsed.name,args:parsed.args.toObject()};}catch{}}return null;}).filter(Boolean);
    const original=archived.transactions.find(t=>t.step===step);
    assert(original,'Missing archived transaction: '+step);
    assert.deepEqual(JSON.parse(serialize(transaction)),original.transaction);
    assert.deepEqual(JSON.parse(serialize(receipt)),original.receipt);
    transactions.push({step,transaction,receipt,blockTimestamp:block.timestamp,method:call.name,args:Array.from(call.args),events});
    progress.successfulReceipts=transactions.length;
  }
  const tx=step=>transactions.find(t=>t.step===step);
  const event=(step,name)=>tx(step).events.find(ev=>ev.name===name).args;
  assert.equal(tx('accept').args[0],3n);assert.equal(tx('accept').args[1],true);assert.equal(event('accept','TeamChanged').status,2n);
  assert(same(tx('approve').args[0],d.escrow));assert.equal(tx('approve').args[1],1000000n);
  const created=event('fund','JobCreated');assert.equal(created.jobId,5n);assert.equal(created.amount,1000000n);assert(same(created.client,A)&&same(created.provider,B));
  assert.equal(event('link','ReplyCreated').replyId,3n);assert.equal(tx('link').args[0],3n);assert.equal(tx('link').args[2],reply.body);
  assert.equal(event('submit','JobSubmitted').jobId,5n);assert.equal(event('submit','JobSubmitted').deliverable,digest);
  const released=event('release','JobReleased');assert.equal(released.jobId,5n);assert(same(released.provider,B));assert.equal(released.amount,1000000n);
  const transfer=tx('release').events.find(ev=>ev.name==='Transfer'&&same(ev.address,d.token)).args;
  assert(same(transfer.from,d.escrow)&&same(transfer.to,B));assert.equal(transfer.value,1000000n);
  const balancesAt=async blockTag=>({A:await token.balanceOf(A,{blockTag}),B:await token.balanceOf(B,{blockTag}),escrow:await token.balanceOf(d.escrow,{blockTag})});
  const beforeFunding=await balancesAt(tx('fund').receipt.blockNumber-1),afterFunding=await balancesAt(tx('fund').receipt.blockNumber),beforeRelease=await balancesAt(tx('release').receipt.blockNumber-1),afterRelease=await balancesAt(tx('release').receipt.blockNumber),finalBalances=await balancesAt(fixed.number);
  assert.equal(afterFunding.A-beforeFunding.A,-1000000n);assert.equal(afterFunding.escrow-beforeFunding.escrow,1000000n);
  assert.equal(afterRelease.B-beforeRelease.B,1000000n);assert.equal(afterRelease.escrow-beforeRelease.escrow,-1000000n);assert.equal(afterRelease.A-beforeRelease.A,0n);
  assert.deepEqual(afterRelease,{A:97000000n,B:3000000n,escrow:0n});
  const allowance=await token.allowance(A,d.escrow,at);assert.equal(allowance,0n);
  let repeatedRelease='';try{await escrow.release.staticCall(5,{from:A,blockTag:fixed.number});}catch(error){repeatedRelease=error.reason||error.shortMessage||error.message;}
  assert.match(repeatedRelease,/not submitted/);
  assert.equal((await p.getBlock(fixed.number)).hash,fixed.hash);
  for(const [key,value] of Object.entries({team:team.toObject(),post:post.toObject(),reply:reply.toObject(),job:job.toObject()}))assert.deepEqual(JSON.parse(serialize(value)),archived[key]);
  const result={observedAt:new Date().toISOString(),rpcSource:process.env.SEPOLIA_RPC_URL?'SEPOLIA_RPC_URL (URL omitted)':endpoint,chainId:11155111,fixedBlock:{number:fixed.number,hash:fixed.hash,timestamp:fixed.timestamp},contracts:d,teamId:'3',postId:'3',replyId:'3',jobId:'5',team:team.toObject(),post:post.toObject(),reply:reply.toObject(),job:job.toObject(),fileDigest:digest,linkScan:{block:linkScan.block,rejected:linkScan.rejected,matching:matching.map(r=>({replyId:r.replyId,link:r.link}))},transactions,balances:{beforeFunding,afterFunding,beforeRelease,afterRelease,atFixedBlock:finalBalances},allowance,repeatedReleaseEthCall:repeatedRelease,historicalUiChecks:archived.uiChecks,historicalUiObservedAt:archived.observedAt,limits:['Test mUSD on Sepolia only.','All wallet transaction confirmations were performed by the user.','Agent IDs are 0; no nonzero Agent NFT link or reputation feedback tested.','Community reply association is validated by the frontend, not enforced by the escrow contract.','Repeated release probe is an eth_call and sends no transaction.','The block before/after balance comparison assumes no unrelated token transfer affecting those wallets within the same block; matching Transfer logs also directly establish this payment.','UI checks were observed by Codex; this script reproduces RPC checks only.']};
  if(output)await fs.writeFile(output,serialize(result),{flag:'wx'}); // Existing evidence/output is never overwritten.
  console.log(serialize({output,fixedBlock:result.fixedBlock,successfulReceipts:transactions.length,status:Number(job.status),amount:'1 mUSD',balances:afterRelease,digestMatch:true,validLinkReplyId:matching[0].replyId,repeatedRelease}));
} catch(error) {
  console.error(serialize({verification:'failed',...progress,message:error.shortMessage||error.message,rpcError:error.info?.error?.message||null,hint:'Historical state requires an archive-capable SEPOLIA_RPC_URL. No latest fallback or output file is written after a failed check.'}));
  process.exitCode=1;
} finally {p.destroy();}
