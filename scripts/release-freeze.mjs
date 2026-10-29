#!/usr/bin/env node
// 生成提交版本冻结清单（R1/#11 的机械部分）。
//
// 用法：
//   node scripts/release-freeze.mjs                 # 以当前 HEAD 为冻结提交
//   node scripts/release-freeze.mjs <完整 SHA>      # 指定冻结提交
//   FREEZE_OUT=path.json node scripts/release-freeze.mjs
//
// 为什么以 Git blob 为基准：Windows 的 core.autocrlf 会把 package.json 等
// 未在 .gitattributes 中归一化的文件检出为 CRLF，字节数与哈希随之改变。
// 只有 blob（LF 内容）才是跨平台可比较的基准。
//
// 输出：默认写 docs/project/evidence/release-manifest.json，并在 stdout 打印摘要。
// 任一读取失败即非零退出。

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SHA_INPUT = process.argv[2] || process.env.FREEZE_SHA || "HEAD";
const OUT = process.env.FREEZE_OUT || "docs/project/evidence/release-manifest.json";

const FILES = [
  "package.json",
  "pnpm-lock.yaml",
  "web/generated/AgentCommunity.json",
  "web/generated/JobEscrow.json",
  "web/generated/MockUSDC.json",
  "contracts/AgentCommunity.sol",
  "contracts/IdentityRegistry.sol",
  "contracts/JobEscrow.sol",
  "contracts/MockUSDC.sol",
  "contracts/ReputationRegistry.sol",
];

function git(args, opts = {}) {
  return execFileSync("git", args, { maxBuffer: 1 << 26, stdio: ["ignore", "pipe", "pipe"], ...opts });
}
function gitText(args) {
  return git(args).toString("utf8").trim();
}
function blob(rev, file) {
  return git(["cat-file", "blob", `${rev}:${file}`]);
}

let sha;
try {
  sha = gitText(["rev-parse", `${SHA_INPUT}^{commit}`]);
} catch {
  console.error(`FAIL: 无法解析提交 ${SHA_INPUT}`);
  process.exit(1);
}
const short = sha.slice(0, 7);
const tree = gitText(["rev-parse", `${sha}^{tree}`]);
const subject = gitText(["log", "-1", "--format=%s", sha]);
const commitDate = gitText(["log", "-1", "--format=%cI", sha]);

// 判断冻结提交是否已在主干上（便于确认"合并后再冻结"这一前提）
function __unused_detectMainRef() {
  for (const ref of ["origin/main", "origin-ssh/main", "main"]) {
    try {
      git(["rev-parse", "--verify", "--quiet", ref]);
      return ref;
    } catch {}
  }
  return null;
}
// origin（HTTPS）可能落后，因此对所有 main 候选分别判断，任一为真即算已在主干
const mainRefs = ["origin/main", "origin-ssh/main", "main"].filter((ref) => {
  try { git(["rev-parse", "--verify", "--quiet", ref]); return true; } catch { return false; }
});
const ancestry = {};
for (const ref of mainRefs) {
  try {
    git(["merge-base", "--is-ancestor", sha, ref]);
    ancestry[ref] = true;
  } catch {
    ancestry[ref] = false;
  }
}
const mainRef = mainRefs.find((ref) => ancestry[ref]) ?? mainRefs[0] ?? null;
const onMain = mainRefs.length ? mainRefs.some((ref) => ancestry[ref]) : null;

const files = [];
for (const file of FILES) {
  let buf;
  try {
    buf = blob(sha, file);
  } catch {
    continue; // 该版本没有这个文件（例如托管产物尚未生成）
  }
  files.push({
    path: file,
    bytes: buf.length,
    sha256: crypto.createHash("sha256").update(buf).digest("hex"),
  });
}

// 工作副本对照：仅用于提醒"本机 CRLF 值不可当通用校验和"
const workingCopyDiff = [];
for (const entry of files) {
  const abs = path.resolve(entry.path);
  if (!fs.existsSync(abs)) continue;
  const buf = fs.readFileSync(abs);
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  if (sha256 !== entry.sha256) {
    workingCopyDiff.push({ path: entry.path, bytes: buf.length, sha256 });
  }
}

let deployment = null;
try {
  const mod = await import("../web/config.js");
  deployment = mod.DEPLOYMENT ?? null;
} catch (error) {
  console.error(`警告: 读取 web/config.js 失败（${error.message}），清单里 deployment 记为 null`);
}

let tag = null;
try {
  tag = gitText(["describe", "--tags", "--exact-match", sha]);
} catch {
  tag = null;
}

const manifest = {
  schema: "agentledger-release-manifest-v1",
  generatedAt: new Date().toISOString(),
  commit: sha,
  shortCommit: short,
  tree,
  commitSubject: subject,
  commitDate,
  isAncestorOfMain: onMain,
  mainRef,
  mainAncestry: ancestry,
  tag: tag,
  deployment,
  files,
  workingCopyDiffersFromBlob: workingCopyDiff,
  notes: [
    "校验和以 Git blob（LF）为基准；workingCopyDiffersFromBlob 里的条目只说明本机检出为 CRLF，不代表内容不同。",
    "本清单不判断是否可发布：阻断项与提交回执见 docs/project/RELEASE_FREEZE_DRAFT.zh-CN.md 与 Issue #11。",
  ],
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`冻结提交 ${short} (${subject})`);
console.log(`tree         ${tree}`);
console.log(`已在主干上: ${onMain === null ? "未知（未找到 main 引用）" : onMain ? "是" : "否"}  [${Object.entries(ancestry).map(([r, v]) => `${r}=${v}`).join(" ")}]    tag: ${tag ?? "无"}`);
console.log("");
console.log(`${"文件".padEnd(42)} ${"字节".padStart(8)}  sha256`);
for (const f of files) console.log(`${f.path.padEnd(42)} ${String(f.bytes).padStart(8)}  ${f.sha256}`);
if (workingCopyDiff.length) {
  console.log("");
  console.log("注意：以下文件的工作副本与 blob 不同（通常是 CRLF 检出，勿当通用校验和）：");
  for (const f of workingCopyDiff) console.log(`  ${f.path}  ${f.bytes}B  ${f.sha256.slice(0, 16)}…`);
}
console.log("");
console.log(`清单已写入 ${OUT}`);
