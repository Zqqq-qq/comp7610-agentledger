# D1 验收记录：双钱包端到端与权限失败路径（#7）

- 任务：[#7 D1](https://github.com/Zqqq-qq/comp7610-agentledger/issues/7)
- 责任人：角色 D · @QiuQiu-xuan
- 状态：**已完成**（三条验收条件全部满足，2026-10-28 复核，见 §七）
- 写作基线：2026-10-27，写作时社区合约尚未部署
- 最后更新：2026-10-28（部署与双钱包回执、界面与跨设备证据、拒绝反馈均已补齐）
- 目标日期：2026-11-02（Asia/Shanghai）

本文对应 #7 的三条验收条件，逐条给出**已被自动化验证**的部分和**必须依赖真实钱包**的部分。未执行的项目不写成已完成；写作基线之后发生的变化在 §五注明。

## 一、验收条件对照

| # | #7 验收条件 | 状态 | 说明 |
| --- | --- | --- | --- |
| 1 | 真实跑通需求→回复→邀请→接受→提议作品→另一成员确认→合作履历 | **已完成** | 链上 9 笔交易逐笔复核 `status=1`、签名人与调用方法符合预期、事件与状态一致（§七）；回执见 PR #19 与 `DEPLOYMENTS.md`。另有两浏览器与另一台设备的只读读取记录 |
| 2 | 验证第三钱包、自确认、重复确认、未入圈发帖等拒绝路径 | **已完成** | 本地断言见 §三；对已部署合约的 `eth_call` 取证与正向对照见 PR #19；界面按钮门控 5 组账户对照见 PR #19；真实点击下的拒绝呈现与用户取消签名见 `FROZEN_CANDIDATE_REGRESSION_2026-10-28.zh-CN.md` §三 |
| 3 | 每条结果记录环境、期望、实际、回执/截图；失败项建缺陷 Issue | **已完成** | 回执见 PR #19 与 `DEPLOYMENTS.md`；截图 21 张见证据目录索引；缺陷 Issue #20（重复部署）、#21（未入圈可提交）、#25（`Joined ✓` 命名）均已建并关闭 |

## 二、为什么新增 `tests/d1-failure-path.test.mjs`

四条拒绝路径在 `tests/community-contract.test.mjs` 里其实已有覆盖，但那里的断言是 `assert.rejects(...)` —— 只验证"会抛错"，不验证"因为什么被拒绝"。

这有实际风险：合约的检查顺序是「状态 → 角色 → 内容」，如果实现被改坏，让某条路径因为**错误的理由**失败（例如第三钱包接受邀请时先被成员检查拦住），旧断言依然会通过，测试是绿的但语义已经错了。

新增文件把这些断言提升为「必须因为合约声明的原因被拒绝」，并额外补了一条完整主流程。

## 三、自动化覆盖映射

测试文件：`tests/d1-failure-path.test.mjs`（新增，5 个用例）

| #7 验收项 | 用例 | 断言内容 |
| --- | --- | --- |
| 主流程 1 | 主流程：需求→回复→邀请→接受→提议作品→另一成员确认→合作履历 | 每一步的链上状态（`postCount`、`replyCount`、`getTeam().status` 1→2、`getWork().status` 1→2），以及确认后 `collaborationCount` 双向各为 1；确认前为 0 |
| 拒绝 · 未入圈发帖 | 拒绝路径：未加入圈子不能发帖，也不能回复 | 抛出 `join circle first`；且 `postCount` 未增加、`replyCount` 仍为 0 |
| 拒绝 · 第三钱包 | 拒绝路径：第三钱包不能接受别人的邀请 | 抛出 `only invited partner`；团队仍为 Pending，正主接受后才变 Active |
| 拒绝 · 自确认 | 拒绝路径：提议人不能确认自己的作品 | 抛出 `only other member`；作品仍为 Proposed，`collaborationCount` 仍为 0 |
| 拒绝 · 重复确认 | 拒绝路径：同一作品不能重复确认 | 抛出 `work not pending`；对已确认作品请求修改同样被拒；`collaborationCount` 保持 1 |

对应的合约约束（`contracts/AgentCommunity.sol`）：

| 拒绝原因 | 位置 | 触发场景 |
| --- | --- | --- |
| `join circle first` | 第 65 行 `createPost`、第 73 行 `createReply` | 未加入圈子即发帖 / 回复 |
| `only invited partner` | 第 100 行 `respondTeam` | 非受邀者（含第三钱包）接受邀请 |
| `only other member` | 第 128 行 `reviewWork` | 提议人确认自己的作品 |
| `work not pending` | 第 127 行 `reviewWork` | 已终态作品再次确认或请求修改 |

### 断言有效性的验证

为避免"测试虽然是绿的但断言无效"，做了变异检查：把 `join circle first` 的期望改成 `only invited partner` 后重跑，对应用例确实变红，并打印出真实原因：

```
未入圈发帖 被拒绝，但原因不是预期的：... VM Exception ... revert join circle first ...
```

说明这些断言真正绑定了拒绝原因，而不是只匹配"抛了错"。

## 四、测试环境

| 项目 | 值 |
| --- | --- |
| 操作系统 | Windows 11 家庭版 中文版 10.0.26200 |
| Node.js | v24.15.0 |
| pnpm | 11.25.0 |
| EVM | Ganache 7.9.2（`chainId 1337`，内存链，进程内） |
| 合约 | `AgentCommunity` 编译产物 + `IdentityRegistry` 现场编译 |
| 账户 | 3 个测试账户（A 客户、B 服务方、C 第三方） |

运行：

```powershell
pnpm test                                  # 全部
node --test tests/d1-failure-path.test.mjs # 仅 D1 用例
```

## 五、真实钱包执行清单（已于 2026-10-27 执行，保留为可重跑步骤）

社区合约已部署为 `0x8CDc9987D46D140a982713B359286bC451262406`，下列 1–8 步已于 2026-10-27 在 Sepolia 上执行完毕，9 笔交易回执与四组拒绝调用的记录见 PR #19 与 `DEPLOYMENTS.md`。

**第 9 步（另一浏览器/设备读取）已完成**，两条独立记录：

| 记录 | 环境 | 结果 |
| --- | --- | --- |
| PR #19 | Edge 156，全新配置，未安装钱包，手工填入社区地址 | 读到 post 2 与 `JOINTLY CONFIRMED` 的作品（`Confirmed at block 12010030`） |
| PR #24 | **另一台设备**，独立浏览器与存储，经局域网访问同一份 `web/`，未连接钱包（`0x0000…00000`） | 读到 2 条帖子与同一件已确认作品，双方署名 `0x4469…e1723 + 0xfa2B…85239` |

**边界**：两台设备都只做**只读**读取，没有在第二台设备上签名或写入；它们证明的是「同一地址、换浏览器/换设备、内容一致」，不证明跨设备协作写入。同浏览器同 MetaMask 双账户的 9 步回执见上一段，两者互补而非互相替代。

以下保留为可重跑的步骤，便于换设备复验或演练：

1. A、B 各自连接 Sepolia，分别加入同一圈子；记录 A、B 地址。
2. A 发布需求，记录交易哈希与 postId。
3. B 刷新后读取并回复，记录交易哈希与 replyId。
4. A 关注 B 并邀请 B，记录交易哈希与 teamId。
5. B 接受邀请，小队变为 Active；记录交易哈希。
6. A 提议共同作品，B 确认；记录两次交易哈希与 workId。
7. 检查 A、B 双方个人主页的合作履历各增加 1。
8. 失败路径（在真实钱包上确认被合约拒绝，而非仅被界面禁用）：
   - 用第三钱包 C 接受 A 给 B 的邀请 → 应回滚；
   - 用 A 确认自己提议的作品 → 应回滚；
   - 用 B 再次确认同一作品 → 应回滚；
   - 用未入圈的钱包发帖 → 应回滚。
9. **另开一个浏览器或设备**，填同一社区地址，确认能读到相同帖子、小队与作品。

第 8 步已有两条记录路径：本地 EVM 断言（本文 §三）与对已部署合约的 `eth_call` 取证（PR #19）。真实钱包执行仍比两者更强，因为它能确认**前端没有把合约拒绝掩盖成静默失败**，且回执可在区块浏览器核对。

## 六、已知限制

1. 全部自动化验证基于 Ganache 本地 EVM，`chainId 1337`，不是 Sepolia，不能作为链上交易证据。
2. 本地用例直接调用合约方法，绕过了前端界面。界面层是否提前禁用按钮属于另一条验证线，不能替代合约拒绝。
3. 合约检查顺序为「状态 → 角色 → 内容」，因此同一操作的失败原因可能随状态变化（如对已确认作品再确认得到的是状态错误而非角色错误），本文记录的是当前实现下的实际原因。
4. #13（托管模块）已合入 main。**托管合约的部署与三条真实交易路径已完成**（JobEscrow `0x3C129b436247368dA71cC31512984c3DB17F1f63`、MockUSDC `0x6a920b13d6396B7b58BfE562c274Ea76a6409C85`，付款、退款、超时领取均有回执，见 PR #22 与 `ESCROW_SEPOLIA_ACCEPTANCE_2026-10-28.zh-CN.md`）。仍未现场验收的只有**「社区小队 → 托管订单」这条跨模块链路**：页面上的 `Team #n · paid tasks →` 入口尚未在真实钱包上走通；其合约层拒绝路径由 `tests/escrow-integration.test.mjs` 覆盖。

## 七、收尾复核（2026-10-28）

关闭 #7 之前，把三条验收条件按链上数据重新算了一遍，不引用文档自述。

### 1. 主流程逐笔复核

9 笔交易从回执直读：每笔 `status=1`、`to` 为本合约、`from` 与步骤应有的签名人一致、输入可解码为预期方法、`logs` 可解出预期事件。

| 步骤 | 区块 | 方法 | 事件 |
| --- | --- | --- | --- |
| A 加入圈子 | 12005903 | `setMembership` | `MembershipChanged(circleId=2, account=A, joined=true)` |
| B 加入圈子 | 12005918 | `setMembership` | `MembershipChanged(circleId=2, account=B, joined=true)` |
| A 发帖 | 12005976 | `createPost` | `PostCreated(postId=2, circleId=2, author=A)` |
| B 回复 | 12006011 | `createReply` | `ReplyCreated(replyId=2, postId=2, author=B)` |
| A 关注 B | 12006028 | `setFollow` | `FollowChanged(follower=A, target=B, active=true)` |
| A 邀请 B | 12006044 | `inviteTeam` | `TeamInvited(teamId=1, postId=2, guest=B)` |
| B 接受 | 12006058 | `respondTeam` | `TeamChanged(teamId=1, status=2)` |
| A 提议作品 | 12006079 | `proposeWork` | `WorkProposed(workId=1, teamId=1, author=A)` |
| B 确认 | 12006101 | `reviewWork` | `WorkReviewed(workId=1, status=2)` |

状态自洽性：`workCount=2`，其中 work 1 为 `Published`（枚举 2）、work 2 为 `Proposed`（枚举 1）；`collaborationCount(A,B)` 与 `(B,A)` 均为 **1**，正好等于「已发布的作品数」。`following(A,B)=true`、`following(B,A)=false`，与只有 A 关注 B 相符。

### 2. 拒绝路径复核（区块 12011205，8 条）

复核时间 2026-10-28 16:45 (+08:00)；区块 **12011205**，hash `0x52e775eaf223db1fe7a67aaebab11ff6ccc33dc7bed28e449336db0ee99f74d2`，时间戳 `2026-10-28T08:45:36Z`。所有 `eth_call` 都以该区块号为固定 tag 发出，不是 `latest`。

四条拒绝各配一条正向对照，只更换调用方或圈子：

| 用例 | 结果 |
| --- | --- |
| 第三方接受 Pending 小队 | `only invited partner` |
| 受邀者接受同一小队（对照） | 通过 |
| 作者确认自己作品 | `only other member` |
| 另一成员确认（对照） | 通过 |
| 未入圈发帖（circle 3，A 未加入） | `join circle first` |
| 已入圈发帖（circle 2，对照） | 通过 |
| 重复确认已发布作品（work 1） | `work not pending` |
| 确认待审作品（work 2，对照） | 通过 |

### 3. 这次复核的注意事项

- 「未入圈发帖」必须选**当前**未加入的圈子。首次复核误用了 circle 1，而 A 恰好在冻结候选写入验收时加入了 circle 1，因此该探针返回成功；改用 circle 3 后命中 `join circle first`。这不是合约或文档的缺陷，是复核参数选错，记录在此以免后人重犯。
- 「提议阶段 `collaborationCount` 为 0」这一条无法在当前公共 RPC 上复算：那需要提案区块 12006079 的历史状态，已超出该节点的可查询窗口。现有证据是事件序列（`WorkProposed` → `WorkReviewed`）与当前计数 1 的一致性；当时的 0 是执行时记录。

