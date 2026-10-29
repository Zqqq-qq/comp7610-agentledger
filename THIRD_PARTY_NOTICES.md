# Source and attribution

This extension starts from the user-supplied COMP7610-AgentLedger.zip (assignment-frontend). Its original frontend, source records, LICENSE.backend and vendored ethers license are retained. The original README is preserved at docs/LEGACY_README.md.

IdentityRegistry.sol, ReputationRegistry.sol and JobEscrow.sol match the LF source blobs at contracts/src/ in https://github.com/Mnorbert87/arc-agent-registry, commit 3b7976a5bbcfe8fac063adfe07fd1244b2bf69de (MIT; copyright 2026 Mnorbert87, retained in LICENSE.backend). The supplied course snapshot used CRLF for those three files; PR #15 normalized them to LF without Solidity logic edits. MockUSDC.sol was supplied in the course snapshot and is not present in that upstream commit; its prior authorship is not independently verified. Current and historical hashes are separate in backend-provenance.json; see docs/project/SOURCE_PROVENANCE.zh-CN.md. AgentCommunity.sol and the social modules/tests are course-project additions.

Ethers.js 6.13.4 is vendored under its MIT license. Development dependencies solc and Ganache retain their upstream licensing; they are not included in the browser distribution.
