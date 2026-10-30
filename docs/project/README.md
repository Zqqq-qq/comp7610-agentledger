# 项目协作入口

- [五人任务与排期](TEAM_TASKS.zh-CN.md)
- [共享部署地址与回执](DEPLOYMENTS.md)
- [实际贡献记录](CONTRIBUTIONS.md)
- [报告 PDF 跨平台生成](REPORT_PDF_GENERATION.zh-CN.md)
- [小队 #3 → 订单 #5：跨模块 Sepolia 验收](TEAM3_ESCROW_SEPOLIA_ACCEPTANCE_2026-10-29.zh-CN.md)
- [D2 验收记录：CI、跨平台启动与回归](ACCEPTANCE_D2.zh-CN.md)
- [PR 与分支规则](../../CONTRIBUTING.md)

私有仓库已建立：[Zqqq-qq/comp7610-agentledger](https://github.com/Zqqq-qq/comp7610-agentledger)。源码、12 项 Issues、8 个分类标签、3 个里程碑已发布。仓库 main 为唯一协作主线。

| 角色 | 默认负责人 | 任务 |
| --- | --- | --- |
| A 前端与体验 | PAisHere | #1、#2 |
| B 合约与权限 | ffmitrg | #3、#4 |
| C 钱包与部署 | Zqqq-qq | #5、#6、#12 |
| D 测试与验收 | QiuQiu-xuan | #7、#8 |
| E 报告与整合 | daizhiqi | #9、#10；最终提交 #11 |

2026-10-27：四位组员的代码写入协作者邀请均已发出，等待各自接受。GitHub 尚不能把待接受邀请的用户设为 Assignee，因此 #1–#4、#7–#11 以正文中的负责人为准；接受后请认领并设置 Assignee。分工已按小组指定更新。

首次 [CI 检查](https://github.com/Zqqq-qq/comp7610-agentledger/actions/runs/40472370291) 已通过：安装锁定依赖、编译与测试、检查合约产物、构建前端。真实 Sepolia 社区部署及双钱包验收仍由 #5、#7 跟进。

当前私有仓库的套餐提示分支保护规则不会强制执行。PR、至少一位同伴审阅、CI 通过后合并，是团队协作约定。

新成员先接受 GitHub 通知/邮件中的邀请，再从仓库克隆最新 main，阅读 CONTRIBUTING.md，认领 Issue 后创建任务分支。不要将旧 ZIP 覆盖进新克隆。

`issues.json` 记录实际 Issue 编号与链接；`team.json` 记录默认分工。`scripts/sync-github.mjs` 为备用管理工具，首次加入项目不需要运行它。

#12 的实现与真实钱包验收边界见 [托管集成说明](../ESCROW_INTEGRATION.zh-CN.md)。
