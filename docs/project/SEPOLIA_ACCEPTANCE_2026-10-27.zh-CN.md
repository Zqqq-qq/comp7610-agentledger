# 2026-10-27 Sepolia 钱包与社区验收

## 环境与真实记录

- Chrome + 官方 MetaMask 13.54.0，Ethereum Sepolia / 11155111；所有钱包凭据与最终签名由用户亲自处理。
- 社区 `0x8CDc9987D46D140a982713B359286bC451262406`，IdentityRegistry 沿用原有地址。
- 部署交易、源码提交、参数与独立核验结果见 [DEPLOYMENTS](DEPLOYMENTS.md) 和 [JSON](evidence/community-sepolia-deployment.json)。未进行 Etherscan 源码发布验证。
- A：`0xD3Ce5196125cd6e25212de4D04911093D3F62D5d`；B：`0xE8bCb71A15ea106aF0CD431C37C1002FeD938e20`。B 测试前由 A 转入 0.005 Sepolia ETH。

## 验收结果

| 项目 | 方法与观察 | 结果 |
| --- | --- | --- |
| 网络恢复 | 初次连接显示钱包处于其他网络；MetaMask 允许 Sepolia 后页面显示 ready to sign | 通过 |
| A 社区操作 | A 加入 Builders Club（circle 3），发布 post 1 | 真实成功回执 |
| A → B 账户切换 | B 能读 A 的帖子，但仍显示 Join circle，没有继承 A 的成员状态 | 通过 |
| B 社区操作 | B 独立加入 circle 3，给 post 1 发布 reply 1 | 真实成功回执 |
| B → A 切回 | A 仍能读 B 的回复；自己帖子处显示 You，不显示自关注入口 | 通过 |
| 跨浏览器共享 | Chrome 与独立内置浏览器配置同一社区，均显示 post 1、Discussion 1 及相同回复内容 | 通过；同一电脑的两个浏览器，第二浏览器只读 |
| 拒签与重试 | 取消真实 MetaMask 发帖请求，未生成帖子；再次提交由用户确认，post 1 成功 | 通过；发现并修复草稿丢失 |
| 无代码地址恢复 | 内置浏览器尝试将 A 钱包地址作为社区，弹窗提示 No community contract exists；恢复正确地址后帖子/回复可读 | 通过 |
| RPC 失败恢复 | 内置浏览器设置不提供 RPC 的本机路径，显示 404 / Could not verify these settings；恢复 PublicNode 后读取原内容 | 通过；故障配置没有保存 |
| 错误注册表恢复 | 对真实 Sepolia 社区使用错误的预期 Registry 调用只读适配器，返回 different identity registry；恢复正确预期后成功 | 通过；只读适配器验证，未伪造浏览器错误配置 |

四笔社区写入的 status 均为 1，见 [记录及回执](evidence/community-sepolia-live-records.json)。错误 Registry 的具体输入与结果见 [JSON](evidence/community-sepolia-registry-mismatch-recovery.json)。

## 本次修复

1. 社交弹窗重绘时保留当前表单草稿，拒签或读请求失败后可直接重试；回复成功后清空回复输入。
2. 错误信息直接放在当前弹窗内，避免全局短提示被模态窗口遮住；重试会清除旧错误。
3. 钱包下拉框按地址显示，避免授权列表重新排序后，页面的临时编号与 MetaMask 账户名称混淆。
4. 对被新钱包事件取代的账户快照返回明确结果，连接/网络切换流程不会继续根据旧状态显示假错误。
5. 新浏览器默认提供真实社区地址；演示和 Sepolia 模式继续区分，已保存的浏览器配置保持优先。

## 自动回归

本次修复后重新编译，56/56 自动测试通过，静态站点构建和差异检查通过。新提交的远端 CI 结果以 PR #16 的最新检查为准。

## 验证边界与待办

- 用户 + Codex 执行本次操作；另一位组员尚未独立复核社区，#5 的该项保持未勾选。
- 本次完成 #6 基础账户、共享数据和错误恢复验收；没有把只读适配器测试写成第三个浏览器或另一成员的人工操作。
- 邀请组队、共同作品、关注全流程及 #12 的托管付款/退款/超时领取，没有在这次 Sepolia 会话中验收；它们的本机自动测试记录与此分开。
- 托管动作通过 selectedSigner 检查网络；社区发送还会再次核对实时链 ID。托管每个写路径的额外网络守卫仍是后续审阅建议，测试时不要在签名请求处理中切换网络。
- 新修复需同伴复审与 CI；真实部署与界面验证不替代代码审阅。
