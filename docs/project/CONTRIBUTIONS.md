# 实际贡献记录

共同底稿不直接计作每人独立完成。每位成员记录自己实际审阅、开发、测试、部署和撰写的证据，报告据此整理。

| 日期 | GitHub 用户名 | Issue | PR/提交 | 工作与结果 | 验收证据/审阅人 |
| --- | --- | --- | --- | --- | --- |
| 待填写 | 待填写 | 待填写 | 待填写 | 待填写 | 待填写 |
| 2026-10-30 | ffmitrg（使用 Claude Code 协助） | 蓝图 P0–P2 | `feat/blueprint-marketplace` | 实现功能蓝图剩余项：名片标准与生成器、详情页名片渲染、一键雇佣、市场排序筛选、我的订单与评价授权入口、示例 Agent 服务（自动交付）、x402 简化按次付费、Agent 社区证据；同步 README / BLUEPRINT。 | `tests/marketplace.test.mjs`、`tests/agent-service.test.mjs`（Ganache 真实合约）；全量 99/99、构建通过；浏览器实测桌面与手机布局；不改 Solidity / 产物 / 部署，无新增 Sepolia 交易 |
| 2026-10-30 | ffmitrg（使用 Claude Code 协助） | #3 / #4 / #30 | `review/b-independent-ffmitrg` | B 本人独立复核 B1 权限、B2 内容边界与产物、#30 设计：本地重编与 Sepolia runtime 逐字节一致；更正 B1 文档中 `inviteTeam` 调用者与 `kind` 强制性两处表述；新增 4 项回归锁定「非发帖人可当 host」「kind 由合约强制」「纯空白文本链上可存、Demo 拒绝」「邀请时不查 guest 圈子资格」。#30 结论：有意设计。 | `REVIEW_B_INDEPENDENT_2026-10-30.zh-CN.md`；`tests/b-independent-review.test.mjs` 4/4；全量通过；无 Solidity/产物/部署改动，无新增 Sepolia 交易 |
| 2026-10-28 | Zqqq-qq（使用 Codex 协助） | #1 | `fix/1-social-mobile-ux` | 逐项审阅圈子、发帖、回复、关注、组队、共同作品；修复连续长标题与队名溢出、手机触摸区域及弹窗名称/焦点恢复。 | `A1_UI_ACCEPTANCE_2026-10-28.zh-CN.md`，390×844 / 1440×1000 实际浏览器截图与测量；64 项测试及构建通过；同伴审阅待完成；本次无新增链上交易 |
| 2026-10-28 | Zqqq-qq（使用 Codex 协助） | #8 | `docs/8-macos-clean-clone` | 用户亲自完成 GitHub 授权；Mac 新目录真实 git clone、固定 7db718a 后安装、64 项测试、构建、工作区/产物/行尾及前端启动检查，补齐归档包不能替代 clone 的缺口。 | `MACOS_CLEAN_CLONE_2026-10-28.zh-CN.md`，原日志、结构化快照与截图；Node v24.22.1；未代 D 声称重跑 Windows 或全部链上交易；同伴审阅待完成 |
| 2026-10-28 | Zqqq-qq（使用 Codex 协助） | #30 | `docs/30-team-permissions` | 明确既有团队独立于圈子；更正 B1 权限表并补充退圈后 host/guest 提议、另一方拒绝/确认、圈子写入拦截和 Pending 接受边界的回归。 | `TEAM_CIRCLE_POLICY.zh-CN.md`；本地 EVM 与 Demo 新增 4 项测试；无 Solidity/部署改动，无新增 Sepolia 交易；同伴审阅待完成 |
| 2026-10-27 | Zqqq-qq（使用 Codex 协助） | #5 | feat/5-deployment-evidence | 可复现部署包、浏览器证据导出和独立只读核验，真实 EVM 部署证据测试 | deployment-evidence.test.mjs；此行为部署准备阶段；实际部署见下方记录 |
| 2026-10-27 | Zqqq-qq（使用 Codex 协助） | #12 | PR #13（已合并） | 增量集成托管、小队链上引用及回溯，43 项自动测试；未代其他组员署名 | ESCROW_INTEGRATION.zh-CN.md；真实 Sepolia 验收及同伴审阅待完成 |
| 2026-10-27 | QiuQiu-xuan | #8 | PR #15，`feature/ci-artifact-lf-qiuqiuxuan` | 定位 Windows 下合约产物不一致：`core.autocrlf` 把 `contracts/*.sol` 检出为 CRLF，solc 的 metadata 哈希随之改变；新增 `.gitattributes` 固定 `*.sol` 与生成产物为 LF，并把三份以 CRLF 存入索引的合约源文件规范化。另修正 README 中 `docs/VERIFICATION.json` 的大小写错误。 | 对照实验：同一源码按 LF 编译与仓库 bytecode 一致、按 CRLF 则不一致；修复后 `pnpm test` 22 项通过、`git diff --exit-code` 通过、工作区干净 |
| 2026-10-27 | QiuQiu-xuan | #7 | PR #18，`feature/d1-failure-path-acceptance-qiuqiuxuan` | 把四条拒绝路径的断言从「会抛错」提升为「因合约声明的具体原因被拒绝」，并补一条完整主流程与合作履历双向计数。 | 变异检查证明断言非空跑（改错期望原因后对应用例变红）；全量 27 项通过 |
| 2026-10-27 | QiuQiu-xuan | #8 | PR #17，`feature/acceptance-d2-qiuqiuxuan` | 新增 D2 验收记录：环境、六次 CI 运行、干净克隆启动、22/43 项测试基线、构建，以及产物一致性缺陷的对照实验与修复后验收。 | PR #17；`docs/project/ACCEPTANCE_D2.zh-CN.md` |
| 2026-10-27 | QiuQiu-xuan | #7 | PR #19，`feature/sepolia-deployment-record-qiuqiuxuan` | Sepolia 双钱包 9 步验收（入圈→发帖→回复→关注→邀请→接受→提议→确认→履历）并记录回执；对已部署合约取证四条拒绝路径并附正向对照；记录重复部署事故、建议统一地址、建缺陷 Issue #20。 | 9 笔交易全部 success；作者历史记录：`collaborationCount` 提议阶段 0；本次固定快照独立核验确认后双向 1（不重算旧状态）；四条拒绝路径命中 `only invited partner` / `only other member` / `join circle first` / `work not pending`；链上字节码与仓库产物逐字节一致 |
| 2026-10-28 | QiuQiu-xuan | #7 / #21 | PR #23，`feature/fix-nonmember-post-qiuqiuxuan` | 未加入圈子时禁用发帖/回复提交并说明原因（`syncPostGate`）；把 10 条合约 revert 原因映射为可读提示，替换原样透出的英文串。 | 「已加入可点 / 未加入禁用」两两对照的浏览器实测；新增 `tests/error-message.test.mjs` 3 例，全量 64 项通过；Issue #21 已按实测更正影响描述 |
| 2026-10-28 | QiuQiu-xuan | #8 | PR #24，`feature/frozen-candidate-regression-qiuqiuxuan` | 对冻结候选 `992584e` 做回归：全新克隆 61 项测试与构建、社区与托管只读回放、固定区块 6 组失败路径、真实点击下的拒绝呈现、用户取消签名的界面反馈、跨设备读取；并写 macOS 交接说明。 | `docs/project/FROZEN_CANDIDATE_REGRESSION_2026-10-28.zh-CN.md`；写入交易 `0xfff88c7c…d7bd`（区块 12010583）；跨设备与拒绝反馈各有独立截图 |
| 2026-10-28 | QiuQiu-xuan | #5 | 评审（无 PR） | 完成 C1 第三项「另一成员独立只读复核」：在区块 12010787 复跑 `identity()` / `getPost(1)` / `getReply(1)`，并用 PR #14 的 `scripts/verify-community.mjs` 核对部署创建输入、构造参数与 runtime，逐项与 Codex 记录比对一致；结果贴回 #5 并关闭。 | 证据为 #5 的复核评论（含时间、RPC、区块哈希、可复制命令）；全程未连接钱包、未签名、未广播 |


## 2026-10-29 A2 状态说明与回溯（#2）

Zqqq-qq 使用 Codex 协助完善四类团队/三类作品状态、角色限制与双向回溯。实际在 1280px 与 390px Demo 浏览器检查邀请接受/拒绝/取消、作品提议/拒绝及种子发布态，保存截图和尺寸记录。见 A2_STATUS_ACCEPTANCE_2026-10-29.zh-CN.md；无新增 Sepolia 交易，PAisHere / QiuQiu-xuan 同伴复审待完成。

## 2026-10-30 报告 PDF 跨平台生成（#9 / #11 工具修复）

Zqqq-qq 使用 Codex 协助修复 Chrome 检测：CHROME_BIN 优先，覆盖 macOS / Windows / Linux 常见路径与 PATH；正确编码 file URL，并按源文件解析图片。五项回归验证检测和失败保留旧 PDF；本机真实 Chrome 自动/显式路径均成功生成 v0.4 报告，15 页排版与架构图检查通过。全量 79 项测试、构建通过，Windows/Linux 为路径逻辑测试而非实际浏览器运行；见 REPORT_PDF_GENERATION.zh-CN.md。同伴复审待完成，不改最终报告或冻结版本。

## #6 钱包切换与失败恢复（Codex 辅助）

Zqqq-qq 发起并负责交付；Codex 辅助实现钱包会话快照与过期响应隔离、签名账户复核、社区签名网络检查，以及本机双 Provider/双账户和故障恢复回归测试。详见 `WALLET_RECOVERY_VERIFICATION.zh-CN.md`。此段记录首轮本机验证；后续真实 MetaMask / Sepolia 验收见下一节，未将本机测试记作公链验收。


## 2026-10-27 真实钱包与 Sepolia 验收（#5 / #6）

Zqqq-qq 亲自完成 MetaMask 钱包创建、解锁和所有交易确认；Codex 辅助准备操作、读取公开回执、核验部署产物并执行 Chrome/内置浏览器检查。实际完成社区部署、A/B 加入圈子、A 发帖、B 回复、账户切回、跨浏览器只读共享及失败恢复检查；修复拒签草稿丢失和弹窗错误遮挡，并根据 QiuQiu-xuan 审阅改进被取代快照的后续处理。证据见 SEPOLIA_ACCEPTANCE_2026-10-27.zh-CN.md。PR #14、#16 已批准并合并；另一成员的独立现场复核仍以 Issue #5 的记录为准。


## 2026-10-30 冻结清单必需输入校验（#11 工具修复）

Zqqq-qq 使用 Codex 协助将冻结脚本的原 11 个代码输入设为必需项，并把来源记录/报告 Markdown/PDF 设为可选补充；缺失必需文件失败且保留原清单，可选缺失显式列出。现有输入必须为普通 Git blob，读取错误不静默跳过。新增逐项删除、可选项与对象类型回归，原目标提交配置测试保留；说明见 RELEASE_CHECKLIST.zh-CN.md。未修改既有冻结清单、tag 或部署，同伴复审待完成。

## 2026-10-29 B2 内容边界复核（#4）

Zqqq-qq 使用 Codex 协助新增三项 Ganache EVM 边界测试，覆盖九字段 UTF-8 精确上限、URI 仅长度验证与前端安全链接限制、错误/重复/终态原因与计数，记录编译参数及公开性/外链可变/串通边界。见 CONTENT_BOUNDARY_REVIEW_2026-10-29.zh-CN.md；专项 3/3 通过，不改源码/产物/部署；ffmitrg / QiuQiu-xuan 同伴复审待完成。

## 2026-10-28 托管 Sepolia 实测（#12）

Zqqq-qq 亲自在 MetaMask 确认两份合约部署和所有验收交易；Codex 辅助部署入口、固定区块核验、截图与文档整理。14 笔成功交易，Job 1 正常付款、Job 2 未交付退款、Job 3 交付后超时领取；最终 A 98 / B 2 / 合约 0 mUSD。交付报告见 ESCROW_SEPOLIA_ACCEPTANCE_2026-10-28.zh-CN.md，含实际源码快照和只读复现命令。Agent ID 0 与未发布小队引用的边界已明确，不冒充其他组员复审；已由 ffmitrg 与 QiuQiu-xuan 审阅批准。


## 2026-10-28 PR #19 证据修订（Codex 辅助）

Zqqq-qq 发起本次整理，Codex 辅助保留双方贡献与部署记录、补充固定区块的只读 RPC 取证与源码重编译复算脚本、区分旧快照和本次读取，并统一 #5 / #7 的未完成边界。QiuQiu-xuan 的原交易与测试贡献保留在表中；本次修订不冒充其再次操作或 ffmitrg 的复审批准。


## 2026-10-30 演示采集动态字幕（#10 工具修复）

Zqqq-qq 使用 Codex 协助将采集字幕绑定配置地址、帖子/作品 ID 与已核验的当前订单卡片；三个配置订单按顺序展示，切换订单时更新字幕，不从 Completed 推断放款路径。修正英文横幅就绪条件，校验完整配置地址/确认区块与订单编号，补场景字幕和观测元数据。五项回归覆盖参数、字幕与合成采集 CLI 的成功/旧卡片失败路径；未新录 Sepolia 视频或广播交易，同伴复审待完成。见 DEMO_RECORDING_SCENES.zh-CN.md。

## 2026-10-29 报告验证范围修正（#9 / #37 复审）

Zqqq-qq 使用 Codex 协助修正报告将全部验证归于 Sepolia 的表述，区分本地 EVM/fixtures、浏览器与跨平台检查、测试网回执及 RPC；气费长度实验明确为 RPC 估算，保留原代码基线与测试计数。分支为 `docs/report-verification-scope`；证据为 REPORT.md 与重生成的 REPORT.pdf，已完成 PDF 文本和页面检查。无新增钱包交易，同伴复审待完成。


## 2026-10-29 小队 #3 → 订单 #5 跨模块 Sepolia 验收（#12 / #9 输入）

Zqqq-qq 亲自在 MetaMask 确认 Account 2 接受邀请，以及 Account 1 授权、注资、发布关联、Account 2 提交交付摘要、Account 1 验收付款，共六笔成功交易。两个账户由同一用户控制，不记为两名组员独立操作。

Codex 辅助恢复本地页面、准备请求、核对双向导航、生成真实交付说明、读取固定区块的回执/事件/余额，并整理只读复现脚本。结果为社区 post 3 → team 3 → reply 3 → escrow job 5，订单 Completed，1 mUSD 到达 B，A/B/托管余额为 97/3/0。原交付文件摘要与链上一致，重复付款只读调用被拒绝。

分支：`docs/team3-job5-sepolia-acceptance`。证据见 [验收报告](TEAM3_ESCROW_SEPOLIA_ACCEPTANCE_2026-10-29.zh-CN.md) 与 `evidence/team3-job5/`；脚本为 `scripts/verify-team3-acceptance.mjs`。本次证据整理没有新部署或广播交易，不补写其他成员批准；尚待同伴复审。Agent ID 0、应用层引用及未新增跨设备签名的边界见报告。


## 2026-10-29 冻结工具配置来源修复（#36 / #11 输入）

Zqqq-qq 使用 Codex 协助修复冻结清单混入工作副本部署配置的问题：配置与哈希均从目标提交的 Git blob 读取，使用静态数据解析且不执行配置代码；配置读取失败时不写清单。新增临时 Git 仓库回归覆盖历史提交、不同检出版本、未提交配置修改、动态/缺失配置及原输出保留。此项不代表最终冻结、打标签或课程提交已完成；同伴审阅待完成。


## 2026-10-29 来源与许可说明修正（#38 后续）

Zqqq-qq 使用 Codex 协助逐一读取固定上游提交的树及原始 blob，核对三个核心合约当前 LF 文件与上游一致、导入快照的 CRLF 哈希及 MIT 通知，明确 MockUSDC 不在该上游提交的来源边界。更新当前/历史哈希及离线核验脚本，修正 README、LICENSE 和第三方说明。见 SOURCE_PROVENANCE.zh-CN.md；未修改合约或补写未核实作者，同伴复审待完成。


## 2026-10-30 #59 安全与持久化修复（D · QiuQiu-xuan）

复审 #59 时确认并修复三项失败场景：x402 增加服务端一次性 challenge，调用方须用付款钱包签名，服务端校验签名者等于链上 `tx.from` 后才消费（防止公开哈希被他人抢先使用）；自动服务只接受配置 mUSD 且金额不低于报价的订单（防止另一代币或低价订单消耗模型与签名钱包 gas）；交付字节在 `submit` 前持久化到 `AGENT_RESULTS_DIR` 并在启动时恢复（重启后 `/results/:id` 仍与链上摘要一致）。新增对应回归，全量 102 项（101 pass + 1 win32 skip）；未改合约、ABI 或部署地址。原 #59 作者 ffmitrg 的提交与署名保留。


## 2026-10-30 部署操作背景补记（#9）

Zqqq-qq 说明记不清 2026-10-27 部署时是否手调 gas/费用。Codex 辅助核对历史部署入口、源码快照与保存的 RPC 回执，补工具及证据来源说明，撤回报告“钱包默认值”的无依据断言，保留 gas limit、费用上限与执行层成因未知项，并同步英文报告、中文草稿及 PDF。没有重新部署、广播交易或改写历史证据；同伴复审待完成。见 DEPLOYMENT_OPERATIONS_2026-10-27.zh-CN.md。


## 2026-11-01 Social DApp 产品定位与报告叙事（#9）

Zqqq-qq 根据课上提供的《DApps in Web3》材料与讨论，使用 Codex 协助补充报告 v0.7：目标用户、协作关系的社交价值、明确标记为示例的用户故事、上链理由与代价、两项已由 #67 实现的 social 改进（报告改为“已实现，采用/留存未验证”），以及逐项证据边界。同步英文报告、中文草稿补记与 PDF，修正结论把不同验收记录合为一次完整故事的表述。没有新增钱包交易或用户研究；未移动冻结 tag 或改写旧清单，本次报告变更须经复审并重新纳入发布清单。同伴复审待完成。

## 2026-11-02 合作履历与账户相关动态（A2 独立后续）

Zqqq-qq 使用 Codex 协助新增 My collaboration history / My activity，复用已确认作品与公开订单引用核验，区分作品认可和资金结算；处理加载范围、未核验/失败/空结果、账户切换及迟到响应，修复 social 页面隐藏 DOM 残留。新增四项投影回归与可复跑浏览器检查；全量 112/112、构建及产物一致性通过，1440/390px Demo 与模拟 live 竞态检查通过。没有新钱包交易、用户研究或合约改动；详见 SOCIAL_INSIGHTS_2026-11-02.zh-CN.md。功能已由 D 复审合并；合并后须同步报告及重新冻结，不补写其他成员验收。



## 2026-11-02 E1 报告及贡献记录整合（本地修订，待提交）

daizhiqi 发起并使用 Codex 辅助，以 main 78be532 为底稿整合报告和英文架构图，保留 #66 课程叙事及 #67/#68 新页面已实现状态，细分历史测试、合成 Demo 和模拟 live 验证范围。按PR与审阅记录更新五人贡献摘要，保留原作者、整合者和审阅者的不同工作；未把 #67 验收归给本人，也未补造未确认的姓名、学号或贡献比例。准备更新PDF及文档检查记录。本条描述本地E1修改，不代表已创建PR、经同伴审阅、重新冻结或提交课程；发布与验证证据在实际完成后补齐。

## 本地报告成员资料补记（2026-11-02）

张青，学号3036843862，GitHub Zqqq-qq。资料来自本人提供的个人贡献详细稿；学校登记英文姓名待补。工时、贡献比例及详细贡献最终确认仍待本人/全组核对。

## 本地E1成员资料与验收范围更新（2026-11-03）

用户提供成员资料：张青 / Zqqq-qq / 3036843862；李典 / ffmitrg / 3036841890；王海鹏 / PAisHere / 3036841371；仇雅萱 / QiuQiu-xuan / 3036842040；戴之颀 / Zhiqi Dai / daizhiqi / 3036841979（用户另提供标签zhiqidai；仓库既有账号为daizhiqi）。其余学校登记英文姓名待确认，不自行推定。

张青本轮提供的主要贡献表述已同步至报告第9章，并保留已有证据支持的工具/来源核验等补充工作。按Issue #9提醒，将单人控制双账户、本人MetaMask交易确认与其他成员独立复核分开；将本地EVM、Demo、模拟live、真实RPC取证和Sepolia交易分开，在摘要、架构图注、§7验收与§9贡献明确说明。未新增真实交易、未补写独立审阅，不认领他人已有验收。

Issue提醒：https://github.com/Zqqq-qq/comp7610-agentledger/issues/9#issuecomment-6578958627 。本次为本地报告修订，尚未推送或创建PR。

### 英文姓名填写方式（2026-11-03）

按用户要求，英文报告采用中文姓名的汉语拼音，统一名在前、姓在后：张青 Qing Zhang；李典 Dian Li；王海鹏 Haipeng Wang；仇雅萱 Yaxuan Qiu；戴之颀 Zhiqi Dai。报告不再将英文姓名列为待补字段，学号和GitHub对应关系不变。

## E1报告分支提交准备（2026-11-03）

从GitHub最新main 78be532建立codex/9-report-integration。daizhiqi按组员提供的信息和Issue #9说明整理v0.9正文、图注、五人身份/贡献、架构图和PDF，保留既有来源与验证范围；新增文档专用ReportLab渲染脚本及使用说明。个人贡献草稿中的“本地”状态为历史记录，后续PR/批准/合并以GitHub #9关联记录为准。

本轮实际执行：node --test tests/report-pdf.test.mjs tests/social-insights.test.mjs，9/9通过；node scripts/build.mjs通过。PDF渲染和文本检查、五人姓名/学号、路径及源文件一致性检查在提交前进行。未重跑112项全量业务套件、未新增真实RPC/MetaMask/Sepolia验收；远端CI及同伴审阅另行记录。


## 2026-11-03 E1 合并收尾与 R1 报告基准更新（#9 / #11）

daizhiqi 使用 Codex 辅助完成报告整合 PR #70；Zqqq-qq 在 head 49fd499 上正式批准，随后合并为 bdb0a6f7d4b4057c88040b741b39ab53ceb89408，#9 已自动关闭。以上更新早期本地准备条目的状态，不把同伴的批准归为本人审阅。

本轮从真实 Git 克隆及该合并提交的 Git blob 运行现有冻结脚本，更新 14 项清单；另登记架构图、报告合并时的贡献快照、PDF 渲染脚本/说明和 5 个现有视频，共 23 项，独立复算摘要。同步冻结记录与执行清单，注明旧 v1.0.0-submission 仍指向 78be532、不包含新报告；本次未移动标签。补充清单中的贡献文件是 bdb0a6f 快照，当前追加记录将在最终冻结时重新纳入。

本轮只核对发布输入和版本映射，未新增应用/合约改动、真实 RPC 或钱包交易；演示旁白、新页面录屏、五人彩排、最终备份和课程提交仍待完成。请求 QiuQiu-xuan 复核本轮记录，实际审阅、测试结果及后续合并以本轮 PR 和 #11 记录为准。

本轮本地专项：冻结脚本与 PDF 工具测试 11/11 通过、0 跳过（使用 `--test-isolation=none`）；23 项独立摘要及文档表格核对、五个部署地址对照与 `git diff --check` 通过。合并后 main 的 verify CI 为 success（run 41604537634）；不记作本轮本地全量 112 项复跑。

## 2026-11-05 E2 补录：合作履历与账户动态（#73）

QiuQiu-xuan 按 Zqqq-qq 的 #73 安排录制 #67 的两页：Maya 接受邀请、Maya 提议作品、Alex 审阅确认、Alex 履历/来源回溯。初版 40.80s 后按复审反馈重录 v2：圈子统一为 Research & Insights、关键状态放慢、补拍 Awaiting partner、下滚展示 “Verified linked orders / Demo 无已核验订单”，并把配音对应修正为 01→voice-07、02→voice-08+09、03→voice-10。v2 交付 69.36s 连续 MP4 + 3 段（11.68s / 32.28s / 16.76s），1280×800、无音轨；全程 Demo sandbox，无钱包/Sepolia 交易，作品使用示例 URL、明确非真实 AI 交付。状态由 `social-core` 的 `applyAction` 预置，准备动作不入镜；脚本 `tests/browser/social-insights-recording.mjs` 可复跑。素材交给 daizhiqi 纳入 #10，未完成成片/旁白/五人彩排；本记录不移动 tag，最终视频哈希由 #11 重新登记。


## 2026-11-08 E2 最终演示与交付同步（#10 / #11）

daizhiqi负责统一英文讲解、2026-11-08补录发帖/回复/邀请和实际本地Ganache权限测试，完成分段试讲/试配、重录、字幕、剪辑和约7分钟成片；按用户确认的最终剪辑准备入库并同步报告正文/PDF、实际时码和来源。Codex辅助本机操作、文档整合、音量处理、剪辑与技术检查，讲话为本人录音。没有代为确认钱包交易或新增Sepolia验收。

QiuQiu-xuan提供并按反馈重录的Social v2已实际用于07–10；历史钱包/托管材料沿用原作者与既有验收记录，不把他人的开发、录制或链上操作计作本人的贡献。五人实际署名保留，统一讲解不代表五位成员分别录制。按#10最新安排不再要求五人彩排。

本地完整成片获用户确认；整片音视频解码、16章抽帧与字幕/来源对应检查通过。仓库同伴审阅另由PR记录，未冒称已获批准；课程正式要求、最终冻结、备份远程位置和实际提交回执仍待#10/#11收尾。详情见FINAL_DEMO_2026-11-08.zh-CN.md。


## 2026-11-08 E2复审修订与课程材料准备

daizhiqi使用Codex辅助按Zqqq-qq的#76意见修正07/09画面时序，保留原录音、字幕及章节总长；报告§9/PDF补记已合并#70/#71、此次实际视频工作和QiuQiu-xuan的#74/#75。根据本人已登录Moodle页面核对小组四类提交物、命名、限制与截止信息，新增10页英文slides。待QiuQiu-xuan人工复审；公开视频链接仅在review通过后发布，最终冻结、备份和课程提交回执仍未完成。个人互评单独保存在本地，不入库。
