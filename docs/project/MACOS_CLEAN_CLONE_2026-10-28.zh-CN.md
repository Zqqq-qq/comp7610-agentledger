# macOS 真实干净克隆验收（#8）

日期：2026-10-28。执行：Zqqq-qq 使用 Codex 协助；GitHub CLI 网页授权及邮件验证由用户亲自完成。此记录补齐 PR #28 明确保留的“Mac 未做真实 git clone”缺口。

## 固定版本与环境

| 项目 | 实际结果 |
| --- | --- |
| 来源 | `git clone https://github.com/Zqqq-qq/comp7610-agentledger.git`，退出码 0 |
| 方式 | GitHub 认证后的新目录真实克隆；非归档解压重建 Git |
| 固定 HEAD | `7db718a54ed439b442d01560acf8c57486e74788`，detached checkout 后执行检查 |
| Git tree | `afc673de65da9e02ce2da6380a9148463a235a93` |
| 历史 | `git rev-parse --is-shallow-repository` → `false` |
| 系统 | macOS 26.6（25G72），arm64 |
| Node / pnpm | v24.22.1 / 11.25.0 |
| 记录时间 | 2026-10-28 09:02:32 UTC（17:02:32 +08:00） |

首轮归档包验收使用 Node v24.15.0；本次实际执行环境已是 v24.22.1，两次记录分别保留，不将它们混为同一次运行。

## 实际检查

| 检查 | 实际结果 | 证据 |
| --- | --- | --- |
| 锁定依赖安装 | exit 0；39 个包，复用 pnpm store 的 39 个包 | [install.log](evidence/macos-clean-clone-2026-10-28/install.log) |
| 编译与全量测试 | exit 0；**64 tests / 64 pass / 0 fail**，无 skip | [test.log](evidence/macos-clean-clone-2026-10-28/test.log) |
| 静态构建 | exit 0；`Static site built in dist/` | [build.log](evidence/macos-clean-clone-2026-10-28/build.log) |
| 产物一致性 | `git diff --exit-code -- web/generated/AgentCommunity.json` → exit 0 | [verification.json](evidence/macos-clean-clone-2026-10-28/verification.json) |
| 工作区 | 测试/构建完成后 `git status --porcelain=v1 --untracked-files=all` 为空 | 同上，取证文件写入之前检查 |
| 行尾 | 全部 `contracts/*.sol` 与社区生成产物的 index / worktree 均为 LF | 同上，`git ls-files --eol` 输出 |
| 前端启动 | 从该克隆的 `web/` 在 127.0.0.1:8093 启动，实际浏览器可见 Community、圈子/人脉/小队/作品入口与 4 条样例帖子 | [frontend.png](evidence/macos-clean-clone-2026-10-28/frontend.png) |

“干净”指源码克隆到新目录、检查前无个人修改；依赖安装使用现有 pnpm 内容缓存，**不声称冷缓存或全新操作系统验收**。测试和构建通过后才创建本次记录、日志和截图，所以随后出现这些待提交文件是正常取证写入，不是编译改写源码。

该固定提交未包含待合并的 PR #34（新增 4 项测试），因此预期为 64 项；不能把其他分支的 68 项写作本次结果。本次确认启动与自动化链路，没有重跑全部社区/托管的真实钱包交易，也没有连接或签名；前端截图是 Demo sandbox，不能作为 Sepolia 成功证据。D 的既有冻结回归与 Windows 证据仍见原报告。

测试日志保留 Ganache 的 uWS 原生模块警告（Node ABI 137 的 macOS arm64 二进制缺失），随后回退 JavaScript 实现，测试与构建仍成功；不把警告隐藏为“完全无提示”。

## 可复制的命令

前提：本机 GitHub 已认证，Node 24 可执行，pnpm 版本为仓库指定的 11.25.0。请在不存在同名目录的位置运行：

```sh
git clone https://github.com/Zqqq-qq/comp7610-agentledger.git
cd comp7610-agentledger
git checkout --detach 7db718a54ed439b442d01560acf8c57486e74788
git rev-parse HEAD
sw_vers
uname -m
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm test
pnpm build
git diff --exit-code -- web/generated/AgentCommunity.json
git status --porcelain=v1 --untracked-files=all
git ls-files --eol 'contracts/*.sol' web/generated/AgentCommunity.json
PORT=8093 node scripts/serve.mjs
```

本次端口 8093 用于避开旧工作目录已占用的 8091，服务根目录明确来自新克隆。复核其他版本时必须替换完整 SHA 并重新执行，不能把本次候选的结果直接称为最终发布版本验收。

## #8 收尾

macOS 真实克隆、安装、测试、构建、产物与启动的缺口已补齐。本记录与冻结回归报告同步提交，贡献按实际执行记录；请 D（QiuQiu-xuan）确认与已有 Windows / 候选回归证据的对应关系。PR 合并后可据此收口 #8；最终发布 SHA 仍由 release 在全部必要变更合入后重新固定。
