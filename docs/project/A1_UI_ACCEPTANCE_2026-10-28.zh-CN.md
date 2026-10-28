# A1 社区界面与手机布局验收

日期：2026-10-28。负责人：Zqqq-qq，使用 Codex 辅助开发与浏览器操作。关联 Issue #1。基于 main `3e473c36e867f5c4f5bff8e5d5ff570475956d66`，保留已合并的入圈权限提示、退出圈子和钱包恢复逻辑。

## 范围与环境

本次在本地 `http://127.0.0.1:8091/` 的 Demo sandbox 中实际点击、填写、提交表单。浏览器为 ChatGPT 内置浏览器；分别设置 390×844 与 1440×1000 视口。截图是页面渲染结果，不是设计稿。手机截图采用整页截取，因此图片高度可大于 844；弹窗边界按实际视口独立测量。

本次只验证前端交互与布局，没有新增 Sepolia 交易，也不以浏览器演示账户代替真实双钱包验收。真实链上证据见既有 `SEPOLIA_ACCEPTANCE_2026-10-27.zh-CN.md` 与 `ESCROW_SEPOLIA_ACCEPTANCE_2026-10-28.zh-CN.md`。本次使用一个浏览器内的演示身份切换，不声称完成不同成员或真实手机设备的独立测试。

## 六类入口与实际操作

| 功能 | 入口 | 实际操作与结果 | 手机 / 桌面截图 |
| --- | --- | --- | --- |
| 圈子 | Explore circles / `#circles` | Alex 退出 Research & Insights 后重新加入；View circle 跳到该圈筛选动态；All circles 恢复全部动态 | [手机](evidence/a1-ui/mobile-circles.png) / [桌面](evidence/a1-ui/desktop-circles.png) |
| 主动发帖 | Community feed → Start a conversation | 发布 100 个连续 W 的标题与说明正文；新帖可读、可打开；表单可用键盘到达 Publish post | [手机列表](evidence/a1-ui/mobile-community.png)、[表单](evidence/a1-ui/mobile-compose.png)、[底部按钮](evidence/a1-ui/mobile-compose-actions.png) / [桌面列表](evidence/a1-ui/desktop-community.png)、[表单](evidence/a1-ui/desktop-compose.png) |
| 回复 | 动态标题 → Discussion → Add a reply | Alex 对研究与翻译任务提交一条 A1 回复，线程显示新回复；线程可转到邀请表单 | [手机](evidence/a1-ui/mobile-thread.png) / [桌面](evidence/a1-ui/desktop-thread.png) |
| 关注 | People & partners / `#network` | Alex 关注 Jamie，按钮切换 Following；再次取消关注恢复原状 | [手机](evidence/a1-ui/mobile-people.png) / [桌面](evidence/a1-ui/desktop-people.png) |
| 邀请组队 | 线程 → Invite a partner；My teams | Alex 用 120 个连续 T 作为队名邀请 Maya，明确双方角色；切换 Maya 接受后显示 Active team | [手机邀请](evidence/a1-ui/mobile-invite.png)、[小队](evidence/a1-ui/mobile-teams.png)、[审阅](evidence/a1-ui/mobile-team-review.png) / [桌面邀请](evidence/a1-ui/desktop-invite.png)、[小队](evidence/a1-ui/desktop-teams.png) |
| 共同作品 | 小队 → Propose a work；Shared works | Maya 提议 140 个连续 R 标题的作品，Alex 审阅并 Confirm & publish；最终显示 Jointly confirmed 和双方角色 | [手机表单](evidence/a1-ui/mobile-work-form.png)、[作品详情](evidence/a1-ui/mobile-work-review.png)、[作品列表](evidence/a1-ui/mobile-works.png) / [桌面表单](evidence/a1-ui/desktop-work-form.png)、[详情](evidence/a1-ui/desktop-work-review.png)、[列表](evidence/a1-ui/desktop-works.png) |

截图覆盖操作过程中的不同状态；手机小队截图包含接受前的邀请状态，桌面小队截图包含接受后的 Active team。测试作品 URL 为 example.com 占位地址，未把它声称为真实成果文件。

## 发现并修复的缺陷

1. **连续长标题被卡片截断。** 390px 下，100 个 W 的合法标题原本宽约 2101.30px，而卡片仅 354px；页面根宽度正常仍会掩盖卡片内部裁切。给帖子、小队、作品标题及作者/履历区域设置可换行与收缩约束后，帖子标题宽 318px，内容完整换行。
2. **长队名撑宽作品表单。** 120 个 T 的队名进入作品提议说明后，弹窗内部 `clientWidth=368`、`scrollWidth=933`。对弹窗内容设置 `min-width:0; overflow-wrap:anywhere` 后，两者均为 368，无内部横向溢出。
3. **弹窗切换与关闭的焦点不明确。** 为每个弹窗关联实际标题作为可访问名称；打开/切换时滚动回顶并聚焦关闭按钮；关闭后恢复最初触发按钮，若触发节点被刷新则回退当前导航。异步 close 事件不清除已重新打开的弹窗。保留原有草稿保存、入圈门槛、交易忙碌锁与拒签恢复。
4. **手机小操作按钮触摸面积过小。** 手机关闭按钮、小按钮和文字操作的最小高度设为 44px；关闭按钮最小宽度 44px；帖子操作栏允许换行。此规则只针对这些操作，不声称所有表单按钮已统一到 44px。

布局与弹窗行为分别提交修复，截图和记录单独提交，便于审阅。

## 测量与关闭检查

最终逐页/逐弹窗测量见 [measurements.json](evidence/a1-ui/measurements.json)。记录中每个标签保存最后一次修复后的结果，修复前数值单独保留为 baselineDefects。

- 手机五个主页面（动态、圈子、人脉、小队、作品）`documentElement.scrollWidth=innerWidth=390`；桌面对应均为 1440。
- 手机已测弹窗宽 370px，内部宽与滚动宽均为 368px；桌面宽 740px，内部宽与滚动宽均为 738px。
- 弹窗保持在视口内，打开/切换时 scrollTop 为 0；手机关闭按钮高度 44px。
- 实际通过 Close dialog 和 Escape 关闭；发帖弹窗 Escape 后恢复 Start a conversation 按钮焦点。线程→邀请→关闭保留最初页面触发点。
- 手机表单通过 Your post → Tab → Cancel → Tab 到达 Publish post，提交按钮实际处于 y=758.60–797.60，844px 视口内可见；顶部关闭栏仍可见。底部按钮截图单独保留。

## 自动检查

执行编译、现有完整测试、静态构建：**64 项测试通过，0 失败**；静态站点构建成功。编译后既有合约生成产物无变化。本次没有修改合约、钱包签名或部署地址。

## 复核方法与交接

从任务分支启动站点，选 Demo sandbox。390×844 下按表中入口依次操作；用连续 W/T/R 的标题复现边界，观察卡片全文与作品表单说明。切换 Alex/Maya，完成邀请接受、作品提议及另一方确认；在每类弹窗测试关闭、Escape 和焦点返回。再以 1440×1000 复查相同入口及作品来源信息。

开发与本次浏览器验收已完成；PR 仍需另一成员审阅、CI 通过后由集成人合并。没有把待审阅状态记作已合并，也没有代其他成员署名。
