# 合作履历与账户动态补录（E2 / #73，2026-11-05；v2）

本补录对应 [Issue #73](https://github.com/Zqqq-qq/comp7610-agentledger/issues/73)：录 #67 新增的 **My collaboration history** 与 **My activity**，作为 #10 演示成片的素材输入，对齐《视频英文配音稿-审核版-v1.md》的 voice-07 / voice-08 / voice-09 / voice-10。

**这不是最终成片。** 没有旁白、没有五人彩排、没有真实钱包或新的 Sepolia 交易；素材由 D（@QiuQiu-xuan）录制并交给 E（@daizhiqi）整合。全程为 **Demo sandbox**，Alex / Maya 是同一浏览器的演示身份，不是真实独立用户。

本版按 2026-11-05 的复审反馈重录，替代 v1（40.80s、Creative Studio 版本）：

- 圈子统一为 **Research & Insights**（与先前准备一致）；
- 放慢关键状态：邀请待接受、Active team、Awaiting partner、Alex 待审、Jointly confirmed、履历各停留约 4–6 秒；
- 第二段补拍 **Awaiting partner**（My teams 小队工作区），不再只靠 Alex 的待审页暗示；
- 第三段向下滚动到 **Verified linked orders**，画面明确显示 “Demo community data has no verified escrow orders.”，再回到来源讨论；
- 配音对应修正为：01 → voice-07；02 → voice-08（提议）+ voice-09（另一方确认）；03 → voice-10。

## 交付文件

所有文件位于 `docs/project/assets/`，1280×800、25 fps、H.264、无音轨；v1 文件已由 v2 替换（Git 历史仍可查）。

| 文件 | 时长 | 字节 | SHA-256 | 对应全片区间 |
| --- | --- | --- | --- | --- |
| `social-insights-full-2026-11-05-v2.mp4` | 01:09.36 | 1,131,730 | `429c32fb3f1e9d2de9d6b5db8ff9299b80801f60e86f7ed188b9daee257c1993` | 00:00–69.36（连续，无内部剪辑） |
| `social-insights-01-invite-accept-2026-11-05-v2.mp4` | 00:11.68 | 212,473 | `d6d8498df41789238303a64dfe9bfd01322ebcbdb6aac932d2ffe8d14c4aadb8` | 04.84–16.49 |
| `social-insights-02-review-confirm-2026-11-05-v2.mp4` | 00:32.28 | 485,996 | `2cd5a08ec0c8af02745903f362a88eb929345d8047cd72d2e25fe8e695896fc9` | 18.54–50.79 |
| `social-insights-03-portfolio-2026-11-05-v2.mp4` | 00:16.76 | 319,176 | `029f785496ba957738c50f1a12903a4e60e1e9b75a2d3b1b0718274f44d5f737` | 51.80–68.53 |

三个分段按上述时间点从全片重编码，便于剪辑取用；全片本身是一次连续录屏，没有在 UI 操作中间拼接。录制文件没有声音，留给后期配音。

## 三段内容与节奏

| 段 | 时间（全片） | 操作 | 画面关键状态 | 配音 |
| --- | --- | --- | --- | --- |
| 1 | 04.84–16.49 | Maya 的 **My activity** → 打开邀请 → 查看双方分工 → **Accept invitation** | `Invitation pending`（约 6 秒）→ `Active team`（约 5 秒）；Research & Insights 小队；Demo sandbox 标识始终可见 | voice-07 |
| 2 | 18.54–50.79 | Maya 在 team 内 **Propose a shared work**，填写 `Analysis chart draft`、示例贡献说明和示例 URL → My teams 打开小队看到 **Awaiting partner** → 切换 Alex → **My activity** → **Review work** → **Confirm & publish** | 表单完整输入；`Awaiting partner` 停留约 4.5 秒；Alex 的 `Work awaiting your review`；`Jointly confirmed` 停留约 6 秒；文案明确“records mutual consent, not independent verification or payment” | voice-08 + voice-09 |
| 3 | 51.80–68.53 | Alex 的 **My collaboration history** → 向下滚动到 **Verified linked orders** → 回到 `Source discussion` | 伙伴 Maya Lin、`Analysis chart draft`、来源小队/帖子；`Verified linked orders` 明确显示 “Demo community data has no verified escrow orders.”（约 4 秒）；再打开原帖 | voice-10 |

状态名称使用界面原文（`Invitation pending` / `Active team`、`Awaiting partner` / `Jointly confirmed`），不把合约的 Proposed / Published 当作屏幕文案。所有关键状态为真实操作后的实时画面，没有使用慢放或定格；观众看到的停留就是录制时的实际停留。

## 录制环境与准备

- 代码：main `50253c7`（含 v1 素材合并；应用代码与 `3efa932` 相同，112 项测试基线）。
- 浏览器：本机 Chrome（Playwright 1.49.1，`headless: true`），视口 1280×800；Playwright 录 webm，本机 FFmpeg 9.0.2 转 H.264 MP4。
- 服务：`PORT=8097 node scripts/serve.mjs`，页面 `http://127.0.0.1:8097/#activity`。
- Demo 状态在页面加载前通过 `web/social-core.js` 的 `applyAction` 生成并写入 localStorage：**Research & Insights**、Alex 发布 `Analysis visualisation partner`、向 Maya 发出 pending 邀请。**准备动作不在录像内**；录像从 Maya 的 My activity 已显示该邀请开始。
- 未连接钱包、未切换 Sepolia、没有签名或交易；`Connect wallet` 按钮只是页面原有入口，全程未点击。
- 作品使用示例 URL（`https://example.com/analysis-chart-draft`），摘要明确标注 example，不是真实 AI 交付，也没有真实订单引用。

## 可复现

录制脚本已更新为 `tests/browser/social-insights-recording.mjs`（需要独立安装 Playwright 与 Chrome，不增加运行时依赖）：

```sh
PORT=8097 node scripts/serve.mjs
# 另一个终端
PLAYWRIGHT_MODULE=file:///absolute/path/to/playwright/index.mjs \
  node tests/browser/social-insights-recording.mjs
# 输出：tmp/social-insights-recording/*.webm，脚本同时打印每段时间点
```

FFmpeg 转 MP4（本机使用 9.0.2）：

```sh
ffmpeg -i tmp/social-insights-recording/<hash>.webm \
  -c:v libx264 -preset medium -crf 24 -pix_fmt yuv420p -movflags +faststart \
  docs/project/assets/social-insights-full-2026-11-05-v2.mp4
```

分段用 `-ss` / `-to` 按上表区间重编码；时间点由脚本的 `MARK` 输出得到。Playwright 的录屏是 webm，仓库文件是转换后的 MP4，转换不会增删画面。

## 交接与边界

- 交给 @daizhiqi 纳入 #10 成片，核对已实际加入 voice-07/08/09/10 场景；素材交付不等于成片、旁白或彩排完成。
- 本补录未改应用、合约、ABI、部署地址、报告或 23 项清单；#11 的最终冻结/备份需按实际使用的视频文件重新登记哈希。
- Demo 标识、示例 URL、“不是真实 AI 交付”“作品确认不等于付款”“Demo 无已核验订单”均保留在画面/文案中；不混入历史 Sepolia 视频，也不声称同一旅程。
