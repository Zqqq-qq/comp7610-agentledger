# 演示录屏素材与分镜（E2 输入）

- 关联任务：[#10 E2](https://github.com/Zqqq-qq/comp7610-agentledger/issues/10)
- 归属角色：E（报告与演示）；本文与素材由 D · @QiuQiu-xuan 提供，**不认领 E2**
- 产出：`demo-walkthrough.mp4`（29 秒 / 1280×800 / 2 fps / 0.46 MB，本地文件）
- 生成日期：2026-10-28

## 一、这是什么，不是什么

| 是 | 不是 |
| --- | --- |
| **真实链上数据**的界面截图序列：Sepolia 社区 `0x8CDc…2406`，与 #7 验收同一地址同一批数据 | 不是**连续录屏**：每场景采集 6 帧、按 2 fps 合成，动作之间有跳帧 |
| 可复现：`scripts/demo-capture.mjs` 一键重跑，输出帧序列后由 ffmpeg 合成 | 不含**钱包签名**片段（录制环境无 MetaMask，也不需要写入） |
| 每场景带字幕条，可直接当无声演示看 | 不含人声讲解、不含五人彩排 |

**为什么用定格而不是连续录屏**：本机没有可用的连续录屏工具（无 OBS、无 Playwright 自带 ffmpeg），且演示内容以静态信息为主（帖子、作品、订单状态）。定格序列能保证每一帧都是可核对的真实状态，比"快速滚动、关键信息一闪而过"的录屏更适合评审。

## 二、分镜

| 时间 | 场景 | 画面要点 | 数据来源 |
| --- | --- | --- | --- |
| 0:00–0:02 | 1/7 社区动态 | 横幅 `Sepolia 链上社区 · 0x8CDc…2406`；`In the community 2`；两条真实帖子 | `postCount=2` |
| 0:03–0:05 | 2/7 帖子详情 | post 2 原文与回复；圈子按钮按成员资格显示 | `getPost(2)` / `getReply(2)` |
| 0:06–0:08 | 3/7 Shared works | `JOINTLY CONFIRMED` + 双方署名 | `getWork(1).status=2` |
| 0:09–0:11 | 4/7 作品详情 | 双方分工、提议人、确认状态 | 同上 |
| 0:12–0:14 | 5/7 托管 Job 1 | `Task #1 · 3 · Completed`；1.0 mUSD；A 98 / B 2 / escrow 0 | `JobEscrow` 只读 |
| 0:15–0:20 | 6/7 Job 2 / Job 3 | `4 · Refunded`；超时领取后 `3 · Completed` | 同上 |
| 0:21–0:24 | 7/7 圈子 | 已加入 `Leave circle`、未加入 `Join circle` | 链上成员关系 |
| 0:25–0:28 | 收尾 | 标题卡 | — |

## 三、复现方式

```sh
# 1) 起本地静态服务（应用本身）
node scripts/serve.mjs          # http://127.0.0.1:8091

# 2) 采集帧（需要 playwright-core 与系统 Chrome）
node scripts/demo-capture.mjs   # 输出到 $DEMO_OUT 或默认 ./demo-frames

# 3) 合成
ffmpeg -y -framerate 2 -i demo-frames/f%05d.png \
  -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart demo-walkthrough.mp4
```

脚本里写死的坐标（与 `.env` 无关，改这几行即可换环境）：

| 常量 | 值 |
| --- | --- |
| 社区合约 | `0x8CDc9987D46D140a982713B359286bC451262406` |
| JobEscrow | `0x3C129b436247368dA71cC31512984c3DB17F1f63` |
| mUSD | `0x6a920b13d6396B7b58BfE562c274Ea76a6409C85` |
| RPC | `https://ethereum-sepolia.publicnode.com` |

## 四、录制时踩到的两个坑（避免重犯）

1. **同 URL 的 `page.goto` 不会重载**：应用把模式与社区地址存在 `localStorage`，但只在启动时读一次。若用 `goto` 到同一地址，页面只做 hash 内跳转，内存里仍是旧模式（录出来是 Demo sandbox 的假数据）。必须「设 hash + `reload()`」。
2. **托管页的任务卡片在页面下方**：提交查询后要先 `scrollIntoView` 到 `#loadedJob`，否则截到的是顶部表单，看不到 `3 · Completed`。

这两条都写进了脚本注释，重跑时不会再踩。

## 五、E2 还缺什么（需要真人）

| 项 | 说明 |
| --- | --- |
| 讲解 | 每场景一句话旁白，可用本文第二节的"画面要点"当提词 |
| 钱包签名片段 | 需要真实 MetaMask 操作，录制环境无钱包；可单独补 30 秒：发帖 → MetaMask 确认 → 回执 |
| 五人彩排 | 需要五名成员各就位，按角色口述一次完整链路 |
| 贡献记录 | `CONTRIBUTIONS.md` 需补 E/R 条目（#11 草案 §七 已列） |

## 六、局限

- 2 fps 意味着场景之间是**跳切**，不适合展示动效；若要展示动画（例如作品从 Pending 变 Confirmed），需要真实连续录屏。
- 视频内所有数据均为录制时刻的链上状态（2026-10-28）；若链上数据后续变化，视频与当前界面会出现差异，属正常。
- 本文件与脚本不包含任何私钥、助记词或签名材料。
