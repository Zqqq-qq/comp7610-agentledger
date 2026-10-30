import {JOB_STATUS} from '../../web/escrow-core.js';
export function parseJobStates(raw) {
  const out=new Map();
  for(const part of raw.split(';')){
    const match=part.trim().match(/^([1-9]\d*)\s*=\s*([1-4])(?:\s*·\s*(\w+))?$/);
    if(!match||!Number.isSafeInteger(Number(match[1])))throw Error(`Invalid DEMO_JOB_STATES entry: ${part}`);
    const [,id,code,label]=match, state=`${code} · ${JOB_STATUS[Number(code)]}`;
    if(label&&label!==JOB_STATUS[Number(code)])throw Error(`Status label disagrees with code: ${part}`);
    if(out.has(Number(id)))throw Error(`Duplicate job ID: ${id}`);
    out.set(Number(id),state);
  }
  if(out.size!==3)throw Error('DEMO_JOB_STATES must specify exactly three distinct jobs, in capture order.');
  return out;
}
export function shortContract(address){
  if(!/^0x[0-9a-fA-F]{40}$/.test(address))throw Error('Invalid contract address');
  return address.slice(0,6)+'…'+address.slice(-4);
}
export function jobCaption(step,escrow,id,expected,observed){
  if(observed.title!==`Task #${id}`||observed.state!==expected)throw Error(`Job ${id} observation does not match its ID and expected state`);
  return `${step}/7  Task escrow · ${shortContract(escrow)} · Job #${id} · ${observed.state}`;
}
// Self-contained DOM predicates: Playwright can serialize these without closures.
export function liveReady({community}){
  let config;try{config=JSON.parse(localStorage.getItem('agentledger-community-config'));}catch{return false;}
  const live=document.querySelector('button[data-social="mode-live"]');
  const note=document.querySelector('.social-bottom-note');
  return typeof config?.address==='string'&&config.address.toLowerCase()===community.toLowerCase()
    &&live?.getAttribute('aria-pressed')==='true'
    &&!document.querySelector('.demo-note')
    &&/Confirmed at block \d+/.test(note?.textContent||'');
}
export function jobReady({id,want,escrow}){
  let config;try{config=JSON.parse(localStorage.getItem('agent-ledger.sepolia.v1'));}catch{return false;}
  const card=document.getElementById('loadedJob');
  return !!card&&!card.hidden&&typeof config?.escrow==='string'&&config.escrow.toLowerCase()===escrow.toLowerCase()
    &&document.getElementById('loadedJobTitle')?.textContent.trim()===`Task #${id}`
    &&document.getElementById('loadedJobState')?.textContent.trim()===want;
}
