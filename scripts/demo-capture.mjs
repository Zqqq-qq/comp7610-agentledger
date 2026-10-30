#!/usr/bin/env node
// 演示素材采集：按场景加载真实链上数据、逐场景定格截图，供 ffmpeg 合成。
//
// 用法：
//   1) node scripts/serve.mjs            # 起 http://127.0.0.1:8091
//   2) node scripts/demo-capture.mjs     # 输出帧到 $DEMO_OUT（默认 ./demo-frames）
//   3) ffmpeg -y -framerate 2 -i demo-frames/f%05d.png -c:v libx264 \
//        -pix_fmt yuv420p -crf 20 -movflags +faststart demo-walkthrough.mp4
//
// 依赖：playwright-core 与系统 Chrome。playwright-core 可通过两种方式提供：
//   - 安装到项目：pnpm add -D playwright-core
//   - 或设置 PW_CORE 指向已有的 playwright-core 目录
//
// 环境变量（全部可选，默认即 Sepolia 共享部署）：
//   DEMO_APP DEMO_OUT DEMO_HOLD
//   DEMO_COMMUNITY DEMO_ESCROW DEMO_TOKEN DEMO_IDENTITY DEMO_REPUTATION DEMO_RPC
//   DEMO_POST_ID DEMO_WORK_ID DEMO_JOB_STATES（恰好三个订单，形如 "1=3;2=4;3=3"）
//
// 安全约定：
//   - 不删除任何已有目录。若 DEMO_OUT 已存在且非空，改用带时间戳的唯一子目录。
//   - 每个场景都必须断言「真实数据真的加载成功」后才写字幕与截帧；任一断言失败
//     立即以非零码退出，不生成声称成功的产物。
//
// 两个已知坑（已在实现里规避）：
//   1) 应用只在启动时读 localStorage，同 URL 的 goto 只做 hash 内跳转、不会重载，
//      因此每个场景必须「设 hash + reload()」，否则拿到的是 Demo sandbox 的假数据。
//   2) 托管页的任务卡片在页面下方，加载成功后要 scrollIntoView，否则截到的是顶部表单。

import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {parseJobStates,shortContract,jobCaption,liveReady,jobReady,workReady} from "./lib/demo-captions.mjs";

// ---------- 参数与路径（先校验，后做任何写入） ----------

function fatal(msg) {
  console.error(`\nFAIL: ${msg}\n`);
  process.exitCode = 1;
  throw new Error(msg);
}

const HOLD_RAW = process.env.DEMO_HOLD ?? "6";
const HOLD = Number(HOLD_RAW);
if (!Number.isInteger(HOLD) || HOLD < 1 || HOLD > 60) {
  console.error(`FAIL: DEMO_HOLD 必须是 1..60 的整数，收到 ${JSON.stringify(HOLD_RAW)}`);
  process.exit(1);
}

const env = (key, fallback) => (process.env[key] && process.env[key].trim()) || fallback;
const COMMUNITY = env("DEMO_COMMUNITY", "0x8CDc9987D46D140a982713B359286bC451262406");
const ESCROW = env("DEMO_ESCROW", "0x3C129b436247368dA71cC31512984c3DB17F1f63");
const TOKEN = env("DEMO_TOKEN", "0x6a920b13d6396B7b58BfE562c274Ea76a6409C85");
const IDENTITY = env("DEMO_IDENTITY", "0x13eA93eCdDeed63259792A39d7a4738a28b3E91d");
const REPUTATION = env("DEMO_REPUTATION", "0x213AEEd69B82DBaebB2800D3904CBb16f9443864");
const RPC = env("DEMO_RPC", "https://ethereum-sepolia.publicnode.com");
const APP = env("DEMO_APP", "http://127.0.0.1:8091");
const POST_ID = env("DEMO_POST_ID", "2");
const WORK_ID = env("DEMO_WORK_ID", "1");

for (const [name, value] of Object.entries({ COMMUNITY, ESCROW, TOKEN, IDENTITY, REPUTATION })) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) fatal(`${name} 不是合法地址：${value}`);
}

// Exactly three job observations, in the order configured by the caller.
let JOB_STATES;
try { JOB_STATES=parseJobStates(env("DEMO_JOB_STATES","1=3 · Completed;2=4 · Refunded;3=3 · Completed")); }
catch(error) { fatal(error.message); }
const JOB_IDS=[...JOB_STATES.keys()];
for(const [name,value] of Object.entries({DEMO_POST_ID:POST_ID,DEMO_WORK_ID:WORK_ID})) {
  if(!/^[1-9]\d*$/.test(value)||!Number.isSafeInteger(Number(value)))fatal(`${name} must be a positive safe integer`);
}

// 不删除任何已有目录：目标非空则改用唯一子目录
const baseOut = path.resolve(env("DEMO_OUT", "demo-frames"));
function uniqueDir(base) {
  if (!fs.existsSync(base)) return base;
  const entries = fs.readdirSync(base);
  if (entries.length === 0) return base;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
  for (let i = 0; i < 50; i++) {
    const candidate = `${base}-${stamp}${i ? `-${i}` : ""}`;
    if (!fs.existsSync(candidate)) return candidate;
  }
  fatal(`无法为 ${base} 找到可用的新目录名`);
}
const OUT = uniqueDir(baseOut);
if (OUT !== baseOut) console.error(`注意：${baseOut} 已存在且非空，本次输出改用 ${OUT}（不删除原目录）`);
fs.mkdirSync(OUT, { recursive: true });

// ---------- 浏览器 ----------

async function loadPlaywright() {
  if (process.env.PW_CORE) {
    const entry = path.join(process.env.PW_CORE, "index.mjs");
    return (await import(pathToFileURL(entry).href)).chromium;
  }
  return (await import("playwright-core")).chromium;
}

const chromium = await loadPlaywright();
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await context.newPage();

let frames = 0;
let currentStep = "启动";
const capturedScenes=[];

async function caption(text,observation={}) {
  capturedScenes.push({startFrame:frames,caption:text,...observation});
  await page.evaluate((t) => {
    let el = document.getElementById("demo-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "demo-caption";
      el.style.cssText = [
        "position:fixed", "left:0", "right:0", "bottom:0", "z-index:2147483647",
        "padding:14px 22px", "font:600 17px/1.45 ui-sans-serif,system-ui,'Segoe UI',sans-serif",
        "color:#fff", "background:rgba(18,32,26,.88)", "letter-spacing:.2px",
        "box-shadow:0 -6px 24px rgba(0,0,0,.18)",
      ].join(";");
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
}

async function hold(n = HOLD) {
  for (let i = 0; i < n; i++) {
    await page.screenshot({ path: path.join(OUT, `f${String(frames).padStart(5, "0")}.png`) });
    frames++;
    await page.waitForTimeout(140);
  }
}

// 断言式等待：超时即失败，绝不"等到时间就继续"
async function mustWait(fn, arg, message, timeout = 25000) {
  try {
    await page.waitForFunction(fn, arg, { timeout, polling: 250 });
  } catch {
    fatal(`${currentStep}：${message}`);
  }
}

async function scene(hash, settle = 1200) {
  await page.evaluate((h) => { location.hash = h; }, hash);
  await page.waitForTimeout(250);
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(settle);
}

async function loadJob(id) {
  const expect = JOB_STATES.get(Number(id));
  if (!expect) fatal(`没有为 job ${id} 配置期望状态（DEMO_JOB_STATES）`);

  await page.evaluate((n) => {
    const f = document.getElementById("lookupJobId");
    if (!f) return;
    f.value = String(n);
    document.getElementById("lookupJobForm")?.requestSubmit();
  }, id);

  // The old card can have the same status: both ID and state must match.
  await mustWait(jobReady,{id,want:expect,escrow:ESCROW},
    `job ${id} 查询未成功或编号/状态不是「${id} / ${expect}」`,40000);
  const observed=await page.evaluate(()=>({
    title:document.getElementById("loadedJobTitle").textContent.trim(),
    state:document.getElementById("loadedJobState").textContent.trim(),
  }));

  // 只做滚动，不再强行把 hidden 置为 false
  await page.evaluate(() => {
    document.getElementById("loadedJob")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(600);
  return observed;
}

// Use mode, full configured address and confirmed data; banner wording is cosmetic.
async function assertLive() {
  await mustWait(liveReady,{community:COMMUNITY},
    `页面未以 ${COMMUNITY} 进入 live 模式并加载确认区块`,30000);
}

try {
  // 写入配置：社区地址 + 链上模式 + 托管地址
  currentStep = "写入本地配置";
  await page.goto(APP + "/#community", { waitUntil: "load" });
  await page.evaluate(({ c, e, t, i, r, rpc }) => {
    localStorage.setItem("agentledger-community-config", JSON.stringify({ address: c }));
    localStorage.setItem("agentledger-social-mode", JSON.stringify("live"));
    localStorage.setItem("agent-ledger.sepolia.v1", JSON.stringify({ identity: i, reputation: r, rpcUrl: rpc, escrow: e, token: t }));
  }, { c: COMMUNITY, e: ESCROW, t: TOKEN, i: IDENTITY, r: REPUTATION, rpc: RPC });

  // 1) 社区动态
  currentStep = "场景 1/7 社区动态";
  await scene("community", 1500);
  await assertLive();
  await mustWait((id) => {
    const b = [...document.querySelectorAll('button[data-social="thread"]')].find((x) => x.dataset.id === id);
    return !!b;
  }, POST_ID, `找不到帖子 #${POST_ID} 的入口——可能链上没有该帖子或读取失败`);
  await caption(`1/7  Community feed · live Sepolia data · ${shortContract(COMMUNITY)}`,{community:COMMUNITY});
  await hold();

  // 2) 帖子详情
  currentStep = "场景 2/7 帖子详情";
  await page.evaluate((id) => {
    [...document.querySelectorAll('button[data-social="thread"]')].find((x) => x.dataset.id === id)?.click();
  }, POST_ID);
  await mustWait((id) => {
    const d = document.getElementById("socialDialog");
    if (!d || !d.open) return false;
    const h2 = d.querySelector("h2");
    return !!h2 && h2.textContent.trim().length > 0;
  }, POST_ID, "帖子详情弹窗未打开或标题为空");
  await caption(`2/7  Post #${POST_ID} · text and replies from live Sepolia records`,{postId:POST_ID});
  await hold();
  await page.evaluate(() => document.querySelector('#socialDialog button[data-social="close"]')?.click());

  // 3) 共同作品
  currentStep = "场景 3/7 Shared works";
  await scene("works", 1500);
  await assertLive();
  await mustWait(workReady, WORK_ID, `找不到作品 #${WORK_ID} 的入口或封面`);
  await caption(`3/7  Shared works · Work #${WORK_ID} · jointly confirmed`,{workId:WORK_ID});
  await hold();

  // 4) 作品详情
  currentStep = "场景 4/7 作品详情";
  await page.evaluate((id) => {
    [...document.querySelectorAll('button[data-social="work"]')].find((x) => x.dataset.id === id)?.click();
  }, WORK_ID);
  await mustWait(() => {
    const d = document.getElementById("socialDialog");
    if (!d || !d.open) return false;
    const h2 = d.querySelector("h2");
    return !!h2 && h2.textContent.trim().length > 0;
  }, null, "作品详情弹窗未打开或标题为空");
  await caption(`4/7  Work #${WORK_ID} · contributor roles and confirmation state`,{workId:WORK_ID});
  await hold();
  await page.evaluate(() => document.querySelector('#socialDialog button[data-social="close"]')?.click());

  // 5) First configured escrow job
  currentStep = `场景 5/7 托管 Job ${JOB_IDS[0]}`;
  await scene("jobs", 1500);
  await mustWait(() => {
    const f = document.getElementById("lookupJobId");
    return !!f && !!document.getElementById("lookupJobForm");
  }, null, "托管页没有订单查询表单——可能托管配置未生效");
  const first=await loadJob(JOB_IDS[0]);
  await caption(jobCaption(5,ESCROW,JOB_IDS[0],JOB_STATES.get(JOB_IDS[0]),first),{escrow:ESCROW,jobId:JOB_IDS[0],observed:first});
  await hold();

  // 6) Each remaining job gets its own freshly verified caption.
  for(const id of JOB_IDS.slice(1)) {
    currentStep=`场景 6/7 托管 Job ${id}`;
    const observed=await loadJob(id);
    await caption(jobCaption(6,ESCROW,id,JOB_STATES.get(id),observed),{escrow:ESCROW,jobId:id,observed});
    await hold();
  }

  // 7) 圈子
  currentStep = "场景 7/7 圈子";
  await scene("circles", 1200);
  await assertLive();
  await mustWait(() => document.querySelectorAll(".circle-card").length >= 3, null, "圈子卡片少于 3 个——读取失败");
  await caption(`7/7  Interest circles · public Sepolia read · ${shortContract(COMMUNITY)}`,{community:COMMUNITY});
  await hold(8);

  // 收尾卡
  await page.evaluate(() => {
    document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font:600 30px/1.5 ui-sans-serif,system-ui;color:#12201a;background:#f6f4ee;text-align:center;flex-direction:column;gap:14px"><div>Agent Ledger</div><div style="font-size:17px;font-weight:400;color:#5b6b62">Sepolia community · end of demonstration</div></div>`;
  });
  await hold(8);

  await browser.close();
  fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ frames, holdsPerScene: HOLD, community: COMMUNITY, escrow: ESCROW, postId:POST_ID, workId:WORK_ID, jobIds:JOB_IDS, jobStates: Object.fromEntries(JOB_STATES), scenes:capturedScenes }, null, 2));
  console.log(`captured ${frames} frames -> ${OUT}`);
} catch (error) {
  try { await browser.close(); } catch {}
  if (!process.exitCode) {
    console.error(`\nFAIL: ${currentStep}：${error.message}\n`);
    process.exitCode = 1;
  }
  console.error("已中止；未生成 meta.json，请勿把本次产物当作成功演示。");
}
