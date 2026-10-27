# 共享部署记录

只记录公开地址和回执，不记录钱包密钥。切换合约版本时保留旧版本历史，并在 PR 说明迁移影响。

## 已有 Sepolia 基线

- Chain ID: 11155111
- IdentityRegistry: `0x13eA93eCdDeed63259792A39d7a4738a28b3E91d`
- ReputationRegistry: `0x213AEEd69B82DBaebB2800D3904CBb16f9443864`
- 核验基线：2026-10-27，区块 12003155；身份 1 个，评价 1 条，90 分。

## 新增 AgentCommunity

- 状态：2026-10-27 已由 Zqqq-qq 的 MetaMask 测试钱包部署，独立只读工具已核验；另一成员人工复核待完成。
- Owner role: C（Zqqq-qq）
- Source commit: `fb6c325175675f210f5dd1b0fba54657043f3701`（部署时本机 `afb52eb`；源码及产物与远端该提交一致）
- Compiler: Solidity 0.8.30
- Settings: optimizer 200, viaIR=true, EVM Shanghai
- Constructor identity: 上面的 IdentityRegistry
- Contract address: `0x8CDc9987D46D140a982713B359286bC451262406`
- Deployment transaction: [回执](https://sepolia.etherscan.io/tx/0x8a537cd6c49e68d4f2301683146bcabc0acc9a2bbde89e797b08dedb80a8ddc5)
- Block: `12005434`
- Deployer public wallet: `0xD3Ce5196125cd6e25212de4D04911093D3F62D5d`
- Verified source link: 尚未进行区块浏览器源码发布验证；独立核验已确认创建输入与仓库产物/构造参数匹配。
- Machine-readable evidence: [真实部署证据](evidence/community-sepolia-deployment.json)
- Evidence handoff: [部署与证据交接](DEPLOYMENT_HANDOFF.zh-CN.md)；浏览器可下载部署记录，也可运行 `scripts/verify-community.mjs` 独立核验。

## JobEscrow 与 MockUSDC（Issue #12）

- 状态：前端与本地 EVM 集成测试完成；真实 Sepolia 地址、部署及验收证据待用户钱包提供。
- JobEscrow address / transaction / block: 待填写
- MockUSDC address / transaction / block: 待填写
- JobEscrow constructor identity: 上述 IdentityRegistry；MockUSDC 无构造参数，6 位小数 mUSD。
- 沿用仓库原 Solidity，不代表已有这两份合约的有效部署证据。
- 演示流程：批准 → 注资 → 发布社区引用 → 提交摘要 → 验收付款；另外创建订单验收退款与超时领取。
- 请记录来源 Community / Post / Team、JobEscrow / jobId、社区引用回复 ID，以及所有操作的交易哈希。

## 双钱包验收回执

| 操作 | 发起钱包 | 交易哈希 | 帖/小队/作品 ID | 验收人 |
| --- | --- | --- | --- | --- |
| 加入圈子 | 待填写 | 待填写 | 待填写 | 待填写 |
| 发布需求 | 待填写 | 待填写 | 待填写 | 待填写 |
| 回复 | 待填写 | 待填写 | 待填写 | 待填写 |
| 关注 | 待填写 | 待填写 | 待填写 | 待填写 |
| 邀请组队 | 待填写 | 待填写 | 待填写 | 待填写 |
| 接受邀请 | 待填写 | 待填写 | 待填写 | 待填写 |
| 提议作品 | 待填写 | 待填写 | 待填写 | 待填写 |
| 另一成员确认 | 待填写 | 待填写 | 待填写 | 待填写 |


## 2026-10-27 真实 Sepolia 基础验收

社区地址见上文。A=`0xD3Ce5196125cd6e25212de4D04911093D3F62D5d`，B=`0xE8bCb71A15ea106aF0CD431C37C1002FeD938e20`。所有签名由用户在 MetaMask 亲自完成。

| 操作 | 钱包 | 交易哈希 | 区块 / 记录 |
| --- | --- | --- | --- |
| 加入 Builders Club | A | [0x180c861990…](https://sepolia.etherscan.io/tx/0x180c8619902c9e6b462559d237dbef6cbf3485ec87989e27d34faf8ffeeb2f8c) | 12005441 / circle 3 |
| 发布验收讨论 | A | [0xc893cb84f2…](https://sepolia.etherscan.io/tx/0xc893cb84f2812dc00a4e00a0a9d6c2e90ec72e3569849028537203319642509a) | 12005468 / post 1 |
| 加入 Builders Club | B | [0xbf6c44c37d…](https://sepolia.etherscan.io/tx/0xbf6c44c37d3635b6d1e9e44db068c90369f1bf5fe8a44ba876cb67b125f43807) | 12005503 / circle 3 |
| 回复验收讨论 | B | [0x0b9fa3a79c…](https://sepolia.etherscan.io/tx/0x0b9fa3a79cd9ba20e2d89f46d50fcaf5f053b4b75d1927787d6e0012dc04a6e9) | 12005519 / reply 1 → post 1 |

机器记录：[链上记录与成功回执](evidence/community-sepolia-live-records.json)。两浏览器为 Chrome（MetaMask，A/B 签名）与内置浏览器（独立配置社区地址，只读）；两者显示相同 post 1 / reply 1。完整边界见 [本次验收报告](SEPOLIA_ACCEPTANCE_2026-10-27.zh-CN.md)。上方其余社交全流程和托管验收模板尚未执行的项目仍保留待填。
