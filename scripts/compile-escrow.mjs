import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import solc from 'solc';

// Reproduce the actual deployed artifacts from their pinned source bytes.
// Current main normalized CRLF to LF after the deployment baseline.
const names=['JobEscrow','MockUSDC'];
const bundle=JSON.parse(await fs.readFile('docs/project/evidence/escrow-deployment-sources.json','utf8'));
const sources=bundle.sources;
for(const name of names){
 const current=await fs.readFile('contracts/'+name+'.sol','utf8');
 if(current.replace(/\r\n/g,'\n')!==sources[name+'.sol'].content.replace(/\r\n/g,'\n'))throw Error(name+' changed since deployment; prepare a new deployment artifact instead of reusing this record.');
}
const settings={optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','evm.deployedBytecode.immutableReferences']}}};
const compiled=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources,settings})));
if(compiled.errors?.some(x=>x.severity==='error'))throw Error(JSON.stringify(compiled.errors));
for(const name of names){
 const source=Buffer.from(sources[name+'.sol'].content);
 const contract=compiled.contracts[name+'.sol'][name];
 const artifact={contractName:name,compiler:solc.version(),settings,sourceReference:'583fd6d1a1932a56c508d1faef617868e8ccb85c',sourceGitBlob:createHash('sha1').update(Buffer.concat([Buffer.from('blob '+source.length+'\0'),source])).digest('hex'),abi:contract.abi,bytecode:'0x'+contract.evm.bytecode.object,runtime:'0x'+contract.evm.deployedBytecode.object,immutableReferences:contract.evm.deployedBytecode.immutableReferences};
 await fs.writeFile('web/generated/'+name+'.json',JSON.stringify(artifact,null,2)+'\n');
 console.log(name+': runtime '+(artifact.runtime.length-2)/2+' bytes; source '+artifact.sourceGitBlob);
}
