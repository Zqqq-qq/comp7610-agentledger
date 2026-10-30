import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Injectable filesystem/platform inputs let CI cover detection on all three OSes.
export function findChrome({platform=process.platform, env=process.env, home=os.homedir(), executable}={}) {
  const paths=platform==='win32'?path.win32:path.posix;
  const usable=executable||((file)=>{
    try { if(!fs.statSync(file).isFile())return false; fs.accessSync(file,platform==='win32'?fs.constants.F_OK:fs.constants.X_OK); return true; }
    catch { return false; }
  });
  const onPath=name=>{
    const names=platform==='win32'&&!paths.extname(name)?[name+'.exe',name]:[name];
    for(const dir of (env.PATH||env.Path||'').split(paths.delimiter).filter(Boolean)) {
      for(const n of names) { const file=paths.join(dir,n); if(usable(file))return file; }
    }
  };
  const override=env.CHROME_BIN?.trim();
  if(override) {
    const file=paths.isAbsolute(override)||/[\\/]/.test(override)?override:onPath(override);
    if(file&&usable(file))return file;
    throw new Error(`CHROME_BIN is not an executable file or a command on PATH: ${override}`);
  }
  let candidates=[];
  if(platform==='darwin') candidates=[
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    paths.join(home,'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];
  if(platform==='win32') candidates=[
    paths.join(env.ProgramFiles||'C:\\Program Files','Google/Chrome/Application/chrome.exe'),
    paths.join(env['ProgramFiles(x86)']||'C:\\Program Files (x86)','Google/Chrome/Application/chrome.exe'),
    ...(env.LOCALAPPDATA?[paths.join(env.LOCALAPPDATA,'Google/Chrome/Application/chrome.exe')]:[]),
  ];
  for(const file of candidates)if(usable(file))return file;
  for(const name of platform==='win32'?['chrome.exe','chromium.exe']:['google-chrome','google-chrome-stable','chromium','chromium-browser']) {
    const file=onPath(name);if(file)return file;
  }
  throw new Error('Chrome/Chromium was not found. Install it or set CHROME_BIN to its executable path.');
}
