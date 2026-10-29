import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ganache from 'ganache';
import solc from 'solc';
import '../web/vendor/ethers.umd.min.js';
import {emptyState, applyAction, partners, PERSONAS} from '../web/social-core.js';

const {BrowserProvider, ContractFactory} = globalThis.ethers;
const artifact = JSON.parse(await fs.readFile('web/generated/AgentCommunity.json', 'utf8'));
const source = await fs.readFile('contracts/IdentityRegistry.sol', 'utf8');
const identityArtifact = JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'I.sol':{content:source}},settings:{evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}}))).contracts['I.sol'].IdentityRegistry;

async function rejectsWith(promise, reason) {
  await assert.rejects(promise, error => {
    assert.match([error.reason,error.shortMessage,error.info?.error?.message,error.message].filter(Boolean).join(' | '), reason);
    return true;
  });
}
async function fixture() {
  const rpc = ganache.provider({logging:{quiet:true},wallet:{totalAccounts:3},chain:{chainId:1337}});
  const provider = new BrowserProvider(rpc, undefined, {cacheTimeout:-1});
  const [a,b,c] = await Promise.all([0,1,2].map(i=>provider.getSigner(i)));
  const identity = await new ContractFactory(identityArtifact.abi, '0x'+identityArtifact.evm.bytecode.object, a).deploy();
  await identity.waitForDeployment();
  const x = await new ContractFactory(artifact.abi, artifact.bytecode, a).deploy(await identity.getAddress());
  await x.waitForDeployment();
  await (await x.setMembership(2,true)).wait();
  await (await x.connect(b).setMembership(2,true)).wait();
  await (await x.createPost(2,0,1,'Task','Keep collaboration independent of discovery')).wait();
  await (await x.inviteTeam(1,await b.getAddress(),0,0,'Team','Research','Review')).wait();
  return {x,a,b,c,close:async()=>{provider.destroy();await rpc.disconnect();}};
}

for (const authorRole of ['host','guest']) {
  test(`leaving a circle preserves ${authorRole} proposals and the other member's review, not circle writes`, async()=>{
    const f=await fixture();
    try {
      const {x,a,b,c}=f, A=await a.getAddress(), B=await b.getAddress();
      await (await x.connect(b).respondTeam(1,true)).wait();
      await (await x.setMembership(2,false)).wait();
      await (await x.connect(b).setMembership(2,false)).wait();
      assert.equal(await x.member(2,A),false);
      assert.equal(await x.member(2,B),false);
      assert.equal((await x.getTeam(1)).status,2n);
      assert.equal((await x.getPost(1)).author,A);
      for (const signer of [a,b]) {
        await rejectsWith(x.connect(signer).createPost(2,0,0,'No','No'),/join circle first/);
        await rejectsWith(x.connect(signer).createReply(1,0,'No'),/join circle first/);
        await rejectsWith(x.connect(signer).inviteTeam(1,await c.getAddress(),0,0,'No','No','No'),/join circle first/);
      }
      const author=authorRole==='host'?a:b, reviewer=authorRole==='host'?b:a;
      await rejectsWith(x.connect(c).proposeWork(1,'No','No','https://example.com'),/not team member/);
      await (await x.connect(author).proposeWork(1,'Draft','Both left the circle','https://example.com')).wait();
      await rejectsWith(x.connect(author).reviewWork(1,true),/only other member/);
      await rejectsWith(x.connect(c).reviewWork(1,true),/only other member/);
      await (await x.connect(reviewer).reviewWork(1,false)).wait();
      assert.equal((await x.getWork(1)).status,3n);
      assert.equal(await x.pendingWork(1),0n);
      assert.equal(await x.collaborationCount(A,B),0n);
      await (await x.connect(author).proposeWork(1,'Revision','Both approve','https://example.com/v2')).wait();
      assert.equal(await x.collaborationCount(A,B),0n);
      await (await x.connect(reviewer).reviewWork(2,true)).wait();
      assert.equal((await x.getWork(2)).status,2n);
      assert.equal(await x.collaborationCount(A,B),1n);
      assert.equal(await x.collaborationCount(B,A),1n);
      await rejectsWith(x.connect(reviewer).reviewWork(2,true),/work not pending/);
      assert.equal(await x.collaborationCount(A,B),1n);
    } finally { await f.close(); }
  });
}

test('pending invitation requires guest membership at acceptance, while host departure does not revoke the invitation',async()=>{
  const f=await fixture();
  try {
    const {x,a,b}=f;
    await (await x.setMembership(2,false)).wait();
    await (await x.connect(b).setMembership(2,false)).wait();
    await rejectsWith(x.connect(b).respondTeam(1,true),/join circle first/);
    assert.equal((await x.getTeam(1)).status,1n);
    await (await x.connect(b).setMembership(2,true)).wait();
    // An explicit gas limit avoids reusing a failed estimate for the same input.
    await (await x.connect(b).respondTeam(1,true,{gasLimit:200000})).wait();
    assert.equal(await x.member(2,await a.getAddress()),false);
    assert.equal((await x.getTeam(1)).status,2n);
  } finally {await f.close();}
});

test('demo retains the same departure boundary and bilateral publication rule',()=>{
  const [A,B,C]=PERSONAS.map(x=>x.address);
  for (const author of [A,B]) {
    let s=emptyState();
    const run=(who,action)=>{s=applyAction(s,who,action,1);};
    for(const who of [A,B])run(who,{type:'membership',circleId:2,joined:true});
    run(A,{type:'post',circleId:2,agentId:0,kind:1,title:'Task',body:'Body'});
    run(A,{type:'invite',postId:1,guest:B,hostAgentId:0,guestAgentId:0,title:'Team',hostRole:'Research',guestRole:'Review'});
    run(A,{type:'membership',circleId:2,joined:false});
    run(B,{type:'membership',circleId:2,joined:false});
    assert.throws(()=>run(B,{type:'respond',teamId:1,accept:true}),/Join this circle first/);
    run(B,{type:'membership',circleId:2,joined:true});
    run(B,{type:'respond',teamId:1,accept:true});
    run(B,{type:'membership',circleId:2,joined:false});
    assert.throws(()=>run(A,{type:'reply',postId:1,agentId:0,body:'No'}),/Join this circle first/);
    run(author,{type:'work',teamId:1,title:'Work',summary:'Summary',uri:'https://example.com'});
    assert.throws(()=>run(author,{type:'reviewWork',workId:1,approve:true}),/other member/);
    assert.throws(()=>run(C,{type:'reviewWork',workId:1,approve:true}),/member/);
    assert.equal(partners(s,A).length,0);
    run(author===A?B:A,{type:'reviewWork',workId:1,approve:true});
    assert.equal(partners(s,A)[0].count,1);
    assert.equal(partners(s,B)[0].count,1);
  }
});
