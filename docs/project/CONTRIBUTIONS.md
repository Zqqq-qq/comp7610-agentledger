# 实际贡献记录

共同底稿不直接计作每人独立完成。每位成员记录自己实际审阅、开发、测试、部署和撰写的证据，报告据此整理。

| 日期 | GitHub 用户名 | Issue | PR/提交 | 工作与结果 | 验收证据/审阅人 |
| --- | --- | --- | --- | --- | --- |
| 待填写 | 待填写 | 待填写 | 待填写 | 待填写 | 待填写 |
| 2026-10-27 | Zqqq-qq（使用 Codex 协助） | #5 | feat/5-deployment-evidence | 可复现部署包、浏览器证据导出和独立只读核验，真实 EVM 部署证据测试 | deployment-evidence.test.mjs；钱包尚未安装，公链部署待执行 |
| 2026-10-27 | Zqqq-qq（使用 Codex 协助） | #12 | feat/12-social-escrow，PR 待关联 | 增量集成托管、小队链上引用及回溯，43 项自动测试；未代其他组员署名 | ESCROW_INTEGRATION.zh-CN.md；真实 Sepolia 验收及同伴审阅待完成 |


## #6 钱包切换与失败恢复（Codex 辅助）

Zqqq-qq 发起并负责交付；Codex 辅助实现钱包会话快照与过期响应隔离、签名账户复核、社区签名网络检查，以及本机双 Provider/双账户和故障恢复回归测试。详见 `WALLET_RECOVERY_VERIFICATION.zh-CN.md`。真实 MetaMask、跨浏览器和 Sepolia 验收待钱包准备及 #5 实际部署后执行，未将本机测试记作公链验收。


## 2026-10-27 真实钱包与 Sepolia 验收（#5 / #6）

Zqqq-qq 亲自完成 MetaMask 钱包创建、解锁和所有交易确认；Codex 辅助准备操作、读取公开回执、核验部署产物并执行 Chrome/内置浏览器检查。实际完成社区部署、A/B 加入圈子、A 发帖、B 回复、账户切回、跨浏览器只读共享及失败恢复检查；修复拒签草稿丢失和弹窗错误遮挡，并根据 QiuQiu-xuan 审阅改进被取代快照的后续处理。证据见 SEPOLIA_ACCEPTANCE_2026-10-27.zh-CN.md。另一成员独立复核及 PR 更新后的同伴复审待完成。


## 2026-10-28 托管 Sepolia 实测（#12）

Zqqq-qq 亲自在 MetaMask 确认两份合约部署和所有验收交易；Codex 辅助部署入口、固定区块核验、截图与文档整理。14 笔成功交易，Job 1 正常付款、Job 2 未交付退款、Job 3 交付后超时领取；最终 A 98 / B 2 / 合约 0 mUSD。交付报告见 ESCROW_SEPOLIA_ACCEPTANCE_2026-10-28.zh-CN.md，含实际源码快照和只读复现命令。Agent ID 0 与未发布小队引用的边界已明确，不冒充其他组员复审；PR 待审阅合并。
