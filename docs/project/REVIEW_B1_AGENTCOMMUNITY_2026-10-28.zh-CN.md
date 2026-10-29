# B1 复核：AgentCommunity 权限、状态机与历史归属

- 任务：[#3 B1](https://github.com/Zqqq-qq/comp7610-agentledger/issues/3)
- 复核人：Zqqq-qq（原负责人 ffmitrg 未认领，2026-10-28 由仓库所有者接手完成）
- 日期：2026-10-28
- 对象：`contracts/AgentCommunity.sol`（main），部署 `0x8CDc9987D46D140a982713B359286bC451262406`
- 证据：`tests/community-contract.test.mjs` + Sepolia 只读查询（区块 12011037）

## 一、权限表

合约没有 owner / admin / pause / upgrade 函数。权限完全由三样东西推导：**圈子成员资格**、**Agent NFT 所有权**、**团队参与者身份**。

| 函数 | 允许的调用者 | 合约强制检查 | 拒绝文案 |
| --- | --- | --- | --- |
| `setMembership(circleId, joined)` | 任意地址（自助） | 圈子 1..3；状态必须真的改变 | `invalid circle` / `membership unchanged` |
| `createPost(circleId, agentId, kind, title, body)` | 该圈子成员 | 圈子合法；`member[circle][sender]`；`kind ≤ 2`；`agentId ≠ 0` 时必须是该 NFT 当前 owner | `join circle first` / `invalid post kind` / `not agent owner` / `invalid text length` |
| `createReply(postId, agentId, body)` | 帖子所在圈子的成员 | 帖子存在；`member[post.circle][sender]`；Agent 所有权 | `unknown post` / `join circle first` / `not agent owner` |
| `setFollow(target, active)` | 任意地址 | `target ≠ 0` 且 `≠ sender`；状态必须改变 | `invalid follow target` / `follow unchanged` |
| `inviteTeam(postId, guest, hostAgentId, guestAgentId, ...)` | 任务贴作者所在圈子的成员 | 帖子存在且 `kind == 1`；成员资格；`guest ≠ 0` 且 `≠ sender`；`hostAgentId` 属 sender、`guestAgentId` 属 guest（**调用时**） | `task post required` / `join circle first` / `invalid partner` / `not agent owner` |
| `respondTeam(teamId, accept)` | **仅被邀请的 guest** | 必须 `Pending`；`sender == guest`；接受时还要 guest 是圈子成员，并**复查**双方 Agent 所有权 | `team not pending` / `only invited partner` / `join circle first` / `not agent owner` |
| `cancelTeam(teamId)` | **仅 host** | 必须 `Pending` | `only pending host` |
| `proposeWork(teamId, ...)` | Active 团队的 host 或 guest | 团队 `Active`；sender 是**团队 host/guest**（不复查圈子资格）；该队**无待审作品** | `team not active` / `not team member` / `review pending work first` |
| `reviewWork(workId, approve)` | 团队中**非作者**的另一方 | 作品 `Proposed`；sender 是**团队 host/guest**且 `≠ author`（不复查圈子资格） | `work not pending` / `only other member` |

要点：

- **圈子资格与团队身份分开**：发帖、回复、新邀请检查调用方圈子资格；接受邀请检查 guest 的圈子资格，不复查 host。团队建立后，作品提议/审阅按已记录的 host/guest 授权，不再检查圈子成员资格。
- **Agent 所有权按特定入口校验**（`_actor`）：发帖、回复、邀请和接受邀请时检查；作品提议/审阅不再次校验 NFT。`agentId` 允许为 0（以钱包身份参与）。
- **reviewWork 的 `only other member`** 同时排除了「自审」和「第三方代审」，这是合作履历可信度的来源。

## 二、状态机

**Team**（`TeamStatus`）

```
None ──inviteTeam──▶ Pending ──respondTeam(accept)──▶ Active
                        │
                        ├──respondTeam(decline)──▶ Declined
                        └──cancelTeam(host)──────▶ Cancelled
```

- `Active` 之后**没有出边**：不接受取消，也没有「完成」态。
- `Declined` / `Cancelled` 均为终态，不能再接受。

**Work**（`WorkStatus`）

```
None ──proposeWork──▶ Proposed ──reviewWork(true)──▶ Published
                          └──────reviewWork(false)─▶ Rejected
```

- `Published` 为终态；`Rejected` 后 `pendingWork[team]` 清零，允许**修改后重新提议**（测试 6 覆盖）。
- 每队**同时只允许一笔**待审作品（`review pending work first`），防止连发刷确认。
- `approve` 时 `collaborationCount` 双向 +1。

## 三、历史归属

这是本任务最容易被误读的部分，明确三条：

1. **写入即快照**：`Post` / `Reply` 保存当时的 `msg.sender` 与 `agentId`；之后 NFT 转让**不回写历史**，旧帖仍归属写入者。
2. **转让时点决定团队命运**：
   - **接受前**转让 → `respondTeam(accept)` 复查失败（`not agent owner`），邀请作废（测试 3）；
   - **接受后**转让 → 团队归属不变，新 owner 不能以该团队身份操作，原地址仍可 `proposeWork`（测试 6）。
3. **退圈不删历史**：`getPost` / `getReply` 不校验成员资格，退出圈子后已发布内容仍可读、仍归原作者。
4. **退圈不解散团队**：host/guest 退出圈子后仍能提议、拒绝或确认该团队作品；作者不能自确认，第三方不能代审。详见 [#30 设计结论与回归证据](TEAM_CIRCLE_POLICY.zh-CN.md)。

一句话：**历史归属是「写入时的地址快照 + 关系存续」，不跟随 NFT 当前持有人。**

## 四、证据

**测试映射**（`tests/community-contract.test.mjs`，6 例）

| 验收要求 | 覆盖测试 |
| --- | --- |
| 成员资格 | `community checks membership...`；`circle membership and wallet follow counts...` |
| Agent Owner | 同上（`not agent owner`）；`only invited guest may accept...` |
| 受邀者权限 | `only invited guest may accept; ownership changes invalidate acceptance` |
| 另一成员确认权限 | `work requires accepted team...`（第三方与作者本人都被拒） |
| 接受前后 NFT 转让差异 | 测试 3（接受前）与测试 6（接受后） |
| 状态机终态 | `decline and cancellation are terminal...`；`rejecting a proposal allows revision...` |

**链上只读**（Sepolia `0x8CDc…2406`，区块 12011037）

| 读取 | 结果 |
| --- | --- |
| `getTeam(1)` | status = `Active`(2)，host `0x4469…`，guest `0xfa2b…`，双方 agentId 均为 0 |
| `getTeam(2)` | status = `Pending`(1) |
| `getWork(1)` | status = `Published`(2) |
| `getWork(2)` | status = `Proposed`(1)，`pendingWork(1) = 2` |
| `collaborationCount(host, guest)` | `1`（发布时双向 +1） |
| `getPost(1).author` | `0xd3ce…62d5d`（与部署者不同，证明归属按写入者记） |

## 五、发现与建议（均不阻塞验收）

1. `setFollow` 允许关注任意地址（含未参与社区者），`followerCount` 可被刷。只影响展示，不构成权限问题；若要求严格，可加 `require(_seen[target])`。
2. **Active 团队没有终止态**：接受后无法取消或标记完成。若产品需要「项目结项」，需扩展状态机（会动 ABI，须同步 C 方联调）。
3. **#30 已落实为现有设计说明，待同伴审阅**：`respondTeam(accept)` 检查 guest 圈子资格与双方 Agent 所有权，不复查 host 圈子资格；退圈不撤销已有团队的作品权限。新增本地 EVM 与 Demo 回归锁定边界，见 `TEAM_CIRCLE_POLICY.zh-CN.md`；未新增 Sepolia 退圈交易。
4. `createPost` 的 `kind` 与圈子无耦合，任务贴仅靠前端约定 `kind = 1`；不构成权限漏洞，只影响检索正确性。
5. 合约不可治理（无 owner），文案类修复只能在前端做——与 PR #23 的做法一致。

## 结论

B1 三条验收全部满足：权限逐项核对完毕、接受前后 NFT 转让差异有测试与链上证据、审阅结果已成表。**无需修改合约 ABI**；上述建议作为后续改进项，不阻塞 M1。
