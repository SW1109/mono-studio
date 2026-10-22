import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";
import { phpBinary, inspectPhpRuntime } from "./lib/php-runtime.mjs";

const root = resolve(process.env.SHOPXO_SOURCE || "artifacts/order-center/shopxo");
const php = phpBinary();
const phpRuntimeCheck = inspectPhpRuntime(php);
const manifest = JSON.parse(await readFile(resolve(root, "mono-source-manifest.json"), "utf8"));
const lock = JSON.parse(await readFile("deploy/shopxo/upstream.lock.json", "utf8"));
if (manifest.commit !== lock.commit) throw new Error("订单中心并非当前锁定源码。");
for (const [path, hash] of Object.entries(manifest.files)) {
  const target = resolve(root, path);
  if (!target.startsWith(root + sep)) throw new Error("清单路径越界。");
  if (createHash("sha256").update(await readFile(target)).digest("hex") !== hash) throw new Error(`源码摘要不匹配：${path}`);
  if (path.endsWith(".php")) execFileSync(php, ["-l", target], { stdio: "pipe", windowsHide: true });
}
for (const [path, hash] of Object.entries({ ...lock.patchedFiles, ...lock.dependencies.files, ...lock.overlays, ...lock.runtimeFiles })) {
  if (path === "config/mono_payment.php") continue; // Deployment-specific migration cutoff is in the manifest.
  if (manifest.files[path] !== hash) throw new Error(`清单不是当前安全补丁：${path}`);
}
const installed = JSON.parse(await readFile(resolve(root, "vendor/composer/installed.json"), "utf8"));
await readFile(resolve(root, "vendor/services.php"));
const packages = new Map((installed.packages || installed).map(item => [item.name, item.version]));
const dependencies = JSON.parse(await readFile(resolve(root, "composer.lock"), "utf8"));
for (const item of dependencies.packages) if (packages.get(item.name) !== item.version) throw new Error(`PHP 依赖未按锁文件安装：${item.name}`);
console.log(execFileSync(php, ["scripts/shopxo-guard.test.php", root], { encoding: "utf8", windowsHide: true }).trim());
console.log(`PHP ${phpRuntimeCheck.version} 达到已审核安全版本基线；未核验线上工作进程。`);
console.log("ShopXO 来源、补丁、依赖安装版本与 PHP 边界检查通过。数据库并发和真实支付须另外验收。");
