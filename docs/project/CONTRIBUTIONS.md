# 实际贡献记录

共同底稿不直接计作每人独立完成。每位成员记录自己实际审阅、开发、测试、部署和撰写的证据，报告据此整理。

| 日期 | GitHub 用户名 | Issue | PR/提交 | 工作与结果 | 验收证据/审阅人 |
| --- | --- | --- | --- | --- | --- |
| 待填写 | 待填写 | 待填写 | 待填写 | 待填写 | 待填写 |
| 2026-10-27 | Zqqq-qq（使用 Codex 协助） | #12 | feat/12-social-escrow，PR 待关联 | 增量集成托管、小队链上引用及回溯，43 项自动测试；未代其他组员署名 | ESCROW_INTEGRATION.zh-CN.md；真实 Sepolia 验收及同伴审阅待完成 |
| 2026-10-27 | QiuQiu-xuan | #8 | PR #15，`feature/ci-artifact-lf-qiuqiuxuan` | 定位 Windows 下合约产物不一致：`core.autocrlf` 把 `contracts/*.sol` 检出为 CRLF，solc 的 metadata 哈希随之改变；新增 `.gitattributes` 固定 `*.sol` 与生成产物为 LF，并把三份以 CRLF 存入索引的合约源文件规范化。另修正 README 中 `docs/VERIFICATION.json` 的大小写错误。 | 对照实验：同一源码按 LF 编译与仓库 bytecode 一致、按 CRLF 则不一致；修复后 `pnpm test` 22 项通过、`git diff --exit-code` 通过、工作区干净 |
| 2026-10-27 | QiuQiu-xuan | #7 | PR #18，`feature/d1-failure-path-acceptance-qiuqiuxuan` | 把四条拒绝路径的断言从「会抛错」提升为「因合约声明的具体原因被拒绝」，并补一条完整主流程与合作履历双向计数。 | 变异检查证明断言非空跑（改错期望原因后对应用例变红）；全量 27 项通过 |
| 2026-10-27 | QiuQiu-xuan | #8 | PR #17，`feature/acceptance-d2-qiuqiuxuan` | 新增 D2 验收记录：环境、六次 CI 运行、干净克隆启动、22/43 项测试基线、构建，以及产物一致性缺陷的对照实验与修复后验收。 | PR #17；`docs/project/ACCEPTANCE_D2.zh-CN.md` |
| 2026-10-27 | QiuQiu-xuan | #7 | PR #19，`feature/sepolia-deployment-record-qiuqiuxuan` | Sepolia 双钱包 9 步验收（入圈→发帖→回复→关注→邀请→接受→提议→确认→履历）并记录回执；对已部署合约取证四条拒绝路径并附正向对照；记录重复部署事故、建议统一地址、建缺陷 Issue #20。 | 9 笔交易全部 success；`collaborationCount` 提议阶段 0、确认后双向 1；四条拒绝路径命中 `only invited partner` / `only other member` / `join circle first` / `work not pending`；链上字节码与仓库产物逐字节一致 |
