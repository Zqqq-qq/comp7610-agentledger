# AgentLedger 功能蓝图

> 初版依据 `main` 提交 `92420f7`（2026-10-27）。2026-10-30 按 `feat/blueprint-marketplace` 分支更新状态（ffmitrg，Claude Code 协助）。合约未改动、未重新部署。
> 图例：🟢 已完成　🟡 部分完成　⚪ 缺失

## 理想目标

**一个 AI Agent 的"接单市场"。** 卖家把 Agent 部署在自己的服务器上，在链上注册身份，名片写清楚服务地址、技能和价格。买家按评分挑选 Agent，一键下单，钱先进托管。Agent 完成任务并提交交付，买家验收放款。放款后买家自动获得评价资格，评分再回流到市场排名。社区模块让人和 Agent 组队协作，积累可追溯的合作记录。

## 理想闭环：一笔交易的完整路径

| 步骤 | 角色 | 做什么 | 现状 |
| --- | --- | --- | --- |
| 1 | 卖家 | 部署 Agent 服务：AI 程序跑在某台服务器上，对外提供接口 | 🟢 `agent-service/`：示例服务，名片 / 结果 / 按次付费接口 |
| 2 | 卖家 | 发布名片 JSON（服务地址、技能、价格），铸造身份 NFT，`tokenURI` 指向名片 | 🟢 名片标准 `agentledger-card-v1` + 注册页生成器 |
| 3 | 买家 | 浏览市场，按平均分、评价次数挑选 | 🟢 按评分 / 评价数 / 价格 / 最新排序，按最低分、技能筛选（作用于当前页） |
| 4 | 买家 | 从链上读 `tokenURI`，下载名片，解析出服务地址和价格 | 🟢 详情页渲染名片卡片，保留原始 JSON |
| 5 | 买家 | 一键下单：用 `ownerOf` 自动填收款钱包和 Agent ID，授权 mUSD 后创建订单 | 🟢 「Hire this agent」预填；托管合约已在 Sepolia |
| 6 | Agent | 监听订单事件，执行任务，提交交付哈希 | 🟢 示例服务自动 `submit`，结果文档可下载核对摘要（任务逻辑为占位） |
| 7 | 买家 | 验收放款；或超时退款、超时领取 | 🟢 已部署并在 Sepolia 验收（PR #22） |
| 8 | 买家 | 评价，评分回流市场排名 | 🟡 「我的订单」里卖家对已完成订单一键签发评价授权；合约层仍不强制绑定订单 |

## 功能全景图

```mermaid
flowchart LR
  subgraph SELLER["卖家 / Agent 主人"]
    direction TB
    S1["部署 Agent 服务<br/>某台服务器上的 AI 程序"]
    S2["发布名片 agent-card.json<br/>服务地址 · 技能 · 价格"]
    S3["注册身份 NFT<br/>tokenURI 指向名片"]
    S1 --> S2 --> S3
  end
  subgraph CHAIN["链上合约 · Ethereum Sepolia"]
    direction TB
    C1[("IdentityRegistry<br/>身份 NFT · ERC-721")]
    C2[("ReputationRegistry<br/>评分 0-100")]
    C3[("JobEscrow<br/>托管付款")]
    C4[("MockUSDC<br/>测试币 mUSD · ERC-20")]
    C5[("AgentCommunity<br/>圈子 · 帖子 · 组队 · 作品")]
  end
  subgraph BUYER["买家"]
    direction TB
    B1["浏览 Agent 市场<br/>按评分筛选排序"]
    B2["查看详情<br/>解析名片拿到服务地址"]
    B3["一键下单<br/>自动填收款地址"]
    B4["验收放款"]
    B5["评价<br/>与订单绑定"]
    B1 --> B2 --> B3 --> B4 --> B5
  end
  A1["Agent 服务收到订单<br/>执行任务"]
  A2["提交交付哈希"]
  S3 --> C1
  C1 -. 身份 .-> B1
  C2 -. 评分 .-> B1
  B2 -. 下载名片 .-> S2
  C4 -- 付款代币 --> C3
  B3 --> C3
  C3 -. 订单事件 .-> A1
  A1 --> A2 --> C3
  B4 --> C3
  B5 --> C2
  C1 -. 验证 Agent 归属 .-> C5
  C5 -. 小队关联订单 .-> C3
  classDef done fill:#e3f3e9,stroke:#1d7a46,color:#12351f,stroke-width:1.5px;
  classDef part fill:#fbefd9,stroke:#9a5b00,color:#3d2600,stroke-width:1.5px;
  classDef todo fill:#f1f2f4,stroke:#8a919c,color:#2c313a,stroke-width:1.5px,stroke-dasharray:5 4;
  class C1,C2,C3,C4,C5,S1,S2,S3,B1,B2,B3,B4,A1,A2 done;
  class B5 part;
```

## 现有功能盘点

"已上链"指合约已部署到 Sepolia。JobEscrow 与 MockUSDC 已于 2026-10-28 部署并写入 `web/config.js`（PR #22）。

| 模块 | 功能 | 对应合约 / 文件 | 状态 |
| --- | --- | --- | --- |
| 身份 | 注册 Agent，铸造身份 NFT（Agent ID 即 NFT 编号） | `IdentityRegistry.register` | 🟢 已上链 |
| 身份 | 修改名片链接、转让身份 | `updateRegistration` · `transferFrom` | 🟢 合约支持 |
| 身份 | Agent 目录：列出全部 Agent 及评分 | `web/app.js` · `loadRegistry` | 🟢 可用 |
| 身份 | Agent 详情：名片卡片、雇佣、按次付费、社区证据 | `web/app.js` · `showAgent` · `web/agent-card.js` | 🟢 可用 |
| 声誉 | Agent 主人签发评价授权（链下签名，不花 gas） | EIP-712 `FeedbackAuth` | 🟢 可用 |
| 声誉 | 评价人上链打分，查平均分；防自评、防重放、授权会过期 | `ReputationRegistry.giveFeedback` | 🟢 已上链 |
| 托管 | 领取测试币 mUSD | `MockUSDC.mint` | 🟢 已上链 |
| 托管 | 授权扣款，创建并注资订单 | `JobEscrow.createJob` | 🟢 已上链 |
| 托管 | 提交交付；放款 / 退款 / 超时领取 | `submit` · `release` · `refund` · `claim` | 🟢 已上链 |
| 托管 | 订单关联社区小队，跨设备恢复关联 | `web/escrow-links.js` | 🟢 已上链 |
| 社区 | 3 个圈子，加入 / 退出 | `AgentCommunity.setMembership` | 🟢 已上链 |
| 社区 | 发帖（讨论 / 任务 / 展示）、回复、关注 | `createPost` · `createReply` · `setFollow` | 🟢 已上链 |
| 社区 | 基于任务帖组队：邀请、接受、拒绝、取消 | `inviteTeam` · `respondTeam` · `cancelTeam` | 🟢 已上链 |
| 社区 | 共同作品：一人提交、另一人确认、合作次数 +1 | `proposeWork` · `reviewWork` | 🟢 已上链 |
| 社区 | 演示模式：不连钱包，在浏览器本地体验 | `web/social-core.js` | 🟢 可用 |
| 基础设施 | 钱包连接、多账户切换、自动切到 Sepolia | `web/wallet-session.js` | 🟢 可用 |
| 基础设施 | 部署证据导出、独立核验脚本、CI | `scripts/verify-community.mjs` | 🟢 可用 |
| 上游独有 | MCP 服务器：查 Agent、付款前信任检查、发现服务 | 上游 `registry/server.py` | ⚪ 未引入 |
| 上游独有 | x402 按次付费服务目录（本地 SQLite） | 上游 `registry/store.py` | ⚪ 未引入（本项目改为 `agent-service/` + `web/x402.js` 自带实现） |

## 要补的功能（2026-10-30 状态）

| 优先级 | 功能 | 实现 | 状态 |
| --- | --- | --- | --- |
| P0 | 部署托管合约 | PR #22，地址见 `web/config.js` | 🟢 |
| P0 | 名片标准与生成器 | `web/agent-card.js`（`buildCard` / `parseCard`），注册页「Generate an agent card」 | 🟢 |
| P0 | 名片解析展示 | 详情页卡片：名称、描述、技能、服务地址、单价、托管期限；不合法字段直接丢弃 | 🟢 |
| P0 | 一键雇佣 | 「Hire this agent」：收款钱包来自 `ownerOf`，价格和期限来自名片 | 🟢 |
| P0 | 示例 Agent 服务 | `agent-service/`：轮询订单、自动提交摘要、提供结果文档 | 🟢 任务逻辑为占位 |
| P1 | 市场筛选排序 | `web/market.js`：排序 4 种，最低分、技能、文本筛选 | 🟢 仅当前页（每页 15 个） |
| P1 | 评价与订单绑定 | 「我的订单」里卖家对已完成且绑定 Agent 的订单一键签发授权（复用 `jobToFeedback`） | 🟡 前端绑定；合约不校验订单，新合约未做 |
| P1 | 订单动态 | 托管页「My orders」：买家 / 卖家视角、状态与下一步提示 | 🟢 扫最近 100 个 Job ID |
| P2 | x402 按次付费 | `web/x402.js` + 示例服务 `/x402/run`：402 → 转账 → 带哈希重试 | 🟢 简化方案，见 `agent-service/README.zh-CN.md` |
| P2 | 社区与市场打通 | 详情页「Community evidence」：绑定该 Agent ID 的小队与已确认作品 | 🟢 读最近 50 条社区记录 |

仍未做：只允许完成订单的买家评价的新合约（需要新部署与迁移）、跨页的全量市场索引（需要索引服务）、按次付费已用哈希的持久化。
