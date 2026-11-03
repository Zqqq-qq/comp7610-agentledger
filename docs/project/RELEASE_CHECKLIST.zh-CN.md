# 冻结与提交执行清单（R1 / #11）

负责人 @daizhiqi；原冻结工具与草案由 @QiuQiu-xuan 提供。本轮在报告 #70 合并后更新，2026-11-03。实际值见 [冻结记录](RELEASE_FREEZE_DRAFT.zh-CN.md)。

## 一、报告合并后核对（本轮）

- [x] #70 已合并，#9 已关闭；main 基准 `bdb0a6f7d4b4057c88040b741b39ab53ceb89408`。
- [x] 合并后 main 的 verify CI 为 success（链接见冻结记录）。
- [x] 从真实 Git blob 重算规范清单：11 必需 + 3 可选，14 项齐全，无可选缺失。
- [x] 补充架构图、贡献快照、PDF 渲染脚本/说明和五份现有 MP4：9 项，共 23 项。
- [x] 配置中的五个合约地址与 DEPLOYMENTS.md 对应；未重新进行 RPC 验收。
- [x] 记录旧 tag 仍指向 `78be5327e1fcb3fa0a0d5ebf3a58033ee0e78ee0`，未包含 #70，不能沿用为最终提交标记。
- [x] CONTRIBUTIONS.md 追加实际 E1 收尾和 R1 更新；早期“本地、待提交”条目为历史状态。
- [ ] 请求同伴复核本轮 PR 后合并（Refs #11，**不使用 Closes #11**）。

## 二、最终冻结前提（尚未完成）

- [ ] #10：完成约 6–8 分钟演示、至少一条权限失败路径、新 social 两页的演示、旁白和录屏备份。
- [ ] 五人能解释各自模块/核心社交流程，各自留存贡献证据并完成彩排记录。
- [ ] 核对老师正式提交清单、渠道、格式、个人要求与截止时刻。
- [ ] 所有最终改动完成审阅合并，阻断项关闭或明确记录；重新读取实际 main SHA 与 CI。

## 三、选定最终提交并复算

```sh
git fetch origin --tags
git switch main
git pull --ff-only origin main
git rev-parse HEAD
# 将输出的完整 SHA 固定到全部记录，不能照抄旧候选
node scripts/release-freeze.mjs <最终完整SHA>
```

脚本按目标提交的普通 Git blob 生成 14 项规范清单：配置、包与锁文件、三个产物、五合约必须存在；来源、Markdown/PDF 为可选输入，但课程最终交付仍必须包含报告。读取失败不覆盖旧清单；配置以静态数据解析，不执行工作副本代码。

- [ ] 核对 commit/tree、`isAncestorOfMain`、必需/可选策略与部署地址。
- [ ] 对最终版本架构图、贡献记录、渲染说明和**实际最终视频**更新补充清单；移除“仅旧素材”的完成误解，写明各文件用途。
- [ ] 更新冻结记录中的完整 SHA、报告版本、最终视频文件名/哈希和证据映射。
- [ ] 更新 DEMO_RECORDING_SCENES.zh-CN.md 中的最终文件和摘要。
- [ ] 固定 SHA 的干净克隆执行 `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm build`；核对实际结果与生成产物无意外差异。
- [ ] 清单/记录的后续文档 PR 同样审阅后合并；区分“清单核对的输入提交”和“存放清单的文档提交”，不要为清单自哈希制造循环。

## 四、最终版本标记

目前 `v1.0.0-submission` 是历史标记。视频收口前不移动它。建议在最终交付确认后使用新 annotated tag，例如 `v1.0.1-submission`；名称及精确目标在 #11 确认。

```sh
git tag -a <确认的最终标签> <最终完整SHA> -m "COMP7610 final submission"
git push origin <确认的最终标签>
git rev-parse '<确认的最终标签>^{}'
```

- [ ] 明确最终 tag 目标与清单输入基准的关系；若目标多出发布记录文档，核对源码/PDF/架构图/最终视频等输入字节相同并保留差异说明。
- [ ] tag 建立后重新核对机器清单；脚本的 `tag` 仅显示精确匹配输入提交的标签，不能凭历史标签的存在判定包含新报告。

## 五、备份与课程提交

```sh
git archive --format=zip --prefix=agentledger-<最终短SHA>/ <最终完整SHA> -o agentledger-<最终短SHA>.zip
```

- [ ] 源码归档、报告/PDF/架构图、最终视频、贡献记录与最新清单均对应已确认最终版本。
- [ ] 备份全量 `docs/project/evidence/`、验收文档、社区/托管交易索引和回执；托管部署原始源码 `escrow-deployment-sources.json` 及编译核验脚本一并保留。
- [ ] 在课程提交目录与独立备份位置保存产物，记录归档 SHA-256 和实际备份位置。
- [ ] 按老师确认的渠道提交，保存实际成功截图或确认邮件（包含个人信息时按课程要求保存）。
- [ ] 在 #11 贴最终 SHA/tag、备份与回执位置，逐项核对三条验收条件，再关闭 #11。

报告批准、旧素材存在、tag 已建立三者都不能代替最终演示、彩排、备份或提交回执。
