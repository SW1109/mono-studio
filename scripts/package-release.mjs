import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

// 使用明确允许的源码清单，不打包工作目录中的 .env.local、密钥、订单库或 node_modules。
const files = ["server/index.mjs", "server/app.mjs", "server/config.mjs", "server/order-store.mjs", "server/order-admin.mjs", "server/orders-cli.mjs", "server/backup.mjs", "server/payments/alipay.mjs", "shared/commerce.js", "shared/order-center.js", "deploy/linux/mono-studio.service", "deploy/linux/mono-studio-backup.service", "deploy/linux/mono-studio-backup.timer", "deploy/linux/nginx-api.conf", "deploy/linux/payment.env.example", "deploy/linux/README.md", "deploy/shopxo/README.md"];
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
  await writeFile(join(staging, "release.json"), JSON.stringify({ createdAt: new Date().toISOString(), node: ">=22.13.0", site: metadata, containsMerchantSecrets: false }, null, 2));
  execFileSync("tar", ["-czf", filename, "-C", staging, "."]);
  console.log(`发布包已生成：${filename}`);
} finally { await rm(staging, { recursive: true, force: true }); }
