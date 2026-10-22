import { paymentConfig } from "./config.mjs";
import { createCommerceServer } from "./app.mjs";
import { readFile } from "node:fs/promises";
import { assertNodeVersion } from "./node-runtime.mjs";

assertNodeVersion();
let metadata;
try { metadata = JSON.parse(await readFile("dist/site-build.json", "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw new Error("官网构建清单损坏，请重新构建后启动。"); }
const config = paymentConfig(metadata?.commerce?.provider === "shopxo" ? { ...process.env, PAYMENT_ORDER_CENTER: "shopxo" } : process.env);
const server = createCommerceServer(config);
server.on("error", error => {
  console.error(error.code === "EADDRINUSE" ? `端口 ${config.port} 已被占用，请停止旧服务或调整 PAYMENT_PORT。` : `服务启动失败：${error.code || "UNKNOWN"}`);
  process.exitCode = 1;
  server.close();
});
server.listen(config.port, config.host, () => {
  console.log(`官网与订单服务：http://${config.host}:${config.port}${config.base}`);
  console.log(config.enabled ? `支付宝 ${config.environment === "production" ? "正式" : "沙箱"}收款已开启；服务以人工交付为准。` : "收款已关闭：完成商品确认与商户配置后再开启。" );
});
let shuttingDown = false;
for (const event of ["SIGINT", "SIGTERM"]) process.once(event, () => {
  if (shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => server.closeAllConnections(), 20000);
  deadline.unref();
  server.close(() => { clearTimeout(deadline); process.exit(0); });
});
