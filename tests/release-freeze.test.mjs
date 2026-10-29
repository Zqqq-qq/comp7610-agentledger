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
const config=n=>`// Static deployment fixture\nexport const DEPLOYMENT = Object.freeze({chainId:11155111, identity:"${address(n)}", community:"", escrow:"", token:"", reputation:"", rpcUrl:"https://example.invalid/a,b:key",});\n`;
function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ledger-freeze-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  fs.mkdirSync(path.join(root,'web'));
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
