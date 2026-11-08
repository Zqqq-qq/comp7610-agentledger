# 当前入口：2026-11-08最终旁白成片

主片：[AgentLedger-final-v1.mp4](assets/AgentLedger-final-v1.mp4)（06:59.92）。[英文字幕](assets/AgentLedger-final-v1.en.srt)、[实际时码与来源](FINAL_DEMO_2026-11-08.zh-CN.md)、[英文讲解稿](DEMO_SCRIPT.en.md)。下文保留2026-10-28素材生成与工具验证历史；旧1:49组合片不再是最终提交视频。

---

# 演示素材与分镜（E2 输入）

- 关联任务：[#10 E2](https://github.com/Zqqq-qq/comp7610-agentledger/issues/10)
- 归属角色：E（报告与演示）；素材由 D · @QiuQiu-xuan 提供，**不认领 E2**
- 生成日期：2026-10-28

## 一、两个文件，两种性质

| 文件 | 时长 | 性质 | 用途 |
| --- | --- | --- | --- |
| `docs/project/assets/demo-full-with-wallet.mp4` | **1:49** | 0:00–0:29 定格走查 **+** 0:29–1:49 真实桌面录制（含 MetaMask） | 历史组合素材，非最终成片 |
| `docs/project/assets/demo-wallet-live.mp4` | **1:20** | **只含**那 80 秒真实桌面录制，**不含**走查段 | 单独展示钱包交互 |
| `docs/project/assets/demo-walkthrough.mp4` | **0:29** | **只含** 7 幕定格走查，**不含**钱包操作 | 纯链上数据走查 |

三个文件的包含关系：

```
demo-full-with-wallet.mp4  =  demo-walkthrough.mp4  +  demo-wallet-live.mp4
        (1:49)                      (0:29)                 (1:20)
```

`demo-wallet-live.mp4` 与 `demo-walkthrough.mp4` **没有共同片段**，前者是后者的续接，不是替代。

## 二、前半段：7 幕走查（0:00–0:29，定格序列）

每场景采集 6 帧、2 fps 合成。**全部为 Sepolia 真实数据**（社区 `0x8CDc…2406`）。

| 时间 | 场景 | 画面要点 | 数据来源 |
| --- | --- | --- | --- |
| 0:00–0:02 | 社区动态 | 横幅 `Sepolia 链上社区 · 0x8CDc…2406`；`In the community 3`（post 3 为 2026-10-28 新增的跨模块验收任务帖） | `postCount=3` |
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

脚本通过环境变量参数化（不写死）：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `DEMO_APP` | `http://127.0.0.1:8091` | 应用地址 |
| `DEMO_COMMUNITY` / `DEMO_ESCROW` / `DEMO_TOKEN` / `DEMO_IDENTITY` / `DEMO_REPUTATION` / `DEMO_RPC` | 本仓库 Sepolia 部署值 | 换部署时改这里 |
| `DEMO_POST_ID` / `DEMO_WORK_ID` | `2` / `1` | 要展示的帖子与作品 |
| `DEMO_JOB_STATES` | `1=3 · Completed;2=4 · Refunded;3=3 · Completed` | 恰好三个不同的正整数订单 ID，按配置顺序展示；状态码 1–4，可省略标准英文标签，如 `7=2;8=1;9=4` |
| `DEMO_OUT` / `DEMO_HOLD` | `demo-frames` / `6` | 输出目录与每场景帧数 |

**脚本的安全与正确性约定**（2026-10-28 按审阅意见加入）：

1. **不删除任何已有目录**：若 `DEMO_OUT` 已存在且非空，改用带时间戳的唯一子目录并打印提示；`DEMO_HOLD` 必须是 1–60 的整数，否则在加载浏览器前直接失败。
2. **不靠等待代替成功判定**：每个场景都断言真实数据已加载——
   - 页面 live 按钮已选中、保存的完整社区地址与 `DEMO_COMMUNITY` 一致、存在确认区块，且没有 Demo 横幅；不依赖英文/中文横幅措辞或地址是否在横幅显示；
   - 目标帖子/作品的入口按钮实际存在；详情弹窗已打开且标题非空；
   - 订单查询后 `#loadedJob` **自身**可见，`#loadedJobTitle` 的编号与当前查询一致、`#loadedJobState` 与标准化后的期望值完全相等，且完整托管配置地址匹配；同状态的旧卡片不能通过；
   - 圈子卡片数 ≥ 3。
   任一断言失败即以非零码退出、不写 `meta.json`，不会出现「空卡片配 Completed 字幕」。
3. 固定延迟只用于画面停留，不承担成功判定。

原版本 2026-10-28 实测：正确配置下 58 帧、退出码 0；故意把 `DEMO_COMMUNITY` 换成不存在的地址时，在「场景 1/7」断言失败并退出 1，且不生成 `meta.json`。

### 2026-10-30 动态字幕修正（#10 工具输入）

- 社区和圈子字幕使用本次 `DEMO_COMMUNITY` 的短地址；订单字幕使用 `DEMO_ESCROW` 短地址、当前已核验的订单 ID 和卡片状态；帖子/作品字幕使用本次配置 ID，不把所有帖子都称为需求。
- 场景 5 展示第一个配置订单；场景 6 依次展示后两个，每次查询成功后分别写字幕。保持 7 场景、默认 58 帧的原布局。
- 配置必须恰好三个不同、安全整数范围内的正整数 ID，状态码为 1 Funded / 2 Submitted / 3 Completed / 4 Refunded。可写 `7=2;8=1;9=4`，或写完整标准标签；重复 ID、未知状态、码与标签矛盾、无效帖子/作品 ID 均在创建输出目录和启动浏览器前失败。
- `Completed` 只报告状态，不从状态码推断是 release 还是超时 claim；退款/领取原因需要单独交易或事件证据，字幕不再把它们写成已证实的过程。
- `meta.json` 新增 `postId`、`workId`、`jobIds`、`scenes`。每项场景记录开始帧、实际字幕，订单场景另附读到的 title/state 及完整托管地址；配置中的期望不替代实际读到的状态。
- 修正 PW_CORE 的本地文件 URL 编码，支持含空格/`#` 的驱动路径。

验证：`node --test tests/demo-capture.test.mjs` 五项回归包括标准状态解析、动态字幕、英文页面就绪条件、完整采集 CLI 的自定义订单字幕与元数据、同状态旧卡片中止。CLI 使用明确标注的合成 DOM/Playwright fixture，不连接 RPC、不启动真实浏览器，临时帧不是实际截图。全量 87 项测试与构建通过，合约源码及生成产物无变化。本修订不重新生成或重命名已有视频，不将这些测试记作新的 Sepolia 录制；原素材的日期和数据仍按前文保存。

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

## 六、E2 当前交付（2026-11-08更新）

完整旁白视频、字幕和实际时码见[最终交付记录](FINAL_DEMO_2026-11-08.zh-CN.md)。2026-11-08完成分段试录、重录、试配与完整录制；由daizhiqi统一讲解，按#10最新安排不再要求五人彩排。成片已在本地获用户确认，仓库同伴审阅、远程备份下载位置和课程正式要求仍待核实。本文件下述旧素材范围是历史说明，不代表新成片全部来自链上或是同一连续验收。

## 七、局限

- 前半段是 2 fps 定格，场景之间跳切；后半段是 12 fps 真实录制。
- 视频内所有数据为录制时刻（2026-10-28）的链上状态，之后变化属正常。
- 后半段为全屏录制，包含浏览器标签栏、系统任务栏等无关界面元素。
- 本文件与脚本不包含任何私钥、助记词或签名材料。
