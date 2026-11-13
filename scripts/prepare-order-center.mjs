import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir, mkdtemp, rm, stat, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { site } from "../src/content/site.js";
import { serviceOffers, servicePurchaseFaqs } from "../src/content/serviceOffers.js";

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

export async function prepareOrderCenter({ archive, output = join(projectRoot, "artifacts/order-center/shopxo") } = {}) {
  const lock = JSON.parse(await readFile(join(deploymentRoot, "upstream.lock.json"), "utf8"));
  const destination = resolve(output);
  const temporary = await mkdtemp(join(tmpdir(), "mono-shopxo-source-"));
  let created = false;
  try {
    try { await stat(destination); throw new Error("输出目录已经存在；为避免覆盖订单、配置和安装状态，请选择新的 --output 目录。"); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
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
      execFileSync("patch", ["--batch", "--forward", "--fuzz=0", "-p1", "-i", join(deploymentRoot, patch)], { cwd: destination, stdio: "inherit" });
    }
    await verifyFiles(destination, lock.patchedFiles);
    for (const [path, digest] of Object.entries(lock.overlayFiles || {})) {
      const source = join(deploymentRoot, "overlay", path);
      if (sha256(await readFile(source)) !== digest) throw new Error(`商城主题覆盖文件摘要不匹配：${path}`);
      await mkdir(dirname(join(destination, path)), { recursive: true });
      await copyFile(source, join(destination, path));
    }
    await verifyFiles(destination, lock.overlayFiles || {});
    if (lock.upgrade) {
      const source = join(deploymentRoot, lock.upgrade.path);
      if (sha256(await readFile(source)) !== lock.upgrade.sha256) throw new Error("数据库增量迁移脚本摘要不匹配。");
      await copyFile(source, join(destination, lock.upgrade.output));
    }
    let syntaxCheck = "passed";
    const phpFiles = [...Object.keys(lock.patchedFiles), ...Object.keys(lock.overlayFiles || {}), ...(lock.upgrade ? [lock.upgrade.output] : [])].filter(path => path.endsWith(".php"));
    for (const path of phpFiles) {
      const php = spawnSync("php", ["-l", join(destination, path)], { encoding: "utf8" });
      if (php.error && php.error.code !== "ENOENT") throw php.error;
      if (php.error) { syntaxCheck = "not-run-php-unavailable"; break; }
      if (php.status !== 0) throw new Error(`二开文件 PHP 语法检查失败：${path}`);
    }
    const catalogue = {
      catalogVersion: "2026-10-28",
      note: "有明确范围与交付清单的软件技术服务套餐；维护脚本须先检查并在备份后显式执行。定价和履约由经营者负责，准备源码不自动上架或启用支付。",
      purchaseFaqs: servicePurchaseFaqs,
      services: serviceOffers,
    };
    await writeFile(join(destination, "mono-service-catalog.json"), JSON.stringify(catalogue, null, 2) + "\n");
    await writeFile(join(destination, "mono-site-navigation.json"), JSON.stringify({ name: site.name, shortName: site.shortName, description: site.description, identity: site.identity, navigation: site.navigation, email: site.email, wechat: site.wechat, records: site.records }, null, 2) + "\n");
    await copyFile(join(deploymentRoot, "README.md"), join(destination, "MONO-STUDIO-SETUP.md"));
    await copyFile(join(deploymentRoot, "nginx-security.conf"), join(destination, "MONO-NGINX-SECURITY.conf"));
    await copyFile(join(deploymentRoot, "nginx-storefront.conf"), join(destination, "MONO-NGINX-STOREFRONT.conf"));
    await copyFile(join(deploymentRoot, "nginx-seo.conf"), join(destination, "MONO-NGINX-SEO.conf"));
    const manifest = {
      preparedAt: new Date().toISOString(), repository: lock.repository, commit: lock.commit,
      ref: lock.ref, archiveSha256: lock.archiveSha256, patches: lock.patches, upgrade: lock.upgrade,
      files: lock.patchedFiles, overlayFiles: lock.overlayFiles, upstreamFiles: lock.sourceFiles, phpSyntaxCheck: syntaxCheck, runtimeVerified: false,
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
      if (!["--archive", "--output"].includes(flag) || !process.argv[index + 1]) throw new Error("用法：npm run orders:prepare -- [--archive 本地官方归档] [--output 全新输出目录]");
      options[flag.slice(2)] = process.argv[index + 1];
    }
    const result = await prepareOrderCenter(options);
    console.log(`订单中心二开源码已准备：${result.destination}`);
    console.log(`PHP 语法检查：${result.manifest.phpSyntaxCheck}；未安装数据库、未配置商户、未启用真实收款。`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
