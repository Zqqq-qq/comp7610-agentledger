# A2 状态提示与回溯验收（#2）

2026-10-29，Zqqq-qq 使用 Codex 协助实现和检查；基线 main `db5e645`。PAisHere / QiuQiu-xuan 的独立复审待完成。

## 变更

团队卡片/工作区增加四种状态的下一步说明：Pending 区分当前钱包是否为 host/guest；Active 说明双方提议与另一方审阅、退圈不撤销既有权限；Declined/Cancelled 明确邀请已结束，须从原任务重新邀请，空态也不再提示接受旧邀请。作品详情说明 Proposed 作者不能自确认、另一成员的审阅权限、Published 只代表双方同意，以及 Rejected 从工作区发起修订，保留历史。

需求帖列出该帖的所有已加载团队，点击进入工作区（Demo 与 Sepolia 共用）；作品详情在既有团队入口外增加直接返回需求帖入口。此前需求帖只给 Sepolia Active 团队的托管入口，不能完整回溯 Pending/终态团队。托管仍可从 Active 团队工作区进入。

没有改钱包签名、权限、状态机、Solidity 或 ABI。隐藏按钮只是 UI 呈现，合约仍是权限依据。记录可能受已加载范围限制；读取器原有补齐引用逻辑保持不变。

## 实际浏览器验收

本地 `PORT=8092 node scripts/serve.mjs`；内置浏览器，桌面 1280×720 与手机 390×844。全程 Demo sandbox，仅操作独立端口的浏览器本地数据，没有连接 MetaMask 或广播 Sepolia 交易，不把种子作品当真实链上验收。

1. 桌面打开种子 Active 团队，进入原需求帖，再由需求帖返回团队。
2. Alex 邀请 Maya：host 仅有取消按钮，提示不能代接受；Maya 切入后有接受/拒绝按钮及入圈提示。
3. Maya 接受后提议作品：作者在桌面/手机均看不到 Confirm/Request changes 按钮，提示等待另一人；Alex 有两种审阅按钮，实际点击 Request changes，看到 Rejected 状态与重新提议说明。
4. 手机打开种子 Published 作品，看到双方同意不等于质量认证/付款的说明；作品→需求帖→团队→作品路径实际可用。
5. 创建两个额外邀请：host 取消一个、guest 拒绝另一个；手机查看终态，没有接受、取消或提议按钮，且明确旧邀请不能重开。
6. 手机作品弹窗测量：viewport/document 宽均为 390px，dialog 宽 370px、scrollWidth 368px；没有横向溢出，两个回溯按钮可见。详情见 `evidence/a2-guidance/mobile-metrics.json`。

截图均在 [evidence/a2-guidance/](evidence/a2-guidance/)：desktop-active / desktop-pending-host / desktop-pending-guest / desktop-proposed-author，以及 mobile-proposed-author / mobile-rejected / mobile-published / mobile-task-links / mobile-cancelled / mobile-declined。截取时的状态和账户如文件名所示。既有测试套件与静态构建检查见 PR；新 B2 测试属于另一独立 PR，不混计为本 PR 新增测试。
