# 冻结与提交执行清单（R1 / #11）

- 关联任务：[#11 R1](https://github.com/Zqqq-qq/comp7610-agentledger/issues/11)
- 归属角色：release；本清单与 `scripts/release-freeze.mjs` 由 D · @QiuQiu-xuan 准备，**不代替 release 决策**
- 配套：`docs/project/RELEASE_FREEZE_DRAFT.zh-CN.md`（草案，已合入 main）

本清单的目的：把所有**可机械执行**的步骤固定成命令，让冻结这一步只需要「跑一遍 + 核对 + 打标签 + 交上去」。

## 零、前提

全部满足后才开始冻结，否则算出来的 SHA 会立刻过期：

- [ ] 所有待合并 PR 已合并（当前：#32 #33 #34 #35）
- [ ] main 的 CI `verify` 绿
- [ ] `node scripts/release-freeze.mjs` 能对目标 SHA 正常输出

## 一、冻结提交

```sh
git fetch --all
git checkout main && git pull
git rev-parse HEAD          # 记下完整 SHA，这就是冻结提交
```

**不要**用分支名或短 SHA 作为冻结依据；后续所有记录都写完整 SHA。

## 二、生成冻结清单（自动算校验和）

```sh
node scripts/release-freeze.mjs <完整 SHA>
# 输出：docs/project/evidence/release-manifest.json
```

脚本会：

- 解析完整 SHA 与 tree；
- 用 `git cat-file blob` 取**原始内容**算 SHA-256（**不用工作副本**，避免 Windows CRLF 差异）；
- 从 `web/config.js` 读取合约地址，写进清单；
- 报告该提交是否为 `main` 祖先（`origin` 与 `origin-ssh` 分别判断，任一为真即可）；
- 列出「工作副本与 blob 不同」的文件（通常是 CRLF 检出），提醒不要混用。

核对要点：

- [ ] `commit` 与第一步记下的 SHA 一致
- [ ] `files` 覆盖 `package.json`、`pnpm-lock.yaml`、`web/generated/*.json`、`contracts/*.sol`
- [ ] `deployment.community` / `escrow` / `token` 与 `DEPLOYMENTS.md` 一致
- [ ] `isAncestorOfMain` 为 `true`

## 三、打版本标记

```sh
git tag -a v1.0.0-submission <完整 SHA> -m "COMP7610 提交版本：<一句话说明>"
git push origin-ssh v1.0.0-submission     # 用可用的远端；origin 走 HTTPS，可能超时
```

打完后 `node scripts/release-freeze.mjs <SHA>` 的 `tag` 字段应显示该 tag；否则说明 tag 没指到同一提交。

## 四、更新文档与贡献记录

- [ ] `RELEASE_FREEZE_DRAFT.zh-CN.md`：把 §一 的候选 SHA、§三 映射表、§四 校验和换成清单里的值；§二 阻断项按实际情况勾选或注明
- [ ] `CONTRIBUTIONS.md`：补 E（#9 报告、#10 演示）与 R（#11 冻结）的条目
- [ ] `DEMO_RECORDING_SCENES.zh-CN.md`：视频一行填最终文件名与 SHA-256（若视频有改动）

## 五、备份

```sh
# 源码归档（按冻结 SHA，含前缀便于解压）
git archive --format=zip --prefix=agentledger-<短SHA>/ <完整 SHA> -o agentledger-<短SHA>.zip

# 校验归档是否完整
unzip -l agentledger-<短SHA>.zip | tail -3
```

需要一并备份（清单见草案 §六）：

- [ ] 源码归档 zip
- [ ] `docs/project/evidence/`（含 `escrow-screenshots/`、本次 `release-manifest.json`）
- [ ] `docs/project/assets/` 三个视频
- [ ] `docs/project/` 下全部验收与复核记录
- [ ] 回执清单（9 笔社区交易 + 部署交易 + 托管交易哈希）

## 六、提交（只能人做）

- [ ] 按课程渠道提交（平台/邮箱/压缩包命名要求按老师规定）
- [ ] **保留回执**：提交成功页截图或确认邮件，存成 `docs/project/evidence/submission-receipt-<日期>.png`
- [ ] 在 #11 里贴回执并勾选三条验收

## 七、提交后

- [ ] 关闭 #11（若由 PR 关联则自动关闭）
- [ ] 在群里同步：最终 SHA、tag 名、回执位置

## 附：一条命令的自检（提交前最后一遍）

```sh
git rev-parse HEAD                                   # 应为冻结 SHA
node scripts/release-freeze.mjs HEAD | head -20      # 校验和与清单一致
git status --porcelain=v1 --untracked-files=all      # 应为空
```

任一项不符就停下来查，不要带着不确定提交。

## 已知不属于本清单的事

- 报告正文（E1 / #9）与演示旁白（E2 / #10）不在冻结动作里；它们若在冻结后修改，冻结 SHA 就不再代表提交内容，**必须重新冻结**。
- 本清单不判断「能不能交」：阻断项、缺失证据、验收未完成，仍需 release 自行判断并在 #11 记录。
