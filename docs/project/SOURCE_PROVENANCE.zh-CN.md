# 后端来源与许可证复核

2026-10-29，Zqqq-qq 使用 Codex 协助。基线 main `db5e645`。此修订更正 #38 后续发现的来源/字节表述，不修改任何 Solidity 或编译产物。

## 可核验的来源

源项目：[Mnorbert87/arc-agent-registry](https://github.com/Mnorbert87/arc-agent-registry/tree/3b7976a5bbcfe8fac063adfe07fd1244b2bf69de)，固定提交 `3b7976a5bbcfe8fac063adfe07fd1244b2bf69de`。

通过 GitHub API 读取该提交的递归树及原始 blob，逐文件对比：

| 当前文件 | 固定上游路径 | 当前文件 SHA-256（LF） |
| --- | --- | --- |
| IdentityRegistry.sol | contracts/src/IdentityRegistry.sol | 44033281eef840c8e7117cf38caf62b43acdb104e5eff8cd29a7ab5f9824cc72 |
| JobEscrow.sol | contracts/src/JobEscrow.sol | ce7d4c46fbd76caafca8d31c78d58c428ddb560fd7a46b6a8fd50a888710f907 |
| ReputationRegistry.sol | contracts/src/ReputationRegistry.sol | cc5dc6bbb85dfd5b012dc9524d649f5efaea1cd8d8d68e36b92e86d6629570ff |
| MockUSDC.sol | 该上游提交中未发现 | 48783f227eadc77ff8fd36cfef7e35e65d20f8a2d2e421f7323a123db9878b2a |

前三个当前 LF 文件与固定上游 blob 的字节完全一致；但导入课程快照的三个文件当时是 CRLF，历史 SHA-256 不等于当前 LF 文件。将当前 LF 恢复成 CRLF 后，三个历史哈希全部匹配；MockUSDC 的历史哈希与当前文件直接一致。PR #15 已记录行尾归一化，不能继续笼统声称所有文件始终“原字节未变”。

MockUSDC 来自用户提供的 COMP7610-AgentLedger 快照，不能把它的作者/原始来源推定为上述固定上游；更早来源未独立验证。`backend-provenance.json` 的旧 `backendSource` 是当时的相对目录标签，不是本次重新取得的外部仓库路径。

## 哈希字段与许可证

`backend-provenance.json` v2 中，`sha256` 是当前 `contracts/*.sol` Git blob 的值；旧值原样移入 `importedSnapshotSHA256`，并记录各文件的上游路径、Git blob ID 与核验日期。`existingContractsModified=false` 仅表示社交扩展未改 Solidity 逻辑，不否认行尾变化。

上游 [MIT LICENSE](https://github.com/Mnorbert87/arc-agent-registry/blob/3b7976a5bbcfe8fac063adfe07fd1244b2bf69de/LICENSE) 的 `Copyright (c) 2026 Mnorbert87` 和完整许可文本已保留在 LICENSE.backend；对比确认除 CRLF/LF 外一致。根 LICENSE 的团队版权不覆盖或替代该通知。Ethers 和开发依赖仍保留各自来源许可，详见 THIRD_PARTY_NOTICES.md。本修订不对未验证部分补写作者或新的授权结论。

## 离线复现

```sh
node scripts/verify-provenance.mjs HEAD
# 或指定包含本次来源记录的固定提交
node scripts/verify-provenance.mjs <commit>
```

该脚本从指定提交的 Git blob 读取记录和四个源码，核验当前哈希、恢复历史行尾后的哈希，以及记录中的上游哈希；它不执行源码、不联网，也不声称重新独立取得上游。独立来源复核应按上方固定上游路径/提交读取 blob，与 JSON 中的 Git blob ID 及 SHA-256 比较。原部署源码快照仍用于既有部署复现，不用当前 LF 文件替换历史来源。
