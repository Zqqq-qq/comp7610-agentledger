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
//   DEMO_POST_ID DEMO_WORK_ID DEMO_JOB_STATES（形如 "1=3 · Completed;2=4 · Refunded"）
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

// 期望的订单状态，可在场景中覆盖；默认对应本仓库已完成的验收数据
function parseJobStates(raw) {
  const out = new Map();
  for (const part of raw.split(";")) {
    const [id, ...rest] = part.split("=");
    if (!id || rest.length === 0) continue;
    out.set(Number(id.trim()), rest.join("=").trim());
  }
  return out;
}
const JOB_STATES = parseJobStates(env("DEMO_JOB_STATES", "1=3 · Completed;2=4 · Refunded;3=3 · Completed"));

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
    return (await import("file:///" + entry.replace(/\\/g, "/"))).chromium;
  }
  return (await import("playwright-core")).chromium;
}

const chromium = await loadPlaywright();
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await context.newPage();

let frames = 0;
let currentStep = "启动";

async function caption(text) {
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

  // 等待真实查询成功：卡片可见且状态文案与期望完全一致
  await mustWait(
    ({ want }) => {
      const card = document.getElementById("loadedJob");
      const state = document.getElementById("loadedJobState");
      if (!card || card.hidden || !state) return false;
      return state.textContent.trim() === want;
    },
    { want: expect },
    `job ${id} 查询未成功或状态不是「${expect}」（可能 RPC 失败、订单不存在或状态已变）`,
    40000,
  );

  // 只做滚动，不再强行把 hidden 置为 false
  await page.evaluate(() => {
    document.getElementById("loadedJob")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(600);
}

// 断言当前是 live 模式且指向预期合约
async function assertLive() {
  await mustWait(
    ({ short }) => {
      const t = document.body.innerText;
      if (!t.includes("Sepolia 链上社区")) return false;
      if (!t.includes(short)) return false;
      if (t.includes("演示模式：样例与操作仅保存在此浏览器")) return false; // 不能是 Demo sandbox
      return true;
    },
    { short: COMMUNITY.slice(0, 6) },
    `页面未进入 live 模式或社区地址不是 ${COMMUNITY.slice(0, 6)}…（可能仍是 Demo sandbox 或配置未生效）`,
    30000,
  );
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
  await caption("1/7  社区动态 · Sepolia 链上真实数据 · 0x8CDc…2406");
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
  await caption("2/7  帖子详情 · 需求原文与回复 · 圈子按钮随成员资格变化");
  await hold();
  await page.evaluate(() => document.querySelector('#socialDialog button[data-social="close"]')?.click());

  // 3) 共同作品
  currentStep = "场景 3/7 Shared works";
  await scene("works", 1500);
  await assertLive();
  await mustWait(() => document.body.innerText.includes("JOINTLY CONFIRMED"), "没有读到 JOINTLY CONFIRMED 作品——链上无已确认作品或读取失败");
  await mustWait((id) => {
    return !![...document.querySelectorAll('button[data-social="work"]')].find((x) => x.dataset.id === id);
  }, WORK_ID, `找不到作品 #${WORK_ID} 的入口`);
  await caption("3/7  Shared works · 双方确认后才发布 · JOINTLY CONFIRMED");
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
  await caption("4/7  作品详情 · 双方分工、提议人与确认状态");
  await hold();
  await page.evaluate(() => document.querySelector('#socialDialog button[data-social="close"]')?.click());

  // 5) 托管 Job 1
  currentStep = "场景 5/7 托管 Job 1";
  await scene("jobs", 1500);
  await mustWait(() => {
    const f = document.getElementById("lookupJobId");
    return !!f && !!document.getElementById("lookupJobForm");
  }, null, "托管页没有订单查询表单——可能托管配置未生效");
  await loadJob(1);
  await caption("5/7  Task escrow · Job #1 已完成（链上 3 · Completed）");
  await hold();

  // 6) 托管 Job 2 / Job 3
  currentStep = "场景 6/7 托管 Job 2 / Job 3";
  await loadJob(2);
  await caption("6/7  Job #2 已退款（4 · Refunded）· Job #3 由服务方超时后领取");
  await hold();
  await loadJob(3);
  await hold();

  // 7) 圈子
  currentStep = "场景 7/7 圈子";
  await scene("circles", 1200);
  await assertLive();
  await mustWait(() => document.querySelectorAll(".circle-card").length >= 3, null, "圈子卡片少于 3 个——读取失败");
  await caption("7/7  Explore circles · 未连接钱包时统一显示 Join circle（成员状态需连接钱包后读取）");
  await hold(8);

  // 收尾卡
  await page.evaluate(() => {
    document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font:600 30px/1.5 ui-sans-serif,system-ui;color:#12201a;background:#f6f4ee;text-align:center;flex-direction:column;gap:14px"><div>Agent Ledger</div><div style="font-size:17px;font-weight:400;color:#5b6b62">Sepolia 链上社区 · 演示结束</div></div>`;
  });
  await hold(8);

  await browser.close();
  fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ frames, holdsPerScene: HOLD, community: COMMUNITY, escrow: ESCROW, jobStates: Object.fromEntries(JOB_STATES) }, null, 2));
  console.log(`captured ${frames} frames -> ${OUT}`);
} catch (error) {
  try { await browser.close(); } catch {}
  if (!process.exitCode) {
    console.error(`\nFAIL: ${currentStep}：${error.message}\n`);
    process.exitCode = 1;
  }
  console.error("已中止；未生成 meta.json，请勿把本次产物当作成功演示。");
}
