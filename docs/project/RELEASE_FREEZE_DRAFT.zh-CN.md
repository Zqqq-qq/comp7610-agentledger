# 提交版本冻结草案（R1 输入材料）

- 关联任务：[#11 R1](https://github.com/Zqqq-qq/comp7610-agentledger/issues/11)
- 归属角色：release · @daizhiqi（本文**不是**认领，只是把汇总所需的事实先备好）
- 撰写：D · @QiuQiu-xuan，2026-10-28
- 状态：**草案**，冻结 SHA 需在 #28 / #29 合并、#8 收口后重新固定

> 为什么由 D 起草：R1 要汇总的多数事实（冻结候选回归、链上回执、产物一致性、测试演进）在 D 的验收记录里，先整理成表可以让 release 直接取用。最终确认与提交仍由 release 负责。

## 一、冻结候选

| 项 | 值 |
| --- | --- |
| 候选提交（**已过期**） | `3e473c36e867f5c4f5bff8e5d5ff570475956d66`（2026-10-28 16:14 +08:00） |
| 当前 main | `7db718a`（#28 合并后前进一格，候选因此过期） |
| 测试 | **64 / 64 通过**（在该候选上实测） |
| 构建 | `pnpm build` 成功 |
| 工作区 | 测试与构建后保持干净 |
| 未并入的待评审改动 | PR #29（D1 收尾复核，修订中）、PR #31（本文）、PR #32（A1 实现与浏览器验收）、PR #33（演示素材） |
| 版本标记 | 仓库当前**无 tag**；建议冻结时创建 `v1.0.0-submission` 并附最终 SHA |

> **本候选已过期，不能作为最终发布版本。** main 已前进到 `7db718a`，本表的 SHA 与 §四 校验和只对 `3e473c3` 成立。重新固定的触发条件：任何 PR 合并、#8 关闭、或 main 有新提交；届时本表与 §四 全部重算。

## 二、阻断问题清单

> 下表是**某个时点**的快照，写于 `3e473c3` 之后、`7db718a` 之前；以 GitHub 实时状态为准。

| Issue | 标题 | 状态 | 阻断提交？ | 说明 |
| --- | --- | --- | --- | --- |
| #8 | D2 验证 CI、跨平台启动与冻结版本回归 | 开 | **是** | macOS 已跑通 install/test/build（PR #28 已合并）；缺「带 GitHub 凭据的真实 clone」 |
| #9 | E1 更新报告与架构图 | 开 | **是** | 报告未更新到实际实现 |
| #10 | E2 演示录屏与彩排 | 开 | **是** | 已有定格素材与分镜（PR #33）；缺旁白、签名片段与五人彩排 |
| #11 | R1 汇总冻结版本与提交物 | 开 | **是** | 本任务本身，归 release |
| #1 | A1 六类界面交互与手机布局 | 开 | 否 | 实现与浏览器验收已交付 **PR #32**，当前待审阅合并；不宜再写成「未完成」 |
| #2 | A2 小队与作品状态提示 | 开 | 否 | 无人认领；属体验打磨 |
| #4 | B2 内容边界与产物一致性复核 | 开 | 否（建议做） | 主要事实已由 CI 与 D 的产物比对覆盖，缺一份成文复核 |
| #6 | C2 账户切换与跨设备共享 | 开 | 否 | 三条验收已完成，等同伴确认；D 已在 #6 提供跨浏览器与跨设备佐证 |
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

**基准**：以候选提交的 **Git blob（LF 内容）** 为准，而不是某台机器工作副本的字节。`package.json` 与 `pnpm-lock.yaml` 不受 `.gitattributes` 归一化，Windows 下 `core.autocrlf=true` 会检出为 CRLF，字节数与哈希随之改变——**两者不可跨平台直接比较**。

候选 `3e473c3`，用 `git cat-file blob <SHA>:<path>` 读原始内容后计算：

| 文件 | Git blob 字节 | SHA-256（规范基准） |
| --- | --- | --- |
| `web/generated/AgentCommunity.json` | 42739 | `026410e7c2c8b38867c8db6147adeb2d3c6d04b28ad2b50bc80988998f081a85` |
| `contracts/AgentCommunity.sol` | 9212 | `ccbdcee86e97a46380ce83afb914d12067ed59192f843d559e13f6086fd8a8c3` |
| `contracts/IdentityRegistry.sol` | 5774 | `44033281eef840c8e7117cf38caf62b43acdb104e5eff8cd29a7ab5f9824cc72` |
| `package.json` | **415** | `f04f7458bce56b0c24e49d431f3a1f059b8c71d1b6773c0e222bfc3e62d638d5` |
| `pnpm-lock.yaml` | **10198** | `feab9156a6f6265f8abb5fb5a630c33bb494f5f9b342bdf95493a0493be12f86` |

**Windows 工作副本的差异值**（仅作对照，**不要**当通用校验和用）：

| 文件 | CRLF 字节 | SHA-256（CRLF） |
| --- | --- | --- |
| `package.json` | 432 | `2aa11140591c83b84d07076b5a465f1b87767ffe08a1a5fcd28a2196c5f413f2` |
| `pnpm-lock.yaml` | 10534 | `432381fa4b5845f3f7bb48ebd67832201fc0a642e8b7fdddbaf7beb7bc3e2501` |

前三份文件在两种环境下一致，因为 `.gitattributes` 固定了 `*.sol` 与生成产物为 LF；这也是 PR #15 修掉的缺陷（按 CRLF 编译会让 solc metadata 变化）。

**行尾一致性**：提交前应在干净克隆里跑一遍 §五 的自检，确认 `git status` 为空且产物未被改写。

## 五、复现与自检（提交前必跑）

```sh
git clone https://github.com/Zqqq-qq/comp7610-agentledger.git
cd comp7610-agentledger
# 必须固定到冻结提交；不固定就会测到移动的默认分支
git checkout --detach <完整冻结 SHA>
test "$(git rev-parse HEAD)" = "<完整冻结 SHA>" || { echo "HEAD 不是冻结提交，停止"; exit 1; }
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
| 社区合约 | `web/generated/AgentCommunity.json`（ABI + bytecode）与 `contracts/AgentCommunity.sol`、`contracts/IdentityRegistry.sol` | 同上 |
| **托管合约** | `docs/project/evidence/escrow-deployment-sources.json`（实际部署源文件）、`docs/project/evidence/escrow-transaction-index.json`、`escrow-sepolia-acceptance.json`、`job1/2/3` 的探测与交付记录，以及 `scripts/compile-escrow.mjs`、`scripts/verify-escrow-acceptance.mjs` | 同上 |
| 回执 | 9 笔社区交易 + 部署交易 + 托管交易的哈希清单 | 同上（Etherscan 链接即可复核） |
| 证据 | **完整证据目录及索引**：`docs/project/evidence/`（含 `escrow-screenshots/`）、`EVIDENCE.md` 的 21 张截图索引、以及后续新增的验收材料 | 同上 |
| 文档 | `docs/project/` 下全部验收与复核记录 | 同上 |
| 视频 | #10 的成片（当前已有 `docs/project/assets/demo-walkthrough.mp4` 定格素材） | 同上 |
| 贡献记录 | `CONTRIBUTIONS.md` | 同上 |

> 托管合约的实际部署源文件与当前 LF 源码字节不同，只备份 `AgentCommunity.json` 与两个 `.sol` **不足以复现现有托管部署**，必须连同上面的托管证据与编译核验脚本一起保留。

## 七、待 release 确认的事项

1. **冻结 SHA**：本文候选 `3e473c3` **已过期**（main 已到 `7db718a`）。等 #29 / #31 / #32 / #33 合并、#8 关闭后重新固定，并把 §四 校验和按新 SHA 重算。
2. **版本标记**：建议 `v1.0.0-submission`；创建 tag 与 release note 由 release 执行。
3. **#8 的收口口径**：若最终采用「macOS install/test/build 通过 + clone 形式缺口」的写法，需在提交说明里一句话讲清，避免被读成"没在 Mac 上验证"。
4. **#30 的处置**：若定为「有意设计」，把结论写进权限表；若定为缺陷，则需在提交前决定是否接受该限制（改合约会动 ABI 与已部署地址，代价高）。
5. **贡献记录**：E / R 的条目尚未加入 `CONTRIBUTIONS.md`。
