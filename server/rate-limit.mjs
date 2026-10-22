import { isIP } from "node:net";
import { CommerceError } from "./order-store.mjs";

export function clientAddress(request, trustProxy = false) {
  const peer = request.socket.remoteAddress;
  const real = request.headers["x-real-ip"];
  return trustProxy && ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(peer) && typeof real === "string" && isIP(real) ? real : peer;
}

// Payment callbacks have their own budget: browser traffic must not consume it.
export function notificationGuard({ perMinute = 240, globalPerMinute = 2400, concurrency = 32, now = Date.now } = {}) {
  const clients = new Map();
  let windowEnd = 0, total = 0, active = 0;
  return address => {
    const time = now();
    if (time >= windowEnd) { windowEnd = time + 60000; total = 0; }
    if (clients.size >= 5000) for (const [key, value] of clients) if (value.until <= time) clients.delete(key);
    let client = clients.get(address);
    if (!client || client.until <= time) {
      if (clients.size >= 5000 && !client) throw new CommerceError("支付通知较多，请稍后重试。", 429);
      client = { count: 0, until: time + 60000 }; clients.set(address, client);
    }
    if (active >= concurrency || client.count >= perMinute || total >= globalPerMinute) throw new CommerceError("支付通知较多，请稍后重试。", 429);
    client.count++; total++; active++;
    let released = false;
    return () => { if (!released) { released = true; active--; } };
  };
}
