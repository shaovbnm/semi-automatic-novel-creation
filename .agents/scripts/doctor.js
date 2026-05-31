"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..", "..");
const problems = [];

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
  return path.relative(root, file).replace(/\\/g, "/");
}

function checkNode(file) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf-8" });
  if (result.status !== 0) {
    problems.push(`JS 语法错误: ${rel(file)}\n${result.stderr || result.stdout}`);
  }
}

function checkRequire(spec) {
  const result = spawnSync(process.execPath, ["-e", `require(${JSON.stringify(spec)}); console.log('ok')`], {
    cwd: root,
    encoding: "utf-8",
  });
  if (result.status !== 0) {
    problems.push(`require 失败: ${spec}\n${result.stderr || result.stdout}`);
  }
}

function checkLinkedDir(dir, label) {
  if (!fs.existsSync(dir)) {
    problems.push(`${label} 不存在。请先运行：node .agents/scripts/sync-claude-skills.js`);
    return;
  }
  const stat = fs.lstatSync(dir);
  if (!stat.isSymbolicLink()) problems.push(`${label} 不是软链接/junction: ${rel(dir)}。请重新运行：node .agents/scripts/sync-claude-skills.js`);
}

function main() {
  const agents = path.join(root, ".agents");
  const skills = path.join(agents, "skills");
  const shared = path.join(agents, "shared");
  const claude = path.join(root, ".claude");
  const claudeSkills = path.join(claude, "skills");
  const claudeShared = path.join(claude, "shared");

  if (!fs.existsSync(skills)) problems.push(".agents/skills 不存在");
  if (!fs.existsSync(shared)) problems.push(".agents/shared 不存在");

  const allAgents = walk(agents);
  for (const file of allAgents.filter((f) => /\.(md|js)$/.test(f))) {
    const text = fs.readFileSync(file, "utf-8");
    if (/^\.\.\/\.\.\//m.test(text)) problems.push(`一行式假文件或断链: ${rel(file)}`);
    if (/Admin-Token\s*[:=]\s*[A-Za-z0-9._-]{8,}/i.test(text)) problems.push(`疑似未脱敏 Admin-Token: ${rel(file)}`);
    if (/Authorization\s*[:=]\s*Bearer\s+[A-Za-z0-9._-]{8,}/i.test(text)) problems.push(`疑似未脱敏 Authorization: ${rel(file)}`);
  }

  for (const file of [...allAgents, ...walk(claude)].filter((f) => f.endsWith(".js"))) {
    checkNode(file);
  }

  if (fs.existsSync(path.join(skills, "story-cover"))) problems.push(".agents/skills/story-cover 仍存在");
  if (fs.existsSync(path.join(claudeSkills, "story-cover"))) problems.push(".claude/skills/story-cover 仍存在");

  for (const file of [...walk(agents), ...walk(claude)]) {
    if (/#U[0-9A-Fa-f]{4}/.test(path.basename(file))) problems.push(`文件名疑似编码错误: ${rel(file)}`);
  }

  const skillNames = fs.existsSync(skills)
    ? fs.readdirSync(skills, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).filter((name) => name !== "story-cover")
    : [];
  for (const name of skillNames) {
    const source = path.join(skills, name, "SKILL.md");
    const target = path.join(claudeSkills, name);
    if (!fs.existsSync(source)) problems.push(`skill 缺少 SKILL.md: ${name}`);
    checkLinkedDir(target, `.claude/skills/${name}`);
  }
  checkLinkedDir(claudeShared, ".claude/shared");

  checkRequire("./.claude/skills/story-long-scan/scripts/cdp-utils.js");
  checkRequire("./.claude/skills/story-short-scan/scripts/cdp-utils.js");

  if (problems.length) {
    console.error(`doctor failed (${problems.length})`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }

  console.log("doctor ok");
}

main();
