#!/usr/bin/env node
"use strict";

const path = require("path");
const { spawnSync } = require("child_process");
const { getArg } = require("./cdp-utils");

const args = process.argv.slice(2);
const platform = getArg(args, "--platform") || "dz";
const channel = getArg(args, "--channel") || "";
const pages = getArg(args, "--pages") || "";
const detail = getArg(args, "--detail") === true || getArg(args, "--detail") === "true";

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

function heiyanArgs() {
  const result = [];
  if (pages) result.push("--pages", String(pages));
  if (channel) result.push("--channel", String(channel));
  if (detail) result.push("--detail");
  return result;
}

function main() {
  if (platform === "dz" || platform === "dianzhong") {
    return run("dz-browse-scraper.js", ["--channel", channel || "all"]);
  }

  if (platform === "heiyan") {
    return run("heiyan-booklist-scraper.js", heiyanArgs());
  }

  if (platform === "all") {
    let code = 0;
    code = run("dz-browse-scraper.js", ["--channel", "all"]) || code;
    code = run("heiyan-booklist-scraper.js", heiyanArgs()) || code;
    return code;
  }

  console.error(`未知平台: ${platform}`);
  console.error("可选：dz, dianzhong, heiyan, all");
  return 1;
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(err && err.message ? err.message : err);
  process.exitCode = 1;
}
