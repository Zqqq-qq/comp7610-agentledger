import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {DEPLOYMENT} from '../web/config.js';
const output=path.resolve(process.argv[2]||'dist/deployment-kit');
const source=await fs.readFile('contracts/AgentCommunity.sol','utf8'),artifact=JSON.parse(await fs.readFile('web/generated/AgentCommunity.json','utf8'));
const input={language:'Solidity',sources:{'AgentCommunity.sol':{content:source}},settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
await fs.mkdir(output,{recursive:true});
const files={'AgentCommunity.sol':source,'compiler-input.json':JSON.stringify(input,null,2)+'\n','AgentCommunity.json':JSON.stringify(artifact,null,2)+'\n'};
for(const [name,content] of Object.entries(files))await fs.writeFile(path.join(output,name),content);
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify({status:'prepared-not-deployed',chainId:11155111,identity:DEPLOYMENT.identity,compiler:artifact.compiler,settings:input.settings,files:Object.fromEntries(Object.entries(files).map(([name,content])=>[name,{sha256:crypto.createHash('sha256').update(content).digest('hex')}])),verification:'After wallet deployment, use scripts/verify-community.mjs with the real transaction hash. Never fill an invented address.'},null,2)+'\n');
console.log('Prepared deployment kit (no transaction sent): '+output);
