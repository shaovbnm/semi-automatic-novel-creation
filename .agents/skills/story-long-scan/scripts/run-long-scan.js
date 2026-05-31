#!/usr/bin/env node
"use strict";

const path = require("path");
const { spawnSync } = require("child_process");
const { getArg } = require("./cdp-utils");

const args = process.argv.slice(2);
const platform = getArg(args, "--platform") || "fanqie";
const type = getArg(args, "--type") || "";
const channel = getArg(args, "--channel") || "";

function optionalArgs() {
  const extra = [];
  for (const name of ["--port", "--outdir"]) {
    const value = getArg(args, name);
    if (value !== undefined && value !== true) extra.push(name, String(value));
  }
  return extra;
}

function run(script, scriptArgs) {
  const file = path.join(__dirname, script);
  const result = spawnSync(process.execPath, [file, ...scriptArgs, ...optionalArgs()], {
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  return result.status || 0;
}

function main() {
  if (platform === "qidian") return run("qidian-rank-scraper.js", ["--type", type || "hotsales"]);
  if (platform === "fanqie") return run("fanqie-rank-scraper.js", ["--channel", channel || "1", "--type", type || "2"]);
  if (platform === "qimao") return run("qimao-rank-scraper.js", ["--channel", channel || "female", "--type", type || "hot"]);
  if (platform === "jjwxc") return run("jjwxc-rank-scraper.js", ["--type", type || "12"]);
  if (platform === "ciweimao") return run("ciweimao-rank-scraper.js", ["--type", type || "click"]);

  if (platform === "all") {
    let code = 0;
    code = run("fanqie-rank-scraper.js", ["--channel", "1", "--type", "2"]) || code;
    code = run("fanqie-rank-scraper.js", ["--channel", "0", "--type", "2"]) || code;
    code = run("qidian-rank-scraper.js", ["--type", "hotsales"]) || code;
    code = run("qimao-rank-scraper.js", ["--channel", "female", "--type", "hot"]) || code;
    code = run("jjwxc-rank-scraper.js", ["--type", "12"]) || code;
    code = run("ciweimao-rank-scraper.js", ["--type", "click"]) || code;
    return code;
  }

  console.error(`未知平台: ${platform}`);
  console.error("可选：fanqie, qidian, qimao, jjwxc, ciweimao, all");
  return 1;
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(err && err.message ? err.message : err);
  process.exitCode = 1;
}
