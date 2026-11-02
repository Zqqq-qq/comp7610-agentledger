# 合作履历与账户动态（2026-11-02）

这是 A2 的独立后续，关联 #2 / #9；不是对既有验收的补签。按 Zqqq-qq 要求，将报告讨论的两项 social 改进落成界面。本次不改合约、ABI、部署或原始证据，没有新签名、交易或用户留存研究。

## 功能与入口

- **My collaboration history**（`#portfolio`）：当前账户的合作伙伴、双方确认作品、原讨论、近期帖子，以及通过显式核验取得的订单引用。People & partners 内现有个人资料入口也使用相同履历内容，可查看其他钱包。
- **My activity**（`#activity`）：受邀账户的 Pending 邀请、需要另一方审阅的 Proposed 作品、他人对本账户帖子的回复。排除自回复、自确认、第三方和已结束状态；按钮打开原小队、作品审阅或讨论。列表按记录创建时间排序，不冒充接受/付款时间。
- 两页均支持 Demo / Sepolia 模式和账户切换；没有钱包时显示连接提示。没有新增写入操作；从详情进行既有接受/作品确认操作仍需钱包本人确认。

## 订单与加载边界

履历区点击 **Verify linked orders** 后复用 `readLinks` / `verifyLink`，检查当前社区、托管、代币、同一身份注册表、来源任务/Active 小队、订单提供方及 Agent ID、引用作者等于付款人。只展示已核验的引用，按 escrow + jobId 去重；原始字符串或本地预填不能成为订单证据。

订单状态与作品确认分别展示；Completed 不推断为用户验收，也可能是超时 claim。按钮进入来源小队的既有托管关联核验流程，并不绕过原核验直接付款。作品不是支付凭证；引用也不是合约级绑定或质量保证。

社区记录沿用加载窗口（默认 40 条/类型加必要来源），两页明确标记范围，可 Load older records；不宣称全历史或“全部无待办”。订单单独全量扫描公开回复，沿用 1000 条回复上限及固定区块核验；超限/RPC 失败提示失败，不写成无订单。成功结果标记订单快照区块，可能不同于社区快照。

刷新、切换钱包/模式或配置时清空订单核验结果并使旧请求失效；迟到响应不能覆盖新账户。未核验、正在核验、失败和完成扫描后无有效引用分别展示。动态没有后台推送、未读状态、已读回执或实时订阅；需要刷新。

## 实际验证

- 全量自动测试 **112/112 通过**，构建通过，合约产物无变化；含 4 项新增数据投影回归（账户参与及来源、邀请/作品/回复的筛选、创建时间顺序、订单参与者及去重）。原有托管引用合约执行测试保持通过。
- Chrome 实际运行前端，在 **1440×950 / 390×950** 下检查两页、Demo 身份切换、邀请/作品/讨论跳转、无横向溢出和无页面脚本错误。测试使用新增合成 Demo 数据，不是线上用户或新增 Sepolia 验收。
- 模拟 live 的浏览器回归：真实 social UI、替身 app/社区读取与订单扫描器；覆盖旧钱包扫描延迟返回不污染新钱包、RPC 失败不冒充空结果、重试成功、订单状态/区块展示和来源导航事件。不是真实 RPC 或 MetaMask 验收。
- 切换 social 页面时清理隐藏页的旧 DOM，避免多个同 ID 的账户选择器和旧视图残留。

[手机合作履历（Demo）](evidence/social-insights/portfolio-demo-mobile.png) · [桌面动态（合成 Demo 邀请与待审作品）](evidence/social-insights/activity-demo-desktop.png)

可复跑命令（仓库根目录，需独立安装 Playwright 及 Chrome；浏览器检查不增加运行时依赖）：

```sh
pnpm test
pnpm build
PORT=8097 node scripts/serve.mjs
# 另一个终端：Playwright 已能被 Node 解析时直接运行。
node tests/browser/social-insights-demo.mjs
node tests/browser/social-insights-live.mjs
# 可选 PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs
# 可选 CHROME_BIN 指定 Chrome；SOCIAL_TEST_URL 指向测试服务地址。
```

浏览器脚本从本机依赖加载 Playwright，屏蔽外部请求，输出到 tmp/insights。单元测试不依赖 Playwright。

## 发布与报告交接

本功能合并后，release 应对新的代码提交重新运行回归、更新源码/报告/视频对应关系与冻结清单，再确定最终版本标记。旧 tag 和旧清单仍属于历史版本，本 PR 不擅自移动。

PR #66 将两项功能描述为 future work；应在功能复审合并后同步报告，改为“已实现，用户采用/留存与真实新增测试网验收未验证”，并重新生成报告 PDF 和哈希，不能沿用旧报告声称已覆盖本代码。该文档及回归脚本作为更新输入；尚待同伴复审。
