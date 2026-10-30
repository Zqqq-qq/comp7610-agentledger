import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {buildCard,parseCard,cardFetchUrl,skillList,priceValue,hirePrefill,CARD_SCHEMA} from '../web/agent-card.js';
import {marketView,skillCloud} from '../web/market.js';
import {seedState,agentCollaboration,applyAction,PERSONAS} from '../web/social-core.js';
import {encodePayment,decodePayment,X402_SCHEME} from '../web/x402.js';

const input={name:' Lingua ',description:'Translation agent',endpoint:'https://agent.example.com',skills:'Translation, research, translation',price:'1.5',submitMinutes:'30',reviewWindowSeconds:'600'};
test('agent card generator normalises fields and rejects unsafe or malformed values',()=>{
  const card=buildCard(input);
  assert.equal(card.schemaVersion,CARD_SCHEMA);assert.equal(card.name,'Lingua');assert.equal(card.service.endpoint,'https://agent.example.com/');
  assert.deepEqual(card.skills,['translation','research']);assert.deepEqual(card.pricing,{amount:'1.5',token:'mUSD',decimals:6,unit:'job'});
  assert.deepEqual(card.payment.escrow,{submitMinutes:30,reviewWindowSeconds:600});assert.equal(card.payment.x402,undefined);
  assert.equal(buildCard({...input,x402:'https://agent.example.com/x402/run'}).payment.x402.amount,'1.5');
  for(const patch of [{name:''},{endpoint:'javascript:alert(1)'},{endpoint:'https://u:p@agent.example.com'},{endpoint:'ipfs://x'},{price:'0'},{price:'1.0000001'},{price:'-1'},{submitMinutes:'1'},{skills:'<script>'},{x402:'data:text/html,x'},{reviewWindowSeconds:'0'}])
    assert.throws(()=>buildCard({...input,...patch}),JSON.stringify(patch));
  assert.throws(()=>skillList(Array.from({length:13},(_,i)=>'s'+i)),/at most 12/);
  assert.equal(priceValue('',{optional:true}),'');
});
test('card parser round-trips v1, accepts the legacy example and drops invalid fields instead of rendering them',async()=>{
  const v1=parseCard(JSON.stringify(buildCard({...input,x402:'https://agent.example.com/x402/run'})));
  assert.equal(v1.schema,CARD_SCHEMA);assert.equal(v1.price,'1.5');assert.equal(v1.submitMinutes,30);assert.equal(v1.reviewWindowSeconds,600);assert.equal(v1.x402,'https://agent.example.com/x402/run');
  const example=parseCard(await fs.readFile('web/.well-known/agent-card.json','utf8'));
  assert.equal(example.schema,CARD_SCHEMA);assert.ok(example.endpoint.startsWith('http://127.0.0.1:8092/'));
  const legacy=parseCard({name:'COMP7610 Agent',description:'Demo',url:'http://127.0.0.1:8090/x',capabilities:['demo-service']});
  assert.equal(legacy.schema,'legacy');assert.deepEqual(legacy.skills,['demo-service']);assert.equal(legacy.price,'');
  const hostile=parseCard({schemaVersion:CARD_SCHEMA,name:'x'.repeat(200),service:{endpoint:'javascript:alert(1)'},skills:['<img src=x>'],pricing:{amount:'1',token:'ETH'},payment:{x402:{endpoint:'data:,x'}}});
  assert.deepEqual([hostile.name,hostile.endpoint,hostile.skills,hostile.price,hostile.x402],['','',[],'','']);
  for(const bad of ['[]','not json','null','x'.repeat(70000)])assert.throws(()=>parseCard(bad));
  assert.deepEqual(hirePrefill({id:3n,owner:'0xabc'},null),{provider:'0xabc',providerAgentId:'3',amount:'1',minutes:'60',reviewWindow:'600'});
});
test('card URIs map to fetchable URLs; IPFS goes through a gateway; other schemes are not fetched',()=>{
  assert.equal(cardFetchUrl('https://a.example/card.json'),'https://a.example/card.json');
  assert.equal(cardFetchUrl('ipfs://bafyexample/card.json'),'https://ipfs.io/ipfs/bafyexample/card.json');
  for(const v of ['javascript:alert(1)','data:application/json,{}','https://u:p@a.example/','ipfs://','nope'])assert.equal(cardFetchUrl(v),null,v);
});

const agent=(id,count,average,card)=>({id:BigInt(id),owner:'0x'+String(id).repeat(40).slice(0,40),uri:`https://a${id}.example/card.json`,count:BigInt(count),total:BigInt(count*average),average:BigInt(average),card});
const agents=[agent(1,0,0,null),agent(2,4,80,{name:'Atlas',skills:['research'],price:'2'}),agent(3,10,80,{name:'Lingua',skills:['translation','research'],price:'0.5'}),agent(4,1,95,{name:'Coder',skills:['code'],price:''})];
test('market sorts by score, review count, price and newest; unrated agents never outrank rated ones',()=>{
  const ids=o=>marketView(agents,o).map(a=>Number(a.id));
  assert.deepEqual(ids({sort:'newest'}),[4,3,2,1]);
  assert.deepEqual(ids({sort:'score'}),[4,3,2,1]);
  assert.deepEqual(ids({sort:'reviews'}),[3,2,4,1]);
  assert.deepEqual(ids({sort:'price'}),[3,2,1,4]);
  assert.deepEqual(ids({sort:'unknown'}),[4,3,2,1]);
});
test('market filters by minimum score, reviews, skill, owner and card text',()=>{
  const ids=o=>marketView(agents,o).map(a=>Number(a.id));
  assert.deepEqual(ids({minScore:90}),[4]);assert.deepEqual(ids({minScore:50,sort:'reviews'}),[3,2,4]);
  assert.deepEqual(ids({minReviews:2}),[3,2]);
  assert.deepEqual(ids({skill:'RESEARCH',sort:'score'}),[3,2]);assert.deepEqual(ids({skill:'trans'}),[3]);
  assert.deepEqual(ids({query:'lingua'}),[3]);assert.deepEqual(ids({query:'a2.example'}),[2]);
  assert.deepEqual(ids({owner:agents[1].owner.toUpperCase().replace('0X','0x')}),[2]);
  assert.deepEqual(skillCloud(agents),[{skill:'research',count:2},{skill:'code',count:1},{skill:'translation',count:1}]);
  assert.equal(agents[0].card,null);
});
test('community evidence counts teams bound to an Agent ID and only works the other member confirmed',()=>{
  let s=seedState();
  assert.deepEqual(agentCollaboration(s,1).works.map(w=>w.id),[1]);assert.equal(agentCollaboration(s,1).partners,1);
  assert.equal(agentCollaboration(s,2).teams.length,1);assert.deepEqual(agentCollaboration(s,0),{teams:[],works:[],partners:0});
  const [alex,maya]=PERSONAS.map(p=>p.address);
  s=applyAction(s,maya,{type:'work',teamId:1,title:'Draft',summary:'Pending',uri:'https://example.com/d'});
  assert.equal(agentCollaboration(s,2).works.length,1,'a proposed work is not evidence until confirmed');
  s=applyAction(s,alex,{type:'reviewWork',workId:2,approve:true});
  assert.equal(agentCollaboration(s,2).works.length,2);assert.equal(agentCollaboration(s,99).teams.length,0);
});
test('x402 payment header round-trips and rejects other schemes or malformed hashes',()=>{
  const hash='0x'+'ab'.repeat(32),req={scheme:X402_SCHEME,network:'eip155:11155111'};
  assert.deepEqual(decodePayment(encodePayment(hash,req)),{network:'eip155:11155111',transaction:hash});
  for(const bad of ['',btoa('{}'),btoa(JSON.stringify({x402Version:1,scheme:'exact',payload:{transaction:hash}})),encodePayment('0x12',req)])assert.throws(()=>decodePayment(bad));
});
