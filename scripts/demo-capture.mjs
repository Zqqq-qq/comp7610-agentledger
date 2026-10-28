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
// 两个已知坑（都已在实现里规避）：
//   1) 应用只在启动时读 localStorage，同 URL 的 goto 只做 hash 内跳转、不会重载，
//      因此每个场景必须「设 hash + reload()」，否则录到的是 Demo sandbox 的假数据。
//   2) 托管页的任务卡片在页面下方，提交查询后要 scrollIntoView 到 #loadedJob，
//      否则截到的是顶部表单，看不到 3 · Completed。

import fs from "node:fs";
import path from "node:path";

const COMMUNITY = "0x8CDc9987D46D140a982713B359286bC451262406";
const ESCROW = "0x3C129b436247368dA71cC31512984c3DB17F1f63";
const TOKEN = "0x6a920b13d6396B7b58BfE562c274Ea76a6409C85";
const IDENTITY = "0x13eA93eCdDeed63259792A39d7a4738a28b3E91d";
const REPUTATION = "0x213AEEd69B82DBaebB2800D3904CBb16f9443864";
const RPC = "https://ethereum-sepolia.publicnode.com";

const APP = process.env.DEMO_APP || "http://127.0.0.1:8091";
const OUT = path.resolve(process.env.DEMO_OUT || "demo-frames");
const HOLD = Number(process.env.DEMO_HOLD || 6); // 每场景帧数

async function loadPlaywright() {
  if (process.env.PW_CORE) {
    const entry = path.join(process.env.PW_CORE, "index.mjs");
    return (await import("file:///" + entry.replace(/\\/g, "/"))).chromium;
  }
  return (await import("playwright-core")).chromium;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const chromium = await loadPlaywright();
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await context.newPage();

let frames = 0;

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

// 坑 1：必须 reload，hash 内跳转不会重新读 localStorage
async function scene(hash, wait = 6500) {
  await page.evaluate((h) => { location.hash = h; }, hash);
  await page.waitForTimeout(250);
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(wait);
}

async function loadJob(id) {
  await page.evaluate((n) => {
    const f = document.getElementById("lookupJobId");
    if (f) { f.value = String(n); document.getElementById("lookupJobForm")?.requestSubmit(); }
  }, id);
  await page.waitForTimeout(5200);
  // 坑 2：任务卡片在下方，滚到卡片顶部才能同时看到状态与明细
  await page.evaluate(() => {
    const el = document.getElementById("loadedJob");
    if (el) { el.hidden = false; el.scrollIntoView({ block: "start" }); }
  });
  await page.waitForTimeout(700);
}

// 写入配置：社区地址 + 链上模式 + 托管地址
await page.goto(APP + "/#community", { waitUntil: "load" });
await page.evaluate(({ c, e, t, i, r, rpc }) => {
  localStorage.setItem("agentledger-community-config", JSON.stringify({ address: c }));
  localStorage.setItem("agentledger-social-mode", JSON.stringify("live"));
  localStorage.setItem("agent-ledger.sepolia.v1", JSON.stringify({ identity: i, reputation: r, rpcUrl: rpc, escrow: e, token: t }));
}, { c: COMMUNITY, e: ESCROW, t: TOKEN, i: IDENTITY, r: REPUTATION, rpc: RPC });

await scene("community");
await caption("1/7  社区动态 · Sepolia 链上真实数据 · 0x8CDc…2406");
await hold();

await page.evaluate(() => {
  [...document.querySelectorAll('button[data-social="thread"]')].find((x) => x.dataset.id === "2")?.click();
});
await page.waitForTimeout(2500);
await caption("2/7  帖子详情 · 需求原文与回复 · 圈子按钮随成员资格变化");
await hold();
await page.evaluate(() => document.querySelector('#socialDialog button[data-social="close"]')?.click());

await scene("works");
await caption("3/7  Shared works · 双方确认后才发布 · JOINTLY CONFIRMED");
await hold();

await page.evaluate(() => {
  [...document.querySelectorAll('button[data-social="work"]')].find((x) => x.dataset.id === "1")?.click();
});
await page.waitForTimeout(2200);
await caption("4/7  作品详情 · 双方分工、提议人与确认状态");
await hold();
await page.evaluate(() => document.querySelector('#socialDialog button[data-social="close"]')?.click());

await scene("jobs");
await loadJob(1);
await caption("5/7  Task escrow · Job #1 已完成（链上 3 · Completed）");
await hold();

await loadJob(2);
await caption("6/7  Job #2 已退款（4 · Refunded）· Job #3 由服务方超时后领取");
await hold();
await loadJob(3);
await hold();

await scene("circles", 6000);
await caption("7/7  Explore circles · 已加入显示 Leave circle，未加入显示 Join circle");
await hold(8);

await page.evaluate(() => {
  document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font:600 30px/1.5 ui-sans-serif,system-ui;color:#12201a;background:#f6f4ee;text-align:center;flex-direction:column;gap:14px"><div>Agent Ledger</div><div style="font-size:17px;font-weight:400;color:#5b6b62">Sepolia 链上社区 · 演示结束</div></div>`;
});
await hold(8);

await browser.close();
fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ frames, holdsPerScene: HOLD }, null, 2));
console.log(`captured ${frames} frames -> ${OUT}`);
