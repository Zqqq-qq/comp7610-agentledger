# 小队 #3 / 订单 #5 原始证据

- `acceptance.json`：原始完成快照（区块 12018561），六笔公开交易与成功回执、解码事件、余额变化、来源回复及摘要；保持首次取证文件字节不变。
- `baseline.json`：本轮注资前快照（区块 12018468），小队仍为 Pending、A/B/托管为 98/2/0 mUSD。
- `transaction-index.json`：本轮六笔成功交易索引。
- `job5-deliverable.md`：实际提交摘要对应的文件原始字节，3518 字节，UTF-8 / LF；不要编辑此文件来更新结算说明。
- `job5-deliverable-digest.json`：该文件的 Keccak-256 及字节数。
- `SHA256SUMS.json`：本目录上述五个归档文件的 SHA-256。

余额和链上记录均为各自区块的观察，不代表实时状态。`acceptance.json` 内 UI 检查为 Codex 的历史观察；只读核验脚本复现链上部分，不会重新执行浏览器流程或广播交易。两账户由同一用户控制，文件不包含私钥、助记词或个人浏览器存储。

从仓库任意目录运行 `node /path/to/repo/scripts/verify-team3-acceptance.mjs`，会固定复读完成快照；历史状态不可用时需要归档 RPC，不会回退 latest 或覆盖原始文件。完整过程见 [验收报告](../../TEAM3_ESCROW_SEPOLIA_ACCEPTANCE_2026-10-29.zh-CN.md)。
