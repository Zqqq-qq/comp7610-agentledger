// Reproducible screen recording of the two account-scoped social views added in #67.
// Demo sandbox only: seeds a pending invitation, accepts it, proposes/confirms a work and
// walks the portfolio at 1280x800. No wallet, Sepolia transaction or real AI output.
// Usage: node tests/browser/social-insights-recording.mjs
//   PLAYWRIGHT_MODULE=/abs/path/to/playwright/index.mjs  (when Playwright is not local)
//   SOCIAL_TEST_URL=http://127.0.0.1:8097/  (serve with: PORT=8097 node scripts/serve.mjs)
//   DEMO_OUT=tmp/social-insights-recording
import fs from 'node:fs';
import path from 'node:path';
import {findChrome} from '../../scripts/lib/chrome-path.mjs';
import {emptyState,applyAction,PERSONAS} from '../../web/social-core.js';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(process.env.DEMO_OUT||'tmp/social-insights-recording');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const [A,B]=PERSONAS.map(p=>p.address);
let s=emptyState();const t=Math.floor(Date.now()/1000)-3600;
s=applyAction(s,A,{type:'membership',circleId:2,joined:true},t);
s=applyAction(s,B,{type:'membership',circleId:2,joined:true},t+1);
s=applyAction(s,A,{type:'post',circleId:2,agentId:1,kind:1,title:'Analysis visualisation partner',body:'I am looking for a partner to turn a small public dataset into a clear chart. I will handle the analysis and source checks; you handle the visual design and an accessible reading of the result.'},t+10);
s=applyAction(s,A,{type:'invite',postId:1,guest:B,hostAgentId:1,guestAgentId:2,title:'Analysis visualisation partner',hostRole:'Data analysis, source checks and methodology',guestRole:'Visualisation, chart design and accessibility review'},t+20);

const browser=await chromium.launch({executablePath:findChrome(),headless:true,args:['--force-device-scale-factor=1']});
const context=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir:out,size:{width:1280,height:800}}});
await context.addInitScript(({state,persona})=>{
  localStorage.setItem('agentledger-social-mode',JSON.stringify('demo'));
  localStorage.setItem('agentledger-social-persona',JSON.stringify(persona));
  localStorage.setItem('agentledger-social-demo-v2',JSON.stringify(state));
},{state:s,persona:B});
const page=await context.newPage();
const t0=Date.now();const mark=name=>console.log(`MARK ${name} ${((Date.now()-t0)/1000).toFixed(2)}`);
await page.goto((process.env.SOCIAL_TEST_URL||'http://127.0.0.1:8097/')+'#activity',{waitUntil:'networkidle'});
await page.locator('#view-activity h1').waitFor();
await page.waitForTimeout(1800);mark('seg1_start');
await page.waitForTimeout(1800);
await page.locator('#view-activity [data-social="team"]').first().click();
await page.waitForTimeout(2200);mark('seg1_details');
await page.locator('#socialDialog button[data-social="accept"]').click();
await page.waitForTimeout(3000);mark('seg1_end');

await page.locator('#socialDialog button[data-social="work-form"]').click();
await page.waitForTimeout(900);mark('seg2_start');
await page.locator('form[data-form="work"] input[name="title"]').fill('');
await page.locator('form[data-form="work"] input[name="title"]').pressSequentially('Analysis chart draft',{delay:35});
await page.locator('form[data-form="work"] textarea[name="summary"]').pressSequentially('Alex checked the public source and the analysis notes; Maya turned them into a chart and an accessible caption. This is a labelled example, not a real AI-generated deliverable.',{delay:6});
await page.locator('form[data-form="work"] input[name="uri"]').pressSequentially('https://example.com/analysis-chart-draft',{delay:18});
await page.waitForTimeout(1200);
await page.locator('form[data-form="work"] button[type="submit"]').click();
await page.waitForTimeout(2000);mark('seg2_proposed');
await page.selectOption('#demoPersona',A);
await page.waitForTimeout(2200);mark('seg2_alex_activity');
await page.locator('#view-activity [data-social="work"]').first().click();
await page.waitForTimeout(2200);
await page.locator('#socialDialog button[data-social="work-approve"]').click();
await page.waitForTimeout(4800);mark('seg2_end');

await page.locator('#socialDialog button[data-social="close"]').click();
await page.waitForTimeout(500);
await page.locator('a[href="#portfolio"]').first().click();
await page.waitForTimeout(3500);mark('seg3_start');
await page.locator('#view-portfolio [data-social="thread"]').first().click();
await page.waitForTimeout(2200);
await page.locator('#socialDialog button[data-social="close"]').click();
await page.waitForTimeout(3200);mark('seg3_end');

const video=page.video();await context.close();await browser.close();
console.log('VIDEO '+await video.path());
