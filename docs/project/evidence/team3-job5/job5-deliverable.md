# 小队 #3 / 订单 #5：跨模块核验交付说明

日期：2026-10-29（Asia/Shanghai）。此文件是 Account 2 为本次课程验收提交的实际说明文件，链上将记录本文件原始字节的 Keccak-256。文件生成由 Codex 协助，钱包签名与交易确认由用户完成。

## 核验对象

- 网络：Ethereum Sepolia，chainId 11155111；使用测试币，无商业价值。
- IdentityRegistry：0x13eA93eCdDeed63259792A39d7a4738a28b3E91d。
- AgentCommunity：0x8CDc9987D46D140a982713B359286bC451262406。
- JobEscrow：0x3C129b436247368dA71cC31512984c3DB17F1f63。
- 6 位小数 mUSD：0x6a920b13d6396B7b58BfE562c274Ea76a6409C85。
- 客户 Account 1：0xD3Ce5196125cd6e25212de4D04911093D3F62D5d。
- 服务方 Account 2：0xE8bCb71A15ea106aF0CD431C37C1002FeD938e20。
- 来源：圈子 #3、需求帖 #3、小队 #3、社区关联回复 #3、托管订单 #5。

## 已核实的链上事实

1. Account 2 调用 respondTeam(3,true)，小队状态变为 2 / Active。成功区块 12018477，交易 0x75954ced4369fd82ecd9ce40d410c2d6e9005c9855f7af6ab194473daaf63d46。
2. Account 1 按本次额度授权 1,000,000 个最小单位，即 1 mUSD。成功区块 12018515，交易 0xafab4fba0c46c76bac0da00bfd37d08cdf97bd0df1f3f33509de7f293aa04e10。
3. 实际 JobCreated 回执给出 jobId 5，服务方为 Account 2，providerAgentId 为 0，托管金额为 1,000,000；提交截止时间为 Unix 1793268600（2026-10-29 18:10:00 +08:00），reviewWindow 为 600 秒。成功区块 12018524，交易 0x591d029261a6aefbb1761eec080383e5f919e0dcef5e581c698aa03e93aa6f72。
4. Account 1 在来源帖 #3 发布前缀为 AgentLedger escrow link v1 的关联回复，replyId 为 3。成功区块 12018530，交易 0x86e974bfb368202532244598952557d9fb5abf23c27c848aa6c3ce655d7617b8。
5. 独立于浏览器存储的只读 RPC 读取，在区块 12018530 恢复并验证了此关联：来源帖为需求类型、小队已接受、付款人为小队成员、服务方为另一成员、Agent ID 与记录一致、支付代币一致、两个合约指向同一 IdentityRegistry、回复作者等于真实付款人。有效关联 1 条，无效或重复关联 0 条。
6. 该区块订单状态为 1 / Funded，A 为 97 mUSD，B 为 2 mUSD，托管合约总余额为 1 mUSD，A 的剩余授权额度为 0。此时尚未提交本文件摘要，也尚未付款；后续结算由独立回执记录。

## 浏览器验收与复现

已在真实 Sepolia 模式验证：小队工作区进入付费任务；托管页面的 Back to source discussion 打开需求帖 #3；来源讨论显示订单 #5 / 小队 #3 的关联；从 Verify linked tasks 返回托管模块并读取链上关联。Account 2 切换后仍可恢复来源与订单关系。

另一读者可配置以上公共合约地址，在 Task escrow 输入 Team ID 3，点击 Load team & linked tasks，再点击 Load task #5。检查客户、服务方、金额、期限及状态。关联读取来自链上回复，不需要创建者浏览器的 localStorage。

## 范围与边界

此为钱包身份 Agent ID 0 的跨模块流程，未证明非零 Agent NFT 的托管身份关联。关联由前端校验，合约不强制跨模块绑定；共同作品发布及信誉评价是另外的流程。本说明没有上传到公链，链上摘要只用于核对文件字节，不能证明服务质量或 AI 执行。付款成功后应另查 JobSubmitted、JobReleased 与 mUSD Transfer 回执，不能将本文件内的 Funded 快照当作付款成功证据。
