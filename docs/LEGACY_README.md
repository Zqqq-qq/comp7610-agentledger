# Agent Ledger · COMP7610 作业前端

全新设计的 Ethereum Sepolia 身份与声誉工作台。使用 HTML、CSS、原生 JavaScript 与本地打包的 Ethers.js 6.13.4；无需 npm 安装或构建。

## 运行

本机 PowerShell：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File 'D:\7610final project\assignment-frontend\start-frontend.ps1'
```

打开 **http://127.0.0.1:8090**。保持终端运行，Ctrl+C 停止。脚本只对启动的 PowerShell 进程设置执行策略，不永久改系统设置。

其他电脑如果已有 Python：

```powershell
py -3 -m http.server 8090 --bind 127.0.0.1 --directory '.\web'
```

也可通过启动脚本的 `-PythonExe` 参数指定自己的 python.exe。`-Port` 可修改端口；更改后，本地 Agent Card 的 URL 也要相应调整。

## 使用已有后端

**不需要重新部署。** 在页面右上角 **Contracts** 填入你已经部署到 Ethereum Sepolia 的 IdentityRegistry、ReputationRegistry 地址。

保存前，前端会检查 RPC chainId=11155111、两份合约存在字节码、评分合约的 identity() 指向填写的身份合约。失败时不会覆盖当前已保存的配置；可点击 dRPC backup 切换公共 RPC。

当前源码里没有你的真实部署地址：它们此前保存在原浏览器的站点存储中。8090 是新的来源，需要重新填写；原来 8082 的部署及链上数据保持有效。

若要把地址随源码一起提交，可编辑 web/config.js 中公开的 identity、reputation 地址。不要填写私钥、助记词或需要保密的服务端凭据。

## 功能与演示顺序

1. **Agent registry**：查询已有身份、Owner、URI、链上平均分和评价数量；可以查看详情及纯文本元数据。
2. **Register an agent**：连接 A，填写 URI，钱包确认，前端等待成功回执并从 Registered 事件取得真实 Agent ID。
3. **Reputation → Authorize a reviewer**：选择 A，填写 Agent ID 和 B 的地址，签署 EIP-712 授权。签名不发送交易，不消耗 gas。
4. 复制授权 JSON。打开右上角钱包菜单，使用账户下拉框选择已授权的 B；若 B 未出现，点击 **Choose another account**，在钱包权限窗口允许 B。
5. **Submit feedback**：使用 B，粘贴 JSON、填写整数评分，钱包确认。前端会在发送前核对客户地址、当前 Owner、签名、网络、评分合约及已使用 nonce。
6. **Refresh** 后在列表读取链上结果，点 Etherscan 链接核对交易。

账户变更不会刷新页面或清空授权 JSON。应用使用 getSigner(选中的地址)，避免默认取到授权列表中的第一个 A。断开应用会结束当前界面会话；撤销站点权限仍由 MetaMask 管理。

“Use the local example card” 使用 web/.well-known/agent-card.json。localhost 资料只在本机可访问，公开演示需换成公开 HTTPS / IPFS URI。

## 后端没有改动

contracts 目录是现有 sepolia-remix/contracts 的逐字节副本；没有修改任何 Solidity 文件。backend-provenance.json 记录来源与 SHA-256。

- IdentityRegistry.sol：原身份合约。
- ReputationRegistry.sol：原评分合约。
- JobEscrow.sol：保留原托管合约；新界面没有扩展托管功能。
- MockUSDC.sol：保留之前运行包中的可选演示代币。

原目录中的 Python MCP、部署脚本、合约及已有网页都没有被覆盖。原项目 MIT 许可证见 LICENSE.backend。新前端保留签名域名称 **ArcAgentReputation**，不能因界面名称变化而修改它。

## 数据与限制

- 页面没有预设 Agent、虚构分数或模拟链上交易。未知数据以 — 显示；没有评价时显示 No reviews，和真正的 0 分区分。
- 列表每页最多读取 15 个 Agent，搜索和 Owner 过滤作用于当前页。单条读取失败时提示失败数量，不把失败分数伪装成 0。
- Recent transactions 只保存本浏览器等待到成功回执的交易，并按合约配置区分。它不是全链历史索引。
- 授权是现有合约的权限证明，不是付款证明；评分不等于服务质量保证。
- 元数据在用户点击 Fetch metadata 后请求，按纯文本/JSON 显示，不执行其中的 HTML。IPFS URI 可登记，当前界面不提供网关代理。
- 写入仍需用户在钱包确认。本项目不保存私钥。

## 测试

安装了 Node.js 的电脑可在项目目录执行：

```powershell
node --test tests/frontend.test.mjs
```

本机也可使用现有运行时：

```powershell
& 'C:\Users\29442\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/frontend.test.mjs
```

测试覆盖错误网络/合约/过期授权、原格式 JSON 兼容性、大整数 ID、评分与字节长度、危险 URI、账户 B 选择与 EIP-712 签名域。测试不访问用户钱包，不发送交易。

真实 Sepolia 注册和评分需按 docs/验收与演示步骤.md 手动验证。不能把前端单元测试当作真实链上交易证据。

## 文件与来源

- web/index.html、styles.css：新界面及响应式布局。
- web/app.js：钱包、读链、合约调用、回执与界面状态。
- web/core.js：输入验证、授权解析及账户选择。
- web/config.js：公开网络/地址默认配置。
- web/vendor：固定版本 Ethers.js 及其许可证，运行不依赖远程 JS CDN。
- 上游后端：https://github.com/Mnorbert87/arc-agent-registry ，提交 3b7976a5bbcfe8fac063adfe07fd1244b2bf69de。
- Ethers.js：https://github.com/ethers-io/ethers.js ，版本 6.13.4。

提交时应说明后端复用来源、前端重做内容和小组实际贡献。运行代码不替代课程要求的视频、PDF 报告和个人提交。
