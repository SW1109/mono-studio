import { existsSync } from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { dirname, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { assertNodeVersion, nodePolicy } from "../server/node-runtime.mjs";

try {
  let binary = process.execPath;
  try { assertNodeVersion(); }
  catch (error) {
    const local = fileURLToPath(new URL(`../artifacts/node-runtime/node-v${nodePolicy.recommended}-win-x64/node.exe`, import.meta.url));
    if (process.platform !== "win32" || !existsSync(local)) throw error;
    assertNodeVersion(execFileSync(local, ["-p", "process.versions.node"], { encoding: "utf8", windowsHide: true, timeout: 10000 }).trim());
    binary = local;
  }
  const args = process.argv.slice(2);
  if (!args.length) throw new Error("缺少要执行的 Node.js 命令。");
  // Subprocesses (Vite SSG, npm scripts and test workers) use the same patched runtime.
  const env = { ...process.env };
  const pathKey = Object.keys(env).find(key => key.toLowerCase() === "path") || "PATH";
  env[pathKey] = dirname(binary) + delimiter + (env[pathKey] || "");
  const child = spawn(binary, args, { stdio: "inherit", env, windowsHide: true });
  const forward = signal => { if (!child.killed) child.kill(signal); };
  process.on("SIGINT", () => forward("SIGINT"));
  process.on("SIGTERM", () => forward("SIGTERM"));
  child.once("error", error => { console.error(error.message); process.exitCode = 1; });
  child.once("exit", (code, signal) => { process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1); });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
