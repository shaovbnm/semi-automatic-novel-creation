"use strict";

const { execFileSync } = require("child_process");

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

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function safeStr(value) {
  return JSON.stringify(String(value ?? ""));
}

function redact(text) {
  return String(text || "")
    .replace(/(Authorization\s*[:=]\s*Bearer\s+)[^\s'"}]+/gi, "$1[REDACTED]")
    .replace(/(Admin-Token\s*[:=]\s*)[^;\s'"}]+/gi, "$1[REDACTED]")
    .replace(/((?:token|cookie)\s*[:=]\s*)[^\n]+/gi, "$1[REDACTED]");
}

function sanitizeArgs(args) {
  const safe = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i - 1] === "eval") {
      safe.push("[eval script omitted]");
      continue;
    }
    const value = redact(String(args[i]));
    safe.push(value.includes(" ") ? JSON.stringify(value) : value);
  }
  return safe;
}

function ab(port, ...args) {
  const bin = process.env.AGENT_BROWSER_BIN || "agent-browser";
  const finalArgs = ["--cdp", String(port), ...args.map(String)];
  try {
    return execFileSync(bin, finalArgs, {
      encoding: "utf-8",
      timeout: 60_000,
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (err) {
    const command = `${bin} ${sanitizeArgs(finalArgs).join(" ")}`;
    const stdout = redact(err.stdout || "");
    const stderr = redact(err.stderr || "");
    throw new Error(`agent-browser 执行失败\n命令: ${command}\nstdout:\n${stdout}\nstderr:\n${stderr}`);
  }
}

function parseJSONFromStdout(stdout) {
  const text = String(stdout || "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}

  const candidates = [];
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(text.slice(firstBrace, lastBrace + 1));
  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) candidates.push(text.slice(firstBracket, lastBracket + 1));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {}
  }
  throw new Error(`JSON 解析失败，原始输出:\n${redact(text)}`);
}

function evalJSON(port, js) {
  const stdout = ab(port, "eval", js);
  const parsed = parseJSONFromStdout(stdout);
  if (typeof parsed === "string") {
    try {
      return JSON.parse(parsed);
    } catch {
      return parsed;
    }
  }
  return parsed;
}

function scrollLoad(port, times = 3, waitMs = 1000) {
  for (let i = 0; i < times; i++) {
    try {
      ab(port, "eval", "window.scrollTo(0, document.body.scrollHeight)");
    } catch (err) {
      console.warn(`滚动加载失败 ${i + 1}/${times}: ${err.message}`);
    }
    sleep(waitMs);
  }
}

module.exports = {
  ab,
  sleep,
  evalJSON,
  safeStr,
  scrollLoad,
  getArg,
  redact,
};
