# 示例 Agent 服务

对应蓝图步骤 1（部署 Agent 服务）、6（监听订单、自动交付）和 P2（x402 按次付费）。零依赖，复用 `web/` 下的 ethers 与校验代码。

## 它做什么

| 路径 / 动作 | 说明 |
| --- | --- |
| `GET /.well-known/agent-card.json` | 按 `agentledger-card-v1` 生成的名片：服务地址、技能、单价、托管期限、按次付费入口 |
| 轮询 JobEscrow | 每 15 秒扫最近 50 个 Job ID；`provider` 是本钱包、`providerAgentId` 等于 `AGENT_ID`、状态 Funded 且未过期的订单，生成结果文档并 `submit(jobId, keccak256(文档))` |
| `GET /results/:jobId` | 返回上面那份结果文档的**原始字节**。使用者下载后用托管页「Hash a local file」核对，摘要应与链上 `deliverable` 一致，再放款 |
| `GET /x402/run?input=…` | 未付款返回 HTTP 402 和付款要求；付款后带 `X-PAYMENT` 重试，返回结果和 `X-PAYMENT-RESPONSE` |
| `GET /health` | 钱包、Agent ID、已处理订单数 |

`defaultWork` / `defaultRun` 只是占位逻辑（生成说明文字、统计输入文本）。接入真实模型时替换 `agent.mjs` 里这两个函数即可，其余流程不变。

## 运行

先用服务钱包在网页「Register an agent」注册身份，记下 Agent ID。名片 URI 填 `PUBLIC_URL/.well-known/agent-card.json`。

```sh
AGENT_PRIVATE_KEY=0x… AGENT_ID=7 PUBLIC_URL=https://your-host.example/ pnpm agent
```

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `AGENT_PRIVATE_KEY` | 必填 | 服务钱包私钥，只放在进程环境里，**不要提交、不要写进 `web/config.js`**。建议用只装少量 Sepolia ETH 的专用测试钱包 |
| `AGENT_ID` | 必填 | 必须归该钱包所有，启动时会用 `ownerOf` 检查 |
| `PUBLIC_URL` | `http://HOST:PORT/` | 写进名片的公开地址 |
| `PORT` / `HOST` | `8092` / `127.0.0.1` | 监听地址；对外服务时放在反向代理后面 |
| `RPC_URL` | `web/config.js` 的 `rpcUrl` | Sepolia RPC |
| `PRICE` / `CALL_PRICE` | `1` / `0.1` | 托管单价、按次单价（mUSD） |
| `AGENT_NAME` / `SKILLS` | 示例值 | 名片里的名称和技能标签（逗号分隔） |
| `POLL_SECONDS` | `15` | 轮询间隔，最少 5 秒 |

## 按次付费（x402 简化版）的边界

- 标准 x402 的 `exact` 方案依赖 EIP-3009 `transferWithAuthorization`，MockUSDC 没有这个函数，所以这里用 `agentledger-erc20-transfer`：使用者先发一笔普通 `transfer` 给 Agent 钱包，再把交易哈希放进 `X-PAYMENT` 重试。
- 服务端核对：交易已确认且成功；Transfer 日志来自配置的 mUSD、`from` 等于交易发起人、`to` 等于 Agent 钱包、金额足够；交易不超过 1 小时；每个哈希只能用一次。托管合约放款给 Agent 的转账（`from` 是托管合约）不能拿来白用。
- 已用哈希保存在内存里，重启后会清空；真正上线要换成持久存储。
- 直接转账**没有托管、没有退款**。网页在付款前会确认金额，并要求收款地址等于该 Agent NFT 的当前 `ownerOf`。

## 测试

`tests/agent-service.test.mjs` 在 Ganache 上部署真实合约，跑通：名片 → 雇佣预填 → 自动交付并核对摘要 → 「我的订单」两种视角 → 402 → 付款 → 重放被拒 → 托管放款转账不能冒充付款。
