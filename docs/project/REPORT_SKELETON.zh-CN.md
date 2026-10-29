# 课程报告骨架（E1 / #9 输入）

- 关联任务：[#9 E1](https://github.com/Zqqq-qq/comp7610-agentledger/issues/9)
- 归属角色：E（报告与整合）；本文由 D · @QiuQiu-xuan 起草，**不认领 E1**
- 用法：按章节顺序填正文即可。每章下面的「可直接引用的证据」都是仓库里**已存在**的文件或已核实的数字，不需要重新造。
- 写作基线：main `a2b38c9`（2026-10-28）。若 main 前进，需要重新核对的项已标注 ⚠️。

## 零、先看这张表

| 章节 | 素材来自 | 缺口 |
| --- | --- | --- |
| 1 摘要 | 本文第 1 节 + `IMPLEMENTATION.zh-CN.md` | 需写 300 字摘要 |
| 2 背景与问题 | `BLUEPRINT.zh-CN.md` | 需按实际实现收窄，蓝图里的未做项要删 |
| 3 需求与范围 | `TEAM_TASKS.zh-CN.md` + 各 Issue | — |
| 4 系统设计 | `IMPLEMENTATION.zh-CN.md`（已有「实际架构/状态机与权限」） | **架构图需重画** |
| 5 实现 | 代码 + `IMPLEMENTATION.zh-CN.md` | — |
| 6 部署 | `DEPLOYMENTS.md` + `ESCROW_SEPOLIA_ACCEPTANCE` | — |
| 7 测试与验收 | `ACCEPTANCE_D1/D2`、`FROZEN_CANDIDATE_REGRESSION`、`MACOS_CLEAN_CLONE` | — |
| 8 已知限制 | `REVIEW_B1` §五 + `TEAM_CIRCLE_POLICY`（#34 合并后） | ⚠️ 依赖 #34 |
| 9 分工与贡献 | `CONTRIBUTIONS.md` | ⚠️ 缺 E/R 条目 |
| 10 结论 | — | — |
| 附录 | `evidence/` 目录 + 复现命令 | 视频待 #33 合并 |

## 1. 摘要

写什么：一句话说明问题（Agent 之间缺少可信的协作与结算记录）、做了什么（链上社区 + 团队协作 + 托管结算）、验证到什么程度（Sepolia 真实交易 + 自动化 + 跨平台）。

可直接引用的数字：

- 社区合约 `0x8CDc9987D46D140a982713B359286bC451262406`，托管 `0x3C129b436247368dA71cC31512984c3DB17F1f63`
- 自动化测试 **64 项**（12 个测试文件），CI 通过
- 真实交易：社区 9 步流程 + 部署 + 拒绝探针；托管 3 个订单（Completed / Refunded / Completed）

## 2. 背景与问题定义

写什么：为什么要做「Agent 社区 + 协作 + 结算」；现有平台缺什么（可信的协作履历、可验证的结算）。

可直接引用：

- `docs/BLUEPRINT.zh-CN.md` 的「理想目标」「理想闭环：一笔交易的完整路径」「现有功能盘点」「要补的功能」
- ⚠️ 蓝图是**规划**文档；报告里只能引用其中**已实现**的部分，未实现的要明确标为后续工作

## 3. 需求与范围

写什么：五类角色的任务划分、六个功能域（身份/圈子/帖子/小队/作品/托管）、边界（不做什么）。

可直接引用：

- `docs/project/TEAM_TASKS.zh-CN.md`：A–E 五角色、A1–R1 共 12 项任务与依赖关系、里程碑日期
- 已完成 Issue：**#3 #5 #7 #8 #12 #20 #21 #25**（8 个）
- 仍未关闭：**#1 #2 #4 #6 #9 #10 #11 #30**（8 个，其中 #9 #10 #11 是交付物本身）

## 4. 系统设计

### 4.1 架构总览（需重画图）

写什么：浏览器（静态站，无后端）↔ 钱包（MetaMask）↔ Sepolia 合约（Identity / Reputation / Community / JobEscrow / MockUSDC）。

可直接引用：

- `docs/IMPLEMENTATION.zh-CN.md` 的「实际架构」
- `web/config.js` 的 `DEPLOYMENT`（五个地址 + RPC）

**缺口**：仓库里只有品牌图（`docs/assets/banner*.svg`、`journey.png`、`map.png`），**没有实现级架构图**。E1 要求「更新报告和架构图」，这张图需要新画。建议画三层：浏览器 / 钱包 / 链上，并标出读写路径。

### 4.2 合约与权限模型

可直接引用：

- `docs/IMPLEMENTATION.zh-CN.md` 的「状态机与权限」
- `docs/project/REVIEW_B1_AGENTCOMMUNITY_2026-10-28.zh-CN.md` §一 权限表（逐函数列出允许的调用者与拒绝文案）
- 关键事实：合约**没有 owner / admin / pause / upgrade**，权限完全由圈子成员资格、Agent NFT 所有权、团队参与者身份推导

### 4.3 状态机

可直接引用：

- `REVIEW_B1` §二：Team `None → Pending → Active / Declined / Cancelled`；Work `None → Proposed → Published / Rejected`；每队同时只允许一笔待审作品
- `docs/project/TEAM_CIRCLE_POLICY.zh-CN.md`（⚠️ 依赖 #34 合并：退圈不撤销既有团队权限）

### 4.4 前端信息架构

可直接引用：

- `web/social.js` 的六类入口（圈子 / 社区 / 人脉 / 小队 / 作品 / 托管）
- A1 验收：`docs/project/A1_UI_ACCEPTANCE_2026-10-28.zh-CN.md` + `evidence/a1-ui/`（⚠️ 依赖 #32 合并；含 22 张 390×844 / 1440×1000 截图与 `measurements.json`）

## 5. 实现

### 5.1 合约实现

- `contracts/AgentCommunity.sol`（圈子/帖子/回复/关注/小队/作品）、`contracts/JobEscrow.sol`（托管）、`contracts/MockUSDC.sol`（6 位小数测试币）
- 编译参数：solc 0.8.30、optimizer 200、viaIR、Shanghai（见 `DEPLOYMENTS.md`）

### 5.2 前端与钱包交互

写什么：为什么不用后端；写入如何经过钱包；失败如何呈现。

可直接引用的三个具体设计（都有 PR 与测试支撑）：

| 设计 | 证据 |
| --- | --- |
| 发送前校验签名钱包的 chainId，不在 Sepolia 就拒绝发送 | `tests/wallet-recovery.test.mjs` |
| 未加入圈子时**选圈即禁用提交**并说明原因 | PR #23；`web/social.js` 的 `syncPostGate()`；`FROZEN_CANDIDATE_REGRESSION` §三 |
| 合约 revert 原因映射为可读提示（新增 10 条，映射表共 20 条） | `web/core.js` 的 `errorMessage`；`tests/error-message.test.mjs`（3 例） |

### 5.3 托管模块集成

- `docs/ESCROW_INTEGRATION.zh-CN.md`
- 订单状态与金额：job1 1 mUSD `Completed`(3)、job2 `Refunded`(4)、job3 超时领取 `Completed`(3)

## 6. 部署与运维

可直接引用：

- `docs/project/DEPLOYMENTS.md`：社区地址、部署交易 `0x8a537cd6…`、区块 12005434、部署者 `0xD3Ce…62D5d`、构造函数参数
- 字节码一致性：runtime keccak `0x42953724…cafde7`、creation `0x71c90987…f91e0`
- `scripts/verify-community.mjs`：任何人可复跑，输出与上面一致
- 重复部署事故与治理：`DEPLOYMENTS.md` 顶部「部署前检查清单」；Issue #20（已关闭）

**写作要点**：把「重复部署」作为流程教训写，不要藏；检查清单就是整改结果。

## 7. 测试与验收

### 7.1 自动化

- **64 项 / 12 个测试文件**：`tests/` 下 community-contract、d1-failure-path、deployment-evidence、error-message、escrow-integration、escrow-ui、escrow、frontend、live-adapter、social-core、wallet-recovery、wallet-session
- CI：`.github/workflows/ci.yml` 的 `verify` 作业（安装 → 编译 → 测试 → 产物检查 → 构建）

### 7.2 双钱包端到端与拒绝路径（D1 / #7，已关闭）

- `docs/project/ACCEPTANCE_D1.zh-CN.md`（含 §七 收尾复核：9 笔逐笔 status/from/事件、8 条拒绝探针）
- 9 笔回执哈希在 `DEPLOYMENTS.md`；固定复核区块 **12011205**
- 四条拒绝：`only invited partner` / `only other member` / `join circle first` / `work not pending`，每条都配正向对照

### 7.3 托管三条路径（#12，已关闭）

- `docs/project/ESCROW_SEPOLIA_ACCEPTANCE_2026-10-28.zh-CN.md`
- job3 的严格边界：区块 12010027 时间恰好等于窗口截止时 claim 仍返回 `review window open`，更晚的区块才成功——这条最能说明实现没有"提前放行"

### 7.4 跨浏览器 / 跨设备 / 真实钱包

- 跨浏览器：Edge 全新配置无钱包读到同样内容（PR #19）
- 跨设备：另一台设备无钱包读到 2 帖 + 已确认作品（PR #24）
- 真实钱包拒绝：`Request cancelled in your wallet. No action was completed.`（`FROZEN_CANDIDATE_REGRESSION` §三）
- 真实钱包**成功写入**录制（加入 → 按钮变 Leave circle → 退出 → 取消）：`docs/project/DEMO_RECORDING_SCENES.zh-CN.md` 与 `docs/project/assets/demo-full-with-wallet.mp4`（⚠️ 视频在 PR #33，合并后路径才成立）

### 7.5 冻结候选回归（D2 / #8，已关闭）

- `docs/project/FROZEN_CANDIDATE_REGRESSION_2026-10-28.zh-CN.md`
- 候选 `992584e`：61 项基线、只读回放、6 组失败路径、1 笔真实写入（`0xfff88c7c…d7bd`，区块 12010583）

### 7.6 跨平台干净克隆（D2 / #8）

- macOS：`docs/project/MACOS_CLEAN_CLONE_2026-10-28.zh-CN.md`（`7db718a`，64/64，附日志与截图）
- Windows：同一 `7db718a` 补跑，64/64、构建成功、工作区空、`.sol` 与产物均为 LF（记录在 PR #35 评论）

## 8. 已知限制与风险

可直接引用（**这一节最容易写得诚实、也最容易加分**）：

| 限制 | 出处 |
| --- | --- |
| 合约无 owner / 无暂停 / 无升级，文案类修复只能在前端做 | `REVIEW_B1` §五 |
| Active 团队没有终止态，无法取消或标记完成 | `REVIEW_B1` §五 |
| `proposeWork` / `reviewWork` 只判团队身份，**不复查圈子资格**；退圈不撤销既有团队权限（已定为设计） | Issue #30；`TEAM_CIRCLE_POLICY`（⚠️ 依赖 #34） |
| 源码**未提交 Etherscan 验证**，一致性靠本地重编译 + 运行时字节码比对 | `DEPLOYMENTS.md` |
| 托管源码与当前 LF 源码字节不同，复现需 `evidence/escrow-deployment-sources.json` | `RELEASE_FREEZE_DRAFT` §六 |
| 前端拒绝反馈依赖 `eth_estimateGas`，不是界面主动拦截 | `FROZEN_CANDIDATE_REGRESSION` §三 |
| 第二台设备只做只读，不含跨设备签名写入 | `ACCEPTANCE_D1` §五 |
| macOS 检测到 Node 24 下 ganache uWS 原生模块 ABI 不匹配（回退纯 JS，不影响结果） | `MACOS_CLEAN_CLONE` |

## 9. 分工与贡献

- `docs/project/CONTRIBUTIONS.md`：A–D 已有条目（含具体证据列），**E 与 R 的条目待补**（⚠️）
- 角色与任务：`TEAM_TASKS.zh-CN.md`
- 写作要点：区分「本人执行」与「工具辅助」；Codex 辅助的记录已在多处标注，报告里保持一致口径

## 10. 结论与后续工作

- 结论：核心闭环（发现 → 讨论 → 组队 → 协作 → 确认 → 结算）已在 Sepolia 上跑通并留有可复核回执
- 后续：团队终止态、退圈权限策略、Etherscan 源码验证、托管跨模块入口（社区小队 → 托管订单）尚未现场验收

## 11. 附录

### 11.1 证据索引

| 类别 | 位置 |
| --- | --- |
| 部署与回执 | `docs/project/DEPLOYMENTS.md`、`evidence/community-sepolia-*.json` |
| 托管 | `evidence/escrow-*.json`、`evidence/escrow-screenshots/`、`evidence/job{1,2,3}-*` |
| 验收 | `ACCEPTANCE_D1`、`ACCEPTANCE_D2`、`SEPOLIA_ACCEPTANCE_2026-10-27`、`ESCROW_SEPOLIA_ACCEPTANCE_2026-10-28` |
| 回归与跨平台 | `FROZEN_CANDIDATE_REGRESSION_2026-10-28`、`MACOS_CLEAN_CLONE_2026-10-28`、`evidence/macos-clean-clone-2026-10-28/` |
| 复核 | `REVIEW_B1_AGENTCOMMUNITY_2026-10-28` |
| 演示 | `DEMO_RECORDING_SCENES.zh-CN.md`（视频在 PR #33） |
| 冻结 | `RELEASE_FREEZE_DRAFT.zh-CN.md`、`RELEASE_CHECKLIST.zh-CN.md`（PR #36）、`scripts/release-freeze.mjs` |

### 11.2 复现命令

```sh
git clone https://github.com/Zqqq-qq/comp7610-agentledger.git
cd comp7610-agentledger
pnpm install --frozen-lockfile
pnpm test        # 预期 64 项
pnpm build
node scripts/verify-community.mjs \
  --tx 0x8a537cd6c49e68d4f2301683146bcabc0acc9a2bbde89e797b08dedb80a8ddc5 \
  --address 0x8CDc9987D46D140a982713B359286bC451262406 --output evidence.json
```

## 附：写报告时最容易犯的三个错

1. **把规划当实现**：`BLUEPRINT.zh-CN.md` 里有未做的功能，照抄会与代码不符。
2. **把工具产出当成"成员验收"**：Codex / 脚本执行的结果不能替代成员本人的验收，仓库里已严格区分，报告别混。
3. **漏掉已知限制**：这一节不是减分项——#30（退圈不撤销团队权限）、无 owner、无 Etherscan 验证都是真实的边界，写清楚比藏起来更可信。
