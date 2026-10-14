import { paymentConfig } from "./config.mjs";
import { createCommerceServer } from "./app.mjs";

const config = paymentConfig();
const server = createCommerceServer(config);
server.listen(config.port, config.host, () => {
  console.log(`官网与订单服务：http://${config.host}:${config.port}${config.base}`);
  console.log(config.enabled ? `支付宝 ${config.environment === "production" ? "正式" : "沙箱"}收款已开启；服务以人工交付为准。` : "收款已关闭：完成商品确认与商户配置后再开启。" );
});
for (const event of ["SIGINT", "SIGTERM"]) process.once(event, () => server.close(() => process.exit(0)));
