# 提交版本冻结草案（R1 输入材料）

- 关联任务：[#11 R1](https://github.com/Zqqq-qq/comp7610-agentledger/issues/11)
- 归属角色：release · @daizhiqi（本文**不是**认领，只是把汇总所需的事实先备好）
- 撰写：D · @QiuQiu-xuan，2026-10-28
- 状态：**草案**，冻结 SHA 需在 #28 / #29 合并、#8 收口后重新固定

> 为什么由 D 起草：R1 要汇总的多数事实（冻结候选回归、链上回执、产物一致性、测试演进）在 D 的验收记录里，先整理成表可以让 release 直接取用。最终确认与提交仍由 release 负责。

## 一、冻结候选

| 项 | 值 |
| --- | --- |
| 候选提交 | `3e473c36e867f5c4f5bff8e5d5ff570475956d66`（main，2026-10-28 16:14 +08:00） |
| 测试 | **64 / 64 通过** |
| 构建 | `pnpm build` 成功 |
| 工作区 | 测试与构建后保持干净 |
| 未并入的待评审改动 | PR #28（macOS 记录）、PR #29（D1 收尾复核） |
| 版本标记 | 仓库当前**无 tag**；建议冻结时创建 `v1.0.0-submission` 并附本表 SHA |

**重新固定的触发条件**：#28 / #29 合并、#8 关闭、或 main 有任何新提交。任一发生后，本表 SHA、测试数与产物校验和都要重算。

## 二、阻断问题清单

| Issue | 标题 | 状态 | 阻断提交？ | 说明 |
| --- | --- | --- | --- | --- |
| #8 | D2 验证 CI、跨平台启动与冻结版本回归 | 开 | **是** | macOS 已跑通 install/test/build；缺「带 GitHub 凭据的真实 clone」 |
| #9 | E1 更新报告与架构图 | 开 | **是** | 报告未更新到实际实现 |
| #10 | E2 演示录屏与彩排 | 开 | **是** | 视频与彩排未产出 |
| #11 | R1 汇总冻结版本与提交物 | 开 | **是** | 本任务本身 |
| #1 | A1 六类界面交互与手机布局 | 开 | 否 | PAisHere 长期失联，Zqqq-qq 已接手；未完成但不影响功能验收 |
| #2 | A2 小队与作品状态提示 | 开 | 否 | 无人认领；属体验打磨 |
| #4 | B2 内容边界与产物一致性复核 | 开 | 否（建议做） | 主要事实已由 CI 与 D 的产物比对覆盖，缺一份成文复核 |
| #6 | C2 账户切换与跨设备共享 | 开 | 否 | 三条验收已完成，等同伴确认 |
| #30 | 退圈后仍可提议/确认作品 | 开 | 否 | 设计问题，非缺陷；已记录并提出两种处置方案 |
| #3 / #5 / #7 / #12 | B1 / C1 / D1 / C3 | 关 | — | 已验收关闭 |
| #20 / #21 / #25 | 三个缺陷 | 关 | — | 均已修复并合入 |

## 三、版本一致性映射

提交物必须互相对得上。下表的每一列都指向**同一版本**：

| 维度 | 值 | 复核方式 |
| --- | --- | --- |
| 源码 | `3e473c3` | `git rev-parse HEAD` |
| 合约（社区） | `0x8CDc9987D46D140a982713B359286bC451262406` | `web/config.js`；`verify-community.mjs` |
| 部署交易 / 区块 | `0x8a537cd6c49e68d4f2301683146bcabc0acc9a2bbde89e797b08dedb80a8ddc5` / 12005434 | 回执 `status=1` |
| 部署者 | `0xD3Ce5196125cd6e25212de4D04911093D3F62D5d` | 回执 `from` |
| 构造函数参数 | `["0x13eA93eCdDeed63259792A39d7a4738a28b3E91d"]` | 创建输入解码 |
| 运行时代码哈希 | `0x42953724f77e05c99bf2f08f5faa057211268ec0973fe17e59cd072f61cafde7` | `eth_getCode` → keccak |
| 创建代码哈希 | `0x71c9098723ea3e4b4929493ebd3ddccfce0b684ddf95566332795e1c672f91e0` | 创建交易输入 → keccak |
| 托管合约 | `0x3C129b436247368dA71cC31512984c3DB17F1f63`（JobEscrow） | PR #22 的验收记录 |
| 支付代币 | `0x6a920b13d6396B7b58BfE562c274Ea76a6409C85`（mUSD，6 位小数） | 同上 |
| 报告 | `docs/project/ACCEPTANCE_D1`、`ACCEPTANCE_D2`、`SEPOLIA_ACCEPTANCE_2026-10-27`、`ESCROW_SEPOLIA_ACCEPTANCE_2026-10-28`、`FROZEN_CANDIDATE_REGRESSION_2026-10-28`、`REVIEW_B1_AGENTCOMMUNITY_2026-10-28` | 均在 main |
| 视频 | 未产出（#10） | 提交前需与最终 SHA 对应 |
| 贡献记录 | `docs/project/CONTRIBUTIONS.md` | 提交前需含 E/R 的条目 |

## 四、提交物清单与校验和

在候选 `3e473c3` 上实测（`Get-FileHash -Algorithm SHA256`）：

| 文件 | 字节 | SHA-256 |
| --- | --- | --- |
| `web/generated/AgentCommunity.json` | 42739 | `026410e7c2c8b38867c8db6147adeb2d3c6d04b28ad2b50bc80988998f081a85` |
| `contracts/AgentCommunity.sol` | 9212 | `ccbdcee86e97a46380ce83afb914d12067ed59192f843d559e13f6086fd8a8c3` |
| `contracts/IdentityRegistry.sol` | 5774 | `44033281eef840c8e7117cf38caf62b43acdb104e5eff8cd29a7ab5f9824cc72` |
| `package.json` | 432 | `2aa11140591c83b84d07076b5a465f1b87767ffe08a1a5fcd28a2196c5f413f2` |
| `pnpm-lock.yaml` | 10534 | `432381fa4b5845f3f7bb48ebd67832201fc0a642e8b7fdddbaf7beb7bc3e2501` |

**行尾一致性**：`.gitattributes` 固定 `*.sol` 与生成产物为 LF；Windows 下若按 CRLF 检出，solc 的 metadata 哈希会变，产物就不再字节一致（这是 PR #15 修掉的缺陷）。提交前应在干净克隆里跑一遍 §五 的自检。

## 五、复现与自检（提交前必跑）

```sh
git clone https://github.com/Zqqq-qq/comp7610-agentledger.git
cd comp7610-agentledger
git rev-parse HEAD                      # 应为冻结 SHA
pnpm install --frozen-lockfile
pnpm test                               # 预期 64 项通过
pnpm build                              # 预期成功
git status --short                      # 预期为空
git diff --exit-code -- web/generated/AgentCommunity.json   # 预期通过（产物未被改写）
node scripts/verify-community.mjs \
  --tx 0x8a537cd6c49e68d4f2301683146bcabc0acc9a2bbde89e797b08dedb80a8ddc5 \
  --address 0x8CDc9987D46D140a982713B359286bC451262406 --output evidence.json
```

最后一条应输出 `creationBytecodeHash` / `runtimeCodeHash` 与 §三 一致。

## 六、备份清单

| 对象 | 备份内容 | 位置建议 |
| --- | --- | --- |
| 源码 | 冻结 SHA 的 `git archive` 包 | 课程提交目录 + 个人云盘 |
| 合约 | `AgentCommunity.json`（ABI + bytecode）与两个 `.sol` | 同上 |
| 回执 | 9 笔社区交易 + 部署交易 + 托管交易的哈希清单 | 同上（Etherscan 链接即可复核） |
| 证据 | 截图 21 张 + `EVIDENCE.md` 索引 | 同上 |
| 文档 | `docs/project/` 下全部验收与复核记录 | 同上 |
| 视频 | #10 产出的录屏 | 同上 |
| 贡献记录 | `CONTRIBUTIONS.md` | 同上 |

## 七、待 release 确认的事项

1. **冻结 SHA**：等 #28 / #29 合并、#8 关闭后再定，本文的 SHA 与校验和随之失效需重算。
2. **版本标记**：建议 `v1.0.0-submission`；创建 tag 与 release note 由 release 执行。
3. **#8 的收口口径**：若最终采用「macOS install/test/build 通过 + clone 形式缺口」的写法，需在提交说明里一句话讲清，避免被读成"没在 Mac 上验证"。
4. **#30 的处置**：若定为「有意设计」，把结论写进权限表；若定为缺陷，则需在提交前决定是否接受该限制（改合约会动 ABI 与已部署地址，代价高）。
5. **贡献记录**：E / R 的条目尚未加入 `CONTRIBUTIONS.md`。
