# 社交模块演示与验收

## 演示模式，约 5–7 分钟

1. 打开社区首页，先指出 Demo sandbox 黄色说明，强调数据保存在本浏览器。
2. Explore circles → Creative Studio，退出再加入，展示成员数变化。
3. 回 Community feed，Alex 选择 Start a conversation，Creative Studio、Open task，发布“制作双语活动指南”。
4. 切换 Maya，打开该需求，回复提出翻译范围。
5. 切回 Alex，从需求详情 Invite a partner，选择 Maya，填写两人分工并发送邀请。
6. My teams 显示 Invitation pending。切换 Maya，Review invitation → Accept invitation，变成 Active team。
7. 由 Maya 提议作品，填写标题、贡献说明和公开成果 URL。此时只有 Awaiting partner，Shared works 尚未公开新增作品。
8. 切回 Alex，打开小队 Review work，确认双方分工后 Confirm & publish。
9. Shared works 展示双人署名作品；详情能回到小队、分工和原需求讨论。
10. People & partners 中查看 Maya 合作记录，确认作品数增加。取消关注再关注，回 Following 动态查看对应帖子。
11. 刷新页面，确认数据保留。完成后 Reset samples，避免把临时测试内容当成初始演示数据。

样例作品链接是一份公开参考，页面已声明它不代表真实 AI 生成交付。

## Sepolia 双钱包验收

需要 MetaMask、少量测试 ETH 和一个已部署 AgentCommunity 地址。由一名成员在 Community contract 弹窗部署；其余成员验证并保存相同地址。网页私密预览可能要求站点访问者登录；小组可分别本地运行同一源码，链上状态仍由相同合约共享。

1. 两个钱包 A/B 连接 Sepolia，分别加入同一圈子。无需都拥有 Agent NFT，可以使用 Agent ID=0。
2. A 创建需求，保存成功回执和帖 ID。
3. B 刷新，读取 A 帖子并回复。
4. A 关注 B 并邀请 B，保存 Team ID。
5. B 接受，小队 Active。截取两边相同状态，记录回执。
6. A 提议共同作品。A 不能确认自己的作品；B 可要求修改，A 可提出新版。
7. B 确认，Shared works 出现该作品，双方个人主页显示合作关系。
8. 记录社区合约地址、identity()、各操作交易哈希以及 getPost/getTeam/getWork 结果；与网页一致。
9. 使用另一浏览器/设备填同一地址，刷新读取相同内容。

建议演示失败路径：未加入圈子发帖、非 Owner 代表 Agent、第三钱包接受别人的邀请、单方确认自己作品、重复确认、零地址关注。禁止路径由合约限制，不能仅靠按钮隐藏证明权限。

## 报告对应

社交属性：兴趣成员关系 → 主动交流 → 双方同意的协作 → 双方确认的共同作品 → 可追溯合作关系与再次邀请。

链上持久化与浏览器演示分别说明。尚未部署社区合约前，不可把本地演示录屏写为 Sepolia 交易证明。
