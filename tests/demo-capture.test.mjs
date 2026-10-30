import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseJobStates,jobCaption,liveReady,jobReady,workReady} from '../scripts/lib/demo-captions.mjs';
const C='0x'+'12'.repeat(20),E='0x'+'34'.repeat(20);
test('job expectations preserve order and reject ambiguous IDs or contradictory status labels',()=>{
  assert.deepEqual([...parseJobStates('7=2;8=1 · Funded;9=4 · Refunded')],[[7,'2 · Submitted'],[8,'1 · Funded'],[9,'4 · Refunded']]);
  for(const value of ['1=3;2=4','1=3;1=3;2=4','1=3 · Refunded;2=4;3=3','1=0;2=4;3=3','-1=3;2=4;3=3','1=3;2=no;3=3','9007199254740992=3;2=4;3=3'])assert.throws(()=>parseJobStates(value));
});
test('job caption uses the observed card and configured contract without claiming a payment method',()=>{
  const text=jobCaption(6,E,8,'1 · Funded',{title:'Task #8',state:'1 · Funded'});
  assert.match(text,/0x3434…3434/);assert.match(text,/Job #8 · 1 · Funded/);assert.doesNotMatch(text,/claimed|Completed|Refunded/);
  assert.throws(()=>jobCaption(6,E,8,'3 · Completed',{title:'Task #7',state:'3 · Completed'}));
  assert.throws(()=>jobCaption(6,E,8,'1 · Funded',{title:'Task #8',state:'3 · Completed'}));
});
function runPredicate(fn,arg,{community=C,escrow=E,live=true,demo=false,block='Confirmed at block 20',id=7,state='3 · Completed'}={}){
  const storage={'agentledger-community-config':JSON.stringify({address:community}),'agent-ledger.sepolia.v1':JSON.stringify({escrow})};
  const document={querySelector:sel=>sel==='.demo-note'?(demo?{}:null):sel==='.social-bottom-note'?{textContent:block}:{getAttribute:()=>String(live)},getElementById:sel=>sel==='loadedJob'?{hidden:false}:{textContent:sel==='loadedJobTitle'?`Task #${id}`:state}};
  return vm.runInNewContext(`(${fn.toString()})(arg)`,{document,localStorage:{getItem:k=>storage[k]},arg});
}
test('live checks do not depend on translated banner text and reject wrong full addresses or unconfirmed data',()=>{
  assert(runPredicate(liveReady,{community:C}));
  for(const patch of [{community:C.slice(0,-1)+'3'},{live:false},{demo:true},{block:'Reading records…'}])assert.equal(runPredicate(liveReady,{community:C},patch),false);
  assert.equal(runPredicate(jobReady,{id:8,want:'3 · Completed',escrow:E},{id:7}),false);
  assert.equal(runPredicate(jobReady,{id:7,want:'3 · Completed',escrow:E},{escrow:C}),false);
  assert(runPredicate(jobReady,{id:7,want:'3 · Completed',escrow:E}));
});
function capture(t,patch={}){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'demo capture #'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const driver=path.join(root,'driver #');fs.mkdirSync(driver);fs.copyFileSync(fileURLToPath(new URL('./fixtures/demo-browser.mjs',import.meta.url)),path.join(driver,'index.mjs'));
  const out=path.join(root,'frames');
  const env={...process.env,PW_CORE:driver,DEMO_OUT:out,DEMO_HOLD:'1',DEMO_COMMUNITY:C,DEMO_ESCROW:E,DEMO_POST_ID:'9',DEMO_WORK_ID:'8',DEMO_JOB_STATES:'7=2;8=1;9=4',FIXTURE_JOB_STATES:JSON.stringify({7:'2 · Submitted',8:'1 · Funded',9:'4 · Refunded'}),...patch};
  const result=spawnSync(process.execPath,[fileURLToPath(new URL('../scripts/demo-capture.mjs',import.meta.url))],{env,encoding:'utf8'});
  return {out,result};
}
test('capture CLI records separate captions for custom jobs, IDs and contract addresses',t=>{
  const {out,result}=capture(t);assert.equal(result.status,0,result.stderr);
  const meta=JSON.parse(fs.readFileSync(path.join(out,'meta.json')));assert.equal(meta.frames,23);assert.equal(meta.scenes.length,8);assert.deepEqual(meta.jobIds,[7,8,9]);assert.equal(meta.postId,'9');assert.equal(meta.workId,'8');
  assert(meta.scenes[0].caption.includes('0x1212…1212'));assert(meta.scenes[1].caption.includes('Post #9'));assert(meta.scenes[3].caption.includes('Work #8'));
  const jobs=meta.scenes.filter(s=>s.jobId);assert.deepEqual(jobs.map(s=>s.observed.state),['2 · Submitted','1 · Funded','4 · Refunded']);
  for(const s of jobs){const frame=JSON.parse(fs.readFileSync(path.join(out,`f${String(s.startFrame).padStart(5,'0')}.png`)));assert.equal(frame.caption,s.caption);assert.equal(frame.title,`Task #${s.jobId}`);assert.doesNotMatch(s.caption,/claimed after/);}
});
test('capture aborts on a stale card with the same state and creates no success metadata',t=>{
  const {out,result}=capture(t,{DEMO_JOB_STATES:'7=3;8=3;9=3',FIXTURE_JOB_STATES:JSON.stringify({7:'3 · Completed',8:'3 · Completed',9:'3 · Completed'}),FIXTURE_STALE_JOB:'8'});
  assert.notEqual(result.status,0);assert.match(result.stderr,/job 8/);assert(!fs.existsSync(path.join(out,'meta.json')));
  const captions=fs.readdirSync(out).map(p=>JSON.parse(fs.readFileSync(path.join(out,p))).caption);assert(captions.every(c=>!c.includes('Job #8')));
  for(const patch of [{DEMO_JOB_STATES:'7=2 · Completed;8=1;9=4'},{DEMO_POST_ID:'0'},{DEMO_WORK_ID:'not-a-number'}]){
    const invalid=capture(t,patch);assert.notEqual(invalid.result.status,0);assert(!fs.existsSync(invalid.out));
  }
});
test('works readiness follows the current published cover, not the removed seal badge',()=>{
  const doc=card=>({querySelectorAll:sel=>sel.includes('data-social="work"')?[{dataset:{id:'8'},closest:()=>card}]:[]});
  const current={querySelector:sel=>sel==='.work-cover-illustration'?{}:null};
  assert.equal(vm.runInNewContext(`(${workReady})('8')`,{document:doc(current)}),true);
  const old={querySelector:sel=>sel==='.work-seal'?{textContent:'JOINTLY CONFIRMED'}:null};
  assert.equal(vm.runInNewContext(`(${workReady})('8')`,{document:doc(old)}),false);
});
