#!/usr/bin/env node
// 把项目报告 Markdown 渲染成 HTML，再用本机 Chrome 打印为 PDF。
//
// 用法：
//   node scripts/report-pdf.mjs docs/project/REPORT.md [输出.pdf]
//
// 只支持报告实际用到的 Markdown 子集：标题、段落、无序/有序列表、引用、
// 围栏代码块、表格、图片、链接、粗体、行内代码、水平线。
// 不引入任何第三方依赖；Chrome 用系统安装版本。

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const input = process.argv[2];
if (!input) {
  console.error("用法: node scripts/report-pdf.mjs <report.md> [out.pdf]");
  process.exit(1);
}
const mdPath = path.resolve(input);
if (!fs.existsSync(mdPath)) {
  console.error(`输入不存在: ${mdPath}`);
  process.exit(1);
}
const outPdf = path.resolve(process.argv[3] || mdPath.replace(/\.md$/i, ".pdf"));
const outHtml = outPdf.replace(/\.pdf$/i, ".html");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(text) {
  let s = esc(text);
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => `<img alt="${alt}" src="${src}">`);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, href) => `<a href="${href}">${t}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
  return s;
}

const lines = fs.readFileSync(mdPath, "utf8").replace(/\r\n/g, "\n").split("\n");
const html = [];
let i = 0;
let inList = null; // 'ul' | 'ol' | null

const closeList = () => {
  if (inList) { html.push(`</${inList}>`); inList = null; }
};

while (i < lines.length) {
  const line = lines[i];

  // 围栏代码块
  if (/^```/.test(line)) {
    closeList();
    const lang = line.slice(3).trim();
    const buf = [];
    i++;
    while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
    i++; // 跳过结束围栏
    html.push(`<pre><code${lang ? ` class="lang-${esc(lang)}"` : ""}>${esc(buf.join("\n"))}</code></pre>`);
    continue;
  }

  // 表格：当前行以 | 开头，下一行是分隔行
  if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
    closeList();
    const cells = (row) =>
      row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    const head = cells(line);
    i += 2;
    const rows = [];
    while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
    html.push("<table>");
    html.push(`<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>`);
    html.push("<tbody>");
    for (const r of rows) {
      const padded = head.map((_, k) => r[k] ?? "");
      html.push(`<tr>${padded.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`);
    }
    html.push("</tbody></table>");
    continue;
  }

  // 标题
  const h = /^(#{1,4})\s+(.*)$/.exec(line);
  if (h) {
    closeList();
    const lvl = h[1].length;
    html.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
    i++;
    continue;
  }

  // 水平线
  if (/^\s*---+\s*$/.test(line)) {
    closeList();
    html.push("<hr>");
    i++;
    continue;
  }

  // 引用
  if (/^>\s?/.test(line)) {
    closeList();
    const buf = [];
    while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
    html.push(`<blockquote>${buf.map((b) => `<p>${inline(b)}</p>`).join("")}</blockquote>`);
    continue;
  }

  // 无序列表
  const ul = /^\s*[-*]\s+(.*)$/.exec(line);
  if (ul) {
    if (inList !== "ul") { closeList(); html.push("<ul>"); inList = "ul"; }
    html.push(`<li>${inline(ul[1])}</li>`);
    i++;
    continue;
  }

  // 有序列表
  const ol = /^\s*\d+\.\s+(.*)$/.exec(line);
  if (ol) {
    if (inList !== "ol") { closeList(); html.push("<ol>"); inList = "ol"; }
    html.push(`<li>${inline(ol[1])}</li>`);
    i++;
    continue;
  }

  // 空行
  if (!line.trim()) {
    closeList();
    i++;
    continue;
  }

  // 段落（连续非空行合并）
  closeList();
  const buf = [line];
  i++;
  while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|\s*\||\s*[-*]\s|\s*\d+\.\s|>|-----)/.test(lines[i])) {
    buf.push(lines[i++]);
  }
  html.push(`<p>${buf.map(inline).join("<br>")}</p>`);
}
closeList();

const title = (lines.find((l) => /^#\s+/.test(l)) || "# Report").replace(/^#\s+/, "");
const doc = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; font-size: 10.5pt; line-height: 1.55; color: #1b2621; }
  h1 { font-size: 20pt; margin: 0 0 6pt; border-bottom: 2px solid #2f6f4f; padding-bottom: 6pt; }
  h2 { font-size: 13.5pt; margin: 16pt 0 6pt; color: #12201a; border-bottom: 1px solid #d9d4c6; padding-bottom: 3pt; page-break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 12pt 0 4pt; page-break-after: avoid; }
  h4 { font-size: 10.8pt; margin: 10pt 0 4pt; }
  p, li { margin: 4pt 0; }
  ul, ol { margin: 4pt 0 8pt 16pt; padding: 0; }
  code { font-family: ui-monospace, Consolas, "Courier New", monospace; font-size: 9pt; background: #f1f0ea; padding: 1pt 3pt; border-radius: 2pt; }
  pre { background: #f6f5f0; border: 1px solid #e2ded1; border-radius: 3pt; padding: 8pt; overflow-x: auto; page-break-inside: avoid; }
  pre code { background: none; padding: 0; font-size: 8.6pt; line-height: 1.4; }
  table { border-collapse: collapse; width: 100%; margin: 6pt 0 10pt; font-size: 9.3pt; page-break-inside: auto; }
  th, td { border: 1px solid #d9d4c6; padding: 3.5pt 5pt; vertical-align: top; text-align: left; }
  th { background: #eef3ee; font-weight: 600; }
  tr { page-break-inside: avoid; }
  blockquote { margin: 6pt 0; padding: 6pt 10pt; border-left: 3px solid #b9c9d8; background: #f6f8fa; }
  blockquote p { margin: 2pt 0; }
  img { max-width: 100%; display: block; margin: 8pt auto; }
  a { color: #2f6f4f; text-decoration: none; }
  hr { border: none; border-top: 1px solid #d9d4c6; margin: 12pt 0; }
</style></head><body>
${html.join("\n")}
</body></html>`;

fs.writeFileSync(outHtml, doc, "utf8");

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].find((p) => fs.existsSync(p));
if (!CHROME) {
  console.error("未找到系统 Chrome，已生成 HTML 但未打印 PDF：" + outHtml);
  process.exit(1);
}

execFileSync(process.env.CHROME_BIN || CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--no-pdf-header-footer",
  `--print-to-pdf=${outPdf}`,
  "file:///" + outHtml.replace(/\\/g, "/"),
], { stdio: ["ignore", "pipe", "pipe"] });

if (!fs.existsSync(outPdf)) {
  console.error("PDF 生成失败");
  process.exit(1);
}
const kb = (fs.statSync(outPdf).size / 1024).toFixed(1);
console.log(`HTML: ${outHtml}`);
console.log(`PDF : ${outPdf} (${kb} KB)`);
