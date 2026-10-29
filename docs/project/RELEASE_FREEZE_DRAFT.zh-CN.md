# 提交版本冻结记录（R1）

- 关联任务：[#11 R1](https://github.com/Zqqq-qq/comp7610-agentledger/issues/11)
- 归属角色：release · @daizhiqi；本记录由 D · @QiuQiu-xuan 于 2026-10-29 按最终 main 汇总，**tag、备份与课程提交仍由 release 执行**
- 状态：**已冻结**（2026-10-29）。tag `v1.0.0-submission` → `7c6540f`；机器可读清单：[`evidence/release-manifest.json`](evidence/release-manifest.json)
- 上一版是 2026-10-28 的草案（候选 `3e473c3`，已作废）；本文件已按新清单重算 §一 与 §四

> 为什么由 D 汇总：R1 需要的事实（冻结候选回归、链上回执、产物一致性、测试演进）多数在 D 的验收记录里。本记录只陈述可复算的值；是否提交、如何提交仍由 release 判断。

## 一、冻结提交

| 项 | 值 |
| --- | --- |
| 代码冻结提交 | `be4f9d8d0a415618d4a052815a8aee973697e59e`（tree `0c17893c3cd3fb24e08ad33e5e02d5e81212a4f1`，2026-10-29 20:53 +08:00） |
| 发布提交（tag 指向） | `7c6540f2bd2326542ba625f0d9bce65f710d086f` |
| 测试 | **71 / 71 通过**（14 个测试文件；在 `be4f9d8` 实测，`7c6540f` 的 CI 亦为 `tests 71 / pass 71 / fail 0`） |
| 构建 | `pnpm build` 成功；`web/generated/AgentCommunity.json` 未被改写 |
| 工作区 | 测试与构建后保持干净 |
| 未并入的待评审改动 | **无**（open PR 0；#32 #34 #43 #44 #45 均已合并） |
| 版本标记 | `v1.0.0-submission`（annotated tag，指向 `7c6540f`） |
| 冻结清单 | `docs/project/evidence/release-manifest.json`，11 个输入，`isAncestorOfMain = true` |

> 清单里的 `commit` 记 `be4f9d8`（代码基线）；`7c6540f` 只在其后追加报告 v0.3 与清单本身，§四 的 11 个输入哈希不变。若 release 决定以 `7c6540f` 为冻结提交，只需把清单的 `commit` 视为“代码基线”而非 tag 目标。

## 二、阻断问题清单（2026-10-29 更新）

| Issue | 标题 | 状态 | 阻断提交？ | 说明 |
| --- | --- | --- | --- | --- |
| #8 | D2 验证 CI、跨平台启动与冻结版本回归 | 关 | — | macOS 带凭据 clone 与 Windows 记录均已完成（PR #28/#35） |
| #9 | E1 更新报告与架构图 | 开 | 否 | 报告已到 v0.3（英/中架构图、PDF），Issue 待 E 收口 |
| #10 | E2 演示录屏与五人彩排 | 开 | **是（提交前）** | `docs/project/assets/*.mp4` 已有成片素材；旁白音轨与五人彩排未完成 |
| #11 | R1 汇总冻结版本、提交物与备份 | 开 | **是（提交前）** | tag 已打；备份与课程提交待 release 执行 |
| #1 | A1 六类界面交互与手机布局 | 关 | — | PR #32 已合并（22 张截图 + 测量） |
| #30 | 退圈后仍可提议/确认作品 | 关 | — | 按“有意设计”写入 `TEAM_CIRCLE_POLICY.zh-CN.md` |
| #2 / #4 / #6 | A2 / B2 / C2 | 开 | 否 | 体验打磨、成文复核、等同伴确认 |
| #3 / #5 / #7 / #12 | B1 / C1 / D1 / C3 | 关 | — | 已验收关闭 |
| #20 / #21 / #25 / #39 | 三个缺陷 + 视觉打磨 | 关 | — | 均已修复并合入 |

## 三、版本一致性映射

| 维度 | 值 | 复核方式 |
| --- | --- | --- |
| 源码（代码基线） | `be4f9d8` | `git rev-parse v1.0.0-submission^{}` 得到 `7c6540f`；两者代码输入一致 |
| 合约（社区） | `0x8CDc9987D46D140a982713B359286bC451262406` | `web/config.js`；`verify-community.mjs` |
| 部署交易 / 区块 | `0x8a537cd6c49e68d4f2301683146bcabc0acc9a2bbde89e797b08dedb80a8ddc5` / 12005434 | 回执 `status=1` |
| 部署者 | `0xD3Ce5196125cd6e25212de4D04911093D3F62D5d` | 回执 `from` |
| 构造函数参数 | `["0x13eA93eCdDeed63259792A39d7a4738a28b3E91d"]` | 创建输入解码 |
| 运行时代码哈希 | `0x42953724f77e05c99bf2f08f5faa057211268ec0973fe17e59cd072f61cafde7` | `eth_getCode` → keccak |
| 创建代码哈希 | `0x71c9098723ea3e4b4929493ebd3ddccfce0b684ddf95566332795e1c672f91e0` | 创建交易输入 → keccak |
| 托管合约 | `0x3C129b436247368dA71cC31512984c3DB17F1f63`（JobEscrow） | 托管验收记录 |
| 支付代币 | `0x6a920b13d6396B7b58BfE562c274Ea76a6409C85`（mUSD，6 位小数） | 同上 |
| 报告 | `REPORT.md` / `REPORT.pdf`（v0.3）、`ACCEPTANCE_D1`、`ACCEPTANCE_D2`、`SEPOLIA_ACCEPTANCE_2026-10-27`、`ESCROW_SEPOLIA_ACCEPTANCE_2026-10-28`、`TEAM3_ESCROW_SEPOLIA_ACCEPTANCE_2026-10-29`、`A1_UI_ACCEPTANCE_2026-10-28`、`TEAM_CIRCLE_POLICY`、`REVIEW_B1_AGENTCOMMUNITY_2026-10-28` | 均在 main |
| 视频 | `docs/project/assets/` 下 5 个 mp4（完整版、带钱包版、英文版、走查、真实钱包片段）；无旁白音轨 | #10 仍开 |
| 贡献记录 | `docs/project/CONTRIBUTIONS.md` | E / R 条目仍缺 |

## 四、提交物清单与校验和

**基准**：以冻结提交的 **Git blob（LF 内容）** 为准，而不是某台机器工作副本的字节。`web/config.js`、`package.json`、`pnpm-lock.yaml` 不在 `.gitattributes` 归一化范围内，Windows 下 `core.autocrlf=true` 会检出为 CRLF，字节数与哈希随之改变——**两者不可跨平台直接比较**。

冻结提交 `be4f9d8`，用 `git cat-file blob <SHA>:<path>` 读原始内容后计算（与 `release-manifest.json` 的 `files` 一一对应）：

| 文件 | Git blob 字节 | SHA-256（规范基准） |
| --- | --- | --- |
| `web/config.js` | 776 | `9399113d290a2dde5beb038710d849afcb407a2970774ec4d183556ecce2eb65` |
| `package.json` | 415 | `f04f7458bce56b0c24e49d431f3a1f059b8c71d1b6773c0e222bfc3e62d638d5` |
| `pnpm-lock.yaml` | 10198 | `feab9156a6f6265f8abb5fb5a630c33bb494f5f9b342bdf95493a0493be12f86` |
| `web/generated/AgentCommunity.json` | 42739 | `026410e7c2c8b38867c8db6147adeb2d3c6d04b28ad2b50bc80988998f081a85` |
| `web/generated/JobEscrow.json` | 25327 | `5efaac95259e94c094e03d714f01127ea09e2b890837538b7f8bc61c65fbd8d2` |
| `web/generated/MockUSDC.json` | 11400 | `caa8db3fb8543dd22af8394f3abde75011a0777e9aeb4599e6468940908e9fe2` |
| `contracts/AgentCommunity.sol` | 9212 | `ccbdcee86e97a46380ce83afb914d12067ed59192f843d559e13f6086fd8a8c3` |
| `contracts/IdentityRegistry.sol` | 5774 | `44033281eef840c8e7117cf38caf62b43acdb104e5eff8cd29a7ab5f9824cc72` |
| `contracts/JobEscrow.sol` | 9207 | `ce7d4c46fbd76caafca8d31c78d58c428ddb560fd7a46b6a8fd50a888710f907` |
| `contracts/MockUSDC.sol` | 1793 | `48783f227eadc77ff8fd36cfef7e35e65d20f8a2d2e421f7323a123db9878b2a` |
| `contracts/ReputationRegistry.sol` | 5872 | `cc5dc6bbb85dfd5b012dc9524d649f5efaea1cd8d8d68e36b92e86d6629570ff` |

**Windows 工作副本的差异值**（仅作对照，**不要**当通用校验和用）：

| 文件 | CRLF 字节 | SHA-256（CRLF） |
| --- | --- | --- |
| `web/config.js` | 791 | `b8159c8feb55d40508d66e16292fb5525470581e19b1a195032cc265782f4dc4` |
| `package.json` | 432 | `2aa11140591c83b84d07076b5a465f1b87767ffe08a1a5fcd28a2196c5f413f2` |
| `pnpm-lock.yaml` | 10534 | `432381fa4b5845f3f7bb48ebd67832201fc0a642e8b7fdddbaf7beb7bc3e2501` |

其余文件在两种环境下一致，因为 `.gitattributes` 固定了 `*.sol` 与生成产物为 LF（PR #15 修掉的缺陷：按 CRLF 编译会让 solc metadata 变化）。

**行尾一致性**：提交前应在干净克隆里跑一遍 §五 的自检，确认 `git status` 为空且产物未被改写。

## 五、复现与自检（提交前必跑）

```sh
git clone https://github.com/Zqqq-qq/comp7610-agentledger.git
cd comp7610-agentledger
# 必须固定到冻结提交；不固定就会测到移动的默认分支
git checkout --detach be4f9d8d0a415618d4a052815a8aee973697e59e
test "$(git rev-parse HEAD)" = "be4f9d8d0a415618d4a052815a8aee973697e59e" || { echo "HEAD 不是冻结提交，停止"; exit 1; }
pnpm install --frozen-lockfile
pnpm test                               # 预期 71 项通过
pnpm build                              # 预期成功
git status --short                      # 预期为空
git diff --exit-code -- web/generated/AgentCommunity.json   # 预期通过（产物未被改写）
node scripts/release-freeze.mjs be4f9d8d0a415618d4a052815a8aee973697e59e   # 11 个 SHA-256 应与 §四 一致
node scripts/verify-community.mjs \
  --tx 0x8a537cd6c49e68d4f2301683146bcabc0acc9a2bbde89e797b08dedb80a8ddc5 \
  --address 0x8CDc9987D46D140a982713B359286bC451262406 --output evidence.json
```

最后一条应输出 `creationBytecodeHash` / `runtimeCodeHash` 与 §三 一致。

## 六、备份清单

| 对象 | 备份内容 | 位置建议 |
| --- | --- | --- |
| 源码 | `git archive` 冻结提交 `be4f9d8` 的包（tag `v1.0.0-submission` 可复核） | 课程提交目录 + 个人云盘 |
| 社区合约 | `web/generated/AgentCommunity.json`（ABI + bytecode）与 `contracts/AgentCommunity.sol`、`contracts/IdentityRegistry.sol` | 同上 |
| **托管合约** | `docs/project/evidence/escrow-deployment-sources.json`（实际部署源文件）、`docs/project/evidence/escrow-transaction-index.json`、`escrow-sepolia-acceptance.json`、`job1/2/3` 的探测与交付记录，以及 `scripts/compile-escrow.mjs`、`scripts/verify-escrow-acceptance.mjs` | 同上 |
| 冻结清单 | `docs/project/evidence/release-manifest.json`（11 个输入 + 部署地址） | 同上 |
| 回执 | 9 笔社区交易 + 部署交易 + 托管交易（含 job 4 / job 5）的哈希清单 | 同上（Etherscan 链接即可复核） |
| 证据 | `docs/project/evidence/` 全量（含 `escrow-screenshots/`、`a1-ui/`、`team3-job5/`） | 同上 |
| 文档 | `docs/project/` 下全部验收与复核记录 | 同上 |
| 视频 | `docs/project/assets/` 的 5 个 mp4 | 同上 |
| 贡献记录 | `CONTRIBUTIONS.md` | 同上 |

> 托管合约的实际部署源文件与当前 LF 源码字节不同，只备份 `AgentCommunity.json` 与两个 `.sol` **不足以复现现有托管部署**，必须连同上面的托管证据与编译核验脚本一起保留。

## 七、状态与剩余动作

1. **冻结 SHA**：已固定为 `be4f9d8`；§四 的 11 个校验和即按该提交计算。
2. **版本标记**：`v1.0.0-submission` 已创建并推送，指向 `7c6540f`（报告 v0.3 + 清单 + 本记录之前的最终 main）。
3. **#8 的收口口径**：已关闭；macOS 带 GitHub 凭据的真实 clone 记录在 `MACOS_CLEAN_CLONE_2026-10-28.zh-CN.md`。
4. **#30 的处置**：已按“有意设计”定稿，写入 `TEAM_CIRCLE_POLICY.zh-CN.md` 并有 4 项回归。
5. **贡献记录**：E / R 的条目仍未加入 `CONTRIBUTIONS.md`，提交前由 release/E 补齐或明确留白。
6. **备份与提交**：源码 zip、证据备份、课程渠道提交与回执保留，按本草案由 release/人执行。
