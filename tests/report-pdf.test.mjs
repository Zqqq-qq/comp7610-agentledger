import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {findChrome} from '../scripts/lib/chrome-path.mjs';
const available=(...files)=>p=>files.includes(p);
test('explicit CHROME_BIN wins over installed defaults and rejects invalid overrides',()=>{
  const file='/custom folder/Chrome';
  assert.equal(findChrome({platform:'darwin',env:{CHROME_BIN:file},executable:available(file,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')}),file);
  assert.throws(()=>findChrome({platform:'darwin',env:{CHROME_BIN:'/missing'},executable:available('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')}),/CHROME_BIN/);
  assert.equal(findChrome({platform:'linux',env:{CHROME_BIN:'my-chrome',PATH:'/tools:/bin'},executable:available('/tools/my-chrome')}),'/tools/my-chrome');
});
test('macOS detects system and per-user Chrome apps',()=>{
  const system='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',user='/Users/Fixture/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  assert.equal(findChrome({platform:'darwin',env:{},home:'/Users/Fixture',executable:available(system,user)}),system);
  assert.equal(findChrome({platform:'darwin',env:{},home:'/Users/Fixture',executable:available(user)}),user);
});
test('Windows detects custom Program Files and per-user installs, including paths with spaces',()=>{
  const file='D:\\Apps\\Google\\Chrome\\Application\\chrome.exe',user='C:\\Users\\A B\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
  assert.equal(findChrome({platform:'win32',env:{ProgramFiles:'D:\\Apps'},executable:available(file)}),file);
  assert.equal(findChrome({platform:'win32',env:{LOCALAPPDATA:'C:\\Users\\A B\\AppData\\Local'},executable:available(user)}),user);
  assert.equal(findChrome({platform:'win32',env:{CHROME_BIN:'chrome',PATH:'D:\\Tools;C:\\bin'},executable:available('D:\\Tools\\chrome.exe')}),'D:\\Tools\\chrome.exe');
});
test('Linux searches PATH for Chrome/Chromium and gives an actionable missing-browser error',()=>{
  assert.equal(findChrome({platform:'linux',env:{PATH:'/tools:/usr/bin'},executable:available('/usr/bin/chromium')}),'/usr/bin/chromium');
  assert.throws(()=>findChrome({platform:'linux',env:{},executable:()=>false}),/CHROME_BIN/);
});
test('CLI encodes local URLs, resolves source images and preserves old PDF when renderer produces no output',{skip:process.platform==='win32'},t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'report pdf #'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const source=path.join(root,'source #'),out=path.join(root,'output #');fs.mkdirSync(source);fs.mkdirSync(out);
  const md=path.join(source,'report.md'),pdf=path.join(out,'report.pdf'),log=path.join(root,'args.json'),fake=path.join(root,'fake chrome');
  fs.writeFileSync(md,'# Portable report\n\n![Figure](figure.svg)\n');
  fs.writeFileSync(fake,`#!${process.execPath}\nconst fs=require('node:fs');fs.writeFileSync(process.env.ARGS_LOG,JSON.stringify(process.argv.slice(2)));if(!process.env.NO_OUTPUT){const arg=process.argv.find(x=>x.startsWith('--print-to-pdf='));fs.writeFileSync(arg.slice(15),'%PDF-1.7\\nfixture\\n');}\n`);fs.chmodSync(fake,0o755);
  const run=patch=>spawnSync(process.execPath,[fileURLToPath(new URL('../scripts/report-pdf.mjs',import.meta.url)),md,pdf],{env:{...process.env,CHROME_BIN:fake,ARGS_LOG:log,...patch},encoding:'utf8'});
  let result=run({});assert.equal(result.status,0,result.stderr);const first=fs.readFileSync(pdf);
  const args=JSON.parse(fs.readFileSync(log));assert(args.includes(pathToFileURL(path.join(out,'report.html')).href));assert(args.some(x=>x.startsWith('--user-data-dir=')));
  assert(fs.readFileSync(path.join(out,'report.html'),'utf8').includes(`<base href="${pathToFileURL(source+path.sep).href}">`));
  result=run({NO_OUTPUT:'1'});assert.notEqual(result.status,0);assert.deepEqual(fs.readFileSync(pdf),first);
  result=run({CHROME_BIN:path.join(root,'missing')});assert.notEqual(result.status,0);assert.match(result.stderr,/CHROME_BIN/);assert.deepEqual(fs.readFileSync(pdf),first);
  const invalid=path.join(out,'report.txt');
  result=spawnSync(process.execPath,[fileURLToPath(new URL('../scripts/report-pdf.mjs',import.meta.url)),md,invalid],{encoding:'utf8'});
  assert.notEqual(result.status,0);assert.match(result.stderr,/must end in .pdf/);assert(!fs.existsSync(invalid));
  assert.deepEqual(fs.readdirSync(out).sort(),['report.html','report.pdf']);
});
