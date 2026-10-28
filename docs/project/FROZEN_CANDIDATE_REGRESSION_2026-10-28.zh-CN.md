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
| `pnpm test` | **61 / 61 通过** |
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

## 五、未覆盖（不计入结论）

| 项目 | 原因 |
| --- | --- |
| macOS 干净克隆启动 | 需要一名使用 Mac 的成员；本文只覆盖 Windows |
| 跨设备读取 | 本次只做到同机另一个浏览器引擎（见 PR #19 的跨浏览器核对） |
| 9 步社交流程在冻结候选上完整重跑 | 已在 PR #19 记录完整 9 步（当时构架接近但非本候选）；本次只做只读回放与失败路径 |
| 托管付款/退款/领取在本候选上重跑 | 已由 PR #22 在 `583fd6d` 基线上完成；本次只做只读回放 |
| MetaMask 弹窗交互自动化 | Chrome 156 禁止在默认配置启用调试端口；复制配置会破坏扩展完整性校验，无法稳定驱动签名窗口 |

## 六、与 #8 验收条件的对照

| # | 条件 | 状态 |
| --- | --- | --- |
| 1 | CI 实际通过，检查编译、测试、构建与合约产物差异 | 通过（本地等价检查 + 远端 CI） |
| 2 | Mac 与 Windows 各一名成员从干净克隆启动 | Windows 完成；**macOS 未覆盖** |
| 3 | 对冻结候选执行主流程与失败路径回归，列出已知限制 | 完成：自动化基线 + 只读回放 + 6 组失败路径 + 1 笔真实写入；限制见 §五 |
