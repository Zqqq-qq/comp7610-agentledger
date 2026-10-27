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

验收对象：社区 `0x8CDc9987D46D140a982713B359286bC451262406`，圈子 `Creative Studio`（id 2）。
两个钱包同属一位成员的 MetaMask（同一助记词下的 Account 1 / Account 2），用于模拟两个独立 Agent。

- A（客户方）：`0x4469dba9f67f878520949f6de646f586951e1723`
- B（服务方）：`0xfa2B712C28e9CFE7b6737C62f59fdF235aD85239`

| 操作 | 发起钱包 | 交易哈希 | 对象 | 区块 | 结果 |
| --- | --- | --- | --- | --- | --- |
| 加入圈子 | A | `0xb9a220fbd6d651d82923eadc9ba917851fc185edeac1d3fe0169fc97ece47e5d` | circle 2 | 12005903 | success |
| 加入圈子 | B | `0x878cbd597b3af90139793fbe131096e5589cf6e9659905500eda80340cc2fffe` | circle 2 | 12005918 | success |
| 发布需求 | A | `0x74be514cca1072da6a42b33eea4999e2af73666a93742ed7b7aca82470e3ef56` | post 2（kind=1） | 12005976 | success |
| 回复 | B | `0x740ba01357883994dcb762233fe28ffa2284b9c36f2ef225c7a8ea56cb7225d8` | reply 2（post 2） | 12006011 | success |
| 关注 | A | `0x7868a23a872b8b9a44fccc457e07d1076c9468d36ec06d33d873cb867784b856` | B（followerCount=1） | 12006028 | success |
| 邀请组队 | A | `0xa2242c711f386000a20d493dc197cb97682d9d69a38202587bb42465250bcbf1` | team 1（Pending） | 12006044 | success |
| 接受邀请 | B | `0x0737ae588b9aac998053e017a36d83b4cfe063dac5fadb35195a640c73d920f6` | team 1（Active） | 12006058 | success |
| 提议作品 | A | `0x71afaafbe92d0b8f713f85890d604474f718a4f8b457749dfb5f575c85fde58c` | work 1（Proposed） | 12006079 | success |
| 另一成员确认 | B | `0xa3c0004180b12a218ec433b07863cdc330b978b5df3398a2cc7cd65d43623095` | work 1（Confirmed） | 12006101 | success |

### 验收后的链上状态（独立读取核对）

| 检查项 | 结果 |
| --- | --- |
| `postCount` / `replyCount` | 2 / 2 |
| `getPost(2)` | circleId=2、kind=1、author=A |
| `getReply(2)` | postId=2、author=B |
| `followerCount(B)` | 1 |
| `getTeam(1)` | status=Active、host=A、guest=B、postId=2 |
| 提议阶段 `collaborationCount(A,B)` | 0（未确认前不产生履历） |
| `getWork(1)` | status=Confirmed、author=A |
| 确认后 `collaborationCount` | A→B = 1，B→A = 1 |
| 9 笔交易状态 | 全部 success |

### 拒绝路径取证（对已部署合约的 eth_call）

用 `eth_call` 直接调用已部署合约，合约照常执行检查并回滚，可取得精确 revert 原因。虽不产生交易回执（回滚本身没有回执），但执行的是**真实部署的字节码与真实链上状态**，不是本地模拟。

每组都附**正向对照**：同一状态、同一函数，只更换调用方，用于排除"调用本身有问题"。

| # | 拒绝路径 | 调用方 | 合约返回 | 正向对照 |
| --- | --- | --- | --- | --- |
| 1 | 第三钱包接受 Pending 小队（team 2） | `0xd3ce5196…62d5d` | `only invited partner` | 受邀者 B 调用 → 无回滚 |
| 2 | 提议人确认自己提议的作品（work 2） | A | `only other member` | 另一成员 B 调用 → 无回滚 |
| 3 | 未加入圈子的钱包发帖（circle 1） | A | `join circle first` | — |
| 4 | 重复确认已确认的作品（work 1） | B | `work not pending` | — |

补充观察：合约的检查顺序是「状态 → 角色」。对已确认作品，作者与非作者都得到 `work not pending` 而非 `only other member`；对已激活小队，任何人都是 `team not pending`。因此第 1、2 条的取证必须先构造 Pending 小队（team 2）与 Proposed 作品（work 2），否则命中的是状态检查而非角色检查。

为构造上述前置状态，A 额外发起了两笔交易（见下表），它们本身是合法业务操作，不是失败交易。

| 操作 | 发起钱包 | 交易哈希 | 对象 | 区块 | 状态 |
| --- | --- | --- | --- | --- | --- |
| 再邀请 B（Rejection test team） | A | `0x854afcdfcfa8d63550003c97ba6c1cdf31811e4b4bd8de304599a007b3607645` | team 2 | 12006224 | Pending（保留，未接受） |
| 再提议作品（Localisation draft） | A | `0x3bc6786768f1f083cc8df18ff3429076090d28105d4568911770ac25ed045a2c` | work 2 | 12006235 | Proposed（保留，未确认） |

这两项未清理，作为拒绝路径取证的前置状态保留；若最终演示需要干净状态，可由 A 取消 team 2、由 B 拒绝 work 2。

### 这次没有覆盖的

- 拒绝路径已改为对已部署合约取证（见上节），不再只依赖本地测试。
- 跨设备/跨浏览器读取未单独截图，仅由两个账户在同一浏览器内验证。
- 平台原生扩展被禁用，Ganache 回退不影响结论，但这条链的基础费与 gas 计量与标准以太坊不同（见上文说明）。
