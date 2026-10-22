import { readFile, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

function safePath(root, path) {
  if (!/^[a-zA-Z0-9_./-]+$/.test(path) || path.startsWith("/") || path.split("/").some(part => part === ".." || part === ".")) throw new Error("补丁路径不安全。");
  const target = resolve(root, path);
  if (!target.startsWith(resolve(root) + sep)) throw new Error("补丁越过源码目录。");
  return target;
}

// Apply exact unified-diff hunks without an external patch executable or fuzzy matching.
export function patchText(source, hunks) {
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const finalNewline = source.endsWith("\n");
  const input = source.replaceAll("\r\n", "\n").split("\n");
  if (finalNewline) input.pop();
  const output = [];
  let cursor = 0;
  for (const hunk of hunks) {
    const start = hunk.oldStart === 0 ? 0 : hunk.oldStart - 1;
    if (start < cursor || start > input.length) throw new Error("补丁行号与固定源码不匹配。");
    output.push(...input.slice(cursor, start)); cursor = start;
    let removed = 0, added = 0;
    for (const line of hunk.lines) {
      const op = line[0], text = line.slice(1);
      if (op === " " || op === "-") {
        if (input[cursor] !== text) throw new Error(`补丁上下文不匹配（原始行 ${cursor + 1}），已停止。`);
        cursor++; removed++;
      }
      if (op === " " || op === "+") { output.push(text); added++; }
    }
    if (removed !== hunk.oldCount || added !== hunk.newCount) throw new Error("补丁内容与行数不匹配。");
  }
  output.push(...input.slice(cursor));
  return output.join(eol) + (finalNewline ? eol : "");
}

export async function applyUnifiedPatch(directory, text) {
  const lines = text.replaceAll("\r\n", "\n").split("\n");
  const changes = [];
  let index = 0;
  while (index < lines.length) {
    if (!lines[index].startsWith("--- a/")) { index++; continue; }
    const path = lines[index++].slice(6).split("\t")[0];
    if (lines[index++] !== `+++ b/${path}`) throw new Error("只接受同一路径的固定源码补丁。");
    const filename = safePath(directory, path), hunks = [];
    while (index < lines.length && !lines[index].startsWith("--- a/") && !lines[index].startsWith("diff --git")) {
      const header = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(lines[index]);
      if (!header) { if (lines[index] && !lines[index].startsWith("index ")) throw new Error("补丁区块格式无效。"); index++; continue; }
      index++;
      const hunk = { oldStart: +header[1], oldCount: header[2] === undefined ? 1 : +header[2], newCount: header[4] === undefined ? 1 : +header[4], lines: [] };
      let oldCount = 0, newCount = 0;
      while (index < lines.length && (oldCount < hunk.oldCount || newCount < hunk.newCount)) {
        const line = lines[index++];
        if (line.startsWith("\\ No newline")) throw new Error("补丁必须保留源码末尾换行。");
        if (![" ", "+", "-"].includes(line[0])) throw new Error("补丁区块不完整。");
        if (line[0] !== "+") oldCount++;
        if (line[0] !== "-") newCount++;
        hunk.lines.push(line);
      }
      hunks.push(hunk);
    }
    if (!hunks.length) throw new Error("补丁没有有效区块。");
    try { changes.push({ filename, result: patchText(await readFile(filename, "utf8"), hunks) }); }
    catch (error) { throw new Error(`${path}: ${error.message}`, { cause: error }); }
  }
  if (!changes.length || new Set(changes.map(item => item.filename)).size !== changes.length) throw new Error("补丁文件清单无效或重复。");
  for (const change of changes) await writeFile(change.filename, change.result);
}
