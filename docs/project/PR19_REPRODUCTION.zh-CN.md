# PR #19 证据复现与边界

本次由 Zqqq-qq 请求、Codex 辅助只读复算；不是其他组员的人工复审。完整原始数据为 [pr19-reproducible-audit.json](evidence/pr19-reproducible-audit.json)。

## 固定区块及环境

- 采集时间：`2026-10-28T03:51:36.531Z`；RPC：`https://ethereum-sepolia.publicnode.com`；chain ID：11155111。
- 节点返回：`Geth/v1.17.9-stable-9dffe6e9/linux-amd64/go1.25.14`。
- 固定区块：12009736 / `0xb74108` / `0x3a5c54c63428b4546139a723c4929f8857b43b2622a8ed4c89fc8fa4739baf5c`。
- 旧区块 12006235 的状态在默认公共节点上已不可读。本次另取明确的新快照，不将 latest 伪装成旧快照。复现固定区块需要保留该历史状态的 RPC；若节点报 historical state unavailable，应记录失败，不能静默回退 latest。

## 执行完整核验

在仓库根目录安装锁定依赖后运行（无钱包、无签名、无交易广播）：

```sh
pnpm install --frozen-lockfile
node scripts/audit-community-evidence.mjs --block 12009736 --rpc https://ethereum-sepolia.publicnode.com --output /tmp/pr19-audit.json
```

不传 `--block` 会冻结新的当前区块，输出记录自己的高度与哈希；该结果是新快照，不能替换为历史结果。脚本遇到非预期 RPC 错误或断言失败会退出，预期 revert 保存在 cases 与 raw。所有 RPC 方法受只读白名单限制。

## 重编译与 immutable 回填

- 源码基线：`583fd6d1a1932a56c508d1faef617868e8ccb85c`。
- `contracts/AgentCommunity.sol` Git blob：`1938bd55c3a84ca6c0c92075fb59c8dba05c7631`。
- `web/generated/AgentCommunity.json` Git blob：`8ad4d097924d454ef3b40c0bf069304984a998ef`。
- 编译器：`0.8.30+commit.73712a01.Emscripten.clang`；optimizer enabled/runs=200，viaIR=true，evmVersion=shanghai。
- 标准 JSON 编译输入使用 sources key `AgentCommunity.sol`，完整 settings 保存在 JSON.settings；路径名和换行会影响 metadata，须保留仓库 LF。
- 先比较重编译 creation bytecode 与提交产物，再比较两笔部署 input 与 creation bytecode + ABI 编码 identity 构造参数。
- 唯一 immutable 为 identity，编译器返回两个引用：字节偏移 7445、10406，长度均为 32；用 identity 地址左补零至 32 字节回填，不修改其他字节。
- 两份链上 runtime 均 10973 字节；回填后的 keccak256：`0x42953724f77e05c99bf2f08f5faa057211268ec0973fe17e59cd072f61cafde7`。
- 脚本实际执行编译、回填、逐字节比较、identity() 检查和回执区块哈希检查。两个合约均未声称已通过 Etherscan 源码验证；字节一致也不证明部署者实际 checkout 的提交。

## 调用矩阵与完整参数

目标均为部署 A。各行均固定在上述区块；cases 按以下顺序，JSON 内每项包含完整 params 与原始返回：

| 索引 | 用例 | 预期 |
| --- | --- | --- |
| 0 | third-wallet-accepts-pending-team | only invited partner |
| 1 | invited-wallet-accepts-same-pending-team | success |
| 2 | author-self-confirms-proposed-work | only other member |
| 3 | other-member-confirms-same-proposed-work | success |
| 4 | nonmember-posts-circle-1 | join circle first |
| 5 | same-author-posts-member-circle-2 | success |
| 6 | repeat-confirm-confirmed-work | work not pending |
| 7 | same-member-confirms-proposed-work-control | success |

前两组控制只更换 from；第三组保持调用者与内容，仅换成其已加入的圈子 2；第四组保持调用者，仅换成 Proposed 的 work 2。这样分别排除角色、圈子和状态条件之外的调用错误。team 2 Pending / work 2 Proposed / work 1 Confirmed 的完整读数保存于 preconditions。

以下可复制命令逐项发送保存的 **8 个完整 eth_call 参数**；不广播交易、不改变状态。输出应与 cases / raw 对照，回滚响应中的 error.data 保留原始 Error(string) 编码：

```sh
python3 - <<'PY'
import json, urllib.request
d = json.load(open('docs/project/evidence/pr19-reproducible-audit.json'))
for i, case in enumerate(d['cases']):
    payload = {'jsonrpc':'2.0', 'id':i+1, 'method':'eth_call', 'params':case['params']}
    request = urllib.request.Request(d['endpoint'], data=json.dumps(payload).encode(), headers={'Content-Type':'application/json'})
    print(case['label'], json.dumps(payload))
    print(urllib.request.urlopen(request, timeout=30).read().decode())
PY
```

原始 JSON 还包含每个请求的 HTTP 状态、ID、method、params、原始 response；每个拒绝 case 保存 revertData / decodedReason。固定区块哈希可通过 eth_getBlockByNumber 再核对；如哈希不同，停止对比。

## 部署 Gas：仅报告原始观察

| 部署 | 区块 | gasUsed（十六进制 / 十进制） | effectiveGasPrice（wei） | 费用 ETH |
| --- | --- | --- | --- | --- |
| A | 12005434 | 0x1062f9a / 17182618 | 0x59682f0e / 1500000014 | 0.025773927240556652 |
| B | 12005696 | 0x1062f9a / 17182618 | 0x10 / 16 | 0.000000000274921888 |

费用由 gasUsed × effectiveGasPrice / 10^18 计算。交易完整哈希、receipt、blockHash 及同高度区块头均在 JSON.deployments / raw。对数值异常仅报告该远程节点的返回；不能据此推导 Sepolia 或以太坊协议的 gas 规则发生变化。链 ID 单项也不是对链历史的独立认证。缺少具体交易哈希的“普通转账 gas 12000”观察不纳入本次已核验结论。本地 Ganache 的原生扩展回退仅属于本地运行环境，与这些远程 RPC 取证无关。

## 快照时间线及未完成工作

| 来源 | 区块 / 哈希 | 计数与边界 |
| --- | --- | --- |
| #16 已提交记录 | 12005532 / `0xaba841c14438741814e397241dac5046009669036000fc5f64b4315fd4098817` | post/reply=1/1；本次仅重读区块头，不重算旧状态 |
| 本次 RPC 取证 | 12009736 / `0x3a5c54c63428b4546139a723c4929f8857b43b2622a8ed4c89fc8fa4739baf5c` | post/reply/team/work=2/2/2/2；合作计数双向 1；重复部署 B 全 0 |

原作者“提议阶段合作计数 0”的描述仅保留为历史报告，本次未对当时状态独立复算。11 笔业务/前置交易回执已核验；eth_call 无真实签名、无交易回执，不代替 UI 拒绝反馈。一次浏览器内的两个账户也不代表两个浏览器的完整独立验收。

- #5 保持开放：待另一成员现场复核部署与交接。
- #7 保持开放：待前端失败反馈证据、完整社交流程跨浏览器读取与同伴验收。
- #18 仅提供本地测试结果，不据此勾选公链 UI 验收。
- #12 托管公链部署与支付/退款/超时领取仍待执行。
