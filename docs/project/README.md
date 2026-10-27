# 项目协作入口

- [五人任务与排期](TEAM_TASKS.zh-CN.md)
- [共享部署地址与回执](DEPLOYMENTS.md)
- [实际贡献记录](CONTRIBUTIONS.md)
- [PR 与分支规则](../../CONTRIBUTING.md)

当前 GitHub 集成已连接账号 Zqqq-qq；当前连接不提供建库接口，需要先在 GitHub 网页完成建库。远端仓库、Issues 和成员邀请尚未创建，不能把本地任务草稿描述为已派发。

已收到并核实的成员：daizhiqi、ffmitrg、PAisHere。加仓库所有者共四人，尚缺第五位用户名。角色 A–E 仍待认领；releaseOwner 暂设为仓库所有者。

`issues.json` 是 11 项结构化任务草稿；`team.json` 暂无成员。

若选择 GitHub CLI，可在该账号完成 `gh auth login` 后运行：

```sh
node scripts/sync-github.mjs           # 只预览，不产生外部写入
node scripts/sync-github.mjs --apply   # 在当前账号下建私有仓库并创建任务
```

收到本人提供的组员用户名后填写 team.json，增加 `--invite` 可发出写入权限邀请。组员接受后脚本可重复运行以完成 Issue 分配。脚本拒绝覆盖其他 origin 或隐式使用同名公开仓库；遇到同名仓库冲突应先人工核对。

GitHub CLI 是备用方式，本次尚未安装或认证；优先完成 GitHub 集成连接后继续由助手执行。
