# 五人协作规则

## 唯一主线

本仓库 main 是最终源码来源。微信群可以沟通和分享截图，代码通过分支和 Pull Request 合并；下载的 ZIP 作为交付备份，不作为并行维护主线。上游或个人旧版本需先对比，再挑选改动合入。

1. 开始前认领 Issue，写清范围、分工和验收条件。
2. 从最新 main 建任务分支，例如 `feat/12-circle-ui`、`fix/18-wallet-refresh`、`docs/20-report`。
3. 一次 PR 解决一个清晰任务，正文关联 Issue。
4. 至少另一名成员阅读并确认，CI 通过后由轮值集成人合并。仓库平台保护规则未启用前，这是一条团队约定，不代表技术上已禁止直推。
5. 合并后删除已完成远端分支；再开始新任务时重新从 main 建分支。

```sh
git switch main
git pull --ff-only origin main
git switch -c feat/12-circle-ui
# 修改后运行与范围对应的检查
git add <本次修改的文件>
git commit -m "Improve circle membership feedback"
git push -u origin feat/12-circle-ui
```

请设置自己的 Git 姓名和 GitHub 可识别邮箱后提交；贡献按实际记录，不代其他成员署名。

## 文件交接边界

| 主要负责人 | 主要文件 | 修改公共接口时找谁 |
| --- | --- | --- |
| A 社区前端 | web/social.js、web/social.css | C 钱包接口；B 合约字段 |
| B 社区合约 | contracts/AgentCommunity.sol、编译产物 | C ABI 与部署；D 权限测试 |
| C 钱包与部署 | web/app.js、web/social-chain.js、web/config.js | A UI 交互；B 合约接口 |
| D 测试与质量 | tests/、.github/workflows/、测试记录 | 对应功能负责人 |
| E 报告与演示 | docs/、报告图、演示与贡献记录 | 全体核对实际实现 |

这些是联调责任，不是禁止互相修改的所有权。`web/index.html`、`web/social-core.js`、package.json、锁文件和 ABI 是公共文件；要动它们，先在 Issue 通知相关负责人。多人改同一文件时缩小 PR 并尽快合并，不手工互相覆盖整个目录。

## 统一运行与验证

运行：`node scripts/serve.mjs`，打开 http://127.0.0.1:8091 。

编译和测试：安装 Node.js 24、pnpm 11.25.0 后执行：

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

修改 Solidity 后同时提交重新生成的 `web/generated/AgentCommunity.json`。合约无法用改本地文件的方式升级已部署版本；需要新地址时在 PR 明确说明，并更新共享部署记录。不要提交 node_modules、dist、临时 ZIP、个人浏览器状态或测试钱包私钥。

## 钱包、地址与录屏

- 每位成员使用自己的测试钱包；不共用助记词或把私钥发到群里。
- 公共合约地址和交易哈希写入 docs/project/DEPLOYMENTS.md。
- Demo sandbox 的假数据不能作为 Sepolia 成功证据。
- 11/03 后冻结功能范围；11/06 完成录屏和彩排；11/07 冻结提交版本，11/08 提交。
