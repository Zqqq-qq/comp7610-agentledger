# 共享部署记录

只记录公开地址和回执，不记录钱包密钥。切换合约版本时保留旧版本历史，并在 PR 说明迁移影响。

## 已有 Sepolia 基线

- Chain ID: 11155111
- IdentityRegistry: `0x13eA93eCdDeed63259792A39d7a4738a28b3E91d`
- ReputationRegistry: `0x213AEEd69B82DBaebB2800D3904CBb16f9443864`
- 核验基线：2026-10-27，区块 12003155；身份 1 个，评价 1 条，90 分。

## 新增 AgentCommunity

- 状态：**已部署**，但同一天发生了**两次**部署，两份合约字节码完全相同（`keccak256` 均为 `0x4295...cafde7`），状态各自独立。两人在同一社区写入才会互相可见，因此必须统一使用一份，见下「重复部署的处理」。
- Owner role: C（Zqqq-qq）负责 #5。
- Source commit: `39092a5`（两次部署所用 main；`contracts/` 与 `web/generated/` 在 #13 合并后的 `92420f7` 中未变）
- Compiler: Solidity 0.8.30
- Settings: optimizer 200, viaIR=true, EVM Shanghai
- Constructor identity: `0x13eA93eCdDeed63259792A39d7a4738a28b3E91d`（上面的 IdentityRegistry）

### 部署 A（建议作为统一地址）

- Contract address: `0x8CDc9987D46D140a982713B359286bC451262406`
- Deployment transaction: `0x8a537cd6c49e68d4f2301683146bcabc0acc9a2bbde89e797b08dedb80a8ddc5`
- Block: `12005434`
- Deployer public wallet: `0xd3ce5196125cd6e25212de4d04911093d3f62d5d`
- 当前状态：`postCount` 1、`replyCount` 1，为 #16 双账户验收时写入。

### 部署 B（重复部署，不采用）

- Contract address: `0xe398d0103f693cd756e46b69d16ed9f4016968ac`
- Deployment transaction: `0x5f2f498b7013c5442ee8049c3ba3f3ea7550211167d204a7d2783f3a3620f9ca`
- Block: `12005696`
- Deployer public wallet: `0x4469dba9f67f878520949f6de646f586951e1723`
- 当前状态：空的（postCount / teamCount / workCount / replyCount 均为 0），未写入任何记录。
- 成因：部署 A 的地址当时尚未同步到本记录，D 按既有流程自行部署，导致重复。

### 重复部署的处理

- **统一使用部署 A `0x8CDc...2406`**：它更早、已带 #16 的验收数据、且属于 C 的 #5 责任范围。
- 部署 B 保留记录但不使用，避免他人误连造成状态分裂；不主张删除链上合约（合约无自毁）。
- 后续任何人配置社区地址前先查本节，不要各自部署。
- Verified source link: 两份均未向 Etherscan 提交源码；改用本地重编译逐字节比对，见下节。

### 部署核验（独立复算，2026-10-27）

- 两份合约链上运行时字节码均为 `10,973` 字节，`keccak256` 均为 `0x42953724f77e05c99bf2f08f5faa057211268ec0973fe17e59cd072f61cafde7`。
- 合约含 `public immutable identity`，部署时会替换该槽位。按 `immutableReferences` 回填 2 处后，与按上述源码和编译参数重编译的结果**逐字节一致**（两份均已比对）。
- 两份链上 `identity()` 均返回 `0x13eA93eCdDeed63259792A39d7a4738a28b3E91d`，与配置的 IdentityRegistry 一致。
- 部署 B 的交易 input 与 `web/generated/AgentCommunity.json` 的 `bytecode` + ABI 编码构造参数完全一致。
- 部署 B 交易状态 SUCCESS，gasUsed `17,182,618`，effectiveGasPrice `16 wei`，实付 `0.000000000275 ETH`。
- 两者差别**仅在于状态**，不在代码：A 有 1 帖 1 回复，B 为空。

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
