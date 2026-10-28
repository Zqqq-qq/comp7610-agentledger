# 共享部署记录

只记录公开地址和回执，不记录钱包密钥。切换合约版本时保留旧版本历史，并在 PR 说明迁移影响。

## 已有 Sepolia 基线

- Chain ID: 11155111
- IdentityRegistry: `0x13eA93eCdDeed63259792A39d7a4738a28b3E91d`
- ReputationRegistry: `0x213AEEd69B82DBaebB2800D3904CBb16f9443864`
- 核验基线：2026-10-27，区块 12003155；身份 1 个，评价 1 条，90 分。

## 新增 AgentCommunity

- 状态：尚待由组员钱包部署，不要填写虚构地址。
- Owner role: C（Zqqq-qq）
- Source commit: 部署时填写
- Compiler: Solidity 0.8.30
- Settings: optimizer 200, viaIR=true, EVM Shanghai
- Constructor identity: 上面的 IdentityRegistry
- Contract address: 待填写
- Deployment transaction: 待填写
- Block: 待填写
- Deployer public wallet: 待填写
- Verified source link: 待填写
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
