import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { centsToAmount, paymentStatuses } from "../shared/commerce.js";

// 仅供服务器运维在本地查看履约联系信息，不向公开网站添加未鉴权的管理接口。
const args = process.argv.slice(2);
let status, limit = 20;
for (let i = 0; i < args.length; i += 2) {
  if (args[i] === "--status") status = args[i + 1];
  else if (args[i] === "--limit") limit = Number(args[i + 1]);
  else throw new Error("用法：npm run orders:list -- --status PAID --limit 20");
}
if ((status && !Object.hasOwn(paymentStatuses, status)) || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("状态必须为 PENDING/PAID/CLOSED，条数范围为 1～100。");
const filename = resolve(process.env.PAYMENT_DATABASE_PATH || "data/commerce.sqlite");
if (!existsSync(filename)) {
  console.log("订单库尚不存在，请先启动订单服务。");
} else {
  const database = new DatabaseSync(filename, { readOnly: true });
  try {
    const rows = database.prepare(`SELECT id,service_name,amount_cents,status,contact_name,email,requirements,created_at FROM orders ${status ? "WHERE status=?" : ""} ORDER BY created_at DESC LIMIT ?`).all(...(status ? [status, limit] : [limit]));
    if (!rows.length) console.log("没有匹配的订单。");
    for (const row of rows) {
      console.log(JSON.stringify({ orderId: row.id, service: row.service_name, amount: centsToAmount(row.amount_cents), status: paymentStatuses[row.status], contactName: row.contact_name, email: row.email, requirements: row.requirements, createdAt: new Date(row.created_at).toISOString() }, null, 2));
    }
  } finally { database.close(); }
}
