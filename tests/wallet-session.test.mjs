import test from 'node:test';import assert from 'node:assert/strict';import {createWalletSession} from '../web/wallet-session.js';
const A='0x'+'11'.repeat(20),B='0x'+'22'.repeat(20);
test('latest account wins when old chain response arrives after a new selection',async()=>{
 const pending=[];const session=createWalletSession({getEthereum:()=>({request:()=>new Promise(resolve=>pending.push(resolve))}),createProvider:()=>({})});
 const old=session.load([A,B],A),next=session.load([A,B],B);
 pending[1]('0xaa36a7');assert.equal((await next).account,B);
 pending[0]('0x1');assert.equal(await old,null);
});
test('disconnect invalidates an in-flight account load and removes stale write identity',async()=>{
 let finish;const session=createWalletSession({getEthereum:()=>({request:()=>new Promise(resolve=>finish=resolve)}),createProvider:()=>({})});
 const old=session.load([A],A);const disconnected=await session.load([]);assert.equal(disconnected.account,'');assert.equal(disconnected.walletProvider,null);
 finish('0xaa36a7');assert.equal(await old,null);
});
test('RPC failure clears permissions, then a subsequent load recovers the selected account',async()=>{
 let fail=true;const ethereum={request:async()=>{if(fail)throw new Error('RPC unavailable');return '0xaa36a7';}};
 const session=createWalletSession({getEthereum:()=>ethereum,createProvider:()=>({})});
 const broken=await session.load([A,B],B);assert.equal(broken.account,'');assert.match(broken.error.message,/RPC/);
 fail=false;const recovered=await session.load([A,B],B);assert.equal(recovered.account,B);assert.equal(recovered.walletChain,11155111);
});
test('network reload re-reads accounts; removed preferred account and malformed lists are safe',async()=>{
 const requests=[];const ethereum={request:async({method})=>{requests.push(method);return method==='eth_accounts'?[A]:'0x1';}};
 const session=createWalletSession({getEthereum:()=>ethereum,createProvider:()=>({})});
 const next=await session.load(null,B);assert.equal(next.account,A);assert.equal(next.walletChain,1);assert.deepEqual(requests,['eth_accounts','eth_chainId']);
 assert.equal((await session.load(['bad','0x'+'00'.repeat(20)])).account,'');
});
