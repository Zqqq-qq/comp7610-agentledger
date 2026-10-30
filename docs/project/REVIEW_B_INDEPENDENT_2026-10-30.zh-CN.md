# B 角色独立复核：B1 权限 / B2 内容边界与产物 / #30 结论

- 复核人：ffmitrg（B 角色负责人），2026-10-30，使用 Claude Code 协助核对与撰写
- 基线：main `2f27c7e`（含 PR #34、#48 合并后的状态）
- 对象：`contracts/AgentCommunity.sol`、`web/social-core.js`、`web/social-chain.js`、`REVIEW_B1_AGENTCOMMUNITY_2026-10-28`、`CONTENT_BOUNDARY_REVIEW_2026-10-29`、`TEAM_CIRCLE_POLICY`
- 新增证据：`tests/b-independent-review.test.mjs`（4 项，本地 Ganache 真实 EVM）

B1、B2 此前由 Zqqq-qq 代为完成，QiuQiu-xuan 已审阅。本文件是 B 本人按 #3 / #4 验收清单做的独立复核，不重复已有内容，只记录核对结论和新发现。

## 一、复现结果

| 检查 | 命令 / 方法 | 结果 |
| --- | --- | --- |
| 锁定依赖安装 | `pnpm install --frozen-lockfile` | 通过（solc 0.8.30、ganache 7.9.2） |
| 全量测试 | `pnpm test` | 82/82 通过（macOS arm64，Node 24.17.0） |
| 产物一致 | `pnpm compile` 后 `git diff --exit-code -- contracts web/generated` | 无差异 |
| 产物哈希 | `shasum -a 256 web/generated/AgentCommunity.json` | `026410e7…081a85` |
| 与链上一致 | 用 `scripts/compile.mjs` 同一组参数本地重编，读取 Sepolia `eth_getCode(0x8CDc…2406)`，屏蔽 2 处 immutable 后逐字节比对 | **runtime 10973 字节完全一致**；immutable `identity` = `0x13eA…E91d`，与 `web/config.js` 一致 |

编译参数：solc `0.8.30+commit.73712a01`，optimizer enabled / runs 200，viaIR true，evmVersion shanghai，source key `AgentCommunity.sol`。runtime 末尾包含 metadata 哈希，因此一致也说明源码字节（LF）与部署时相同。

补充：README 里的 `node scripts/verify-community.mjs --tx 0x8a53…` 在 2026-10-30 用默认 RPC（publicnode）运行时报 `Deployment has no confirmed receipt yet`，原因是公共节点已裁剪该区块的回执。脚本本身没问题，但 README 应注明需要能查历史回执的 RPC（与 TEAM3 验收文档里说的裁剪限制相同）。上面的 `eth_getCode` 比对不受裁剪影响，可作为替代核验。

## 二、B1 权限：确认与新发现

原复核的权限表、状态机和历史归属结论**经核对成立**。以下是需要更正或补充的地方：

1. **`inviteTeam` 不要求调用者是任务帖作者。** 原表写「任务贴作者所在圈子的成员」，容易读成「只有作者能组队」。实际是：任务帖所在圈子的**任何成员**都可以以该帖为来源当 host 发起邀请（测试 1）。Demo 种子数据本身就是这样（Jamie 发帖，Alex 当 host）。这符合「看到任务帖的人来组队」的产品设定，不是漏洞，但发帖人对基于自己帖子的团队没有否决权，文档应写清楚。
2. **第 4 条发现与权限表自相矛盾。** 第五节第 4 条说任务贴「仅靠前端约定 `kind = 1`」，但合约第 66 行 `require(kind <= 2)`、第 88 行 `inviteTeam` 要求 `kind == 1`，均为合约强制（测试 2）。准确说法应是：kind 的**含义**（0 讨论 / 1 任务 / 2 展示）是约定，**取值范围和「只能从任务帖组队」**由合约强制。
3. **邀请时不检查 guest 是否在圈内**，只在接受时检查（测试 4）。不在圈内的地址也能收到邀请，可以拒绝，入圈后才能接受。权限表应写明。
4. 其余建议（关注可刷、Active 无终态、无治理）同意原结论，不阻塞。

## 三、B2 内容边界：确认与新发现

#48 的九字段 UTF-8 字节上限、URI 合约/前端分层、重复操作断言**经核对成立**。补充一条 Demo 与链上的语义差异：

- **只含空白的文本**：合约只检查 `bytes(value).length > 0`，`"   "` 能上链并原样存储；Demo `applyAction` 会 `trim()`，空白文本被拒，且存储的是去掉首尾空格后的值（测试 3）。界面表单有 `required`，但浏览器的 required 不拦截纯空格。影响：同一输入在 Demo 和 Sepolia 下结果不同。建议在前端写入适配器发送前也统一 `trim` 并拒绝空串（不动合约）。

公开性、外链可变、确认不证明质量 / 不防串通的说明与 #48 文档一致，同意。

## 四、#30 结论（B 方意见）

**结论：有意设计，不是 bug。同意 PR #34 的处理。**

理由：

1. 团队一经双方接受，就是两个地址之间的合作关系；圈子只是发现与讨论的入口。若退圈即失去提议 / 审阅权，一方退圈就能让对方的待审作品永远卡在 `Proposed`，这比现状更糟。
2. 与「接受后转让 NFT 不影响团队」的已有规则一致：团队权限都跟着**接受时记录的地址**走。
3. 合约已部署且不可升级，若改为「退圈即失权」需要重部署并迁移数据，收益不足以抵消代价。

保留的限制（已写入 TEAM_CIRCLE_POLICY）：Active 团队没有终止态；两个地址串通可以刷合作次数。以后如需「结项 / 解散」，应作为新的状态机变更单独立项。

## 五、对 PR #48 的复审意见

**批准。** 验收清单四项（字节上限、错误/重复操作、URI 边界、编译参数与产物复现）均已独立复现。非阻塞建议：

1. B1 复核文档第一节 `inviteTeam` 一行和第五节第 4 条按上面第二节更正；
2. README 的验证命令注明需要可查历史回执的 RPC；
3. 前端写入适配器统一 trim，消除 Demo 与链上对纯空白文本的差异。

## 运行

```sh
node --test tests/b-independent-review.test.mjs
pnpm test
```
