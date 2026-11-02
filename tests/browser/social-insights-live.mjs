import {findChrome} from '../../scripts/lib/chrome-path.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {seedState,PERSONAS} from '../../web/social-core.js';
const [a,b,c]=PERSONAS.map(x=>x.address),s=seedState();s.block=12345;s.people=[a,b,c];s.counts={members:[3,3,3]};
const browser=await chromium.launch({executablePath:findChrome(),headless:true});
const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await context.route('https://**/*',r=>r.abort());
 await context.route('**/app.js',r=>r.fulfill({contentType:'text/javascript',body:`export const ledger=window.fixtureLedger;const route=()=>document.querySelectorAll('.view').forEach(x=>x.hidden=x.id!=='view-'+location.hash.slice(1));window.addEventListener('hashchange',route);route();`}));
 await context.route('**/social-chain.js',r=>r.fulfill({contentType:'text/javascript',body:`export const loadCommunity=async()=>window.fixtureState;export const reader=async()=>({c:{},p:{destroy(){window.destroyed=(window.destroyed||0)+1}}});export const sendCommunity=()=>{throw Error('No writes permitted')};export const deployCommunity=sendCommunity;`}));
 let links=await fs.readFile('web/escrow-links.js','utf8');links=links.replace('export async function readLinks(', 'async function actualReadLinks(')+`\nexport const readLinks=async()=>new Promise((resolve,reject)=>{window.scan={resolve,reject}});`;
 await context.route('**/escrow-links.js',r=>r.fulfill({contentType:'text/javascript',body:links}));
 await page.addInitScript(({s,a,b})=>{window.fixtureState=s;window.fixtureLedger={account:a,config:{identity:a,escrow:b,token:a,rpcUrl:'https://example.invalid'},busy:false,toast(){},setBusy(){}};localStorage.setItem('agentledger-social-mode',JSON.stringify('live'));localStorage.setItem('agentledger-community-config',JSON.stringify({address:a}));window.addEventListener('ledger-escrow-source',e=>window.openedSource=e.detail);},{s,a,b});
 await page.goto((process.env.SOCIAL_TEST_URL||'http://127.0.0.1:8097/')+'#portfolio');await page.getByText('Order references have not been verified',{exact:false}).waitFor();
 await page.locator('[data-social="verify-portfolio-orders"]').click();await page.waitForFunction(()=>!!window.scan);
 // Change wallet while scan A is pending. Completing A afterwards must not publish it for C.
 await page.evaluate(c=>{window.fixtureLedger.account=c;window.dispatchEvent(new Event('ledger-account-changed'));},c);
 await page.getByText('Order references have not been verified',{exact:false}).waitFor();
 const record={link:{escrow:b,jobId:'5',teamId:'1',postId:'1'},job:{client:a,provider:b,status:3}};
 await page.evaluate(record=>window.scan.resolve({records:[record],block:999}),record);
 await page.waitForFunction(()=>window.destroyed===1);assert.doesNotMatch(await page.locator('#view-portfolio').innerText(),/Order #5/);
 await page.evaluate(a=>{window.fixtureLedger.account=a;window.dispatchEvent(new Event('ledger-account-changed'));},a);
 await page.locator('[data-social="verify-portfolio-orders"]').click();await page.waitForFunction(()=>window.scan);await page.evaluate(()=>window.scan.reject(new Error('RPC offline')));
 await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/RPC offline/);assert.doesNotMatch(await page.locator('#view-portfolio').innerText(),/No valid linked orders/);
 await page.locator('[data-social="verify-portfolio-orders"]').click();await page.waitForFunction(()=>!document.querySelector('[role="alert"]'));await page.evaluate(record=>window.scan.resolve({records:[record],block:12346}),record);
 await page.getByText('Order #5 · Completed',{exact:true}).waitFor();assert.match(await page.locator('#view-portfolio').innerText(),/Order snapshot at block 12346/);assert.match(await page.locator('#view-portfolio').innerText(),/Completed alone does not identify/);
 await page.locator('[data-social="team-escrow"]').click();await page.waitForFunction(()=>window.openedSource?.teamId===1);
 assert.deepEqual(errors,[]);console.log('PASS: simulated live scan, stale account result discarded, RPC error distinct from empty, retry, status and source event. No RPC/wallet transactions.');
}finally{await browser.close();}
