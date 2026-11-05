# 合作履历与账户动态补录（E2 / #73，2026-11-05）

本补录对应 [Issue #73](https://github.com/Zqqq-qq/comp7610-agentledger/issues/73)：录 #67 新增的 **My collaboration history** 与 **My activity**，作为 #10 演示成片的素材输入，对齐《视频英文配音稿-审核版-v1.md》voice-07 / voice-09 / voice-10。

**这不是最终成片。** 没有旁白、没有五人彩排、没有真实钱包或新的 Sepolia 交易；素材由 D（@QiuQiu-xuan）录制并交给 E（@daizhiqi）整合。全程为 **Demo sandbox**，Alex / Maya 是同一浏览器的演示身份，不是真实独立用户。

## 交付文件

所有文件位于 `docs/project/assets/`，1280×800、25 fps、H.264、无音轨。

| 文件 | 时长 | 字节 | SHA-256 | 对应全片区间 |
| --- | --- | --- | --- | --- |
| `social-insights-full-2026-11-05.mp4` | 00:40.80 | 756,902 | `b8d1f36cc99445c117077142593906496a616df68a79078b3da7418d3ff775cb` | 00:00–40.80（连续，无内部剪辑） |
| `social-insights-01-invite-accept-2026-11-05.mp4` | 00:07.16 | 184,701 | `4da14a0e6ecd8b26d245d8c36bf393e3bdec07666079d5fea671121fb41c451e` | 04.95–12.10 |
| `social-insights-02-review-confirm-2026-11-05.mp4` | 00:17.96 | 273,687 | `bbb94cc2c25c53c6d8716d7137d189bbc660d6ce1456c6aa5ae4b815a48370b0` | 13.05–31.01 |
| `social-insights-03-portfolio-2026-11-05.mp4` | 00:09.28 | 228,445 | `0c1ad21905123002ee62a3d2882a53ec25c73e11a9d2f0a532b9071f9e0de6c0` | 31.30–40.57 |

三个分段是从全片按上述时间点重新编码的**节选**，便于剪辑取用；全片本身是一次连续录屏，没有在 UI 操作中间拼接。录制文件没有声音，留给后期配音。

## 三段内容

| 段 | 操作 | 画面关键状态 | 配音对应 |
| --- | --- | --- | --- |
| 1 | Maya 的 **My activity** → 打开邀请 → 查看双方分工 → **Accept invitation** | `Invitation pending` → `Active team`；显示 Alex / Maya 各自贡献；Demo sandbox 标识始终可见 | voice-07（接受邀请、进入 Active team） |
| 2 | Maya 在 team 内 **Propose a shared work**，填写 `Analysis chart draft`、示例贡献说明和示例 URL → 切换 Alex → **My activity** → **Review work** → **Confirm & publish** | 表单完成；`Awaiting partner` → Alex 的 `Work awaiting your review` → `Jointly confirmed`；文案明确“records mutual consent, not independent verification or payment” | voice-09 / voice-10（提议、待审、另一方确认） |
| 3 | Alex 的 **My collaboration history** → 打开 **Source discussion** | 伙伴 Maya Lin、`Analysis chart draft`、来源小队/帖子回溯；订单区显示 Demo 无已核验订单，作品确认与付款分开 | voice-10 结尾的履历回溯 |

状态名称使用界面原文（`Invitation pending` / `Active team`、`Awaiting partner` / `Jointly confirmed`），不把合约的 Proposed / Published 当作屏幕文案。

## 录制环境与准备

- 代码：main `3efa93286c2b42167ffe71d1280b1249a384afd2`（`pnpm test` 112 项基线；本次未新增测试）。
- 浏览器：本机 Chrome（Playwright 1.49.1，`headless: true`），视口 1280×800；Playwright 录 webm，本机 FFmpeg 9.0.2 转 H.264 MP4。
- 服务：`PORT=8097 node scripts/serve.mjs`，页面 `http://127.0.0.1:8097/#activity`。
- Demo 状态在页面加载前通过 `web/social-core.js` 的 `applyAction` 生成并写入 localStorage：Creative Studio、Alex 发布 `Analysis visualisation partner`、向 Maya 发出 pending 邀请。**准备动作不在录像内**；录像从 Maya 的 My activity 已显示该邀请开始。
- 未连接钱包、未切换 Sepolia、没有签名或交易；`Connect wallet` 按钮只是页面原有入口，全程未点击。
- 作品使用示例 URL（`https://example.com/analysis-chart-draft`），摘要明确标注 example，不是真实 AI 交付，也没有真实订单引用。

## 可复现

录制脚本已提交为 `tests/browser/social-insights-recording.mjs`（需要独立安装 Playwright 与 Chrome，不增加运行时依赖）：

```sh
PORT=8097 node scripts/serve.mjs
# 另一个终端
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
  node tests/browser/social-insights-recording.mjs
# 输出：tmp/social-insights-recording/*.webm，脚本同时打印每段时间点
```

FFmpeg 转 MP4（本机使用 9.0.2）：

```sh
ffmpeg -i tmp/social-insights-recording/<hash>.webm \
  -c:v libx264 -preset medium -crf 24 -pix_fmt yuv420p -movflags +faststart \
  docs/project/assets/social-insights-full-2026-11-05.mp4
```

分段用 `-ss` / `-to` 按上表区间重编码；时间点由脚本的 `MARK` 输出得到。Playwright 的录屏是 webm，仓库文件是转换后的 MP4，转换不会增删画面。

## 交接与边界

- 交给 @daizhiqi 纳入 #10 成片，核对已实际加入 voice-07/09/10 场景；素材交付不等于成片、旁白或彩排完成。
- 本补录未改应用、合约、ABI、部署地址、报告或 23 项清单；#11 的最终冻结/备份需按实际使用的视频文件重新登记哈希。
- Demo 标识、示例 URL、“不是真实 AI 交付”“作品确认不等于付款”均保留在画面/文案中；不混入历史 Sepolia 视频，也不声称同一旅程。
