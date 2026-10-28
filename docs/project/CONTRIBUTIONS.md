# 实际贡献记录

共同底稿不直接计作每人独立完成。每位成员记录自己实际审阅、开发、测试、部署和撰写的证据，报告据此整理。

| 日期 | GitHub 用户名 | Issue | PR/提交 | 工作与结果 | 验收证据/审阅人 |
| --- | --- | --- | --- | --- | --- |
| 待填写 | 待填写 | 待填写 | 待填写 | 待填写 | 待填写 |
| 2026-10-27 | Zqqq-qq（使用 Codex 协助） | #5 | feat/5-deployment-evidence | 可复现部署包、浏览器证据导出和独立只读核验，真实 EVM 部署证据测试 | deployment-evidence.test.mjs；此行为部署准备阶段；实际部署见下方记录 |
| 2026-10-27 | Zqqq-qq（使用 Codex 协助） | #12 | PR #13（已合并） | 增量集成托管、小队链上引用及回溯，43 项自动测试；未代其他组员署名 | ESCROW_INTEGRATION.zh-CN.md；真实 Sepolia 验收及同伴审阅待完成 |
| 2026-10-27 | QiuQiu-xuan | #8 | PR #15，`feature/ci-artifact-lf-qiuqiuxuan` | 定位 Windows 下合约产物不一致：`core.autocrlf` 把 `contracts/*.sol` 检出为 CRLF，solc 的 metadata 哈希随之改变；新增 `.gitattributes` 固定 `*.sol` 与生成产物为 LF，并把三份以 CRLF 存入索引的合约源文件规范化。另修正 README 中 `docs/VERIFICATION.json` 的大小写错误。 | 对照实验：同一源码按 LF 编译与仓库 bytecode 一致、按 CRLF 则不一致；修复后 `pnpm test` 22 项通过、`git diff --exit-code` 通过、工作区干净 |
| 2026-10-27 | QiuQiu-xuan | #7 | PR #18，`feature/d1-failure-path-acceptance-qiuqiuxuan` | 把四条拒绝路径的断言从「会抛错」提升为「因合约声明的具体原因被拒绝」，并补一条完整主流程与合作履历双向计数。 | 变异检查证明断言非空跑（改错期望原因后对应用例变红）；全量 27 项通过 |
| 2026-10-27 | QiuQiu-xuan | #8 | PR #17，`feature/acceptance-d2-qiuqiuxuan` | 新增 D2 验收记录：环境、六次 CI 运行、干净克隆启动、22/43 项测试基线、构建，以及产物一致性缺陷的对照实验与修复后验收。 | PR #17；`docs/project/ACCEPTANCE_D2.zh-CN.md` |
| 2026-10-27 | QiuQiu-xuan | #7 | PR #19，`feature/sepolia-deployment-record-qiuqiuxuan` | Sepolia 双钱包 9 步验收（入圈→发帖→回复→关注→邀请→接受→提议→确认→履历）并记录回执；对已部署合约取证四条拒绝路径并附正向对照；记录重复部署事故、建议统一地址、建缺陷 Issue #20。 | 9 笔交易全部 success；作者历史记录：`collaborationCount` 提议阶段 0；本次固定快照独立核验确认后双向 1（不重算旧状态）；四条拒绝路径命中 `only invited partner` / `only other member` / `join circle first` / `work not pending`；链上字节码与仓库产物逐字节一致 |
| 2026-10-28 | QiuQiu-xuan | #7 / #21 | PR #23，`feature/fix-nonmember-post-qiuqiuxuan` | 未加入圈子时禁用发帖/回复提交并说明原因（`syncPostGate`）；把 10 条合约 revert 原因映射为可读提示，替换原样透出的英文串。 | 「已加入可点 / 未加入禁用」两两对照的浏览器实测；新增 `tests/error-message.test.mjs` 3 例，全量 64 项通过；Issue #21 已按实测更正影响描述 |
| 2026-10-28 | QiuQiu-xuan | #8 | PR #24，`feature/frozen-candidate-regression-qiuqiuxuan` | 对冻结候选 `992584e` 做回归：全新克隆 61 项测试与构建、社区与托管只读回放、固定区块 6 组失败路径、真实点击下的拒绝呈现、用户取消签名的界面反馈、跨设备读取；并写 macOS 交接说明。 | `docs/project/FROZEN_CANDIDATE_REGRESSION_2026-10-28.zh-CN.md`；写入交易 `0xfff88c7c…d7bd`（区块 12010583）；跨设备与拒绝反馈各有独立截图 |
| 2026-10-28 | QiuQiu-xuan | #5 | 评审（无 PR） | 完成 C1 第三项「另一成员独立只读复核」：在区块 12010787 复跑 `identity()` / `getPost(1)` / `getReply(1)`，并用 PR #14 的 `scripts/verify-community.mjs` 核对部署创建输入、构造参数与 runtime，逐项与 Codex 记录比对一致；结果贴回 #5 并关闭。 | 证据为 #5 的复核评论（含时间、RPC、区块哈希、可复制命令）；全程未连接钱包、未签名、未广播 |


## #6 钱包切换与失败恢复（Codex 辅助）

Zqqq-qq 发起并负责交付；Codex 辅助实现钱包会话快照与过期响应隔离、签名账户复核、社区签名网络检查，以及本机双 Provider/双账户和故障恢复回归测试。详见 `WALLET_RECOVERY_VERIFICATION.zh-CN.md`。此段记录首轮本机验证；后续真实 MetaMask / Sepolia 验收见下一节，未将本机测试记作公链验收。


## 2026-10-27 真实钱包与 Sepolia 验收（#5 / #6）

Zqqq-qq 亲自完成 MetaMask 钱包创建、解锁和所有交易确认；Codex 辅助准备操作、读取公开回执、核验部署产物并执行 Chrome/内置浏览器检查。实际完成社区部署、A/B 加入圈子、A 发帖、B 回复、账户切回、跨浏览器只读共享及失败恢复检查；修复拒签草稿丢失和弹窗错误遮挡，并根据 QiuQiu-xuan 审阅改进被取代快照的后续处理。证据见 SEPOLIA_ACCEPTANCE_2026-10-27.zh-CN.md。PR #14、#16 已批准并合并；另一成员的独立现场复核仍以 Issue #5 的记录为准。


## 2026-10-28 托管 Sepolia 实测（#12）

Zqqq-qq 亲自在 MetaMask 确认两份合约部署和所有验收交易；Codex 辅助部署入口、固定区块核验、截图与文档整理。14 笔成功交易，Job 1 正常付款、Job 2 未交付退款、Job 3 交付后超时领取；最终 A 98 / B 2 / 合约 0 mUSD。交付报告见 ESCROW_SEPOLIA_ACCEPTANCE_2026-10-28.zh-CN.md，含实际源码快照和只读复现命令。Agent ID 0 与未发布小队引用的边界已明确，不冒充其他组员复审；已由 ffmitrg 与 QiuQiu-xuan 审阅批准。


## 2026-10-28 PR #19 证据修订（Codex 辅助）

Zqqq-qq 发起本次整理，Codex 辅助保留双方贡献与部署记录、补充固定区块的只读 RPC 取证与源码重编译复算脚本、区分旧快照和本次读取，并统一 #5 / #7 的未完成边界。QiuQiu-xuan 的原交易与测试贡献保留在表中；本次修订不冒充其再次操作或 ffmitrg 的复审批准。
