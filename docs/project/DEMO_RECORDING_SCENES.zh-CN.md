# 演示素材与分镜（E2 输入）

- 关联任务：[#10 E2](https://github.com/Zqqq-qq/comp7610-agentledger/issues/10)
- 归属角色：E（报告与演示）；素材由 D · @QiuQiu-xuan 提供，**不认领 E2**
- 生成日期：2026-10-28

## 一、两个文件，两种性质

| 文件 | 时长 | 性质 | 用途 |
| --- | --- | --- | --- |
| `docs/project/assets/demo-full-with-wallet.mp4` | **1:49** | 前 29 秒定格走查 + 后 80 秒**真实桌面录制（含 MetaMask）** | **推荐作为演示主片** |
| `docs/project/assets/demo-wallet-live.mp4` | **1:20** | 真实桌面录制节选，含钱包确认与取消 | 单独展示钱包交互 |

两者前半段（7 幕走查）来源相同，区别在于后半段是否包含真实钱包操作。

## 二、前半段：7 幕走查（0:00–0:29，定格序列）

每场景采集 6 帧、2 fps 合成。**全部为 Sepolia 真实数据**（社区 `0x8CDc…2406`）。

| 时间 | 场景 | 画面要点 | 数据来源 |
| --- | --- | --- | --- |
| 0:00–0:02 | 社区动态 | 横幅 `Sepolia 链上社区 · 0x8CDc…2406`；`In the community 2` | `postCount=2` |
| 0:03–0:05 | 帖子详情 | post 2 原文与回复 | `getPost(2)` / `getReply(2)` |
| 0:06–0:08 | Shared works | `JOINTLY CONFIRMED` + 双方署名 | `getWork(1).status=2` |
| 0:09–0:11 | 作品详情 | 双方分工、提议人、确认状态 | 同上 |
| 0:12–0:14 | 托管 Job 1 | `Task #1 · 3 · Completed`，1.0 mUSD，A 98 / B 2 / escrow 0 | `JobEscrow` 只读 |
| 0:15–0:20 | Job 2 / Job 3 | `4 · Refunded`；超时领取后 `3 · Completed` | 同上 |
| 0:21–0:24 | 圈子 | 未连接钱包时统一显示 `Join circle`（成员状态需连接钱包后读取） | 链上成员关系 |
| 0:25–0:28 | 收尾 | 标题卡 | — |

**这段的局限**：未连接钱包，所以看不到 `Leave circle`，也没有签名动作。这正是后半段要补的。

## 三、后半段：真实钱包操作（0:29–1:49，桌面录制）

用 `ffmpeg -f gdigrab` 录制真实桌面，MetaMask 弹窗与确认过程都在画面内。操作者：仓库所有者（本机 Chrome + 已解锁的 MetaMask，账户 A `0x4469…e1723`）。

| 大致时间 | 画面 | 链上结果 |
| --- | --- | --- |
| 0:29–0:55 | Explore circles，三个圈子；点 Builders Club 的 `Join circle` | — |
| 0:55–1:05 | **MetaMask「交易请求」弹窗**：网络 Sepolia、交互对象 `0x8CDc…2406`、手续费 `< 0.0001` | — |
| 1:05–1:15 | 点确认 → 页面 `Waiting for confirmation` 与交易哈希 → toast `Community transaction confirmed: 0x…` | `setMembership(3,true)`，区块 **12011308**，`status=1` |
| 1:15–1:25 | 按钮变为 **`Leave circle`**（#26 的效果，真实钱包下） | — |
| 1:25–1:40 | 点 `Leave circle` → MetaMask 确认 → 状态复原 | `setMembership(3,false)`，区块 **12011311**，`status=1` |
| 1:40–1:49 | 再点 `Join circle` → 弹窗后**点取消** → 红色 toast `Request cancelled in your wallet. No action was completed.` | 未发交易，nonce 未变 |

复核：录制后 A 的 nonce 由 16 变为 18（两笔），`member(3, A)` 回到 `false`、`memberCount(3)` 仍为 2 —— 状态已复原，未留下半截改动。

## 四、复现

### 前半段（定格走查）

```sh
node scripts/serve.mjs            # http://127.0.0.1:8091
node scripts/demo-capture.mjs     # 输出帧到 ./demo-frames
ffmpeg -y -framerate 2 -i demo-frames/f%05d.png \
  -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart demo-walkthrough.mp4
```

脚本参数化社区/托管地址，读 `PW_CORE` 或 `playwright-core`。

### 后半段（真实钱包）

需要人工操作，无法脚本化（见 §六）。录制命令：

```sh
ffmpeg -f gdigrab -framerate 12 -t 150 -i desktop -c:v libx264 -preset veryfast -crf 23 demo-wallet-live.mp4
# 录制期间：Chrome 置于前台 → 点 Join circle → MetaMask 确认
#          → 点 Leave circle → 确认 → 再点 Join circle → MetaMask 取消
```

### 合成

```sh
ffmpeg -i demo-walkthrough.mp4 -i demo-wallet-live.mp4 -filter_complex \
  "[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x12201a,setsar=1,fps=12[v0];\
   [1:v]fps=12,setsar=1[v1];[v0][v1]concat=n=2:v=1:a=0[v]" -map "[v]" \
  -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p demo-full-with-wallet.mp4
```

## 五、录制时踩的四个坑（已规避，写下来免得重犯）

1. **同 URL 的 `page.goto` 不会重载**：应用只在启动时读 `localStorage`，同一地址的 goto 只做 hash 内跳转，内存里仍是 Demo sandbox 模式 → 录到假数据。必须「设 hash + `reload()`」。
2. **托管页任务卡片在页面下方**：提交查询后要 `scrollIntoView` 到 `#loadedJob`，否则截到的是顶部表单。
3. **桌面录制会录到无关窗口**：第一次录制时聊天窗口一直盖在最前面，3 分钟全是聊天画面，作废。录制前必须确认目标窗口在前台。
4. **「读说明」与「在前台」冲突**：先发说明再开录，操作者读说明时聊天窗口就在前台。解决办法是**延迟开录**（先切到 Chrome，20 秒后自动开始）。

## 六、E2 还缺什么（需要真人）

| 项 | 说明 |
| --- | --- |
| 讲解 / 旁白 | 可用本文分镜表当提词；后半段建议边操作边讲解 |
| 五人彩排 | 需要五名成员各就位，按角色口述一次完整链路 |
| 贡献记录 | `CONTRIBUTIONS.md` 需补 E/R 条目（#11 草案 §七 已列） |
| 剪辑 | 后半段是原始桌面录制，有鼠标抖动与等待；正式提交前建议剪掉空白、加字幕 |

## 七、局限

- 前半段是 2 fps 定格，场景之间跳切；后半段是 12 fps 真实录制。
- 视频内所有数据为录制时刻（2026-10-28）的链上状态，之后变化属正常。
- 后半段为全屏录制，包含浏览器标签栏、系统任务栏等无关界面元素。
- 本文件与脚本不包含任何私钥、助记词或签名材料。
