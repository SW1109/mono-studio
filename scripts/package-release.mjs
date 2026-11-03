import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

// 使用明确允许的源码清单，不打包工作目录中的 .env.local、密钥、订单库或 node_modules。
const files = ["deploy/shopxo/README.md", "deploy/shopxo/nginx-security.conf", "deploy/shopxo/nginx-storefront.conf", "deploy/shopxo/nginx-seo.conf"];
const metadata = JSON.parse(await readFile("dist/site-build.json", "utf8"));
const staging = await mkdtemp(join(tmpdir(), "mono-release-"));
const output = resolve("artifacts/releases");
const filename = join(output, `mono-studio-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomBytes(3).toString("hex")}.tar.gz`);
try {
  await mkdir(output, { recursive: true });
  await cp("dist", join(staging, "dist"), { recursive: true });
  for (const file of files) {
    const destination = join(staging, file);
    await mkdir(dirname(destination), { recursive: true });
    await cp(file, destination);
  }
  await writeFile(join(staging, "release.json"), JSON.stringify({ createdAt: new Date().toISOString(), kind: "website-static", site: metadata, containsMerchantSecrets: false }, null, 2));
  // macOS 扩展属性不应变成 Linux 站点里的公开 ._* 附带文件。
  execFileSync("tar", ["--exclude=._*", "--exclude=.DS_Store", "-czf", filename, "-C", staging, "."], { env: { ...process.env, COPYFILE_DISABLE: "1" } });
  console.log(`发布包已生成：${filename}`);
} finally { await rm(staging, { recursive: true, force: true }); }
