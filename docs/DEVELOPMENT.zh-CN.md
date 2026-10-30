# AgentLedger Social · COMP7610

在小组提供的 AgentLedger 身份与声誉工作台上增加完整社交协作模块：圈子、主动发帖、回复、钱包关注、邀请组队、共同作品，以及由双方确认作品形成的合作履历。沿用原生 HTML/CSS/JavaScript 与本地 Ethers，原有注册和评分流程保留。

Issue #12 增量接入任务托管：批准测试 mUSD、注资、交付、验收放款、退款、超时领取及小队订单引用。详见 [社交与托管集成说明](ESCROW_INTEGRATION.zh-CN.md)。五份 Solidity 源码未修改；真实 Sepolia 部署和钱包验收仍需成员执行。

## 小组协作入口

以本仓库 `main` 为唯一源码主线。五人分工与时间表见 [任务表](project/TEAM_TASKS.zh-CN.md)，修改流程见 [CONTRIBUTING.md](../CONTRIBUTING.md)，公共地址与回执写入 [部署记录](project/DEPLOYMENTS.md)。每人认领 Issue，从任务分支提交 PR，经过同伴审阅及 CI 后合并。

## 立即运行

安装了 Node.js 20+：

```sh
node scripts/serve.mjs
```

打开 http://127.0.0.1:8091 。运行网页不需要安装依赖。Windows 也可使用 `start-frontend.ps1`，默认 8091，自动查找 Node.js 或 Python，不再依赖某位成员的绝对路径。已有 Python 时：

```sh
python3 -m http.server 8091 --bind 127.0.0.1 --directory web
```

默认打开 Demo sandbox。顶部明确标识样例只在当前浏览器保存，不向链上发交易。Act as 可切换 Alex、Maya、Jamie；Reset samples 恢复初始样例。种子包含 3 个钱包、4 条帖子、3 条回复、1 个已接受小队和 1 件双方确认作品。演示模式切换身份不是钱包授权。

身份注册/评分页面独立读取真实 Sepolia；演示样例不会进入它们的列表。已有两个地址已填入 `web/config.js`：

- IdentityRegistry：`0x13eA93eCdDeed63259792A39d7a4738a28b3E91d`
- ReputationRegistry：`0x213AEEd69B82DBaebB2800D3904CBb16f9443864`

## 功能与权限

| 模块 | 已实现 |
| --- | --- |
| 圈子 | 三个固定主题圈，加入/退出、成员数、按圈查看内容 |
| 发帖 | 动态、开放需求、作品分享；标题、正文、代表身份 |
| 回复 | 需求详情讨论串，作者、代表 Agent、时间；同圈成员可回复 |
| 关注 | 钱包关注/取消关注、关注者数、Following 动态流 |
| 组队 | 由需求邀请一名伙伴，公开双方角色；受邀者接受/拒绝，发起人撤回未接受邀请 |
| 共同作品 | 活跃小队成员提议结果，另一成员确认或要求修改；只有双方确认后公开入作品集 |
| 履历 | 个人钱包主页、共同作品、历史伙伴与共同确认作品次数 |
| 链上社区 | 新增 AgentCommunity，全部社交写入由合约控制；跨浏览器读取同一部署 |
| 原有功能 | 注册、身份查询、授权评分、MetaMask 账户选择、交易回执 |
| 任务托管 | 单客户/单服务方 mUSD 订单、交付摘要、付款、退款、超时领取；复用原 JobEscrow |
| 社交订单引用 | 小队/需求进入托管、付款人发布链上回复引用、独立验证和跨设备加载、反向回溯 |

普通用户可用 Agent ID=0 以钱包身份参与。代表非零 Agent 时检查当前 NFT Owner。待接受的邀请再次核验双方 Agent 所有权；接受后成员钱包被记录，NFT 转让不会把既有小队和个人合作履历送给新 Owner。

关注对象是运营者钱包；它不随 NFT 转让转移。作品确认是两名钱包对贡献说明和引用的认可，不是独立质量审计，不证明 AI 自动完成任务，也不是付款证据。原有卖家授权评分保持单独展示。

## Sepolia 多人使用

社交合约尚未代用户广播部署。代码和编译产物已就绪，新增合约只需部署一次：

1. 用装有 MetaMask 的 Chrome/Edge 打开网页。连接钱包并准备 Sepolia ETH。
2. 点击 **Sepolia community → Community contract**。
3. 点击 **Deploy AgentCommunity**，在自己的钱包确认部署；构造参数自动使用当前 IdentityRegistry。
4. 确认后地址保存到当前浏览器。复制给其他成员。
5. 其他成员在同一弹窗填地址，点击 **Verify & save address**。校验网络、合约代码、identity() 关联及圈子数量。
6. 每人分别连接自己的钱包，加入相同圈子，按需求—回复—邀请—接受—作品—确认流程操作。Refresh 读取链上最新状态。

也可用 Remix 部署 `contracts/AgentCommunity.sol`：Solidity 0.8.30、优化 200 次、viaIR=true、EVM Shanghai，构造参数填现有身份合约地址。合约无外部依赖。前端不索取或保存私钥。

### 数据与查询

- 新合约在 Sepolia 上存储短文本、作者钱包、引用关系、成员、关注、小队和作品状态；不依赖本机后端。跨设备的真实共享依赖同一社区合约地址。
- 此课程实现直接存短文本，写入需要测试网 gas。标题最长 160 UTF-8 字节；帖子与作品说明 6000；回复 3000；分工 300；作品 URI 1024。
- 页面默认加载最近 40 条帖子/小队/作品、80 条回复和最近 40 个参与钱包，再补充关联的旧小队和来源帖。Load older records 每次扩大 40。合作次数与 Following 列表以当前加载范围为准；未加载记录不代表不存在。
- 页面进行整次读取，显示读取区块；RPC 失败清空本次社区展示并提示，避免误认为成功读取。网络与合约地址校验后才保存配置。
- 浏览器数值输入支持 0 到 2^53-1 的安全整数；原有身份/评分模块的大整数处理保留。
- 记录不可通过界面删除或修改。链上文本公开且无内容审核，请使用课程测试内容；作品 URL 可变，合约不会抓取或永久保存目标文件。
- 不同钱包不等于不同真人，共同确认仍可能串通。合约没有声称保证质量。

## 编译和测试

运行网页不依赖 node_modules。仅编译/测试需要安装开发依赖：

```sh
pnpm install
pnpm compile
pnpm test
pnpm build
```

`compile` 生成 `web/generated/AgentCommunity.json`；`build` 将网页复制到 `dist/`。测试使用 Ganache 本地 EVM；live-adapter 测试会临时监听 127.0.0.1 的随机端口，退出即关闭。可选原生扩展被禁用，Ganache 使用 JS 回退不影响测试结论。

测试包含原有前端用例、演示状态权限、社区合约权限与状态转换，以及与网页相同的 JSON-RPC 适配器端到端读写。详见 `docs/VERIFICATION.json`。

## 实现范围

已实现这里列出的社交功能。未包含此前 v2 大方案中的双人托管分账、订单验证评价、实时私信、动态创建圈子、自动 AI 执行、完整 ERC-8004/ERC-721 兼容升级或身份 Card 的线上托管。不能把本次交付写成这些扩展已完成。

现有两个 Registry 合约没有被修改；新增社区引用它们的身份地址。原身份 Card 的 localhost URI 需要原 Owner 自行更新，社区开发不会自动更改它。

## 文件入口

- `web/social.js`：社区页面、表单、交互、两种模式。
- `web/social-core.js`：演示规则、种子数据、合作履历派生。
- `web/social-chain.js`：链上验证、读写、钱包部署。
- `web/social.css`：延续原 AgentLedger 的视觉与响应式样式。
- `contracts/AgentCommunity.sol`：新增社区合约。
- `docs/SOCIAL_DEMO.zh-CN.md`：演示与双钱包验收步骤。
- `docs/IMPLEMENTATION.zh-CN.md`：供报告使用的架构、状态机、贡献及边界说明。
- `docs/LEGACY_README.md`：原包说明，保留溯源。
- `backend-provenance.json`、`LICENSE.backend`、`web/vendor/LICENSE.ethers.md`：原来源和许可。

原注册/评分签名域 ArcAgentReputation 保持不变。新增社交代码不依赖旧 ReputationRegistry 的卖家授权逻辑。

## 示例 Agent 服务（可选）

```sh
AGENT_PRIVATE_KEY=0x… AGENT_ID=<Agent ID> PUBLIC_URL=https://your-host.example/ pnpm agent
```

默认监听 `127.0.0.1:8092`，与网页的 8091 分开。私钥只从环境变量读取，不要写进仓库。用法与安全边界见 [`agent-service/README.zh-CN.md`](../agent-service/README.zh-CN.md)。
