# B2 内容边界与合约产物复核（#4）

2026-10-29，Zqqq-qq 使用 Codex 协助。基线 main `db5e64501608485a931bcfc8252970a1f3d77997`。这是本地 EVM / 源码 / 编译复核；没有新增 Sepolia 交易，也不代替 ffmitrg 的独立审阅。

## 字节与输入边界

`AgentCommunity._text` 检查 `bytes(value).length`，不是 Unicode 字符数：所有字段均须大于 0，最大值包含在内。

| 字段 | UTF-8 最大字节数 |
| --- | ---: |
| post.title / team.title / work.title | 160 |
| post.body / work.summary | 6000 |
| reply.body | 3000 |
| team.hostRole / team.guestRole | 300 |
| work.uri | 1024 |

新测试 `tests/community-content-boundaries.test.mjs` 对以上九个字段逐一构造中文三字节字符与 ASCII 混合输入：恰好达到上限成功；再多一个字节及空串均以 `invalid text length` 拒绝。使用真实 Ganache EVM 的 staticCall，成功检查不持久写入；计数保持基线。合约不 trim 空白、不做 HTML/内容审核；长度合格不代表内容有效或安全。UI 的 maxlength 是额外输入限制，不是合约字节规则。

## URI 和公开性

合约对 URI **只做非空与 1024 字节限制**。测试直接调用合约，证明 `javascript:`、`data:`、含账号密码的 HTTPS 文本及 `not a URL` 均通过合约长度检查，且 `javascript:alert(1)` 可以写入并原样读回。它们是公开文本；不要放入密码、个人隐私或密钥。

官方写入适配器 `web/social-chain.js` 和 Demo `applyAction` 使用 URL 解析，只允许 HTTP / HTTPS / IPFS 且拒绝 credentials；这属于客户端规则，可被直接调用合约绕过。渲染使用文本转义；`safeLink` 仅把无 credentials 的 HTTP(S) 转为可点击外链，IPFS/非法协议按文本显示，不在页面执行。测试同时验证 URI helper 的这些结果。客户端允许 HTTP 不代表加密安全；IPFS URI 不保证内容存在或已被固定，HTTPS 内容也可变。

共同作品记录保存链接与声明，不保存外部资源快照/内容哈希，也不保证可用性、质量、版权或实际劳动。双方可以串通积累合作次数；确认仅代表另一团队钱包同意，不是独立质量认证，更不触发托管付款。外部页面应由用户自行判断是否访问。

## 错误与重复操作

新增用例核对具体原因：重复入圈 `membership unchanged`、重复关注 `follow unchanged`、已 Active 再接受 `team not pending`、无效帖子 `unknown post`、重复待审提议 `review pending work first`、作者自确认 `only other member`、终态再审阅 `work not pending`。操作后检查 follow/work/collaboration 计数，没有重复增量。此前权限、邀请拒绝/取消、退圈及双向作品流程测试仍保留。

## 编译复现

使用锁文件固定的 solc **0.8.30**（完整版本记录在生成 JSON），标准 JSON 编译设置来自 `scripts/compile.mjs`：optimizer enabled，runs 200，viaIR true，evmVersion shanghai，source key `AgentCommunity.sol`；输出 ABI、creation bytecode 与 runtime bytecode，runtime 需不超过 EIP-170 的 24576 字节。已提交 JSON 保存 ABI 与 creation bytecode。`.gitattributes` 固定 Solidity/产物为 LF；CRLF 源码会改变 metadata 和产物哈希，旧托管部署的原始来源快照见既有部署验收记录。

```sh
pnpm install --frozen-lockfile
node --test tests/community-content-boundaries.test.mjs
pnpm test
pnpm build
git diff --exit-code -- contracts web/generated
```

专项 3/3 通过，覆盖九字段 27 次精确边界调用及 URI/重复状态检查。最终全量结果见 PR 的 CI；本次不修改 Solidity、ABI、部署地址或已有链上验收快照。合并前请 ffmitrg / QiuQiu-xuan 对照源码和复现命令审阅。
