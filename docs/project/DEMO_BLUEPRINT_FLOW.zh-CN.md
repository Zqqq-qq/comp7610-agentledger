# 蓝图 8 步完整演示脚本（Sepolia 实录）

2026-10-30，ffmitrg 使用 Claude Code 协助整理。对应 PR #59 的功能；在 #59 合并前，请在 `feat/blueprint-marketplace` 分支上录制。

预计时长约 7 分钟（不含开场介绍与社区部分）。每一步都给出点哪里、画面上应该看到什么、以及一句讲解词。

## 先彩排：本地分叉，不花钱、不用私钥

```sh
pnpm rehearse
```

脚本在本地 Ganache 上分叉 Sepolia，用**已部署的真实合约**跑一遍 8 步加按次付费，不广播任何交易。2026-10-30 实测全部通过。录制前跑一次，可以确认 RPC 和合约状态正常。

已知分叉限制：Ganache 7.9 执行不了已部署 IdentityRegistry 的 `tokenURI()`（Cancun 指令），脚本改从 `Registered` 事件读 URI。真实 Sepolia 上网页正常读取，不受影响。

## 录制前准备（真人完成）

| 项 | 谁 | 说明 |
| --- | --- | --- |
| 两个 MetaMask 测试账户 | 录制者 | **A = 使用者 / 付款方**，**B = Agent 主人 / 收款方**，都切到 Sepolia，各有少量 Sepolia ETH |
| 启动网页 | 录制者 | `pnpm dev`，浏览器打开 `http://127.0.0.1:8091`。必须用本地 http 打开：示例服务在 `http://127.0.0.1:8092`，https 页面会拦截它 |
| 启动示例 Agent 服务 | **B 本人** | 在 B 自己的终端运行下面的命令。私钥只放在这个终端的环境变量里，不要贴到聊天、文档或仓库 |
| 窗口 | 录制者 | 浏览器在前台，关掉通知；终端窗口放旁边，能拍到"submitted job"那一行日志 |

B 先在网页注册身份（第 2 步），拿到 Agent ID 后再启动服务：

```sh
AGENT_PRIVATE_KEY=<B 的测试私钥> AGENT_ID=<第 2 步得到的 ID> AGENT_NAME="Lingua translator" SKILLS="translation, research" PRICE=1 pnpm agent
```

## 分镜

| # | 时长 | 账户 | 操作 | 画面上应该看到 | 讲解词 |
| --- | --- | --- | --- | --- | --- |
| 1 | 0:30 | B | 终端运行 `pnpm agent`；浏览器打开 `http://127.0.0.1:8092/.well-known/agent-card.json` | 服务启动日志；名片 JSON，含服务地址、技能、单价、按次付费入口 | "Agent 跑在主人自己的服务器上，对外公开一张名片。" |
| 2 | 0:50 | B | **Register an agent**：右侧「Generate an agent card」可演示生成；左侧 URI 填 `http://127.0.0.1:8092/.well-known/agent-card.json` → Register on-chain → MetaMask 确认 | 「Agent #N is registered」和交易链接 | "注册身份 NFT，链上只记名片的地址，名片本身在链下。" |
| 3 | 0:40 | A | **Agent registry** → 排序选 *Highest score*，技能框输入 `translation` | 列表行显示名片名称、技能、单价；筛选后只剩这个 Agent | "使用者按口碑和技能挑选。" |
| 4 | 0:40 | A | 点 **View** | 名片卡片：描述、技能、服务地址、单价、托管期限；下方「Community evidence」 | "名片解析成卡片。收款地址不是从名片读的，而是从链上 `ownerOf` 读的。" |
| 5 | 1:10 | A | **Hire this agent** → 托管页已自动填好 → 「Need test mUSD?」铸 100 → **1. Approve** → **2. Create & pay** | 收款钱包、Agent ID、金额已填；两笔交易成功；Job ID | "一键雇佣：钱先进托管合约，不经过任何第三方。" |
| 6 | 0:40 | — | 等 15–30 秒，切到终端 | 终端出现 `submitted job <ID> digest 0x…`；网页 Load/refresh 后状态变成 Submitted | "Agent 服务自动发现订单、执行、提交交付摘要。" |
| 7 | 1:00 | A | 打开 `http://127.0.0.1:8092/results/<ID>` 另存为文件 → 托管页「Hash a local file」选这个文件 → 与详情里的 DELIVERY DIGEST 对比 → **Accept & release payment** | 两个摘要一致；状态 Completed；B 的余额增加 | "先核对交付物的哈希，再放款。" |
| 8 | 1:00 | B → A | 切到 B，「My orders」→ **Authorize client review** → 签名 → 复制 JSON；切到 A → Submit feedback → 打分 | 订单列表显示 Completed 和下一步提示；评价上链；注册表评分更新 | "只有完成订单后，卖家才会给这位买家签发评价授权。" |
| P2 | 0:40 | A | 回到 Agent 详情 → **Pay & call** → 确认 → MetaMask 签付款 challenge → 确认 mUSD 转账 | 结果 JSON；交易链接 | "小额调用不走托管：服务端返回 402，付款人签 challenge 后直接拿结果。" |
| 失败路径 | 0:30 | B | 第 7 步放款前切到 B，重新 Load 这个任务 | 「Accept & release」不可点，角色提示写着 B 只能提交或超时领取；合约同样会以 `not client` 拒绝（已有回归测试） | "按钮跟着链上角色和状态走，收款方不能替付款方放款。" |

## 必须如实说明的边界

- 示例 Agent 的"任务"是占位逻辑，交付的是一份说明文档，不是真实 AI 结果。
- 评价授权是前端在完成订单后引导卖家签发的，**合约本身不检查付款记录**。
- 名片里的价格和服务地址是主人的声明；收款地址只认链上 `ownerOf`。
- 用 `127.0.0.1` 地址注册的名片，别人的电脑读不到。这种注册只适合录制，共享演示要换成公网地址。
- 按次付费是直接转账，没有托管、不能退款；付款人需先签一次性 challenge 再签转账（两次钱包确认），公开交易哈希不能代替付款人签名。
- 交付文件写入 `AGENT_RESULTS_DIR`，服务重启后 `/results/:id` 仍可核对；已用支付哈希只在内存中去重（1 小时时效内重启可重放）。

## 录制后

- 把第 2、5、7、8 步和 P2 的交易哈希记到 `DEPLOYMENTS.md` 或新的验收记录里。
- 视频与冻结版本要对应同一个提交（#11）。
