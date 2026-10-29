# 共享部署记录

只记录公开地址和回执，不记录钱包密钥。切换合约版本时保留旧版本历史，并在 PR 说明迁移影响。

## 部署前检查清单

部署是**一次性、不可撤销、影响全组**的动作。2026-10-27 曾因地址未及时登记而重复部署（见下文「重复部署 B」与 Issue #20），以下四步用于避免重演：

1. **先查本文件**：上方是否已有 AgentCommunity 地址。若有，直接到网页里 `Community contract → Verify & save address`，**不要再部署**。
2. **再查只读核验**：对已有地址运行 `node scripts/verify-community.mjs --tx <部署交易> --address <地址>`，确认代码与仓库产物一致。
3. **部署后立即登记**：把地址、交易哈希、区块、部署者、源码提交与编译参数写进本文件，**与部署代码放在同一个 PR**，不要留到后续 PR。
4. **登记后通知全组**：在群里贴出地址，并提醒所有人使用同一地址——两人连不同地址时，各自写入的内容互相不可见。

> 只读核验不代表已向区块浏览器提交源码验证；若未提交，请如实写「未提交 Etherscan 验证」，不要写成「已验证」。

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

- 状态：2026-10-28 已部署并完成双钱包正常付款、未交付退款、交付后超时领取；待同伴审阅交付材料。
- JobEscrow：`0x3C129b436247368dA71cC31512984c3DB17F1f63`；交易 `0x3a35a1d2409018d5f9b14d3be7d3f9fc3a113467d9d6407f75125c5c2fa1170d`；区块 12009914。
- MockUSDC：`0x6a920b13d6396B7b58BfE562c274Ea76a6409C85`；交易 `0x45673f45fa0c9b156bb276b8e113213369ffc19e2295f14cc9384211d9929dd3`；区块 12009909；6 位小数 mUSD。
- JobEscrow constructor identity 为上述 IdentityRegistry；MockUSDC 无构造参数。
- 实际部署源码基线 `583fd6d1a1932a56c508d1faef617868e8ccb85c`，保留原始 CRLF 快照，避免后续 LF 规范化改变 metadata 后无法复现。solc 0.8.30 / optimizer 200 / viaIR / Shanghai。
- [完整验收报告](ESCROW_SEPOLIA_ACCEPTANCE_2026-10-28.zh-CN.md)；[原始回执与固定区块证据](evidence/escrow-sepolia-acceptance.json)。
- Job 1 Completed、Job 2 Refunded、Job 3 Completed；均为 1 mUSD、Agent ID 0 独立钱包订单。本轮未发布社区小队引用；应用引用校验不等于合约强制绑定。
- 以后演示沿用这两个共享地址，不需要每人重新部署。单钱包/浏览器已有存储配置时，可在 Contracts 中手动更新到上述地址。

## 2026-10-27 真实 Sepolia 基础验收

社区地址见上文。A=`0xD3Ce5196125cd6e25212de4D04911093D3F62D5d`，B=`0xE8bCb71A15ea106aF0CD431C37C1002FeD938e20`。所有签名由用户在 MetaMask 亲自完成。

| 操作 | 钱包 | 交易哈希 | 区块 / 记录 |
| --- | --- | --- | --- |
| 加入 Builders Club | A | [0x180c861990…](https://sepolia.etherscan.io/tx/0x180c8619902c9e6b462559d237dbef6cbf3485ec87989e27d34faf8ffeeb2f8c) | 12005441 / circle 3 |
| 发布验收讨论 | A | [0xc893cb84f2…](https://sepolia.etherscan.io/tx/0xc893cb84f2812dc00a4e00a0a9d6c2e90ec72e3569849028537203319642509a) | 12005468 / post 1 |
| 加入 Builders Club | B | [0xbf6c44c37d…](https://sepolia.etherscan.io/tx/0xbf6c44c37d3635b6d1e9e44db068c90369f1bf5fe8a44ba876cb67b125f43807) | 12005503 / circle 3 |
| 回复验收讨论 | B | [0x0b9fa3a79c…](https://sepolia.etherscan.io/tx/0x0b9fa3a79cd9ba20e2d89f46d50fcaf5f053b4b75d1927787d6e0012dc04a6e9) | 12005519 / reply 1 → post 1 |

机器记录：[链上记录与成功回执](evidence/community-sepolia-live-records.json)。两浏览器为 Chrome（MetaMask，A/B 签名）与内置浏览器（独立配置社区地址，只读）；两者显示相同 post 1 / reply 1。完整边界见 [本次验收报告](SEPOLIA_ACCEPTANCE_2026-10-27.zh-CN.md)。这是区块 12005532 的早期快照（post 1 / reply 1），不代表后续计数；后续社交交易见下节。托管资金实测已于 2026-10-28 完成，见 [托管验收报告](ESCROW_SEPOLIA_ACCEPTANCE_2026-10-28.zh-CN.md)。


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

### 前端拒绝路径的界面核对（2026-10-28）

方法：用 Playwright 驱动 Chromium，注入一个**只读的 EIP-1193 provider** 模拟「当前账户」，逐账户核对按钮门控。全程不安装钱包、不签名、不广播。它验证的是**应用如何按账户与状态渲染界面**，不是 MetaMask 弹窗或失败交易的界面反馈。

| 拒绝路径 | 账户 | 界面行为 | 结论 |
| --- | --- | --- | --- |
| 作者确认自己的作品（work 2） | D-A（作者） | 动作区只有 `Team workspace`，无 `Confirm & publish` / `Request changes` | 已阻止 |
| 同一作品，换另一成员 | D-B | 出现 `Request changes` + `Confirm & publish` | 正向对照 |
| 重复确认（work 1 已 Confirmed） | D-B（本来有权限） | 无 `Confirm & publish` / `Request changes` | 已阻止（按状态） |
| 第三方接受 Pending 小队（team 2） | `0xd3ce…62d5d`（非 host 非 guest） | 只有导航，无 `Accept invitation` / `Decline` | 已阻止 |
| 未入圈发帖（circle 1） | D-A（未加入 circle 1） | 下拉标注 `join first`，但 **`Publish post` 仍可点击** | **未阻止**，已建 Issue #21 |

第 2、3 行是正向对照：同一作品、同一状态，只更换账户，按钮的有无正好对应角色与状态限制，排除了「弹窗本身没渲染动作区」的解释。

第 5 行是本次发现的缺陷：界面知道账户没加入该圈子（有 `join first` 标注），却没有禁用提交，用户会发出一笔必然以 `join circle first` 回滚的交易。

### 跨浏览器只读核对（2026-10-28）

用 Microsoft Edge 156 新建独立临时配置（无钱包扩展），写入社区地址后加载页面：

- 社区页显示 `Sepolia 链上社区 · 0x8CDc…2406`，可见 post 2。
- Shared works 页显示 `JOINTLY CONFIRMED` 的 work 1 与双方署名，页脚 `Confirmed at block 12010030`。
- 全程未连接钱包（右上角仍为 Connect wallet），说明内容完全来自链上读取。

**边界**：这是同一台机器上的另一个浏览器引擎，证明读取不依赖单个浏览器配置；**跨设备**仍未验证。

### 验收边界与 Issue 状态

**#5、#7 继续保持未完成。**

- #5：仍需另一成员完成部署记录的独立现场复核。
- #7：**界面按钮门控**已核对（见上节），剩余缺口是「MetaMask 弹窗与真实失败交易的界面反馈」，以及**跨设备**读取（本次只到同机跨浏览器引擎）。
- 新发现缺陷 Issue #21（未入圈仍可提交发帖）。

`eth_call` 使用任意公开 from 模拟调用，不签名、不广播、不改变状态；成功对照之间也不共享模拟写入。它证明固定状态下的合约判断，不能替代 MetaMask 拒签、浏览器失败提示或真实失败交易回执。界面核对使用的是注入的只读 provider，同样不能替代真实钱包交互。#18 是本地合约测试，不提升为公链 UI 验收。#16 的 Chrome / 内置浏览器结果仅覆盖前节 post 1 / reply 1。

本次未发送新交易，也不将 Codex 复算记作其他组员批准。JobEscrow / MockUSDC 的公链部署与托管验收已于 2026-10-28 完成（PR #22），见 [托管验收报告](ESCROW_SEPOLIA_ACCEPTANCE_2026-10-28.zh-CN.md)；本节只覆盖社区侧。

## 跨模块验收：社区小队 → 托管订单（2026-10-28）

此前 post 3 / team 3 的邀请未被接受、也没有从该团队建过订单，因此跨模块路径一直记为未验证。本次用两个钱包（A `0x4469…1723`、B `0xfa2B…85239`）把整条链路跑完。

| 步骤 | 方法 | 结果 |
| --- | --- | --- |
| A 铸测试币 | `MockUSDC.mint` | A 余额 100 mUSD |
| A 发任务帖 | `createPost` | post 4（circle 2，kind 1） |
| A 邀请 B | `inviteTeam` | team 4（host A / guest B，status Pending=1） |
| B 接受 | `respondTeam` | team 4 → Active(2) |
| A 授权 | `MockUSDC.approve` | 授权额度在下一步被消耗 |
| A 从团队建单 | `JobEscrow.createJob` | job 4，托管 1 mUSD |
| B 提交交付 | `JobEscrow.submit` | 进入提交态 |
| A 验收放款 | `JobEscrow.release` | job 4 → **Completed(3)** |

**放款后余额（区块 12012205 读取）**：A 99 mUSD / B 1 mUSD / JobEscrow 0 mUSD。

**关联的边界**：`JobEscrow` 没有 team 字段，团队与订单的关联只存在于应用层——界面按「每个订单首条由客户发出的引用」显示关联，并在界面上明确说明该引用不构成结算依据、不能证明质量、不做分账、也不让评价与订单绑定。因此本节记录的是**真实跑通的业务流程**，不是链上强制的关联。

**核验方式**：在应用的 Task escrow 页填入 Job ID 4 并 Load / refresh，界面读链结果为 `3 · Completed` 与上述余额；团队侧在 My teams 页读到 team 4 为 Active 且 host/guest 与实际一致。

## 2026-10-29 小队 #3 → 托管订单 #5（新增跨模块证据）

沿用上方共享 AgentCommunity、JobEscrow 与 mUSD 地址，无新部署。社区需求帖 #3 与小队邀请 #3 已于前一天存在，本轮由同一用户控制的 Account 1 / Account 2 执行六笔交易；全部钱包确认由用户完成。

| 步骤 | 交易 | 区块 |
| --- | --- | --- |
| B 接受小队 #3 | `0x75954ced4369fd82ecd9ce40d410c2d6e9005c9855f7af6ab194473daaf63d46` | 12018477 |
| A 授权 1 mUSD | `0xafab4fba0c46c76bac0da00bfd37d08cdf97bd0df1f3f33509de7f293aa04e10` | 12018515 |
| A 创建并托管订单 #5 | `0x591d029261a6aefbb1761eec080383e5f919e0dcef5e581c698aa03e93aa6f72` | 12018524 |
| A 发布来源帖 #3 的关联回复 #3 | `0x86e974bfb368202532244598952557d9fb5abf23c27c848aa6c3ce655d7617b8` | 12018530 |
| B 提交交付文件摘要 | `0xdfcf6ceb8677a6eea1783fc9d0dec96a1a4cdd8c801065c372730c1b1e72c00b` | 12018547 |
| A 验收付款 | `0xd3579e0854b0f4e2b39ecd51e57a211ed5a8acec9b037effe9b7342e008e8b58` | 12018556 |

固定区块 12018561：小队 Active、订单 Completed，A 97 / B 3 / escrow 0 mUSD，剩余授权 0；相较注资前 A 98 / B 2，实际支付一次 1 mUSD。关联、交付摘要与付款 Transfer 均已核对。

[完整报告与复现命令](TEAM3_ESCROW_SEPOLIA_ACCEPTANCE_2026-10-29.zh-CN.md)；[六笔回执与固定快照](evidence/team3-job5/acceptance.json)。此记录补充前文“旧托管验收未发布社区引用”的历史范围，不改写旧快照。双方 Agent ID 为 0，关联由应用校验，不属于合约强制绑定，也未验收共同作品或信誉评价。
