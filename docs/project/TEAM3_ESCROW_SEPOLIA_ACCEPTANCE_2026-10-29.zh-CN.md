# 小队 #3 跨模块 Sepolia 验收完成记录

日期：2026-10-29（Asia/Shanghai）。需求帖 #3 → 小队 #3 → 社区回复 #3 → 托管订单 #5 的接受邀请、1 测试 mUSD 注资、关联、真实文件摘要交付和客户验收付款全部完成。全部钱包签名和交易确认由用户亲自执行。

## 最终结果

- 小队 #3：2 / Active；托管订单 #5：3 / Completed。
- 客户 Account 1：0xD3Ce5196125cd6e25212de4D04911093D3F62D5d。
- 服务方 Account 2：0xE8bCb71A15ea106aF0CD431C37C1002FeD938e20。
- 金额：1,000,000 个最小单位，即 1 mUSD（6 位小数）。
- 付款前后：A 97 → 97 mUSD；B 2 → 3 mUSD；托管总余额 1 → 0 mUSD。
- 对比本轮注资前：A 98 → 97 mUSD；B 2 → 3 mUSD；A 剩余授权额度 0。
- JobReleased(5,B,1000000) 与 mUSD Transfer(escrow,B,1000000) 同时存在于成功付款回执。
- 交付文件：[job5-deliverable.md](evidence/team3-job5/job5-deliverable.md)。链上摘要与文件字节的 Keccak-256 完全匹配：`0xd878a5668315cecb038d161e9df7f8cd9a652430c47e927288084ed2056d29ad`。

## 成功交易

以下六笔回执 status 均为 1。时间为链上区块时间，UTC+08:00。

| 步骤 | 区块 | 时间 | 交易 |
| --- | --- | --- | --- |
| Account 2 接受小队 #3 | 12018477 | 17:02:12 | [0x75954ced…aaf63d46](https://sepolia.etherscan.io/tx/0x75954ced4369fd82ecd9ce40d410c2d6e9005c9855f7af6ab194473daaf63d46) |
| Account 1 授权 1 mUSD | 12018515 | 17:09:48 | [0xafab4fba…3aa04e10](https://sepolia.etherscan.io/tx/0xafab4fba0c46c76bac0da00bfd37d08cdf97bd0df1f3f33509de7f293aa04e10) |
| Account 1 创建并托管订单 #5 | 12018524 | 17:11:36 | [0x591d0292…93aa6f72](https://sepolia.etherscan.io/tx/0x591d029261a6aefbb1761eec080383e5f919e0dcef5e581c698aa03e93aa6f72) |
| Account 1 发布关联回复 #3 | 12018530 | 17:12:48 | [0x86e974bf…5d7617b8](https://sepolia.etherscan.io/tx/0x86e974bfb368202532244598952557d9fb5abf23c27c848aa6c3ce655d7617b8) |
| Account 2 提交真实文件摘要 | 12018547 | 17:16:12 | [0xdfcf6ceb…1e72c00b](https://sepolia.etherscan.io/tx/0xdfcf6ceb8677a6eea1783fc9d0dec96a1a4cdd8c801065c372730c1b1e72c00b) |
| Account 1 验收付款 | 12018556 | 17:18:00 | [0xd3579e08…008e8b58](https://sepolia.etherscan.io/tx/0xd3579e0854b0f4e2b39ecd51e57a211ed5a8acec9b037effe9b7342e008e8b58) |

## 跨模块与权限验收

已观察真实浏览器路径：Active 小队工作区进入付费任务；订单关联区域 Back to source discussion 打开来源需求帖 #3；原帖显示订单 #5 / 小队 #3；Verify linked tasks 返回托管页面并重新读取有效关联。Account 2 切换后仍能恢复引用。独立只读 RPC 读取不依赖浏览器 localStorage，恢复的标准关联为回复 #3。

关联校验覆盖 Sepolia 网络、配置地址、共同 IdentityRegistry、来源需求类型、小队来源和已接受状态、付款人属于小队、服务方为另一成员、记录的 Agent ID、支付代币、真实订单存在及引用作者等于付款人。最终仍可恢复唯一有效关联。额外只读 eth_call 模拟重复 release(5)，返回 `not submitted`；该模拟没有签名或发送交易。

## 复现与证据

- [完整链上证据](evidence/team3-job5/acceptance.json)：包含固定区块状态、六笔交易与回执、解码事件、注资和付款前后区块余额、有效关联与重复放款拒绝结果。
- [交易索引](evidence/team3-job5/transaction-index.json)。
- [只读核验脚本](../../scripts/verify-team3-acceptance.mjs)。使用仓库自带的 ethers 与 ABI，无私钥、无 signer、无广播交易。

```sh
node scripts/verify-team3-acceptance.mjs
# 可选：把本次复现写入一个不存在的新文件（不覆盖仓库证据）
node scripts/verify-team3-acceptance.mjs --output /tmp/team3-job5-reproduction.json
```

首次取证时（2026-10-29 17:19 +08:00）完整只读核验实际通过，形成下列原始证据。证据固定区块为 12018561，哈希 `0xcc94173092edb23b38f6279c62f9723409eb1d8598763b0e3cf64ce8f42aa891`。入库的 acceptance.json 与原始取证文件字节一致。核验脚本固定读取同一区块及哈希，包含关联扫描也固定在该区块；默认只输出摘要，--output 仅可写入证据目录外不存在的新文件。不会覆盖原始快照，也不会在历史状态不可用时退回 latest。历史余额复现需要保留指定区块的 RPC，可通过 SEPOLIA_RPC_URL 指定。六笔交易输入和回执还会与归档逐项比对。

入库时再次复读：六笔交易输入/成功回执与原归档完全一致，完成区块状态和关联读取通过；随后在复读注资前区块 12018523 的余额时，publicnode 返回 `historical state ... is not available`，整轮以非零退出，未生成声称完整成功的新证据。备用 sepolia.drpc.org 返回免费套餐不提供该网络。因此本次入库不将该次复读记为“完整固定区块复现通过”；旧余额快照按原始文件保留，后续完整复算须提供能读上述区块的归档 RPC。仓库常规 64 项自动测试、构建与合约产物检查已通过。

执行工作副本为 e9c3e3976cd5fe90ca91aa7aed0f539d211556df；本轮已核对 web/、contracts/、scripts/serve.mjs 的 Git blob 与 GitHub main 提交 a2b38c98356e287f7e072944aeca52947bda3887 的对应文件一致，无需改动合约或前端源文件。

## 实际范围

本轮只使用 Sepolia 测试 mUSD。Account 1 / Account 2 为同一用户控制的两个账户，不等于两位成员独立操作或同伴复审。本轮六笔交易不包含前一天已存在的需求帖创建与组队邀请。独立 RPC 复现证明读取不依赖浏览器存储，本轮没有新增第二台设备签名或跨设备实测。双方 Agent ID 为 0，未验收非零 Agent NFT 订单、共同作品发布或信誉评价。跨模块引用由应用校验，托管合约不强制绑定社区记录。文件摘要用于核对交付字节，不能证明质量。余额变化与匹配的 Transfer 事件共同证明本轮测试付款；固定区块数据是观察快照。

## 文件字节与报告整合

原交付文件共 3518 字节，保持原始 UTF-8 / LF，未为更新说明而修改；特定路径的 .gitattributes 固定 LF，防止 Windows 自动行尾转换改变链上摘要。其归档旁附字节数、Keccak-256 与 SHA-256 清单。

本记录补充了 2026-10-28 只覆盖独立钱包订单的旧托管验收。报告编写者可引用此记录更新小队 #3 的后续状态，并区分原有 post 4 / team 4 / job 4 的另一组验收记录；不能把两组账户、订单和余额混合计数。
