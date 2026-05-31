"use strict";

const fs = require("fs");
const path = require("path");

function getArg(args, name, fallback = undefined) {
  const idx = args.indexOf(name);
  if (idx >= 0) {
    const next = args[idx + 1];
    if (next && !next.startsWith("--")) return next;
    return true;
  }
  const prefix = `${name}=`;
  const pair = args.find((arg) => arg.startsWith(prefix));
  if (pair) return pair.slice(prefix.length);
  return fallback;
}

const args = process.argv.slice(2);
const project = path.resolve(getArg(args, "--project") || args[0] || process.cwd());
const out = path.join(project, "05_追踪", "文风基准.md");

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/第\d+章.*\.md$/.test(entry.name)) files.push(full);
  }
  return files;
}

function chapterNo(file) {
  const m = path.basename(file).match(/第(\d+)章/);
  return m ? Number(m[1]) : 0;
}

function pickSamples(lines) {
  const clean = lines.filter(Boolean);
  const midStart = Math.max(0, Math.floor(clean.length / 2) - 15);
  const start = clean.slice(0, 30);
  const mid = clean.slice(midStart, midStart + 30);
  const end = clean.slice(-30);
  return [
    "【开头样本】",
    ...start,
    "",
    "【中段样本】",
    ...mid,
    "",
    "【结尾样本】",
    ...end,
  ].join("\n");
}

function sampleText(files) {
  return files
    .slice(-5)
    .map((file) => {
      const lines = fs.readFileSync(file, "utf-8").split(/\r?\n/);
      return `## ${path.basename(file)}\n\n${pickSamples(lines)}`;
    })
    .join("\n\n---\n\n");
}

function main() {
  const body = path.join(project, "正文");
  const files = walk(body).sort((a, b) => chapterNo(a) - chapterNo(b) || a.localeCompare(b));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const sample = sampleText(files);
  const content = `# 文风基准\n\n## 一句话文风定义\n\n（请根据最近章节样本补充：叙述口吻、句长、对白密度、情绪表达和章尾方式。）\n\n## 叙述参数\n\n| 维度 | 当前设定 |\n|---|---|\n| 人称 | |\n| 视角 | |\n| 叙述距离 | |\n| 句长 | |\n| 段落 | |\n| 对白密度 | |\n| 心理描写 | |\n| 动作描写 | |\n| 环境描写 | |\n| 爽点表达 | |\n| 情绪表达 | |\n| 章尾方式 | |\n\n## 角色语气表\n\n| 角色 | 说话长度 | 语气 | 常用句式 | 禁止偏移 |\n|---|---|---|---|---|\n\n## 标准样本\n\n${sample || "暂无章节样本。"}\n`;
  fs.writeFileSync(out, content, "utf-8");
  console.log(`wrote ${out}`);
}

main();
