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

## 2026-10-27 真实 Sepolia 基础验收

社区地址见上文。A=`0xD3Ce5196125cd6e25212de4D04911093D3F62D5d`，B=`0xE8bCb71A15ea106aF0CD431C37C1002FeD938e20`。所有签名由用户在 MetaMask 亲自完成。

| 操作 | 钱包 | 交易哈希 | 区块 / 记录 |
| --- | --- | --- | --- |
| 加入 Builders Club | A | [0x180c861990…](https://sepolia.etherscan.io/tx/0x180c8619902c9e6b462559d237dbef6cbf3485ec87989e27d34faf8ffeeb2f8c) | 12005441 / circle 3 |
| 发布验收讨论 | A | [0xc893cb84f2…](https://sepolia.etherscan.io/tx/0xc893cb84f2812dc00a4e00a0a9d6c2e90ec72e3569849028537203319642509a) | 12005468 / post 1 |
| 加入 Builders Club | B | [0xbf6c44c37d…](https://sepolia.etherscan.io/tx/0xbf6c44c37d3635b6d1e9e44db068c90369f1bf5fe8a44ba876cb67b125f43807) | 12005503 / circle 3 |
| 回复验收讨论 | B | [0x0b9fa3a79c…](https://sepolia.etherscan.io/tx/0x0b9fa3a79cd9ba20e2d89f46d50fcaf5f053b4b75d1927787d6e0012dc04a6e9) | 12005519 / reply 1 → post 1 |

机器记录：[链上记录与成功回执](evidence/community-sepolia-live-records.json)。两浏览器为 Chrome（MetaMask，A/B 签名）与内置浏览器（独立配置社区地址，只读）；两者显示相同 post 1 / reply 1。完整边界见 [本次验收报告](SEPOLIA_ACCEPTANCE_2026-10-27.zh-CN.md)。这是区块 12005532 的早期快照（post 1 / reply 1），不代表后续计数；后续社交交易见下节，托管公链验收仍待完成。


## 重复部署 B（保留历史，不作为共享地址）

- 地址：`0xe398d0103f693cd756e46b69d16ed9f4016968ac`
- 交易：`0x5f2f498b7013c5442ee8049c3ba3f3ea7550211167d204a7d2783f3a3620f9ca`
- 区块：12005696；部署者：`0x4469dba9f67f878520949f6de646f586951e1723`。
- QiuQiu-xuan 记录：当时部署 A 尚未同步，因此重复部署。保留链上合约，统一使用上方部署 A，避免状态分裂。
- 作者原记源码基线 `39092a5`；本次只证明其创建输入、构造参数和运行时代码与已固定的仓库源码/产物一致，不能据此证明部署者当时使用的 Git 提交。
- 本次固定区块 12009736：B 的 post / reply / team / work 计数均为 0。

## QiuQiu-xuan 的社交全流程交易记录（PR #19）

共享社区为部署 A，圈子 Creative Studio（circle 2）。以下 D-A / D-B 是该成员在同一浏览器 MetaMask 中的两个账户，与前节 Zqqq-qq 的 A / B 不同；不能当作两位成员独立操作或全流程跨浏览器验收。

- D-A：`0x4469dba9f67f878520949f6de646f586951e1723`
- D-B：`0xfa2b712c28e9cfe7b6737c62f59fdf235ad85239`

| 操作 | 发起钱包 | 交易哈希 | 对象 | 区块 | 结果 |
| --- | --- | --- | --- | --- | --- |
| 加入圈子 | D-A | `0xb9a220fbd6d651d82923eadc9ba917851fc185edeac1d3fe0169fc97ece47e5d` | circle 2 | 12005903 | success |
| 加入圈子 | D-B | `0x878cbd597b3af90139793fbe131096e5589cf6e9659905500eda80340cc2fffe` | circle 2 | 12005918 | success |
| 发布需求 | D-A | `0x74be514cca1072da6a42b33eea4999e2af73666a93742ed7b7aca82470e3ef56` | post 2（kind=1） | 12005976 | success |
| 回复 | D-B | `0x740ba01357883994dcb762233fe28ffa2284b9c36f2ef225c7a8ea56cb7225d8` | reply 2（post 2） | 12006011 | success |
| 关注 | D-A | `0x7868a23a872b8b9a44fccc457e07d1076c9468d36ec06d33d873cb867784b856` | B（followerCount=1） | 12006028 | success |
| 邀请组队 | D-A | `0xa2242c711f386000a20d493dc197cb97682d9d69a38202587bb42465250bcbf1` | team 1（Pending） | 12006044 | success |
| 接受邀请 | D-B | `0x0737ae588b9aac998053e017a36d83b4cfe063dac5fadb35195a640c73d920f6` | team 1（Active） | 12006058 | success |
| 提议作品 | D-A | `0x71afaafbe92d0b8f713f85890d604474f718a4f8b457749dfb5f575c85fde58c` | work 1（Proposed） | 12006079 | success |
| 另一成员确认 | D-B | `0xa3c0004180b12a218ec433b07863cdc330b978b5df3398a2cc7cd65d43623095` | work 1（Confirmed） | 12006101 | success |


### 拒绝调用的前置业务交易

以下两笔是成功的业务交易，用于保留 Pending / Proposed 状态，不能计为失败交易。

| 操作 | 发起钱包 | 交易哈希 | 对象 | 区块 | 状态 |
| --- | --- | --- | --- | --- | --- |
| 再邀请 B（Rejection test team） | D-A | `0x854afcdfcfa8d63550003c97ba6c1cdf31811e4b4bd8de304599a007b3607645` | team 2 | 12006224 | Pending（保留，未接受） |
| 再提议作品（Localisation draft） | D-A | `0x3bc6786768f1f083cc8df18ff3429076090d28105d4568911770ac25ed045a2c` | work 2 | 12006235 | Proposed（保留，未确认） |


### 固定快照与可复现核验（2026-10-28）

- RPC：`https://ethereum-sepolia.publicnode.com`；chain ID 11155111。完整请求、响应、节点版本和交易所属区块哈希见 [原始证据 JSON](evidence/pr19-reproducible-audit.json)。来源为上述远程 RPC，不是本地 Ganache。
- 记录快照：**12009736**（`0xb74108`），哈希 `0x3a5c54c63428b4546139a723c4929f8857b43b2622a8ed4c89fc8fa4739baf5c`。该区块的状态在公共节点上已被裁剪，精确复读需要归档 RPC。
- 复跑快照：**12009928**（`0xb741c8`），哈希 `0x2a6e3107166dd0a0718a7d7af56a9eddcdb6a946f539919b7f43b5234ffd938f`。2026-10-28 由 QiuQiu-xuan 在不带 `--block` 的情况下重跑，8 个用例（4 拒绝 + 4 成功对照）、11 笔回执、两份 runtime 匹配均复现，逐条结果见 [复现说明](PR19_REPRODUCTION.zh-CN.md)。
- A 的 post / reply / team / work = **2 / 2 / 2 / 2**；team 2 Pending，work 2 Proposed，work 1 Confirmed；D-A→D-B 与 D-B→D-A 合作计数均为 1。
- 早期 **12005532** 快照的 1 帖 / 1 回复来自 #16 已提交记录；本次只重读其区块头，未重新计算旧状态。原记录的「提议阶段计数 0」为作者历史报告，本次不冒充已复算。
- 9 笔主流程、2 笔前置交易回执均返回 success，并核对目标地址与各自所属区块哈希。两份部署的创建输入及运行时代码也逐字节匹配。
- 4 条拒绝调用与 4 条成功对照全部通过。完整 from / to / calldata / block 参数、原始 revert data、编译及 immutable 回填步骤见 [复现说明](PR19_REPRODUCTION.zh-CN.md)。

### 验收边界与 Issue 状态

**#5、#7 继续保持未完成。** #5 仍需另一成员完成部署记录的独立现场复核；#7 仍需补齐前端拒绝路径的界面反馈证据，以及该完整社交流程的跨浏览器读取与同伴验收。

`eth_call` 使用任意公开 from 模拟调用，不签名、不广播、不改变状态；成功对照之间也不共享模拟写入。它证明固定状态下的合约判断，不能替代 MetaMask 拒签、浏览器失败提示或真实失败交易回执。#18 是本地合约测试，不提升为公链 UI 验收。#16 的 Chrome / 内置浏览器结果仅覆盖前节 post 1 / reply 1。

本次未发送新交易，也不将 Codex 复算记作其他组员批准。#12 的 JobEscrow / MockUSDC 部署与公链验收继续待完成。
