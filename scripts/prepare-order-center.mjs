import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir, mkdtemp, rm, stat, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, dirname, join, sep, posix } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { serviceOffers, centsToAmount } from "../shared/commerce.js";
import { applyUnifiedPatch } from "./lib/unified-patch.mjs";
import { phpBinary, inspectPhpRuntime } from "./lib/php-runtime.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const deploymentRoot = join(projectRoot, "deploy/shopxo");
const maxArchiveBytes = 128 * 1024 * 1024;
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

export function validateArchiveEntries(names, types, root) {
  if (!names.length || names.length > 50000 || types.length !== names.length) throw new Error("订单中心源码归档清单无效。");
  for (let index = 0; index < names.length; index++) {
    const name = names[index];
    // 不允许第三方归档把文件写到新建目录以外，也不接受符号链接/硬链接或设备文件。
    if (!name.startsWith(`${root}/`) || name.includes("\\") || name.split("/").some(part => part === "..") || !["-", "d"].includes(types[index])) {
      throw new Error("订单中心归档包含不安全的路径或文件类型。");
    }
  }
}

async function verifyFiles(directory, files) {
  for (const [path, digest] of Object.entries(files)) {
    if (sha256(await readFile(join(directory, path))) !== digest) throw new Error(`订单中心源码不匹配：${path}`);
  }
}

function lockedPath(directory, path) {
  if (typeof path !== "string" || !/^[A-Za-z0-9_./-]+$/.test(path) || path.startsWith("/") || posix.normalize(path) !== path || path.split("/").includes("..")) throw new Error("来源锁包含不安全路径。");
  const destination = resolve(directory, path);
  if (!destination.startsWith(resolve(directory) + sep)) throw new Error("来源锁越过源码目录。");
  return destination;
}

export async function prepareOrderCenter({ archive, output = join(projectRoot, "artifacts/order-center/shopxo"), php = phpBinary(), requirePhp = false, composer } = {}) {
  const lock = JSON.parse(await readFile(join(deploymentRoot, "upstream.lock.json"), "utf8"));
  const destination = resolve(output);
  const temporary = await mkdtemp(join(tmpdir(), "mono-shopxo-source-"));
  let created = false;
  try {
    try { await stat(destination); throw new Error("输出目录已经存在；为避免覆盖订单、配置和安装状态，请选择新的 --output 目录。"); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    const phpRuntimeCheck = inspectPhpRuntime(php, { allowMissing: !requirePhp && !composer });
    const sourceArchive = archive ? resolve(archive) : join(temporary, "source.tar.gz");
    if (!archive) {
      execFileSync("curl", ["--fail", "--location", "--proto", "=https", "--proto-redir", "=https", "--max-time", "180", "--output", sourceArchive, lock.archiveUrl], { stdio: "inherit" });
    }
    const info = await stat(sourceArchive);
    if (!info.isFile() || info.size > maxArchiveBytes) throw new Error("订单中心源码归档大小无效。");
    if (sha256(await readFile(sourceArchive)) !== lock.archiveSha256) throw new Error("源码归档 SHA-256 不匹配，已停止；不能跳过校验安装未知版本。");
    const tarOptions = { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 };
    const names = execFileSync("tar", ["-tzf", sourceArchive], tarOptions).trimEnd().split("\n");
    const types = execFileSync("tar", ["-tvzf", sourceArchive], tarOptions).trimEnd().split("\n").map(line => line[0]);
    validateArchiveEntries(names, types, `shopxo-${lock.commit}`);
    await mkdir(dirname(destination), { recursive: true });
    // mkdir 不带 recursive 保证只写入本次创建的全新目录，失败清理不触碰既有站点。
    await mkdir(destination);
    created = true;
    execFileSync("tar", ["-xzf", sourceArchive, "--strip-components=1", "-C", destination]);
    await verifyFiles(destination, lock.sourceFiles);
    for (const patch of lock.patches) {
      await applyUnifiedPatch(destination, await readFile(join(deploymentRoot, patch), "utf8"));
    }
    await verifyFiles(destination, lock.patchedFiles);
    const deployedFiles = { ...lock.patchedFiles };
    for (const [path, digest] of Object.entries(lock.runtimeFiles)) {
      const bytes = await readFile(lockedPath(deploymentRoot, path));
      if (sha256(bytes) !== digest) throw new Error(`PHP 运行环境检查文件摘要不匹配：${path}`);
      await writeFile(lockedPath(destination, path), bytes, { flag: "wx" });
      deployedFiles[path] = digest;
    }
    for (const [path, digest] of Object.entries(lock.dependencies.files)) {
      if (!["composer.json", "composer.lock"].includes(path)) throw new Error("依赖锁只允许替换 Composer 清单。");
      const bytes = await readFile(join(deploymentRoot, "dependencies", path));
      if (sha256(bytes) !== digest) throw new Error("订单中心依赖锁摘要不匹配。");
      await writeFile(join(destination, path), bytes);
      deployedFiles[path] = digest;
    }
    // The source archive bundles vulnerable historical dependencies. Never ship that vendor.
    await rm(join(destination, "vendor"), { recursive: true, force: true });
    for (const [path, digest] of Object.entries(lock.overlays || {})) {
      const source = lockedPath(join(deploymentRoot, "overlays"), path);
      const bytes = await readFile(source);
      if (sha256(bytes) !== digest) throw new Error(`订单中心扩展摘要不匹配：${path}`);
      const target = lockedPath(destination, path);
      await mkdir(dirname(target), { recursive: true });
      // Overlay files may only create new paths; upstream changes cannot be silently overwritten.
      await writeFile(target, bytes, { flag: "wx" });
      deployedFiles[path] = digest;
    }
    const policyPath = "config/mono_payment.php";
    const policy = (await readFile(join(destination, policyPath), "utf8")).replace("'refund_v2_from' => 0", `'refund_v2_from' => ${Math.floor(Date.now() / 1000)}`);
    await writeFile(join(destination, policyPath), policy);
    deployedFiles[policyPath] = sha256(policy);
    let syntaxCheck = "passed";
    for (const path of Object.keys(deployedFiles).filter(path => path.endsWith(".php"))) {
      const check = spawnSync(php, ["-l", join(destination, path)], { encoding: "utf8", windowsHide: true });
      if (check.error?.code === "ENOENT" && !requirePhp) { syntaxCheck = "not-run-php-unavailable"; break; }
      if (check.error) throw check.error;
      if (check.status !== 0) throw new Error(`订单中心 PHP 语法检查失败：${path}`);
    }
    let dependencyAudit = "not-run", dependenciesInstalled = false;
    if (composer) {
      const executable = resolve(composer);
      const execution = { cwd: destination, stdio: "inherit", windowsHide: true };
      execFileSync(php, [executable, "install", "--no-dev", "--no-interaction", "--no-scripts", "--prefer-dist"], execution);
      execFileSync(php, [executable, "check-platform-reqs", "--no-dev"], execution);
      execFileSync(php, [executable, "audit", "--locked", "--no-dev"], execution);
      // A known framework command is required after --no-scripts for native multi-app routing.
      execFileSync(php, ["think", "service:discover"], execution);
      dependenciesInstalled = true; dependencyAudit = "passed";
    }
    const catalogue = {
      requiresOwnerConfirmation: true,
      note: "这是待经营者确认的服务资料，不是已入库商品。请在后台创建服务商品并回填真实 ID；不自动上架、不启用支付。",
      services: serviceOffers.map(offer => ({ ...offer, price: centsToAmount(offer.priceCents) })),
    };
    await writeFile(join(destination, "mono-service-catalog.json"), JSON.stringify(catalogue, null, 2) + "\n");
    await copyFile(join(deploymentRoot, "README.md"), join(destination, "MONO-STUDIO-SETUP.md"));
    const manifest = {
      preparedAt: new Date().toISOString(), repository: lock.repository, commit: lock.commit,
      ref: lock.ref, archiveSha256: lock.archiveSha256, patches: lock.patches,
      files: deployedFiles, phpSyntaxCheck: syntaxCheck, phpRuntimeCheck, runtimeVerified: false,
      dependenciesInstalled, dependencyAudit,
      merchantConfigured: false, productionApproved: false, containsMerchantSecrets: false,
    };
    await writeFile(join(destination, "mono-source-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    return { destination, manifest };
  } catch (error) {
    if (created) await rm(destination, { recursive: true, force: true });
    throw error;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options = {};
    for (let index = 2; index < process.argv.length; index += 2) {
      const flag = process.argv[index];
      if (flag === "--require-php") { options.requirePhp = true; index--; continue; }
      if (!["--archive", "--output", "--php", "--composer"].includes(flag) || !process.argv[index + 1]) throw new Error("用法：npm run orders:prepare -- [--archive 本地官方归档] [--output 全新输出目录] [--php php可执行文件] [--composer composer.phar] [--require-php]");
      options[flag.slice(2)] = process.argv[index + 1];
    }
    const result = await prepareOrderCenter(options);
    console.log(`订单中心二开源码已准备：${result.destination}`);
    console.log(`PHP 安全版本检查：${result.manifest.phpRuntimeCheck.status}；网站工作进程尚未核验。`);
    console.log(`PHP 语法检查：${result.manifest.phpSyntaxCheck}；未安装数据库、未配置商户、未启用真实收款。`);
    if (!result.manifest.dependenciesInstalled) console.log("未安装 vendor：已移除上游旧依赖，请按锁文件执行 Composer install --no-dev --no-scripts 并 audit 后再运行。");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
