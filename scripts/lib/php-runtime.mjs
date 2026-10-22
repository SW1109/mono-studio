import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export function phpBinary() {
  if (process.env.PHP_BINARY) return process.env.PHP_BINARY;
  const local = fileURLToPath(new URL("../../artifacts/order-center/php-runtime/php.exe", import.meta.url));
  return process.platform === "win32" && existsSync(local) ? local : "php";
}

export function inspectPhpRuntime(php = phpBinary(), { allowMissing = false, requireHardening = false } = {}) {
  const checker = fileURLToPath(new URL("../../deploy/shopxo/php-runtime-check.php", import.meta.url));
  const args = [checker, "--json", ...(requireHardening ? ["--require-hardening"] : [])];
  const result = spawnSync(php, args, { encoding: "utf8", windowsHide: true, timeout: 10000, maxBuffer: 65536 });
  if (result.error?.code === "ENOENT" && allowMissing) return { status: "not-run-php-unavailable", webWorkersVerified: false };
  if (result.error) throw new Error(`无法检查 PHP 运行环境：${result.error.code || result.error.message}`);
  let report;
  try { report = JSON.parse(result.stdout); }
  catch { throw new Error("PHP 安全版本检查没有返回有效结果，请确认使用 PHP CLI 及完整的安全策略文件。"); }
  if (result.status !== 0 || report.status !== "passed" || report.sapi !== "cli" || report.versionCheck?.status !== "passed") {
    throw new Error(`PHP 运行环境未通过检查：${report.versionCheck?.reason || "版本无效"} ${(report.hardeningIssues || []).join(" ")}`);
  }
  return report;
}
