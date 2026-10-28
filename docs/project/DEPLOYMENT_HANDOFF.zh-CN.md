# #5 社区部署与证据交接

状态：部署材料及核验工具就绪；未发送公链交易。用户尚未安装 MetaMask，真实 Sepolia 地址、回执和另一成员独立复核仍待完成。

## 钱包与部署

1. 在自己的 Chrome 中从 https://metamask.io/download 安装官方钱包。自行设置密码并保存恢复凭据，不在项目文件、群聊或报告记录这些凭据。
2. 创建用于课程的两个测试账户，启用 Sepolia，给部署账户准备测试 ETH。这里的操作只针对测试网。
3. 从 PR #13 的集成版启动网页，或使用包含本 PR 的分支。运行 `node scripts/serve.mjs`，在装有钱包的 Chrome 打开 http://127.0.0.1:8091 。
4. 连接部署账户；保持原 IdentityRegistry 与 ReputationRegistry 配置。切到 Sepolia community → Community contract → Deploy AgentCommunity，在钱包核对 Sepolia 后亲自确认。
5. 部署成功后复制社区地址，在同一设置页下载 **Download deployment evidence**。若记录显示 `deployed-verification-pending`，使用同一交易哈希重试只读核验，不要再次部署。
6. 将公开地址和证据提供给另一位成员，双方使用同一社区地址。另一成员运行下方只读核验并读取同样的空社区或公开记录。

部署只需要一次；身份和评分的原有合约不变。#3 合约审阅和本 PR 的同伴审阅仍应记录，不能把工具测试当作其他成员已审阅。

## 可复现材料

在已安装开发依赖且重新编译后运行：

```sh
node scripts/deployment-kit.mjs
```

输出 dist/deployment-kit/：Solidity 源码、标准编译输入、现有编译产物及 SHA-256 清单。参数为 Solidity 0.8.30、optimizer 200、viaIR=true、EVM Shanghai；构造参数填已有 IdentityRegistry 地址。材料状态明确标记 prepared-not-deployed。

## 独立只读核验

```sh
node scripts/verify-community.mjs --tx 0x实际部署交易哈希 --address 0x实际社区地址 --output community-deployment-evidence.json
```

工具不读取钱包私钥、不请求签名、不发送交易。它检查 Sepolia、成功回执、直接创建合约、实际地址、创建输入与仓库编译产物及构造参数逐字节匹配、IdentityRegistry 关联和三个圈子，然后记录区块、部署者、编译参数、代码哈希与确认数。失败不生成“已验证”记录。

浏览器下载记录与 CLI 使用相同的核验函数。源码提交 SHA 仍需记录为实际部署所用分支/PR 的提交，和 DEPLOYMENTS.md 一并提交；文件哈希或相同代码不自动证明 GitHub 的提交来源。

## #5 完成所需证据

- [ ] 实际 Sepolia 社区地址与部署交易。
- [ ] 区块、部署者公开地址、实际源码提交、编译器与编译参数。
- [ ] 另一位成员独立复核结果与测试记录。

本地 EVM 测试仅证明部署与回执核验逻辑可执行，以上三项没有真实证据前保持未勾选。
