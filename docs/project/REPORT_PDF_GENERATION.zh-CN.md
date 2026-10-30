# 报告 PDF 生成（跨平台）

需要 Node.js，以及本机已安装的 Chrome/Chromium。生成器不下载浏览器、不依赖 Playwright，也不需要钱包。

```sh
node scripts/report-pdf.mjs docs/project/REPORT.md
# 可指定已存在目录中的输出文件（须以 .pdf 结尾）
node scripts/report-pdf.mjs docs/project/REPORT.md /path/to/output/REPORT.pdf
```

Markdown 旁的相对图片按 Markdown 所在目录解析；输出目录可以不同，空格与 `#` 会按本地 file URL 编码。保留同名 HTML，便于检查生成内容。脚本只支持报告现有 Markdown 子集，不是通用 Markdown 排版器。

## 浏览器选择

1. 设置 `CHROME_BIN` 时优先使用：可填完整可执行文件路径，或 PATH 中的命令名。无效值会报错，不会悄悄换用其他浏览器。
2. macOS 自动检查系统 `/Applications` 和用户 `~/Applications` 的 Google Chrome，再检查系统 Chromium。
3. Windows 检查 `ProgramFiles`、`ProgramFiles(x86)` 与 `LOCALAPPDATA` 下的 Chrome，包括单用户安装。
4. 查 PATH：Google Chrome / Chromium 的常见命令名。Linux 使用此方式。

macOS / Linux shell：

```sh
CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node scripts/report-pdf.mjs docs/project/REPORT.md
CHROME_BIN=/usr/bin/chromium node scripts/report-pdf.mjs docs/project/REPORT.md
```

Windows PowerShell：

```powershell
$env:CHROME_BIN = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node scripts/report-pdf.mjs docs/project/REPORT.md
```

路径包含空格时按 shell 规则加引号，不把引号本身写进环境变量。浏览器未找到时，脚本返回非零并保留 HTML，提示设置 CHROME_BIN。无需修改默认 Chrome 路径来适配机器。

## 输出与验证

每次打印使用独立临时浏览器 profile，不复用正在打开的个人 Chrome。Chrome 需在 60 秒内完成；先生成新的临时 PDF 并检查 PDF 文件头，再替换目标。失败时保留已有 PDF、返回非零，清理临时输出/profile，不会因为旧 PDF 存在而误报成功。

```sh
node --test tests/report-pdf.test.mjs
pnpm test
pnpm build
```

2026-10-30，Zqqq-qq 使用 Codex 协助，在 main `0123272` 基础上修复并验证：

- 五项回归覆盖 CHROME_BIN 优先级/无效值、macOS 系统/用户安装、Windows 自定义系统/用户路径、Linux PATH，以及 CLI 的 file URL 编码、相对图片基准、输出失败保留/临时目录清理。
- Windows/Linux 路径逻辑使用注入的环境/文件系统验证，**不声称已在两种操作系统上实际运行 Chrome**。CLI 可执行脚本 fixture 在 Windows 跳过。
- 本机 macOS 的真实 Chrome 分别以自动检测与显式 CHROME_BIN 生成当前 v0.4 报告成功；输出位于与源文件不同、含空格和 `#` 的目录。PDF 共 15 页，已核对文字与各页布局，架构图正常显示；分页可随系统字体不同而变化。
- 全量 79 项测试和构建通过，合约源码、生成产物、已有报告 PDF 与冻结记录未改写。本次验证输出为临时验收文件，不重定义最终发布版本。
