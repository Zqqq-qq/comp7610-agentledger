# 2026-11-08演示候选更新（尚未最终冻结）

最终旁白视频已产出并提交本轮审阅；报告正文/PDF同步为v1.0-delivery-candidate-r2（22页）；当前整合基准main 7389bbe，包含#77的新README截图。成片与字幕的实际摘要及来源见[最终演示记录](FINAL_DEMO_2026-11-08.zh-CN.md)和`evidence/final-demo-delivery.json`。本轮未移动tag，未把工作副本候选摘要冒充合并后的规范冻结清单。

下面2026-11-03的14+9项清单、bdb0a6f报告哈希及21页PDF描述保留为**报告阶段历史快照**，不覆盖本轮新PDF/视频。旧表内“五人彩排”安排已由#10最新单人统一讲解安排替代。课程正式要求已从Moodle核对并另记；当前11页英文slides（r2）也纳入候选摘要。当前待办为同伴复核本轮PR、视频可访问链接与最终备份；合并后再从实际提交复算报告/PDF/架构图/贡献/源码/最终视频，确认新版本标记并保存实际提交回执。

---

# 提交版本冻结记录（R1 / #11）

- 更新：2026-11-03；负责人 @daizhiqi，使用 Codex 辅助执行与整理；请求 @QiuQiu-xuan 复核，实际批准以 PR 为准。
- 状态：**报告合并后的阶段核对；最终提交未冻结**。本记录替代旧 v0.7 清单作为当前报告基准，不表示 #10 / #11 完成。
- 关联：[任务 #11](https://github.com/Zqqq-qq/comp7610-agentledger/issues/11)、[报告 PR #70](https://github.com/Zqqq-qq/comp7610-agentledger/pull/70)。

## 一、实际提交与版本标记

| 项 | 值 |
| --- | --- |
| 当前报告合并基准（完整 SHA） | `bdb0a6f7d4b4057c88040b741b39ab53ceb89408` |
| Git tree | `1532491c497af9aeb7941542cd5933a02faaf949` |
| 报告版本 | `v0.9-review`（沿用已批准正文中的版本字符串），#70 已于 2026-11-03 合并，#9 已关闭 |
| 代码功能基线 | `2e59b10`（#67）；本轮仅更新发布记录，无应用、合约或 ABI 改动 |
| 旧清单基准（历史） | `d126891f0103ec3617d69b22e04d7010be1f1b28`，报告 v0.7；已由本轮清单替代 |
| 现有标签（历史） | `v1.0.0-submission` → `78be5327e1fcb3fa0a0d5ebf3a58033ee0e78ee0`，**不包含 #70，不能作为当前完整提交版本** |
| 当前基准的精确标签 | 无（`release-manifest.json` 的 `tag: null`） |
| 最终版本标记 | **待定**。视频与剩余验收完成后选定实际最终提交，优先使用新的 annotated tag（例如 `v1.0.1-submission`，名称届时确认），不自动覆盖已有标签 |
| 机器清单 | `evidence/release-manifest.json`：14 项（11 必需 + 3 可选）；`evidence/release-supplement.json`：9 项补充，共 23 项 |

哈希直接读取上述提交的 Git blob，避免 Windows CRLF 工作副本差异。清单的 `commit` 是被核对的内容基准，不是存放清单的后续文档提交；新清单不能自引用自身哈希。本 PR 合并后及最终视频变动后，应再次选择实际提交复算。贡献补充记录也须在最终复算范围内。

## 二、验收状态与剩余动作

| 事项 | 当前状态 | 后续 |
| --- | --- | --- |
| #8 跨平台启动与回归 | 已关闭，保留原验收记录 | 最终版本仍需按清单自检 |
| #9 报告与架构图 | #70 经 Zqqq-qq 批准后合并，#9 已关闭 | 本轮更新哈希与发布映射 |
| #10 演示与五人彩排 | **开放，阻断最终提交** | 约 6–8 分钟旁白演示、权限失败路径、新 social 两页场景、五人彩排和备份；核对老师正式要求 |
| #11 冻结、备份和提交 | **开放** | 同伴复核本轮 PR；待 #10 收口后最终复算、标记、备份、实际提交并保存回执 |

daizhiqi 负责报告基准核对、清单与记录更新及最终交付协调；请求 QiuQiu-xuan 协助复核 23 项哈希和版本映射，未替其承诺批准或完成时间。本轮目标为 11/03 发起复核；沿用 Issue 内排期：#10 11/06，#11 11/07，11/08 提交。**这些是仓库排期，老师正式渠道、截止时刻和个人提交要求仍须核对。**

## 三、源码、PDF、架构图、合约与视频映射

| 对象 | 基准与证据 | 范围 |
| --- | --- | --- |
| 源码 | 上述完整 SHA 的 Git tree；功能基线 `2e59b10` | #70 仅文档/报告渲染工具变更；本轮不部署或广播交易 |
| 报告与 PDF | `REPORT.md` / `REPORT.pdf`；14 项清单内 | #70 批准的正文和 21 页 PDF，不在本轮重新生成 |
| 架构图 | `docs/assets/architecture.svg`；补充清单内 | 对应报告核心 DApp / 可选 Agent 服务及验证范围 |
| 贡献 | `CONTRIBUTIONS.md`；补充清单记录报告合并时快照 | 本轮追加 R1 记录，最终提交须重算后续版本 |
| PDF 渲染来源 | `render-report-review.py` / `REPORT_RENDERING.md`；补充清单内 | 保留 #70 可复现方法 |
| 视频 | `assets/` 下 5 个 MP4；补充清单逐个登记 | 已有无旁白素材，**不是最终成片**；不证明已覆盖新增两页或已完成彩排 |

以下是沿用部署记录的公开值，本轮仅核对配置与文档对应，未重新运行 RPC/链上验收：

| 项 | 记录 | 来源 |
| --- | --- | --- |
| 网络 | Ethereum Sepolia，chain ID 11155111 | `web/config.js` |
| IdentityRegistry | `0x13eA93eCdDeed63259792A39d7a4738a28b3E91d` | `web/config.js` / `DEPLOYMENTS.md` |
| ReputationRegistry | `0x213AEEd69B82DBaebB2800D3904CBb16f9443864` | 同上 |
| 合约（社区） | `0x8CDc9987D46D140a982713B359286bC451262406` | `web/config.js`；`verify-community.mjs` |
| 部署交易 / 区块 | `0x8a537cd6c49e68d4f2301683146bcabc0acc9a2bbde89e797b08dedb80a8ddc5` / 12005434 | 回执 `status=1` |
| 部署者 | `0xD3Ce5196125cd6e25212de4D04911093D3F62D5d` | 回执 `from` |
| 构造函数参数 | `["0x13eA93eCdDeed63259792A39d7a4738a28b3E91d"]` | 创建输入解码 |
| 运行时代码哈希 | `0x42953724f77e05c99bf2f08f5faa057211268ec0973fe17e59cd072f61cafde7` | `eth_getCode` → keccak |
| 创建代码哈希 | `0x71c9098723ea3e4b4929493ebd3ddccfce0b684ddf95566332795e1c672f91e0` | 创建交易输入 → keccak |
| 托管合约 | `0x3C129b436247368dA71cC31512984c3DB17F1f63`（JobEscrow） | 托管验收记录 |
| 支付代币 | `0x6a920b13d6396B7b58BfE562c274Ea76a6409C85`（mUSD，6 位小数） | 同上 |


历史证据继续保留于 `evidence/` 及相应验收文档，单人双账户不改写为两名独立用户验收。托管部署使用的原始 CRLF 源码快照与当前 LF 源码不同；复现应保留 `escrow-deployment-sources.json`、交易索引和原编译核验脚本。

## 四、当前基准的 23 项校验和

规范清单 14 项（由现有 `scripts/release-freeze.mjs` 生成）：

| Git blob 路径 | 字节 | SHA-256 |
| --- | --- | --- |
| `web/config.js` | 776 | `9399113d290a2dde5beb038710d849afcb407a2970774ec4d183556ecce2eb65` |
| `package.json` | 511 | `d8940ce0f92af3296b97c3e123b56079f2dd780075f67dffd84ba03aa9a6ac58` |
| `pnpm-lock.yaml` | 10198 | `feab9156a6f6265f8abb5fb5a630c33bb494f5f9b342bdf95493a0493be12f86` |
| `web/generated/AgentCommunity.json` | 42739 | `026410e7c2c8b38867c8db6147adeb2d3c6d04b28ad2b50bc80988998f081a85` |
| `web/generated/JobEscrow.json` | 25327 | `5efaac95259e94c094e03d714f01127ea09e2b890837538b7f8bc61c65fbd8d2` |
| `web/generated/MockUSDC.json` | 11400 | `caa8db3fb8543dd22af8394f3abde75011a0777e9aeb4599e6468940908e9fe2` |
| `contracts/AgentCommunity.sol` | 9212 | `ccbdcee86e97a46380ce83afb914d12067ed59192f843d559e13f6086fd8a8c3` |
| `contracts/IdentityRegistry.sol` | 5774 | `44033281eef840c8e7117cf38caf62b43acdb104e5eff8cd29a7ab5f9824cc72` |
| `contracts/JobEscrow.sol` | 9207 | `ce7d4c46fbd76caafca8d31c78d58c428ddb560fd7a46b6a8fd50a888710f907` |
| `contracts/MockUSDC.sol` | 1793 | `48783f227eadc77ff8fd36cfef7e35e65d20f8a2d2e421f7323a123db9878b2a` |
| `contracts/ReputationRegistry.sol` | 5872 | `cc5dc6bbb85dfd5b012dc9524d649f5efaea1cd8d8d68e36b92e86d6629570ff` |
| `backend-provenance.json` | 3366 | `6b3ba2bc17673ca544c092a6010c89c66aebdd5adfdea4d3bfa269b96f264096` |
| `docs/project/REPORT.md` | 59609 | `6295f5dafe6ae35adb5c64797b26bb89215671b7d00e5fbb2d2d4640ab549f69` |
| `docs/project/REPORT.pdf` | 71697 | `a003ab601d93ec4bec491d57d79eac9d44b563cfee0e6327173e68ebcc7924c2` |

补充清单 9 项（同一完整 SHA 的 Git blob）：

| Git blob 路径 | 字节 | SHA-256 |
| --- | --- | --- |
| `docs/assets/architecture.svg` | 6799 | `e49519bb3fd71d03afe38101e0dace481894dc388c7753d475936cb2daf27f4a` |
| `docs/project/CONTRIBUTIONS.md` | 19907 | `fa17d961159b42f4ab4fe0d0afda0ad39701389f951403c6e9abb28b78a67e96` |
| `docs/project/render-report-review.py` | 6997 | `a81019f3458e962522d94a080f67132368c1b92a50be310ce72d9369b62caed3` |
| `docs/project/REPORT_RENDERING.md` | 874 | `d2711f63bc4b5e5a7f987e02920438a7f94961a23770b6adcacbcbfd513c4766` |
| `docs/project/assets/demo-full-en.mp4` | 1807754 | `24f54656149ca5f1ba3b249cf62a42dd585694274230b34013967c05589e43a6` |
| `docs/project/assets/demo-full-with-wallet.mp4` | 1809330 | `1a7838996ca0fef9c43c75007d609b12c8a3461a33a8ef467cbaef86c347c189` |
| `docs/project/assets/demo-walkthrough-en.mp4` | 485370 | `be86c0b746b2463167abf2722379b278b44b667b9625e291236197818cfdff38` |
| `docs/project/assets/demo-walkthrough.mp4` | 486569 | `cffbd292633732124aaf7aab161a8eec9b55f2f21ab170e17af87600bcaaf1b3` |
| `docs/project/assets/demo-wallet-live.mp4` | 1324394 | `f23ef04e458bb7ebdd584493e39b02627eb6ad2a8fe3584d431b3222d8cfed27` |

相较旧 14 项清单，仅 `REPORT.md` 与 `REPORT.pdf` 改变，其余 12 项未变。规范清单没有可选缺失，`isAncestorOfMain = true`，生成时工作副本输入与 blob 无差异。23 项另以独立 SHA-256 复算核对。

## 五、本轮检查证据

- 真实 GitHub 凭据克隆成功，已核对 `origin/main` 与完整 SHA。
- 合并后 main CI：[verify success](https://github.com/Zqqq-qq/comp7610-agentledger/actions/runs/41604537634)。本轮不将历史测试重新记成本地全量执行。
- 本轮本地专项：`node --test --test-isolation=none --test-timeout=30000 tests/release-freeze.test.mjs tests/report-pdf.test.mjs`，**11/11 通过，0 跳过**。
- 只更新发布文档、清单及贡献记录；无新 RPC、钱包交易、五人彩排或课程提交证据。

## 六、复算、最终冻结与备份

规范清单复算示例（固定 SHA；临时输出避免仅因时间戳改写入库记录）：

```sh
FREEZE_OUT=/tmp/agentledger-release-check.json node scripts/release-freeze.mjs bdb0a6f7d4b4057c88040b741b39ab53ceb89408
```

补充项可按 §四 路径，以 `git cat-file blob <完整SHA>:<路径>` 读取并计算 SHA-256；不要用未提交工作副本替代。

最终执行步骤见 [RELEASE_CHECKLIST.zh-CN.md](RELEASE_CHECKLIST.zh-CN.md)。备份须包含固定最终 SHA 的源码归档、报告/PDF/架构图/渲染说明、最终视频、贡献记录、全量 `evidence/`、部署原始源码与编译核验脚本、社区和托管交易索引及回执。当前仅登记所需内容，**尚无最终备份或课程提交成功的证明**。
