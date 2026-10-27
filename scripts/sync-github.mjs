// Run only after the repository owner has authenticated GitHub CLI.
// Dry-run by default; --apply creates a PRIVATE repository and its task Issues.
// --invite additionally sends write-access invitations to real usernames in team.json.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
const args=new Set(process.argv.slice(2)), apply=args.has('--apply'), invite=args.has('--invite');
for(const a of args)if(!['--apply','--invite'].includes(a))throw new Error('Supported flags: --apply [--invite]');
const manifest=JSON.parse(await fs.readFile('docs/project/issues.json','utf8'));
const team=JSON.parse(await fs.readFile('docs/project/team.json','utf8'));
const tasks=manifest.tasks;
if(new Set(tasks.map(t=>t.key)).size!==tasks.length)throw new Error('Duplicate task keys');
const members=[...new Set([...(team.members||[]),...Object.values(team.roles)].filter(Boolean))];
if(members.some(u=>!/^\w[\w-]{0,38}$/.test(u)))throw new Error('Use real GitHub usernames only.');
const gh=(a)=>execFileSync('gh',a,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const api=(endpoint,method='GET',payload)=>{
 const input=payload===undefined?undefined:JSON.stringify(payload);
 return JSON.parse(execFileSync('gh',['api',endpoint,'--method',method,...(input?['--input','-']:[])],{encoding:'utf8',input,stdio:['pipe','pipe','pipe']})||'null');
};
if(!apply){console.log(JSON.stringify({dryRun:true,repository:manifest.repositoryName,visibility:'private',issues:tasks.map(t=>({key:t.key,title:t.title,role:t.role,due:t.due})),inviteRequested:invite,members},null,2));process.exit(0);}
const login=gh(['api','user','--jq','.login']);
const repo=login+'/'+manifest.repositoryName;
// Public repositories and other owners are never selected implicitly.
let existing;
try{existing=JSON.parse(gh(['repo','view',repo,'--json','nameWithOwner,isPrivate']));}catch(e){
 if(!/not found|Could not resolve to a Repository|HTTP 404/i.test(String(e.stderr)))throw e;
}
if(existing&&!existing.isPrivate)throw new Error('An existing public repo uses this name. Stop and choose explicitly.');
const origin=(()=>{try{return execFileSync('git',['remote','get-url','origin'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}catch{return '';}})();
const target='https://github.com/'+repo+'.git';
if(origin&&origin!==target&&origin!=='git@github.com:'+repo+'.git')throw new Error('Origin points elsewhere. Refusing to change it.');
if(!existing){
 gh(['repo','create',repo,'--private','--description','COMP7610 AgentLedger: identity, community and social collaboration','--source','.','--remote','origin','--push']);
}else{
 if(!origin)throw new Error('Repository already exists but is not this checkout origin. Review before attaching.');
 execFileSync('git',['push','origin','main'],{stdio:'inherit'});
}
const color={P0:'B60205',P1:'D4C5F9','area:A':'C2E0C6','area:B':'BFD4F2','area:C':'FEF2C0','area:D':'F9D0C4','area:E':'D4C5F9','area:release':'EDEDED'};
for(const [label,value] of Object.entries(color))gh(['label','create',label,'--repo',repo,'--color',value,'--force']);
let milestones=api('repos/'+repo+'/milestones?state=all&per_page=100');
for(const [title,date] of [['M1 · Testnet baseline','2026-10-30'],['M2 · Feature freeze','2026-11-03'],['M3 · Rehearsal & release','2026-11-07']]){
 if(!milestones.some(m=>m.title===title)){milestones.push(api('repos/'+repo+'/milestones','POST',{title,due_on:date+'T15:59:59Z'}));}
}
if(invite){
 for(const username of members){const actual=api('users/'+encodeURIComponent(username)).login;if(actual.toLowerCase()!==username.toLowerCase())throw new Error('Unrecognized user: '+username);}
 for(const username of members)if(username.toLowerCase()!==login.toLowerCase())api('repos/'+repo+'/collaborators/'+encodeURIComponent(username),'PUT',{permission:'push'});
}
const existingIssues=JSON.parse(gh(['issue','list','--repo',repo,'--state','all','--limit','500','--json','title,number,url']));
const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'agentledger-issues-'));
const result={repository:'https://github.com/'+repo,issues:[],invitationsRequested:invite?members:[]};
try{
 for(const task of tasks){
  let issue=existingIssues.find(i=>i.title.startsWith('['+task.key+']'));
  const username=task.role==='release'?team.releaseOwner:team.roles[task.role];
  if(!issue){
   const file=path.join(tmp,task.key+'.md');await fs.writeFile(file,task.body);
   const url=gh(['issue','create','--repo',repo,'--title',task.title,'--body-file',file,'--milestone',task.milestone,...task.labels.flatMap(l=>['--label',l])]);
   issue={url,number:Number(url.split('/').at(-1))};
  }
  // Assignment requires accepted collaborator access; keep Issues if it is pending.
  let assignment='unassigned';
  if(username){try{gh(['issue','edit',String(issue.number),'--repo',repo,'--add-assignee',username]);assignment=username;}catch{assignment='pending invitation: '+username;}}
  result.issues.push({key:task.key,url:issue.url,assignment});
 }
 await fs.writeFile('docs/project/github-status.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{await fs.rm(tmp,{recursive:true,force:true});}
