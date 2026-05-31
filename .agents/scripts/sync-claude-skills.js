"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const sourceDir = path.join(root, ".agents", "skills");
const sharedSource = path.join(root, ".agents", "shared");
const claudeDir = path.join(root, ".claude");
const targetDir = path.join(claudeDir, "skills");
const sharedTarget = path.join(claudeDir, "shared");
const deprecated = new Set(["story-cover"]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removePath(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

function linkDir(source, target) {
  if (!fs.existsSync(source)) throw new Error(`source not found: ${source}`);
  removePath(target);
  fs.symlinkSync(source, target, "junction");
}

function main() {
  if (!fs.existsSync(sourceDir)) throw new Error(`skills source not found: ${sourceDir}`);
  ensureDir(claudeDir);
  removePath(targetDir);
  ensureDir(targetDir);

  const skills = fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !deprecated.has(name))
    .sort();

  for (const name of skills) {
    const source = path.join(sourceDir, name);
    if (!fs.existsSync(path.join(source, "SKILL.md"))) {
      console.warn(`skip ${name}: missing SKILL.md`);
      continue;
    }
    linkDir(source, path.join(targetDir, name));
    console.log(`linked skill ${name}`);
  }

  if (fs.existsSync(sharedSource)) {
    linkDir(sharedSource, sharedTarget);
    console.log("linked shared");
  }
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
