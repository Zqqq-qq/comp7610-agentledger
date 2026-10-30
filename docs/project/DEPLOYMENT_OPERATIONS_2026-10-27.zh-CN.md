# AgentCommunity 部署操作记录（2026-10-27；2026-10-30 补记）

本记录补充英文报告 §5.3 的 17.18M 部署 gas 操作背景。它区分当时保存的材料、历史源码和部署者后续回忆；不是一次新部署，也不是新的链上取证。未知项不以推测补齐。

## 对应哪一笔部署

| 项目 | 保存的值 |
| --- | --- |
| 网络 | Ethereum Sepolia / chainId 11155111 |
| 合约 | `0x8CDc9987D46D140a982713B359286bC451262406` |
| 部署者 A | `0xD3Ce5196125cd6e25212de4D04911093D3F62D5d` |
| 交易 | `0x8a537cd6c49e68d4f2301683146bcabc0acc9a2bbde89e797b08dedb80a8ddc5` |
| 区块 | 12005434 |
| 构造参数 IdentityRegistry | `0x13eA93eCdDeed63259792A39d7a4738a28b3E91d` |

另一成员的 `0xe398…68ac` 是另一笔部署，其费用与操作设置不能用于补齐 A 的钱包记录。

## 部署工具与应用侧行为

- [当日验收记录](SEPOLIA_ACCEPTANCE_2026-10-27.zh-CN.md)记载 Chrome + 官方 MetaMask 13.54.0；钱包凭据及最终签名由用户亲自处理。[交接说明](DEPLOYMENT_HANDOFF.zh-CN.md)记录本地项目网页的操作路径：`node scripts/serve.mjs` → `http://127.0.0.1:8091` → Sepolia community → Community contract → Deploy AgentCommunity。交接说明保留了复现步骤，不能单凭这些步骤还原每一次点击或钱包输入。
- [部署证据](evidence/community-sepolia-deployment.json)记录实际使用本地 `afb52eb` 检出版本，部署源码/产物对应远端 `fb6c325175675f210f5dd1b0fba54657043f3701`。编译器为 solc 0.8.30，optimizer enabled / runs 200、viaIR=true、EVM Shanghai。不是根据当前 main 反推当时参数。
- 该[历史源码中的部署函数](https://github.com/Zqqq-qq/comp7610-agentledger/blob/fb6c325175675f210f5dd1b0fba54657043f3701/web/social-chain.js)使用浏览器 ethers.js 的 `new e.ContractFactory(a.abi,a.bytecode,signer).deploy(registry)`，未显式传入 `gasLimit`、`gasPrice`、`maxFeePerGas` 或 `maxPriorityFeePerGas` 覆盖参数。这只能确认应用调用方式；ethers/provider 和钱包后续填入什么值、用户是否编辑，不能由这行代码确定。
- 没有材料支持将此次广播工具写成 Remix、命令行私钥部署或 `deployment-kit.mjs`。后者用于准备编译材料，不是这笔交易的广播证据。

## 是否手调 gas：未确认

2026-10-30 整理本说明时，部署者对“是否在 MetaMask 手动修改过 gas limit 或费用”的答复为：**“记不清，记录为未确认”**。

因此，报告原先的“1.5 gwei，为钱包默认值 / the wallet default”缺少依据，予以撤回。当前材料没有保存当时的钱包确认画面、建议档位、手动输入值或交易请求中的 gas/费用上限。不能将“应用没有覆盖参数”等同于“钱包使用默认值”，也不能写成部署者确认未手调。

## gas 数值来源及边界

来源是 2026-10-28 保存的[只读审计 JSON](evidence/pr19-reproducible-audit.json)中 `deployments[0].receipt`，背景与节点限制见 [PR19 复现记录](PR19_REPRODUCTION.zh-CN.md)。本补记没有重新读取或改写该历史快照。

| 字段 | 保存的原值 / 换算 |
| --- | --- |
| status | `0x1` |
| gasUsed | `0x1062f9a` = 17,182,618 |
| effectiveGasPrice | `0x59682f0e` = 1,500,000,014 wei（约 1.5 gwei） |
| 费用 | 17,182,618 × 1,500,000,014 = 25,773,927,240,556,652 wei = 0.025773927240556652 测试 ETH |

`gasUsed` 是保存回执中的消耗值，不是已知的钱包 gas limit。该快照未保留这笔交易的 gas limit、maxFeePerGas 或 maxPriorityFeePerGas，不能从 effectiveGasPrice 反推出这些值或用户操作。原始部署 JSON 主要证明创建输入/运行时代码匹配，不包含上述费用字段；费用来源应引用只读审计 JSON。

**仍未知：** 钱包当时如何估算及展示 gas、用户是否改过限制/费用、最终 gas limit 与费用上限，以及 17.18M gas 的执行层组成。没有交易 trace 或同一历史状态/规则下的重放，本记录不归因为 gas limit 设置、MetaMask 行为或协议规则变化。RPC 返回的异常数值也不自动构成独立链历史认证。

本次已补齐可追溯的工具和操作背景，并明确部署者记忆边界；不宣称已完成 gas 成因分析。后续如获得原始交易对象、钱包画面或执行跟踪，应注明新增证据来源和采集时间，再修订结论。
