import fs from 'node:fs/promises';import '../web/vendor/ethers.umd.min.js';import {DEPLOYMENT} from '../web/config.js';import {verifyDeployment} from '../web/deployment-evidence.js';
const args=Object.fromEntries(process.argv.slice(2).reduce((out,v,i,a)=>{if(v.startsWith('--'))out.push([v.slice(2),a[i+1]]);return out;},[]));
if(!args.tx){console.error('Usage: node scripts/verify-community.mjs --tx 0x... [--address 0x...] [--rpc URL] [--output evidence.json]');process.exit(1);}
const sdk=globalThis.ethers,request=new sdk.FetchRequest(args.rpc||DEPLOYMENT.rpcUrl);request.timeout=15000;
const provider=new sdk.JsonRpcProvider(request,undefined,{cacheTimeout:0,batchMaxCount:1});
try {
 const artifact=JSON.parse(await fs.readFile('web/generated/AgentCommunity.json','utf8'));
 const evidence=await verifyDeployment({provider,sdk,artifact,registry:DEPLOYMENT.identity,transactionHash:args.tx,address:args.address});
 const output=args.output||'community-deployment-evidence.json';await fs.writeFile(output,JSON.stringify(evidence,null,2)+'\n');console.log('Verified deployment evidence saved: '+output);
}finally{provider.destroy();}
