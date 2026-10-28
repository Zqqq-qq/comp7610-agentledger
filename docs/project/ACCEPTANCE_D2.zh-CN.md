# D2 验收记录：CI、跨平台启动与冻结版本回归

- 任务：[#8 D2](https://github.com/Zqqq-qq/comp7610-agentledger/issues/8)
- 责任人：角色 D · @QiuQiu-xuan
- 状态：**进行中**（Windows 侧已完成；macOS 启动与冻结候选回归待补）
- 基线：`main @ 39092a5`（2026-10-27）。次日复核时 main 已前进到 `583fd6d`，相关差异见 §五.4 与 §八
- 最后更新：2026-10-28（按审阅意见修正归属与基线口径）

本文只记录**实际执行**过的检查，每条给出环境、命令、期望与实际。未执行的项目明确标记为待办，不以推断代替证据；涉及后续变化的结论按 commit 区分。

## 一、验收条件对照

| # | #8 验收条件 | 状态 | 说明 |
| --- | --- | --- | --- |
| 1 | GitHub CI 实际运行成功，检查编译、测试、构建与合约产物差异 | 部分完成 | CI 记录见 §三；产物差异缺陷已定位并修复，#15 已获审阅通过待合并 |
| 2 | Mac 和 Windows 各一名成员从干净克隆启动，记录命令和问题 | Windows 完成 / macOS 待办 | 见 §四 |
| 3 | 对冻结候选提交执行主流程与失败路径回归，列出已知限制 | 待办 | #13 / #14 / #16 已合入，候选提交可确定；托管链路未部署 |

## 二、实测环境

| 项目 | 值 |
| --- | --- |
| 操作系统 | Windows 11 家庭版 中文版 10.0.26200 |
| Node.js | v24.15.0 |
| pnpm | 11.25.0（与 `package.json` 的 `packageManager` 一致） |
| git | 2.54.0.windows.1 |
| `core.autocrlf` | `true`（Windows 默认，是 §四.5 缺陷的直接诱因） |
| 基线提交 | `39092a5`（`main`） |

依赖按锁文件安装：`pnpm install --frozen-lockfile`。首次安装 49.1 秒，39 个包。

## 三、CI 运行记录

仓库 CI 仅覆盖 `ubuntu-latest`，因此 Linux 由 CI 自动验证，Windows 与 macOS 只能靠成员人工记录。

| 运行 ID | 事件 | 分支 | 结论 |
| --- | --- | --- | --- |
| 40472370291 | push | main | success |
| 40472826751 | push | main | success |
| 40473047052 | push | main | success |
| 40507448513 | pull_request | `feat/12-social-escrow`（PR #13） | success |
| 40509355422 | pull_request | `feat/5-deployment-evidence`（PR #14） | success |
| 40509728194 | pull_request | `feature/ci-artifact-lf-qiuqiuxuan`（PR #15） | success |

CI 步骤为：安装锁定依赖 → 编译与测试 → `git diff --exit-code -- web/generated/AgentCommunity.json` → 构建前端。

**注意**：CI 全绿只说明 Linux 上的编译、测试、构建与产物检查通过，**不构成** Sepolia 链上验收证据。

## 四、已完成的实测

### 4.1 干净克隆启动（Windows）

```powershell
git clone https://github.com/Zqqq-qq/comp7610-agentledger.git
cd comp7610-agentledger
pnpm install --frozen-lockfile
node scripts/serve.mjs
```

| 检查 | 期望 | 实际 | 结论 |
| --- | --- | --- | --- |
| 无依赖启动 | 直接运行即可，不需要 `node_modules` | 服务输出 `Local: http://127.0.0.1:8091` | 通过 |
| HTTP 响应 | 200 | `HTTP 200`，23037 字节 | 通过 |
| 依赖安装 | 按锁文件无差异 | `Done in 49.1s`，无 peer 冲突 | 通过 |

发现的问题：无阻断问题。唯一需要注意的是 Windows 控制台默认代码页会把页面标题中的 `·` 显示成 `Â·`，这是终端显示问题，文件本身是 UTF-8，不影响页面。

### 4.2 测试基线（`main` @ `39092a5`）

```powershell
pnpm test
```

实际结果：`tests 22 / pass 22 / fail 0`，耗时约 13.4 秒。

其中与真实 EVM 相关的用例（合约权限、状态机、JSON-RPC 适配器端到端）由 Ganache 本地链执行，不是 Sepolia。

日志中的 `µWS ... Falling back to a NodeJS implementation` 是 Ganache 可选原生扩展在当前 Node 版本下不可用的提示，属预期行为，不影响结论（与 `README.md` 描述一致）。

### 4.3 托管集成分支（`feat/12-social-escrow` @ `e3ebc9a`，PR #13）

```powershell
git checkout --detach origin/feat/12-social-escrow
pnpm test
```

实际结果：`tests 43 / pass 43 / fail 0`。

该分支声称的「43 项测试通过」经独立复跑属实。核对结论已提交至 PR #13 审阅。

### 4.4 静态构建

```powershell
pnpm build
```

实际结果：输出 `Static site built in dist/`，`dist/` 生成 14 个文件。`dist/` 已在 `.gitignore` 中，不作为提交物。

### 4.5 合约产物一致性缺陷（本次发现并修复）

这是 #8 第 1 条验收条件「检查编译、测试、构建与合约产物差异」中实际暴露的问题。

**现象**：在 Windows 上执行 `pnpm test`（第一步即 `pnpm compile`）后，`web/generated/AgentCommunity.json` 变为 modified，与仓库提交的版本不一致。

**对照实验**：用同一份 `contracts/AgentCommunity.sol`，仅改变行尾后分别编译，再与仓库内 bytecode 比对。

```
LF   matches committed: true  | 22378 bytes
CRLF matches committed: false | 22378 bytes
```

**根因**：solc 会把源文件的 keccak256 写入 bytecode 的 metadata 哈希。`core.autocrlf=true` 且仓库原先没有 `.gitattributes`，导致 `contracts/*.sol` 被检出为 CRLF，编译结果的 metadata 哈希随之改变。字节长度相同，仅末尾哈希段不同。

**次级发现**：`IdentityRegistry.sol`、`JobEscrow.sol`、`ReputationRegistry.sol` 三份文件的**索引内容本身**就是 CRLF（当初从 Windows 导入），并非仅工作区被转换。

**影响**：Windows 成员每次跑测试都会得到脏的工作区，误提交会直接破坏 Linux CI 的产物检查。

**修复**（PR #15 `feature/ci-artifact-lf-qiuqiuxuan`）：新增 `.gitattributes` 将 `*.sol` 与 `web/generated/*.json` 固定为 `eol=lf`，并把上述三份索引文件规范化为 LF。

**修复后验收**：

| 检查 | 实际 | 结论 |
| --- | --- | --- |
| `pnpm test` | 22/22 通过 | 通过 |
| 测试后 `git status` | 无输出（干净） | 通过 |
| `git diff --exit-code -- web/generated/AgentCommunity.json` | 退出码 0，产物字节一致 | 通过 |
| `git diff --ignore-cr-at-eol --stat main -- contracts` | 空，说明仅行尾变化、无代码改动 | 通过 |

修复未改动 `contracts/AgentCommunity.sol` 的内容，已部署合约不受影响。

### 4.6 文档引用缺陷（曾修复，现已随 README 改版消失）

`README.md` 曾引用 `docs/VERIFICATION.json`，而实际文件是 `docs/verification.json`。Windows 与 macOS 的大小写不敏感文件系统掩盖了该问题，在 Linux（含 GitHub Actions）上是坏链接。

**原计划**在 #15 中改正。rebase 到最新 `main` 后发现该段落已被 README 改版整段替换，坏引用不复存在，因此**那条提交已从 #15 中丢弃**——不是遗漏，也不是仍未修复。

**测试数量口径**（按 commit 区分，避免把历史数字当成当前状态）：

| 提交 | 含义 | `pnpm test` |
| --- | --- | --- |
| `39092a5` | 本文 §4.2 实测时的 main | 22 项 |
| `583fd6d` | 当前 main（已合入 #13 / #14 / #16） | **56 项** |

`docs/verification.json` 中仍写着 22 项，属历史记录，与当前 main 不一致；该文件的维护不在本 PR 范围，已列入「待办」。

## 五、已知限制

1. CI 只有 `ubuntu-latest`，Windows 与 macOS 的构建行为没有自动覆盖，只能人工记录。
2. 测试全部基于 Ganache 本地 EVM，不能替代 Sepolia 真实交易证据。
3. 演示模式（Demo sandbox）的数据保存在浏览器 localStorage，刷新保留但换浏览器即丢失；它不是链上数据，也不计入任何验收证据。
4. 本文写于 `main @ 39092a5`（2026-10-27 晚）。链上状态此后已有进展，按 commit 与本文件写作时间区分如下：

| 对象 | 截至 `39092a5`（本文基线） | 截至 2026-10-28 12:30 |
| --- | --- | --- |
| AgentCommunity | 未部署，`DEPLOYMENTS.md` 为待填 | **已部署** `0x8CDc9987…2406`；#14 / #16 / #19 均有部署记录与回执，另一成员独立复核未完成 |
| JobEscrow / MockUSDC | 未部署 | **仍未部署**，`DEPLOYMENTS.md` 对应栏仍为待填 |
| 链上验收 | 未开始 | 社区合约已有双钱包验收记录（#16 / #19）；托管支付链路仍无公链证据 |

因此准确说法是「本文基线时链上验收尚未开始」，而不是「至今没有部署报告」。两者的证据缺口不同：社区合约缺的是独立人工复核与跨浏览器读取；托管合约缺的是真实部署本身。

## 六、待办

| 事项 | 负责 | 前置条件 |
| --- | --- | --- |
| macOS 干净克隆启动并记录命令与问题 | 需一名使用 Mac 的成员 | 无 |
| 冻结候选提交的主流程与失败路径回归 | D | #13 / #14 / #16 已合入，可确定候选提交；仍待其他 PR 并入 |
| 更新 `docs/verification.json` 的测试数量 | D 或文档负责人 | 该文件仍写 22 项，当前 main 为 56 项 |
| 社区合约的独立人工复核与跨浏览器读取 | 非 D 成员 | 部署与回执已具备（#14 / #16 / #19） |
| JobEscrow / MockUSDC 真实部署与托管验收 | C + D | #12 的托管模块已合入，但未部署 |

macOS 侧建议按 4.1 的命令执行，额外记录以下三项，便于与 Windows 对比：

```bash
sw_vers                        # 系统版本
node --version                 # 预期 v24.x
pnpm install --frozen-lockfile && pnpm test   # 预期 56 项通过（main @ 583fd6d）；在 39092a5 上为 22 项
node scripts/serve.mjs         # 预期 8091 端口返回 200
```

## 七、复现命令

```powershell
# 依赖
pnpm install --frozen-lockfile

# 编译 + 全部测试
pnpm test

# 单独编译与产物一致性检查（CI 使用的判据）
pnpm compile
git diff --exit-code -- web/generated/AgentCommunity.json

# 构建
pnpm build

# 本地启动
node scripts/serve.mjs
# 打开 http://127.0.0.1:8091
```

## 八、与 D1 的关系

D2 的冻结版本回归需要在 D1（[#7](https://github.com/Zqqq-qq/comp7610-agentledger/issues/7)）跑通真实双钱包流程之后才有意义。

**截至 2026-10-28 12:30 的实际状态**（与本文写作时的基线不同，见 §五.4）：

- **社区合约已部署**：`0x8CDc9987D46D140a982713B359286bC451262406`（区块 12005434）。#14 提供部署工具包与交接文档，#16 与 #19 记录了双钱包操作回执。
- **D1 的主流程已在链上跑通**：入圈→发帖→回复→关注→邀请→接受→提议→确认→合作履历，共 9 笔交易；四条拒绝路径也已用 `eth_call` 取证（含正向对照）。
- **D1 仍不能关闭**：缺前端是否如实展示拒绝的界面证据，以及跨浏览器/跨设备的完整流程读取；本次是同浏览器双账户。
- **托管链路（JobEscrow / MockUSDC）仍未部署**，`DEPLOYMENTS.md` 对应栏为待填，因此本记录第 3 条（冻结候选回归）仍缺托管部分。

所以 D1 不再是"完全阻塞"，而是"主流程与合约层已具备证据、界面与跨端证据待补"。
