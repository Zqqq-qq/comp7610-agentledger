import fs from 'node:fs/promises';
await fs.mkdir('tmp/insights',{recursive:true});
import {findChrome} from '../../scripts/lib/chrome-path.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import {seedState,PERSONAS} from '../../web/social-core.js';
import assert from 'node:assert/strict';
const s=seedState(),[a,b,c]=PERSONAS.map(x=>x.address);
s.teams.push({id:2,postId:1,host:a,guest:b,status:1,createdAt:1793062900,title:'New invitation',hostRole:'Research',guestRole:'Review'});
s.works.push({id:2,teamId:1,author:a,status:1,createdAt:1793063000,title:'Pending output',summary:'Review this result',uri:'https://example.com'});
s.replies.push({id:9,postId:2,author:b,agentId:2,body:'A new reply',createdAt:1793063100});
const browser=await chromium.launch({executablePath:findChrome(),headless:true});
try{
 for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:950}});await context.route('https://**/*',r=>r.abort());
 const errors=[];const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({s,b})=>{localStorage.setItem('agentledger-social-mode','demo');localStorage.setItem('agentledger-social-persona',JSON.stringify(b));localStorage.setItem('agentledger-social-demo-v2',JSON.stringify(s));},{s,b});
 await page.goto((process.env.SOCIAL_TEST_URL||'http://127.0.0.1:8097/')+'#portfolio');await page.locator('#view-portfolio h1').waitFor();
 assert.match(await page.locator('#view-portfolio').innerText(),/jointly confirmed works loaded/);
 assert.match(await page.locator('#view-portfolio').innerText(),/Demo community data has no verified escrow orders/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`portfolio overflow ${width}`);
 await page.screenshot({path:`tmp/insights/portfolio-${width}.png`,fullPage:true});
 await page.goto((process.env.SOCIAL_TEST_URL||'http://127.0.0.1:8097/')+'#activity');await page.waitForFunction(()=>!document.querySelector('#view-activity').hidden && document.querySelector('#demoPersona')?.value==='0x2222222222222222222222222222222222222222');
 assert.match(await page.locator('#view-activity').innerText(),/New invitation/);assert.match(await page.locator('#view-activity').innerText(),/Pending output/);await page.screenshot({path:`tmp/insights/activity-pending-${width}.png`,fullPage:true});
 await page.locator('#view-activity [data-social="work"]').click();await page.locator('#socialDialog[open]').waitFor();assert.match(await page.locator('#socialDialog').innerText(),/Pending output/);await page.locator('#socialDialog [data-social="close"]').click();
 await page.locator('#view-activity [data-social="team"]').click();assert.match(await page.locator('#socialDialog').innerText(),/New invitation/);await page.locator('#socialDialog [data-social="close"]').click();
 await page.locator('#demoPersona').selectOption(a);await page.waitForFunction(()=>!document.querySelector('#view-activity').innerText.includes('New invitation'));assert.doesNotMatch(await page.locator('#view-activity').innerText(),/New invitation|Pending output/);assert.match(await page.locator('#view-activity').innerText(),/Reply to your post/);
 await page.locator('#view-activity [data-social="thread"]').first().click();assert.match(await page.locator('#socialDialog').innerText(),/A new reply/);await page.locator('#socialDialog [data-social="close"]').click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`activity overflow ${width}`);
 await page.screenshot({path:`tmp/insights/activity-${width}.png`,fullPage:true});assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS: demo portfolio/activity, persona switch, source actions and no overflow at 1440/390px. Synthetic fixture, no Sepolia transactions.');
}finally{await browser.close();}
