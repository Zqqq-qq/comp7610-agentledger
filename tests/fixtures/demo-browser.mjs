// Deliberately synthetic Playwright fixture; no browser, RPC or real PNGs.
import vm from 'node:vm';
import fs from 'node:fs/promises';
export const chromium={async launch(){
  const storage=new Map(),elements=new Map();
  const states=JSON.parse(process.env.FIXTURE_JOB_STATES||'{}');
  let modal=false, title='',caption='';
  const card={hidden:true,scrollIntoView(){}};
  const node=(textContent='')=>({textContent,getAttribute(){return 'true';}});
  const post={dataset:{id:process.env.DEMO_POST_ID||'2'},click(){modal=true;title='Fixture post';}};
  const work={dataset:{id:process.env.DEMO_WORK_ID||'1'},click(){modal=true;title='Fixture work';},closest(){return {querySelector(sel){return sel==='.work-cover-illustration'?node(''):null;}};}};
  const input={value:''};
  const form={requestSubmit(){
    const id=String(input.value);card.hidden=false;
    if(id!==process.env.FIXTURE_STALE_JOB){elements.set('loadedJobTitle',node('Task #'+id));elements.set('loadedJobState',node(states[id]||'3 · Completed'));}
  }};
  const body={innerText:'Fixture page'};Object.defineProperty(body,'innerHTML',{set(){caption='';}});
  body.appendChild=e=>{elements.set(e.id,e);Object.defineProperty(e,'textContent',{set(v){caption=v;},get(){return caption;}});};
  const document={body,createElement(){return {style:{}};},getElementById(id){
    if(id==='lookupJobId')return input;if(id==='lookupJobForm')return form;if(id==='loadedJob')return card;
    if(id==='socialDialog')return {open:modal,querySelector(){return node(title);}};
    return elements.get(id)||null;
  },querySelector(sel){
    if(sel==='button[data-social="mode-live"]')return node();
    if(sel==='.social-bottom-note')return node('Confirmed at block 123');
    if(sel==='.demo-note')return null;
    if(sel.includes('button[data-social="close"]'))return {click(){modal=false;}};
    return null;
  },querySelectorAll(sel){if(sel.includes('data-social="thread"'))return [post];if(sel.includes('data-social="work"'))return [work];if(sel==='.circle-card')return [{},{},{}];return [];}};
  const context=vm.createContext({document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{hash:''}});
  const evaluate=(fn,arg)=>{context.arg=arg;return vm.runInContext(`(${fn.toString()})(arg)`,context);};
  const page={goto:async()=>{},reload:async()=>{},waitForTimeout:async()=>{},evaluate:async(fn,arg)=>evaluate(fn,arg),
    waitForFunction:async(fn,arg)=>{if(!evaluate(fn,arg))throw Error('Fixture DOM did not satisfy predicate');},
    screenshot:async({path})=>fs.writeFile(path,JSON.stringify({caption,title:elements.get('loadedJobTitle')?.textContent})),
  };
  return {newContext:async()=>({newPage:async()=>page}),close:async()=>{}};
}};
