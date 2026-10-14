import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname } from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { findServiceOffer, purchaseRules } from "../shared/commerce.js";

export const hashOwner = token => createHash("sha256").update(token).digest("hex");
export class CommerceError extends Error {
  constructor(message, status = 400, fields) { super(message); this.status = status; this.fields = fields; }
}
export class OrderStore {
  constructor(filename) {
    if (filename !== ":memory:") mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(filename);
    if (filename !== ":memory:") chmodSync(filename, 0o600);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY, owner_hash TEXT NOT NULL, idempotency_key TEXT NOT NULL, fingerprint TEXT NOT NULL,
        service_id TEXT NOT NULL, service_name TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
        contact_name TEXT NOT NULL, email TEXT NOT NULL, requirements TEXT NOT NULL, terms_version TEXT NOT NULL,
        provider TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('PENDING','PAID','CLOSED')),
        created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, paid_at INTEGER, trade_no TEXT UNIQUE,
        UNIQUE(owner_hash,idempotency_key)
      );
      CREATE INDEX IF NOT EXISTS orders_owner ON orders(owner_hash,created_at);
      CREATE INDEX IF NOT EXISTS orders_created ON orders(created_at DESC,id DESC);
      CREATE INDEX IF NOT EXISTS orders_status_created ON orders(status,created_at DESC,id DESC);
      CREATE TABLE IF NOT EXISTS payment_events (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, source TEXT NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL);`);
    if (!this.db.prepare("PRAGMA table_info(orders)").all().some(column => column.name === "service_snapshot")) {
      this.db.exec("ALTER TABLE orders ADD COLUMN service_snapshot TEXT NOT NULL DEFAULT '{}'");
    }
  }
  create(data, ownerHash, key, provider = "alipay") {
    const service = findServiceOffer(data.serviceId);
    if (!service) throw new CommerceError("服务商品不存在。");
    const fingerprint = createHash("sha256").update(JSON.stringify(data)).digest("hex");
    const existing = this.db.prepare("SELECT * FROM orders WHERE owner_hash=? AND idempotency_key=?").get(ownerHash, key);
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new CommerceError("本次请求与已创建订单不一致，请重新确认订单。", 409);
      return existing;
    }
    const id = `GN${Date.now().toString(36).toUpperCase()}${randomBytes(10).toString("hex").toUpperCase()}`;
    const now = Date.now();
    this.db.prepare(`INSERT INTO orders (id,owner_hash,idempotency_key,fingerprint,service_id,service_name,amount_cents,contact_name,email,requirements,terms_version,provider,status,created_at,expires_at,service_snapshot)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'PENDING',?,?,?)`).run(id, ownerHash, key, fingerprint, service.id, service.name, service.priceCents, data.contactName, data.email, data.requirements, purchaseRules.termsVersion, provider, now, now + purchaseRules.orderMinutes * 60000, JSON.stringify(service));
    return this.get(id);
  }
  get(id) { return this.db.prepare("SELECT * FROM orders WHERE id=?").get(id); }
  owned(id, ownerHash) {
    const order = this.db.prepare("SELECT * FROM orders WHERE id=? AND owner_hash=?").get(id, ownerHash);
    if (!order) throw new CommerceError("订单不存在或不属于当前浏览器，请使用下单时的浏览器查询。", 404);
    return order;
  }
  list(ownerHash) { return this.db.prepare("SELECT * FROM orders WHERE owner_hash=? ORDER BY created_at DESC LIMIT 20").all(ownerHash); }
  ping() { this.db.prepare("SELECT 1 FROM orders LIMIT 1").get(); }
  queryForAdmin({ status, orderId, page, pageSize }) {
    const conditions = [], parameters = [];
    if (status) { conditions.push("status=?"); parameters.push(status); }
    if (orderId) { conditions.push("id=?"); parameters.push(orderId); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const total = this.db.prepare(`SELECT COUNT(*) AS total FROM orders ${where}`).get(...parameters).total;
    const orders = this.db.prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).all(...parameters, pageSize, (page - 1) * pageSize);
    return { orders, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }
  paymentHistory(orderId) {
    return this.db.prepare("SELECT source,status,created_at AS createdAt FROM payment_events WHERE order_id=? ORDER BY created_at,id").all(orderId);
  }
  applyPayment(event, { source, eventId }) {
    if (!["PAID", "CLOSED", "PENDING"].includes(event.status)) throw new CommerceError("交易状态无效。");
    if (!Number.isSafeInteger(event.amountCents) || event.amountCents <= 0) throw new CommerceError("交易金额无效。");
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(event.tradeNo || "")) throw new CommerceError("交易流水号无效。");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const order = this.get(event.orderId);
      if (!order || order.provider !== event.provider || order.amount_cents !== event.amountCents) throw new CommerceError("支付订单或金额不匹配。");
      if (order.trade_no && order.trade_no !== event.tradeNo) throw new CommerceError("交易流水号与已记录付款不一致。");
      if (!this.db.prepare("SELECT id FROM payment_events WHERE id=?").get(eventId)) {
        const paid = event.status === "PAID";
        // 已付款订单不可被晚到的关闭/等待通知回退；收款不等于服务已经交付。
        const status = paid ? "PAID" : order.status === "PAID" ? "PAID" : event.status === "CLOSED" ? "CLOSED" : order.status;
        this.db.prepare("UPDATE orders SET status=?,trade_no=?,paid_at=COALESCE(paid_at,?) WHERE id=?").run(status, event.tradeNo, paid ? Date.now() : null, order.id);
        this.db.prepare("INSERT INTO payment_events VALUES (?,?,?,?,?)").run(eventId, order.id, source, event.status, Date.now());
      }
      this.db.exec("COMMIT");
      return this.get(order.id);
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }
  close() { this.db.close(); }
}
export function publicOrder(order) {
  return { id: order.id, serviceId: order.service_id, serviceName: order.service_name, amountCents: order.amount_cents,
    contactName: order.contact_name, email: order.email, requirements: order.requirements, status: order.status,
    provider: order.provider, termsVersion: order.terms_version, serviceSnapshot: JSON.parse(order.service_snapshot), createdAt: order.created_at, expiresAt: order.expires_at, paidAt: order.paid_at,
    expired: order.status === "PENDING" && order.expires_at <= Date.now() };
}
