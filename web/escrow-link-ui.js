import {reader,sendCommunity} from './social-chain.js';
import {readLinks,verifyLink,teamCounterparty,encodeLink,normalizeLink,escrowReader} from './escrow-links.js';
import {sameAddress,unsigned} from './escrow-core.js';

export function createEscrowLinkUI(api) {
  const {sdk,$,state,node,toast,selectedSigner,configKey,runAction,status}=api;
  let source=null,jobId=null,generation=0;
  const sourceKey=()=>`${$('linkCommunity').value.trim().toLowerCase()}:${$('linkTeamId').value.trim()}`;
  const configured=()=>!!state.config.escrow&&!!state.config.token;
  function invalidate(){generation++;source=null;jobId=null;$('linkedTasks').replaceChildren();$('linkSummary').textContent='Optional: load an accepted community team to connect a paid task with its discussion.';render();}
  function render(){
    $('loadTeamLinks').disabled=state.busy;
    for(const id of ['linkCommunity','linkTeamId','clearTeamLink'])$(id).disabled=state.busy;
    $('publishJobLink').disabled=state.busy||!configured()||!source||!jobId||!state.account;
    $('linkJobLabel').textContent=jobId?`Selected escrow task #${jobId}`:'Load or create an escrow task before publishing its reference.';
    if(source) {
      try { const other=teamCounterparty(source.team,state.account);$('jobProvider').value=other.provider;$('jobAgentId').value=other.agentId.toString(); }
      catch { /* Read-only viewers may browse links but cannot fund as a member. */ }
    }
  }
  async function environment(){
    if(!configured())throw new Error('Configure JobEscrow and MockUSDC in Contracts first.');
    const communityAddress=sdk.getAddress($('linkCommunity').value.trim());
    const teamId=unsigned($('linkTeamId').value,'Team ID').toString();
    const config={...state.config};
    const {c:community,p:provider}=await reader(communityAddress,config.identity,config.rpcUrl);
    return {community,provider,escrow:escrowReader(config.escrow,sdk,provider),config,communityAddress,teamId};
  }
  function showLinks(result,teamId,communityAddress){
    $('linkedTasks').replaceChildren();
    for(const record of result.records.filter(r=>r.link.teamId===teamId)) {
      const open=node('button',{class:'text-button',type:'button',text:`Load task #${record.link.jobId} →`});
      open.addEventListener('click',()=>{$('lookupJobId').value=record.link.jobId;$('lookupJobForm').requestSubmit();});
      $('linkedTasks').append(node('div',{class:'work-row'},[node('span',{text:`Task #${record.link.jobId} · community reply #${record.replyId}`}),open]));
    }
    const back=node('button',{class:'text-button',type:'button',text:'Back to source discussion →'});
    back.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('ledger-community-source',{detail:{community:communityAddress,postId:source.postId,teamId}})));
    $('linkedTasks').append(back,node('p',{class:'field-help',text:`Verified at block ${result.block}. First valid client-authored reference per escrow/job is displayed. ${result.rejected} invalid/duplicate references ignored. This is application verification; the contracts do not enforce the association.`}));
  }
  async function load(){
    const current=++generation,key=sourceKey(),config=configKey(state.config);source=null;$('linkedTasks').replaceChildren();render();
    const env=await environment();
    try {
      const team=await env.community.getTeam(env.teamId),post=await env.community.getPost(team.postId);
      if(Number(team.status)!==2||Number(post.kind)!==1)throw new Error('Choose an accepted team originating from an open task.');
      const result=await readLinks({...env,sdk,token:env.config.token});
      if(current!==generation||key!==sourceKey()||config!==configKey(state.config))return;
      source={team,postId:team.postId.toString(),teamId:env.teamId,address:env.communityAddress,key,config};
      $('linkSummary').textContent=`Team #${env.teamId} · ${team.title} · source post #${source.postId}. The selected member funds the other recorded member. Publish a reference after funding (a separate community transaction).`;
      showLinks(result,env.teamId,env.communityAddress);render();
    } finally {env.provider.destroy();}
  }
  async function beforeFunding(values){
    if(!$('linkCommunity').value.trim()&&!$('linkTeamId').value.trim())return;
    if(!source||source.key!==sourceKey()||source.config!==configKey(state.config))throw new Error('Load and verify the source team before funding.');
    const env=await environment();
    try {
      const team=await env.community.getTeam(env.teamId),other=teamCounterparty(team,state.account);
      if(!sameAddress(other.provider,values.provider)||other.agentId!==BigInt(values.providerAgentId))throw new Error('The service provider and Agent ID must match the other team member.');
    }finally{env.provider.destroy();}
  }
  async function publish(){
    if(!source||!jobId)throw new Error('Load a source team and a confirmed job first.');
    if(source.key!==sourceKey()||source.config!==configKey(state.config))throw new Error('Source configuration changed; load the team again.');
    const env=await environment();
    try {
      const signer=await selectedSigner(),author=await signer.getAddress();
      const link=normalizeLink({version:1,chainId:11155111,community:env.communityAddress,postId:source.postId,teamId:env.teamId,escrow:env.config.escrow,jobId},sdk);
      const verified=await verifyLink({...env,link,author,token:env.config.token});
      if(!await env.community.member(verified.post.circleId,author))throw new Error('Join the source circle before publishing its reference.');
      const existing=await readLinks({...env,sdk,token:env.config.token});
      if(existing.records.some(r=>r.link.jobId===link.jobId))throw new Error('This escrow task already has a verified community reference.');
      status('jobLinkStatus','Confirm the community reference',{message:'The task is already funded. This separate transaction only publishes its reference; it never pays again.',pending:true});
      const hash=await sendCommunity(env.communityAddress,env.config.identity,env.config.rpcUrl,signer,{type:'reply',postId:source.postId,agentId:0,body:encodeLink(link,sdk)});
      status('jobLinkStatus','Task reference published',{message:'Other devices can load this team using the same community and escrow addresses.',hash});
      await load();
    }finally{env.provider.destroy();}
  }
  function bind(){
    $('loadTeamLinks').addEventListener('click',()=>runAction('jobLinkStatus',load));
    $('publishJobLink').addEventListener('click',()=>runAction('jobLinkStatus',publish));
    $('clearTeamLink').addEventListener('click',()=>{if(state.busy)return;$('linkCommunity').value='';$('linkTeamId').value='';invalidate();});
    for(const id of ['linkCommunity','linkTeamId'])$(id).addEventListener('input',invalidate);
    window.addEventListener('ledger-escrow-source',event=>{
      if(state.busy)return toast('Finish the wallet operation first.',true);
      $('linkCommunity').value=event.detail.community;$('linkTeamId').value=String(event.detail.teamId);invalidate();location.hash='jobs';
      runAction('jobLinkStatus',load);
    });
    window.addEventListener('ledger-account-changed',render);
    window.addEventListener('ledger-config-changed',invalidate);
    render();
  }
  return {bind,render,invalidate,beforeFunding,jobCleared(){jobId=null;render();},jobLoaded(job){jobId=job.id.toString();render();}};
}
