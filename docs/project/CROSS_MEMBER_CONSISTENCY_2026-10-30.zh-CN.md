# 组员产出一致性检查（2026-10-30）

检查人：ffmitrg，使用 Claude Code 协助。基线 main `2f27c7e`，另看了未合并的 PR #57。

五位组员都用 AI 协助开发，各自的 PR 单独看都通过了 CI，但互相之间有说法或行为不一致。下面按「会不会误导评分 / 用户」排序。

## 一、代码行为矛盾

| # | 矛盾 | 位置 | 影响 | 处理 |
| --- | --- | --- | --- | --- |
| 1 | Demo 写入会 trim 并拒绝纯空白文本，Sepolia 写入适配器原样发送，`"   "` 能上链 | `web/social-core.js` `text()` ↔ `web/social-chain.js` `sendCommunity` | 同一输入在两种模式下结果不同 | **已修复**：`normalizeText` 统一两条路径（`review/b-independent-ffmitrg`） |
| 2 | 示例名片里写的地址是 `127.0.0.1:8090`，本地服务器默认端口是 `8091` | `web/.well-known/agent-card.json` ↔ `scripts/serve.mjs`、`DEVELOPMENT.zh-CN.md` | 按名片 `url` 访问会 404 | 在蓝图功能分支里改为新的名片格式，不再写死端口 |

## 二、文档与文档 / 代码之间的矛盾

| # | 矛盾 | 位置 | 正确情况 |
| --- | --- | --- | --- |
| 3 | 中文 README 说 JobEscrow / MockUSDC「待部署」，英文 README 说已部署并完成 3+2 笔订单验收 | `README.zh-CN.md` 「现有功能」表 ↔ `README.md`「Feature status」、`web/config.js` | 已部署：`0x3C12…1f63` / `0x6a92…9C85` |
| 4 | 中文 README 路线图把「部署托管合约」列为 P0 待办 | `README.zh-CN.md`、`docs/BLUEPRINT.zh-CN.md` | 已完成（PR #22） |
| 5 | README 写「64 tests across 12 files」，报告写 82 tests，实测 main 为 82 项 / 20 个文件 | `README.md` 第 88、153、184 行 ↔ `REPORT.md` 第 6 行 | 以 `pnpm test` 实测为准 |
| 6 | README 写 `release-freeze.mjs`「available once PR #36 is merged」 | `README.md` 第 148 行 | PR #36 早已合并 |
| 7 | README Quick start 要求首次使用时手动粘贴社区合约地址 | `README.md`「Run the app」 | `web/config.js` 已内置地址，不需要粘贴 |
| 8 | B1 复核文档的权限表写「任务贴作者所在圈子的成员」，第五节说 kind「仅靠前端约定」 | `REVIEW_B1_…2026-10-28` | 任意圈子成员可当 host；kind 范围与「只能从任务帖组队」由合约强制。**已更正** |
| 9 | `TEAM_TASKS.zh-CN.md` 仍写「当前基线 22 项测试」 | `docs/project/TEAM_TASKS.zh-CN.md` 第 5 行 | 历史快照，建议加「（10/27 时）」 |
| 10 | README 的部署核验命令在默认公共 RPC 上失败（区块回执已被裁剪） | `README.md`「Verification」 | 需注明使用可查历史回执的 RPC；或用 `eth_getCode` 比对 runtime |
| 11 | BLUEPRINT 头部写「依据提交 `92420f7`」，内容停留在托管未部署的阶段 | `docs/BLUEPRINT.zh-CN.md` | 需随蓝图功能实现一起更新 |

## 三、未合并 PR 与 main 的关系

- PR #57（Zqqq-qq，演示字幕）只改 `scripts/demo-capture.mjs`、`scripts/lib/`、`tests/demo-*` 和两份文档，GitHub 显示可合并。与本次分支唯一重叠的文件是 `docs/project/CONTRIBUTIONS.md`（双方都只在表里加行），后合并的一方需要手动保留两行。

## 四、没有发现矛盾的地方

- 五份合约的地址在 `web/config.js`、`README.md`、`DEPLOYMENTS.md` 三处一致。
- 编译参数在 `scripts/compile.mjs`、`compile-escrow.mjs`、B2 文档、CI 之间一致，本地重编与 Sepolia runtime 逐字节一致。
- 退圈与团队权限（#30）的语义在合约、Demo、`TEAM_CIRCLE_POLICY`、B1 文档之间一致。
- 前端 `errorMessage` 映射的 10 条社区 revert 文本都能在合约 `require` 中逐字找到；`team not active`、`not team member`、`only pending host`、`invalid text length` 等尚未映射，会原样显示英文（不矛盾，可改进）。
