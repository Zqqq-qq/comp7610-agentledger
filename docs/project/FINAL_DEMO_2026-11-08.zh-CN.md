# E2 最终演示成片交付记录（2026-11-08）

关联 #10；发布与提交后续关联 #11。输入 main 基准 `70629990d78a62c059a53d6df5c3c3c2b9e9a08e`，功能代码基线仍为 `2e59b10`；本次不修改应用、合约、ABI、配置或部署地址。

## 文件与检查

| 文件 | 用途 | 字节 | SHA-256 |
| --- | --- | --- | --- |
| `assets/AgentLedger-final-v1.mp4` | 最终旁白成片 | 16135940 | `95ca9e0ec46e30f82e5e6d352399d15ef47d0f438d55653ee29707da24d4bb09` |
| `assets/AgentLedger-final-v1.en.srt` | 可编辑英文字幕；视频中已烧录 | 8130 | `b6925ac71f04762b23d872e2c4e7e3958d092e1a8ecd1daf232bc5760b74cb4d` |

- 成片：06:59.92，1920×1080，30fps，H.264，AAC单声道48kHz；16段英文旁白、章节标记、字幕、架构图、证据卡和五人署名齐全。
- 实际检查：完整音视频解码无错误；16章逐章抽帧检查；字幕文本与v3稿逐段核对；来源标识及关键状态/证据画面对应检查。调整响度和少量首尾留白，讲话未变速。技术检查不等于逐音节人工审核。
- 用户在本地确认完整成片无问题后授权入库；仓库同伴审阅尚待本PR，请Zqqq-qq复核音画同步、来源界限及报告同步。

- 本轮交付检查：`node scripts/build.mjs`通过；PDF生成/冻结脚本专项测试11/11通过；PDF重新生成共22页，逐页缩略图与关键页排版复核通过，正文版本、五人姓名和新成片状态可从PDF提取核对；架构图保持原内容；初版仓库视频/字幕与用户确认的本地文件逐字节一致；本轮随后按审阅修正07/09画面节奏，最新字节以候选摘要为准。`git diff --check`通过。未以此次专项检查冒称重跑全部112项历史测试。

## 讲解覆盖与实际时码

| 段落 | 时间 | 内容 |
| --- | --- | --- |
| voice-01 | 00:00.0–00:23.4 | AgentLedger |
| voice-02 | 00:23.4–00:49.9 | An example collaboration |
| voice-03 | 00:49.9–01:16.5 | Architecture and trust boundaries |
| voice-04 | 01:16.5–01:46.6 | Alex publishes an open task |
| voice-05 | 01:46.6–02:05.0 | Maya offers a contribution |
| voice-06 | 02:05.0–02:28.0 | Alex proposes a team |
| voice-07 | 02:28.0–02:50.5 | Maya reviews the invitation |
| voice-08 | 02:50.5–03:15.2 | Maya proposes a shared work |
| voice-09 | 03:15.2–03:38.9 | Alex reviews and confirms |
| voice-10 | 03:38.9–04:09.4 | A traceable collaboration history |
| voice-11 | 04:09.4–04:47.3 | Real wallet interactions |
| voice-12 | 04:47.3–05:21.0 | Three settlement paths |
| voice-13 | 05:21.0–05:33.8 | Community to escrow: archived evidence |
| voice-14 | 05:33.8–06:07.9 | Bilateral confirmation: contract rules |
| voice-15 | 06:07.9–06:42.1 | Evidence scope and product limits |
| voice-16 | 06:42.1–06:59.9 | AgentLedger · Team and sources |

## 来源与验证边界

- 01–03、15–16：标题/用户故事/验证边界/署名卡及报告架构图。可选agent service只作架构与占位工作说明，不声称录制了新的服务执行。
- 04–06：daizhiqi于2026-11-08补录发帖、Maya回复、Alex邀请；Research & Insights示例场景。
- 07–10：使用QiuQiu-xuan交付、#75合入的Social **v2**，节选01对应07、02对应08+09、03对应10。04–06与07–10是分开准备的浏览器Demo会话；不声称相同链上编号或一次连续操作。单一浏览器切换Alex/Maya，不是独立用户研究。
- 10：末尾停留原始履历详情帧，明确Demo无已核验托管订单，已标注画面定格。
- 11：2026-10-28历史钱包原片`demo-wallet-live.mp4`剪辑；保留确认、等待、状态更新与用户取消。等待缩短、节奏调整及末帧定格均有标注；钱包取消不是权限拒绝。
- 12：2026-10-28独立订单1/2/3；状态、金额和时间来自原截图裁切；release/refund/claim路径及交易索引来自`evidence/escrow-transaction-index.json`与既有托管验收。仅Completed标签不能证明路径；全部为无价值测试mUSD。
- 13：2026-10-29独立的Team 3 / Job 5历史记录，1测试mUSD；同一操作者控制两个账户，不是前面的Demo团队付款。来源`TEAM3_ESCROW_SEPOLIA_ACCEPTANCE_2026-10-29.zh-CN.md`和`evidence/team3-job5/`。
- 14：2026-11-08实际本地Ganache运行，断言代码来自`tests/d1-failure-path.test.mjs`；自确认被拒、作品仍Proposed、合作次数0，以及另一成员确认的正向流程。2测试通过、0失败，进程退出0。不是新Sepolia交易。

```sh
node --test --test-isolation=none --test-reporter=spec --test-name-pattern='提议人不能确认自己的作品|主流程：需求' tests/d1-failure-path.test.mjs
```

旧五份MP4保留为历史输入，不再作为最终主片；未将两个full组合片重复拼入，也未沿用旧走查中途的结束卡。16段旁白在`DEMO_SCRIPT.en.md`，文件摘要见`evidence/final-demo-delivery.json`。原始个人语音、无关桌面画面、私人本地路径和未筛选的原片不入库。

## 试讲、署名与待办

- 2026-11-08实际完成分段试录、01–04试配、第三段重录、下午03–10重录与合入、11–16录制及全片整合；本地试听后用户确认可用。没有补造一次性直播式全流程彩排。
- 统一讲解、补录与整合：Zhiqi Dai / daizhiqi，使用Codex辅助操作、整理、剪辑、字幕与检查。Social v2作者为QiuQiu-xuan，历史部署/钱包/托管素材保留原作者和验收来源；统一讲解不计作五位成员分别讲解。
- 按#10最新安排不再要求五人分别讲解/五人彩排；保留五人实际贡献署名。旧日期记录中的“五人彩排”仅代表当时安排。
- 仍待：仓库同伴审阅；可供老师访问的视频链接和最终备份。老师正式渠道、清单、截止时刻与个人互评要求已从Moodle核对，见SUBMISSION_REQUIREMENTS_2026-11-08.zh-CN.md。故本PR只Refs #10/#11，不自动关闭。
- 合并后按#11从真实最终提交重新生成报告/PDF/架构图/源码/视频清单，确认最终tag与备份；实际课程提交回执尚未产生。既有23项清单和旧tag均不自动覆盖本片及新PDF。

## 2026-11-08复审修订及提交准备

Zqqq-qq对a4fb588提出两项P2：07/09状态说明早于画面、报告§9贡献信息仍为旧阶段。本轮重排07和09的原始v2片段，使02:38.007和03:23.380状态说明出现前已显示Active team和Jointly confirmed；总长、章节边界、原旁白和SRT不变，烧录字幕与原旁白一同保留。检查02:37.9/38.1/40.0及03:23.3/23.5/24.0实帧；整片重新解码通过；改动两段的解码音频SHA-256与原段相同。没有重录、生成新语音或新增Sepolia交易。

报告§9及PDF同步#70/#71、本人实际补录/试讲/旁白/剪辑和QiuQiu-xuan的#74/#75；新增10页英文可编辑slides，含故事、架构、两页social、权限、结算、测试、gas分析、边界及贡献。Slides通过包结构、字体/布局和重新导入检查，并逐页查看渲染图。正式要求核对已记录；当前仍是待复审候选，尚未发布公开视频、合并、最终冻结或交Moodle。请QiuQiu-xuan人工复审音画和新增slides，最终批准以GitHub记录为准。
