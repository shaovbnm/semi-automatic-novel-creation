"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

function runNode(script, args = [], options = {}) {
  const result = spawnSync(process.execPath, [script, ...args.map(String)], {
    cwd: options.cwd || path.dirname(script),
    stdio: "inherit",
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${path.basename(script)} 执行失败，退出码 ${result.status}`);
  }
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

module.exports = {
  runNode,
  asArray,
};
