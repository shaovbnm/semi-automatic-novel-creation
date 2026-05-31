"use strict";

const fs = require("fs");
const path = require("path");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function dateStamp(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function writeJSON(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  return file;
}

function writeText(file, text) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, String(text), "utf-8");
  return file;
}

module.exports = {
  ensureDir,
  dateStamp,
  writeJSON,
  writeText,
};
