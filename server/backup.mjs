import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, chmodSync, openSync, fsyncSync, closeSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";

export function backupOrders(filename, directory) {
  const source = resolve(filename), destination = resolve(directory);
  if (!existsSync(source)) throw new Error("订单库不存在，不能用空数据库冒充有效备份。");
  mkdirSync(destination, { recursive: true, mode: 0o700 });
  const target = join(destination, `orders-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomBytes(4).toString("hex")}.sqlite`);
  const previousMask = process.umask(0o077);
  let database;
  try {
    database = new DatabaseSync(source, { readOnly: true });
    // VACUUM INTO 包含仍在 WAL 中的已提交交易，不能直接复制主库文件。
    database.prepare("VACUUM INTO ?").run(target);
    chmodSync(target, 0o600);
    const handle = openSync(target, "r");
    try { fsyncSync(handle); } finally { closeSync(handle); }
    const copy = new DatabaseSync(target, { readOnly: true });
    try {
      if (copy.prepare("PRAGMA integrity_check").get().integrity_check !== "ok") throw new Error("订单备份完整性检查失败。");
      copy.prepare("SELECT COUNT(*) FROM orders").get();
    } finally { copy.close(); }
    return target;
  } catch (error) { rmSync(target, { force: true }); throw error; }
  finally { database?.close(); process.umask(previousMask); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const directory = process.env.PAYMENT_BACKUP_DIR;
  if (!directory) throw new Error("请设置 PAYMENT_BACKUP_DIR，将订单备份保存到静态目录之外。");
  console.log(`订单备份完成：${backupOrders(process.env.PAYMENT_DATABASE_PATH || "data/commerce.sqlite", directory)}`);
}
