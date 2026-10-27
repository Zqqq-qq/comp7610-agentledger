import {ESCROW_ABI, sameAddress, unsigned} from './escrow-core.js';

export const LINK_PREFIX = 'AgentLedger escrow link v1\n';
export const MAX_LINK_REPLIES = 1000;
export function normalizeLink(raw, sdk) {
  if (!raw || raw.version !== 1 || raw.chainId !== 11155111) throw new Error('Unsupported escrow link network or version.');
  const address = value => { const a = sdk.getAddress(value); if (a === sdk.ZeroAddress) throw new Error('A link address cannot be zero.'); return a; };
  return {version:1, chainId:11155111, community:address(raw.community), postId:unsigned(raw.postId,'Post ID').toString(), teamId:unsigned(raw.teamId,'Team ID').toString(), escrow:address(raw.escrow), jobId:unsigned(raw.jobId,'Job ID').toString()};
}
export function encodeLink(raw, sdk) { return LINK_PREFIX + JSON.stringify(normalizeLink(raw,sdk)); }
export function decodeLink(body, sdk) {
  if (!body?.startsWith(LINK_PREFIX)) return null;
  try { return normalizeLink(JSON.parse(body.slice(LINK_PREFIX.length)),sdk); } catch { return null; }
}
export function teamCounterparty(team, client) {
  if (Number(team.status)!==2) throw new Error('Accept the team invitation before linking an escrow task.');
  if (sameAddress(client,team.host)) return {provider:team.guest,agentId:BigInt(team.guestAgentId)};
  if (sameAddress(client,team.guest)) return {provider:team.host,agentId:BigInt(team.hostAgentId)};
  throw new Error('Only a recorded team member can fund or publish its task link.');
}
// Re-read both contracts at one block. This validates a reference, not an escrow contract constraint.
export async function verifyLink({provider,community,escrow,link,author,token,blockTag}) {
  const at={blockTag:blockTag ?? await provider.getBlockNumber()};
  if (BigInt((await provider.getNetwork()).chainId)!==11155111n) throw new Error('Use Ethereum Sepolia for escrow links.');
  if (!sameAddress(await community.getAddress(),link.community) || !sameAddress(await escrow.getAddress(),link.escrow)) throw new Error('Link addresses do not match the configured contracts.');
  const [team,post,job,registry,escrowRegistry]=await Promise.all([community.getTeam(link.teamId,at),community.getPost(link.postId,at),escrow.jobs(link.jobId,at),community.identity(at),escrow.identity(at)]);
  if (!sameAddress(registry,escrowRegistry)) throw new Error('Community and escrow use different identity registries.');
  if (BigInt(team.postId)!==BigInt(link.postId) || Number(post.kind)!==1) throw new Error('The source must be this team’s open task post.');
  if (Number(job.status)===0) throw new Error('This escrow job does not exist.');
  if (!sameAddress(author,job.client)) throw new Error('Only the on-chain paying client may publish this reference.');
  const partner=teamCounterparty(team,job.client);
  if (!sameAddress(partner.provider,job.provider) || partner.agentId!==BigInt(job.providerAgentId)) throw new Error('The job provider wallet / Agent ID does not match the team partner.');
  if (token && !sameAddress(token,job.token)) throw new Error('This order uses a different payment token.');
  return {link,team,post,job,block:Number(at.blockTag)};
}
export async function readLinks({provider,community,escrow,sdk,token}) {
  const block=await provider.getBlockNumber(),at={blockTag:block};
  const count=Number(await community.replyCount(at));
  if (count>MAX_LINK_REPLIES) throw new Error('Community exceeds the 1000-reply link scan limit. An indexed reader is required; no completeness claim is made.');
  const records=[],seen=new Set(); let rejected=0;
  for(let start=1;start<=count;start+=10) {
    const replies=await Promise.all(Array.from({length:Math.min(10,count-start+1)},(_,i)=>community.getReply(start+i,at)));
    for(let i=0;i<replies.length;i++) {
      const reply=replies[i],link=decodeLink(reply.body,sdk); if(!link)continue;
      if (!sameAddress(link.community,await community.getAddress()) || !sameAddress(link.escrow,await escrow.getAddress()))continue;
      // RPC failures must fail the scan rather than promote a later conflicting reference.
      let verified;
      try { verified=await verifyLink({provider,community,escrow,link,author:reply.author,token,blockTag:block}); }
      catch(error) { if(error.code && !['CALL_EXCEPTION','INVALID_ARGUMENT'].includes(error.code))throw error; rejected++;continue; }
      if(BigInt(reply.postId)!==BigInt(link.postId)){rejected++;continue;}
      const key=link.escrow.toLowerCase()+':'+link.jobId;
      if(seen.has(key)){rejected++;continue;}seen.add(key);
      records.push({...verified,replyId:start+i});
    }
  }
  return {records,rejected,block};
}
export function escrowReader(address,sdk,provider){return new sdk.Contract(address,ESCROW_ABI,provider);}
