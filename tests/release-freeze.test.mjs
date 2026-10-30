import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../scripts/release-freeze.mjs',import.meta.url));
const address=n=>'0x'+String(n).repeat(40);
const required=['web/config.js','package.json','pnpm-lock.yaml','web/generated/AgentCommunity.json','web/generated/JobEscrow.json','web/generated/MockUSDC.json','contracts/AgentCommunity.sol','contracts/IdentityRegistry.sol','contracts/JobEscrow.sol','contracts/MockUSDC.sol','contracts/ReputationRegistry.sol'];
const optional=['backend-provenance.json','docs/project/REPORT.md','docs/project/REPORT.pdf'];
const config=n=>`// Static deployment fixture\nexport const DEPLOYMENT = Object.freeze({chainId:11155111, identity:"${address(n)}", community:"", escrow:"", token:"", reputation:"", rpcUrl:"https://example.invalid/a,b:key",});\n`;
function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ledger-freeze-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  for(const file of required.filter(p=>p!=='web/config.js')){const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,'required fixture\n');}
  fs.mkdirSync(path.join(root,'web'),{recursive:true});
  const write=s=>fs.writeFileSync(path.join(root,'web/config.js'),s);
  const commit=()=>{git('add','-A');git('commit','-m','fixture');return git('rev-parse','HEAD');};
  const run=(sha,out=path.join(root,'manifest.json'))=>spawnSync(process.execPath,[script,sha],{cwd:root,env:{...process.env,FREEZE_OUT:out},encoding:'utf8'});
  return {root,git,write,commit,run};
}
test('freeze reads the requested revision despite checkout and working-copy changes',t=>{
  const f=fixture(t),original=config(1);f.write(original);const first=f.commit();
  f.write(config(2));const second=f.commit();
  f.write('throw new Error("working-copy code must not execute");');
  for(const [sha,n] of [[first,1],[second,2]]){
    const result=f.run(sha);assert.equal(result.status,0,result.stderr);
    const m=JSON.parse(fs.readFileSync(path.join(f.root,'manifest.json')));
    assert.equal(m.commit,sha);assert.equal(m.deployment.identity,address(n));
    assert.equal(m.deployment.rpcUrl,'https://example.invalid/a,b:key');
    assert.equal(m.files.find(x=>x.path==='web/config.js').sha256,crypto.createHash('sha256').update(config(n)).digest('hex'));
    assert(m.workingCopyDiffersFromBlob.some(x=>x.path==='web/config.js'));
  }
});
test('dynamic target config is rejected without executing it or overwriting output',t=>{
  const f=fixture(t),marker=path.join(f.root,'executed');
  f.write(`import fs from 'node:fs';fs.writeFileSync(${JSON.stringify(marker)},'bad');\n`+config(1));
  const sha=f.commit(),out=path.join(f.root,'existing.json');fs.writeFileSync(out,'keep');
  const result=f.run(sha,out);assert.notEqual(result.status,0);assert.match(result.stderr,/FAIL: cannot read deployment/);
  assert.equal(fs.readFileSync(out,'utf8'),'keep');assert(!fs.existsSync(marker));
});
test('missing or malformed target config fails before creating a manifest',t=>{
  const f=fixture(t);f.write('export const DEPLOYMENT = Object.freeze({chainId:11155111});');
  const invalid=f.commit();assert.notEqual(f.run(invalid).status,0);assert(!fs.existsSync(path.join(f.root,'manifest.json')));
  f.git('rm','web/config.js');const missing=f.commit();
  assert.notEqual(f.run(missing).status,0);assert(!fs.existsSync(path.join(f.root,'manifest.json')));
});

test('every required path is checked in the target commit; missing inputs never replace output',t=>{
  const f=fixture(t);f.write(config(1));f.commit();
  const out=path.join(f.root,'existing.json');fs.writeFileSync(out,'keep');
  for(const file of required){
    const original=fs.readFileSync(path.join(f.root,file));f.git('rm',file);const missing=f.commit();
    // Restoring the worktree must not hide a missing blob in the requested revision.
    fs.writeFileSync(path.join(f.root,file),original);
    const result=f.run(missing,out);assert.notEqual(result.status,0,file);assert.match(result.stderr,/missing required files/);assert(result.stderr.includes(file));
    assert.equal(fs.readFileSync(out,'utf8'),'keep');
    const fresh=path.join(f.root,'uncreated','manifest.json');assert.notEqual(f.run(missing,fresh).status,0);assert(!fs.existsSync(path.dirname(fresh)));
    f.commit();
  }
});
test('optional absence is explicit and optional presence is hashed from the requested revision',t=>{
  const f=fixture(t);f.write(config(1));const earlier=f.commit();
  const file='docs/project/REPORT.md',content='Optional report\n';fs.mkdirSync(path.join(f.root,'docs/project'),{recursive:true});fs.writeFileSync(path.join(f.root,file),content);const later=f.commit();
  for(const [sha,present] of [[earlier,false],[later,true]]){
    const result=f.run(sha);assert.equal(result.status,0,result.stderr);
    const m=JSON.parse(fs.readFileSync(path.join(f.root,'manifest.json')));
    assert.deepEqual(m.filePolicy,{required,optional});assert.deepEqual(m.missingOptionalFiles,optional.filter(p=>!present||p!==file));
    assert.equal(m.files.length,required.length+Number(present));assert.match(result.stderr,/WARN: optional files absent/);
    if(present)assert.equal(m.files.find(p=>p.path===file).sha256,crypto.createHash('sha256').update(content).digest('hex'));
  }
});
test('directories and symlinks cannot masquerade as required or optional files',t=>{
  for(const [file,mode] of [['package.json','directory'],['docs/project/REPORT.pdf','directory'],['contracts/MockUSDC.sol','symlink']]){
    const f=fixture(t);f.write(config(1));f.commit();
    if(fs.existsSync(path.join(f.root,file)))f.git('rm',file);
    if(mode==='directory'){
      fs.mkdirSync(path.join(f.root,file),{recursive:true});fs.writeFileSync(path.join(f.root,file,'nested'),'not a regular file');
    }else{
      // Write the symlink mode directly to the index so this fixture also works on Windows.
      const oid=execFileSync('git',['hash-object','-w','--stdin'],{cwd:f.root,input:'IdentityRegistry.sol',encoding:'utf8'}).trim();
      f.git('update-index','--add','--cacheinfo',`120000,${oid},${file}`);
    }
    let sha;
    if(mode==='symlink'){f.git('commit','-m','symlink fixture');sha=f.git('rev-parse','HEAD');}else sha=f.commit();
    const out=path.join(f.root,'existing.json');fs.writeFileSync(out,'keep');
    const result=f.run(sha,out);assert.notEqual(result.status,0,file);assert.match(result.stderr,/expected a regular Git blob/);assert(result.stderr.includes(file));assert.equal(fs.readFileSync(out,'utf8'),'keep');
  }
});
