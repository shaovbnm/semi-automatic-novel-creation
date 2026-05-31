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
const target = path.resolve(getArg(args, "--project") || args[0] || process.cwd());
const checkOnly = args.includes("--check");
const bodyDir = path.join(target, "正文");
const trackingDir = path.join(target, "05_追踪");
const problems = [];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function ensureFile(file, content) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, content, "utf-8");
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function rel(file) {
  return path.relative(target, file).replace(/\\/g, "/");
}

function normalizePathFromIndex(value) {
  return value.replace(/`/g, "").trim().replace(/^\.\//, "");
}

function checkProject() {
  if (!fs.existsSync(bodyDir)) problems.push("缺少 正文/ 目录");
  if (!fs.existsSync(trackingDir)) problems.push("缺少 05_追踪/ 目录");

  const rootChapterFiles = fs.existsSync(bodyDir)
    ? fs.readdirSync(bodyDir, { withFileTypes: true }).filter((entry) => entry.isFile() && /^第\d+章.*\.md$/.test(entry.name)).map((entry) => path.join(bodyDir, entry.name))
    : [];
  for (const file of rootChapterFiles) problems.push(`正文根目录存在散落章节: ${rel(file)}`);

  const volumeDirs = fs.existsSync(bodyDir)
    ? fs.readdirSync(bodyDir, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^第\d{2}卷_/.test(entry.name))
    : [];
  if (!volumeDirs.length) problems.push("未发现 正文/第XX卷_卷名/ 分卷目录");

  const indexPath = path.join(bodyDir, "正文索引.md");
  if (!fs.existsSync(indexPath)) {
    problems.push("缺少 正文/正文索引.md");
  } else {
    const index = fs.readFileSync(indexPath, "utf-8");
    if (!index.includes("文风状态")) problems.push("正文索引.md 缺少 文风状态 列");
    const matches = index.matchAll(/\|\s*(正文\/[^|`\n]+?\.md|第\d{2}卷_[^|`\n]+?\.md)\s*\|/g);
    for (const match of matches) {
      const p = normalizePathFromIndex(match[1]);
      const full = path.join(target, p.startsWith("正文/") ? p : path.join("正文", p));
      if (!fs.existsSync(full)) problems.push(`正文索引.md 路径不存在: ${p}`);
    }
  }

  for (const file of ["文风基准.md", "伏笔表.md", "时间线.md"]) {
    const full = path.join(trackingDir, file);
    if (!fs.existsSync(full)) problems.push(`缺少 05_追踪/${file}`);
  }
}

function normalizeProject() {
  ensureDir(bodyDir);
  ensureDir(path.join(bodyDir, "第01卷_未命名"));
  ensureDir(trackingDir);
  ensureFile(path.join(bodyDir, "正文索引.md"), "# 正文索引\n\n## 第1卷：未命名\n\n| 章节 | 文件路径 | 标题 | 字数 | 剧情功能 | 章尾钩子 | 文风状态 | 状态 |\n|---|---|---|---:|---|---|---|---|\n");
  ensureFile(path.join(trackingDir, "文风基准.md"), "# 文风基准\n\n## 一句话文风定义\n\n\n## 叙述参数\n\n| 维度 | 当前设定 |\n|---|---|\n| 人称 | |\n| 视角 | |\n| 叙述距离 | |\n| 句长 | |\n| 段落 | |\n| 对白密度 | |\n| 心理描写 | |\n| 动作描写 | |\n| 环境描写 | |\n| 爽点表达 | |\n| 情绪表达 | |\n| 章尾方式 | |\n\n## 角色语气表\n\n| 角色 | 说话长度 | 语气 | 常用句式 | 禁止偏移 |\n|---|---|---|---|---|\n\n## 标准样本\n\n### 旁白样本\n\n### 对白样本\n\n### 冲突样本\n\n### 章尾样本\n");
  ensureFile(path.join(trackingDir, "伏笔表.md"), "# 伏笔表\n\n| 伏笔 | 埋设章节 | 预计回收 | 状态 |\n|---|---|---|---|\n");
  ensureFile(path.join(trackingDir, "时间线.md"), "# 时间线\n\n| 章节 | 故事时间 | 事件 | 备注 |\n|---|---|---|---|\n");
  console.log(`normalized ${target}`);
}

function main() {
  if (!checkOnly) normalizeProject();
  checkProject();
  if (problems.length) {
    console.error(`long project check failed (${problems.length})`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(checkOnly ? 1 : 0);
  }
  console.log(`long project ok: ${target}`);
}

main();
