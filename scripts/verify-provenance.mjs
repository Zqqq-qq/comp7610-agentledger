// Verify recorded hashes against immutable Git blobs; does not fetch upstream.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{stdio:['ignore','pipe','pipe']});
const rev=git('rev-parse',`${process.argv[2]||'HEAD'}^{commit}`).toString().trim();
const blob=path=>git('cat-file','blob',`${rev}:${path}`);
const p=JSON.parse(blob('backend-provenance.json'));
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const [name,expected] of Object.entries(p.sha256)){
  const data=blob('contracts/'+name);
  if(hash(data)!==expected)throw Error(`Current blob mismatch: ${name}`);
  const original=name==='MockUSDC.sol'?data:Buffer.from(data.toString('utf8').replace(/\n/g,'\r\n'));
  if(hash(original)!==p.importedSnapshotSHA256[name])throw Error(`Imported snapshot mismatch: ${name}`);
  const upstream=p.upstreamVerification.files[name];
  if(upstream&&hash(data)!==upstream.sha256)throw Error(`Recorded upstream hash mismatch: ${name}`);
  console.log(`${name}: current and imported-snapshot hashes match`);
}
console.log(`Verified ${rev}. Upstream attribution was checked separately; this command is offline.`);
