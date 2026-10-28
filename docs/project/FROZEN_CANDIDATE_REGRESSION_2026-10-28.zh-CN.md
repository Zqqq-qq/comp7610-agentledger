# 冻结候选回归 · 2026-10-28

- 任务：[#8 D2](https://github.com/Zqqq-qq/comp7610-agentledger/issues/8) 第 3 条（对冻结候选提交执行主流程与失败路径回归，列出已知限制）
- 责任人：角色 D · @QiuQiu-xuan
- 候选提交：`992584e`（main，含 #13 / #14 / #15 / #16 / #17 / #18 / #19 / #22）
- 执行环境：Windows 11 26200 / Node 24.15.0 / pnpm 11.25.0 / git 2.54.0（`core.autocrlf=true`）
- 部署基线：社区 `0x8CDc9987D46D140a982713B359286bC451262406`，托管 `0x3C129b436247368dA71cC31512984c3DB17F1f63`，代币 `0x6a920b13d6396B7b58BfE562c274Ea76a6409C85`

本记录只写**实际执行**的检查。未执行的项目在文末单列，不并入结论。

## 一、自动化基线（全新克隆）

```sh
git clone --branch main <repo> && cd <repo>
pnpm install --frozen-lockfile
pnpm test && pnpm build
```

| 检查 | 结果 |
| --- | --- |
| `pnpm test` | **61 / 61 通过**（候选 `992584e` 当时的用例数；#23 合并进 main 后为 **64 项**） |
| `pnpm build` | `Static site built in dist/` |
| 测试后 `git status` | 干净（`.gitattributes` 生效，产物未被改写） |
| `git diff --exit-code -- web/generated/AgentCommunity.json` | 通过，字节一致 |
| 关键文件 | `ACCEPTANCE_D1`、`ACCEPTANCE_D2`、`ESCROW_SEPOLIA_ACCEPTANCE`、`.gitattributes`、`tests/d1-failure-path.test.mjs` 均在 |

## 二、只读回归（浏览器，无钱包写入）

用 Playwright 驱动 Chromium，仅通过链上读取核对界面：

| 页面 | 预期 | 实际 |
| --- | --- | --- |
| 社区横幅 | 指向 `0x8CDc…2406` | ✅ `Sepolia 链上社区 · 0x8CDc…2406` |
| 社区动态 | 含 post 2 | ✅ 可见 `Bilingual event guide for the open day` |
| Shared works | 含已确认作品 | ✅ `JOINTLY CONFIRMED` + `Bilingual open-day guide (zh/en)`，页脚 `Confirmed at block 12010536` |
| Task escrow（job 1） | `Completed` | ✅ `3 · Completed`，1.0 mUSD，client/provider 正确 |
| Task escrow（job 2） | `Refunded` | ✅ `4 · Refunded` |
| Task escrow（job 3） | `Completed` | ✅ `3 · Completed` |
| 托管配置未填时 | 显示配置提示 | ✅ 配置齐全后 setup 横幅隐藏 |

页面上的 job 状态与 PR #22 的记录、以及本次链上直读一致。

## 三、失败路径（对已部署合约的 `eth_call`）

固定区块 **12010536**；每组都带正向对照，只更换调用方。

| 用例 | 调用方 | 结果 | 判定 |
| --- | --- | --- | --- |
| 第三方接受 Pending 小队（team 2） | `0xd3ce…62d5d` | `only invited partner` | 通过 |
| 受邀者接受同一小队 | D-B | 无回滚 | 对照通过 |
| 作者确认自己作品（work 2） | D-A | `only other member` | 通过 |
| 另一成员确认同一作品 | D-B | 无回滚 | 对照通过 |
| 未入圈发帖（circle 1） | D-A | `join circle first` | 通过 |
| 重复确认已确认作品（work 1） | D-B | `work not pending` | 通过 |

社区状态在本次回归时仍为 `post/reply/team/work = 2/2/2/2`，与 PR #19 的记录一致。

### 真实点击的界面反馈（不是模拟）

在冻结候选的页面上，用账户 A（未加入 Builders Club）实际点击 **Publish post**，观察前端如何呈现合约拒绝：

| 观察点 | 实际结果 |
| --- | --- |
| MetaMask 是否弹窗 | **没有弹窗** |
| 页面提示 | 表单顶部出现红色提示，内容为合约原始 revert 字符串 **`join circle first`** |
| 是否产生交易 | **没有**：A 的 nonce 仍为 14、余额未变、`postCount` 仍为 2，最近 20 个区块内无 A 的交易 |
| 是否消耗 gas | **没有** |

机制：ethers 在发送前先做 `eth_estimateGas`，节点在估算阶段即按合约规则回滚，异常在 `social-chain.js` 的 `await write.createPost(...)` 处抛出，**不会走到 `eth_sendTransaction`**。

因此这条链路的准确结论是：

- 前端**能**把合约的拒绝原因显示出来，不会静默失败；
- 但显示的是未翻译的英文 revert 字符串，没有「先加入圈子」这类可操作引导；
- 也不会出现「交易已提交后回滚」的界面，因为根本没发出。

界面允许点击这一点本身是缺陷（Issue #21），修复见 PR #23：改为在选圈时禁用提交并给出说明。**注意该缺陷不造成资损**，Issue #21 已据此更正优先级与描述。

### 用户在钱包里拒绝签名时的界面反馈

同一天在真实钱包上做了第二次观察：点 Creative Studio 的 `Joined ✓`（该按钮是开关，已加入时点击即退出圈子），MetaMask 弹出交易请求后，在钱包里点 **取消**。

| 观察点 | 实际结果 |
| --- | --- |
| 页面提示 | 底部红色 toast：**`Request cancelled in your wallet. No action was completed.`** |
| 文案来源 | `web/core.js:71` 对错误码 `4001` / `ACTION_REJECTED` 的映射 |
| 按钮状态 | `Joined ✓` 保持不变，可再次点击 |
| 是否残留中间态 | 无，没有卡在 pending |
| 链上状态 | A 的 nonce 仍为 14；`member(1..3, A)` 未变 |

### 两种拒绝的文案不一致

| 拒绝来源 | 页面文案 | 是否可读 |
| --- | --- | --- |
| 用户主动取消 | `Request cancelled in your wallet. No action was completed.` | 清楚，说明了后果 |
| 合约规则拒绝（估算阶段） | `join circle first` | 合约原文，没有解释 |

同一条错误展示路径，前者被映射成用户能懂的话，后者直接透出英文 revert 串。

**已补齐**：PR #23（merge commit `a6692bd`）在同一个 `errorMessage` 里补了 10 条常见 revert 原因的映射，`join circle first` 现在显示为「Join this circle before posting or replying — the contract only accepts members.」。同一 PR 还让界面在选圈时就禁用提交，多数情况下用户不会走到这条报错；两者合起来构成修复。

## 四、写入路径

在冻结候选的页面（由该提交构建、`node scripts/serve.mjs` 提供）上，由账户 A 通过 MetaMask 亲自确认一笔真实社区写入：加入 `Research & Insights`（circle 1）。

| 检查 | 结果 |
| --- | --- |
| 操作 | A 加入 circle 1 |
| 交易哈希 | `0xfff88c7c87aa4553f80b9748ce882eb01e8c2eccf970a22498d4fc8aac7da7bd` |
| 区块 / 状态 | 12010583 / `status=1` |
| gas | `gasUsed=240,555`，`effectiveGasPrice=15 wei`，实付约 `0.0000000000036 ETH` |
| `member(1, A)` | `false` → **`true`** |
| `memberCount(1)` | `0` → **`1`** |
| A 的 nonce | `13` → `14`（确认由 A 签名） |
| 签名钱包网络检查 | 交易成功，说明 #16 引入的 `sendCommunity` chainId 守卫未误拦正常写入 |

这一步同时覆盖了「写路径在冻结候选上可用」和「守卫不产生误拦」两件事，且用的是合法业务操作而不是失败交易，没有把 gas 浪费在回滚上。

## 五、跨设备读取

同一份冻结候选的 `web/` 通过局域网 IP 提供（`0.0.0.0:8092`），由**另一台设备**的浏览器访问，全程不连接钱包。

| 检查 | 结果 |
| --- | --- |
| 设备 | 另一台设备，独立浏览器与独立存储（不是本机换浏览器） |
| 访问地址 | `http://10.128.54.159:8092`（同一 Wi-Fi） |
| 钱包状态 | 未连接（页面显示 `0x0000…00000`） |
| 社区动态 | 读到 **2 条帖子**：post 2 `Bilingual event guide for the open day`（A 发，Creative Studio / OPEN TASK）与 post 1 `Sepolia acceptance 2026-10-27: shared community`（Zqqq-qq 发，Builders Club） |
| Shared works | 读到 **`JOINTLY CONFIRMED`** 的 `Bilingual open-day guide (zh/en)`，双方署名 `0x4469…e1723 + 0xfa2B…85239`，分工与结果文本一致 |

这说明内容确实在链上、不依赖某台机器的浏览器状态：换设备、换浏览器、无钱包，看到的仍是同一份数据。这与 PR #19 的「同机跨浏览器引擎」合起来，覆盖了 `SOCIAL_DEMO.zh-CN.md` 中「另开一个浏览器或设备，确认能读到相同内容」的要求。

验证完成后局域网服务已关闭，临时服务脚本已删除。

## 六、未覆盖（不计入结论）

| 项目 | 原因 |
| --- | --- |
| 9 步社交流程在冻结候选上完整重跑 | 已在 PR #19 记录完整 9 步（当时构架接近但非本候选）；本次只做只读回放与失败路径 |
| 托管付款/退款/领取在本候选上重跑 | 已由 PR #22 在 `583fd6d` 基线上完成；本次只做只读回放 |
| MetaMask 弹窗交互自动化 | Chrome 156 禁止在默认配置启用调试端口；复制配置会破坏扩展完整性校验，无法稳定驱动签名窗口（本次改为人工在真实钱包上操作） |

## 七、与 #8 验收条件的对照

| # | 条件 | 状态 |
| --- | --- | --- |
| 1 | CI 实际通过，检查编译、测试、构建与合约产物差异 | 通过（本地等价检查 + 远端 CI） |
| 2 | Mac 与 Windows 各一名成员从干净克隆启动 | Windows 完成（本文原记录）；macOS 已补真实认证克隆、固定 SHA 的 64 项测试、构建及启动，见 §八新记录与 `MACOS_CLEAN_CLONE_2026-10-28.zh-CN.md`；两次运行使用不同候选，不能当成最终发布版本的同一轮双平台验收 |
| 3 | 对冻结候选执行主流程与失败路径回归，列出已知限制 | 完成：自动化基线 + 只读回放 + 6 组失败路径 + 真实点击的拒绝呈现 + 1 笔真实写入 + 跨设备读取；限制见 §六 |

## 八、macOS 启动（首轮归档验收及后续真实克隆）

### 首轮记录：归档包，Node v24.15.0

2026-10-28，Zqqq-qq 在自己的 Mac 上执行了 `install / test / build`，记录如下：

| 项目 | 结果 |
| --- | --- |
| 环境 | macOS 26.6（25G72），arm64（Apple M5），Node v24.15.0，pnpm 11.25.0（corepack 按 `packageManager` 激活） |
| `pnpm install --frozen-lockfile` | 39 个包，900 ms，无报错 |
| `pnpm test` | **64 / 64 通过**，0 失败 |
| `pnpm build` | 成功 |
| `git status --short` | 空 |
| `git diff --exit-code -- web/generated/AgentCommunity.json` | 通过 |
| `contracts/*.sol` 行尾 | LF |

**首轮保留（这一轮不能算「干净克隆」）**：当时该机器没有 GitHub 凭据，无法 `git clone`，改用 GitHub 归档包 `main.tar` 解压后 `git init` + 基线提交。代码树是 main 原样、行尾已核对，但严格意义上不是一次带凭据的 clone。此历史记录保留，后续缺口已由下一节独立补齐。

**已知警告（不影响结论）**：ganache 7.9.2 的 `@trufflesuite/uws-js-unofficial` 原生模块与 Node 24 的 ABI 不匹配，回退到纯 JS 实现（`Cannot find module '../binaries/uws_darwin_arm64_137.node'`）；测试与构建均通过。

### 后续补齐：真实认证克隆，Node v24.22.1

2026-10-28 17:02 +08:00，用户亲自完成 GitHub CLI 网页及邮件授权后，Zqqq-qq 使用 Codex 协助完成新目录真实 `git clone`。固定 `7db718a54ed439b442d01560acf8c57486e74788`，macOS 26.6 / arm64、Node v24.22.1、pnpm 11.25.0：安装、64/64 测试、构建均 exit 0；产物无差异，测试构建后工作区为空；从新目录启动 8093 并实际浏览器打开。

详见 [macOS 干净克隆记录](MACOS_CLEAN_CLONE_2026-10-28.zh-CN.md)，附原日志、固定 SHA、行尾、校验和与启动截图。依赖复用本机 pnpm store，不声称冷缓存。以下为该候选的复现命令：

```sh
git clone https://github.com/Zqqq-qq/comp7610-agentledger.git
cd comp7610-agentledger
git checkout --detach 7db718a54ed439b442d01560acf8c57486e74788
sw_vers && node --version                # 需 v24.x
pnpm install --frozen-lockfile
pnpm test                                # 预期 64 项
pnpm build                               # 预期成功
git status --short                       # 预期为空（.gitattributes 应使 .sol 检出为 LF）
git diff --exit-code -- web/generated/AgentCommunity.json   # 预期通过
```

本次输出已附在独立记录。未来复核若出现产物差异或工作区变化，需要调查实际原因，不能只凭差异就断定 `.gitattributes` 未生效。

### 真实钱包项（#7）

三项观察均已在真实钱包上完成，各自可回溯到本文对应章节：

| 项目 | 位置 |
| --- | --- |
| 正常写入（加入圈子） | §四，交易 `0xfff88c7c…d7bd`（区块 12010583） |
| 被拒绝的提交（`join circle first` 呈现在页面上、未产生交易） | §三「真实点击的界面反馈」 |
| 用户主动取消签名（toast、按钮可再点、无中间态） | §三「用户在钱包里拒绝签名时的界面反馈」 |

**没有遗留的真实钱包观察项。** macOS 的真实克隆与启动缺口也已补齐，见上一节。后续若最终冻结 SHA 改变，应重新运行对应版本的回归；本记录不自动变成新版的验收结论。
