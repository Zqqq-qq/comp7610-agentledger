// Dress rehearsal of the 8-step blueprint journey against the deployed Sepolia contracts, on a local Ganache fork.
// Nothing is broadcast to Sepolia and no real key is used: the fork's pre-funded accounts play client A and provider B.
// Usage: node scripts/rehearse-demo.mjs [--rpc https://sepolia-rpc]
import http from 'node:http';
import ganache from 'ganache';
import '../web/vendor/ethers.umd.min.js';
import {DEPLOYMENT} from '../web/config.js';
import {createAgent} from '../agent-service/agent.mjs';
import {parseCard,hirePrefill} from '../web/agent-card.js';
import {marketView} from '../web/market.js';
import {escrowService,jobFromReceipt,listOrders,orderSummary,ESCROW_ABI,TOKEN_ABI} from '../web/escrow-core.js';
import {FEEDBACK_TYPES,domainFor} from '../web/core.js';
import {payPerCall} from '../web/x402.js';

const e=globalThis.ethers;
const rpcArg=process.argv.indexOf('--rpc');const upstream=rpcArg>0?process.argv[rpcArg+1]:DEPLOYMENT.rpcUrl;
const IDENTITY_ABI=['function register(string) returns (uint256)','function agentCount() view returns (uint256)','function ownerOf(uint256) view returns (address)','function tokenURI(uint256) view returns (string)','event Registered(uint256 indexed agentId,address indexed owner,string tokenURI)'];
const REPUTATION_ABI=['function giveFeedback(uint256,uint8,bytes32,string,uint64,bytes32,bytes)','function getSummary(uint256) view returns (uint64 n,uint256 sum,uint256 average)'];
const step=(n,text)=>console.log(`\n[${n}] ${text}`);const ok=text=>console.log('    ✔ '+text);

const chain=ganache.provider({logging:{quiet:true},fork:{url:upstream},chain:{chainId:DEPLOYMENT.chainId},wallet:{totalAccounts:2,defaultBalance:10}});
const provider=new e.BrowserProvider(chain,undefined,{cacheTimeout:-1});
const [a,b]=await Promise.all([0,1].map(i=>provider.getSigner(i)));const [A,B]=await Promise.all([a.getAddress(),b.getAddress()]);
const identity=new e.Contract(DEPLOYMENT.identity,IDENTITY_ABI,provider),reputation=new e.Contract(DEPLOYMENT.reputation,REPUTATION_ABI,provider);
const escrow=new e.Contract(DEPLOYMENT.escrow,ESCROW_ABI,provider),token=new e.Contract(DEPLOYMENT.token,TOKEN_ABI,provider);
let server;
try{
 console.log(`Fork of chain ${DEPLOYMENT.chainId} at block ${await provider.getBlockNumber()} via ${new URL(upstream).host}`);
 console.log(`A (client) ${A}\nB (provider) ${B}`);

 step(1,'B starts the agent service');
 const port=await new Promise(r=>{server=http.createServer((q,s)=>agent.handle(q,s));server.listen(0,'127.0.0.1',()=>r(server.address().port));});
 const base=`http://127.0.0.1:${port}/`;
 step(2,'B registers an identity NFT pointing at the served card');
 const before=await identity.agentCount();
 const receipt=await(await identity.connect(b).register(base+'.well-known/agent-card.json')).wait();
 const registered=receipt.logs.map(l=>{try{return identity.interface.parseLog(l);}catch{return null;}}).find(x=>x?.name==='Registered');
 const agentId=registered.args.agentId,cardUri=registered.args.tokenURI;
 // Ganache 7.9 cannot execute the Cancun string copy in the deployed tokenURI(); the event carries the same URI.
 // The browser reads tokenURI() from real Sepolia, where it works.
 ok(`Agent #${agentId} registered (registry had ${before})`);
 var agent=await createAgent({sdk:e,provider,signer:b,escrowAddress:DEPLOYMENT.escrow,tokenAddress:DEPLOYMENT.token,identityAddress:DEPLOYMENT.identity,agentId,publicUrl:base,name:'Rehearsal translator',skills:'translation, research',price:'2',callPrice:'0.1'});
 const card=parseCard(await(await fetch(cardUri)).text());ok(`card served: ${card.name}, ${card.price} mUSD, skills ${card.skills.join('/')}`);

 step(3,'A browses the market and filters by skill');
 const listing=[{id:agentId,owner:await identity.ownerOf(agentId),uri:cardUri,count:0n,total:0n,average:0n,card}];
 if(marketView(listing,{skill:'translation'}).length!==1)throw Error('skill filter missed the agent');ok('agent found by skill "translation"');
 step(4,'A opens the card and reads endpoint and price');ok(`endpoint ${card.endpoint}, escrow ${card.submitMinutes} min / review ${card.reviewWindowSeconds}s`);

 step(5,'A hires: prefill from ownerOf + card, mint, approve, create & pay');
 const input={...hirePrefill(listing[0],card),reviewWindow:'60'};
 if(input.provider!==B)throw Error('prefill did not use ownerOf');
 await(await token.connect(a).mint(A,100_000_000n)).wait();
 const service=escrowService({sdk:e,escrow,token,identity,provider,escrowAddress:DEPLOYMENT.escrow,tokenAddress:DEPLOYMENT.token});
 const approved=await service.approve(a,input);if(approved.tx)await approved.tx.wait();
 const jobId=jobFromReceipt(await(await service.create(a,input)).wait(),DEPLOYMENT.escrow,escrow.interface);ok(`job #${jobId} funded with ${input.amount} mUSD`);

 step(6,'The agent service detects the job and submits the delivery digest');
 const delivered=await agent.poll();const mine=delivered.find(x=>x.jobId===jobId);if(!mine)throw Error('agent did not deliver');
 const body=await(await fetch(`${base}results/${jobId}`)).text();
 if(e.keccak256(e.toUtf8Bytes(body))!==(await escrow.jobs(jobId)).deliverable)throw Error('digest mismatch');ok(`digest ${mine.digest.slice(0,18)}… matches /results/${jobId}`);

 step(7,'A checks My orders and releases payment');
 let block=await provider.getBlock('latest');
 const [row]=(await listOrders({escrow,account:A,limit:20})).filter(j=>j.id===jobId);ok(`A sees: ${orderSummary(row,A,block.timestamp).next}`);
 const balance=await token.balanceOf(B);await(await service.perform('release',a,jobId)).wait();ok(`B received ${e.formatUnits(await token.balanceOf(B)-balance,6)} mUSD`);

 step(8,'B authorizes the review from My orders; A submits the score');
 block=await provider.getBlock('latest');
 const [paid]=(await listOrders({escrow,account:B,limit:20})).filter(j=>j.id===jobId);
 if(!orderSummary(paid,B,block.timestamp).reviewHandoff)throw Error('provider has no review hand-off');
 const auth={agentId,client:A,expiry:block.timestamp+3600,nonce:e.hexlify(e.randomBytes(32))};
 // Ganache's eth_signTypedData_v4 rejects ethers' string payload; sign with B's throwaway fork key instead.
 const bKey=Object.entries(chain.getInitialAccounts()).find(([addr])=>addr.toLowerCase()===B.toLowerCase())[1].secretKey;
 const signature=await new e.Wallet(bKey).signTypedData(domainFor(DEPLOYMENT.chainId,DEPLOYMENT.reputation),FEEDBACK_TYPES,auth);
 await(await reputation.connect(a).giveFeedback(agentId,92,e.encodeBytes32String('rehearsal'),'',auth.expiry,auth.nonce,signature)).wait();
 const summary=await reputation.getSummary(agentId);ok(`Agent #${agentId}: ${summary.n} review, average ${summary.average}/100`);

 step('P2','Pay-per-call over HTTP 402');
 const call=await payPerCall({url:base+'x402/run?input=hello',signer:a,sdk:e,token:DEPLOYMENT.token,chainId:DEPLOYMENT.chainId,expectedPayTo:B});
 ok(`paid ${call.paymentHash.slice(0,12)}…, result ${JSON.stringify(call.body.result)}`);
 console.log('\nRehearsal passed on a fork. Nothing was sent to Sepolia.');
}catch(error){console.error('\n✖ Rehearsal failed: '+(error.shortMessage||error.reason||error.message));if(process.env.DEBUG)console.error(JSON.stringify({to:error.transaction?.to,data:error.transaction?.data?.slice(0,74)}),String(error.stack).split('\n').filter(l=>!l.includes('ethers.umd')).slice(0,8).join('\n'));process.exitCode=1;}
finally{server?.close();provider.destroy();await chain.disconnect();}
