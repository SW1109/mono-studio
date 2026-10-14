// 这是待经营者确认的服务目录，不将原有概念方案伪装成已交付产品或客户案例。
export const serviceOffers = Object.freeze([
  {
    id: "technical-review", name: "软件问题诊断", category: "技术支持", icon: "web", priceCents: 29900,
    summary: "围绕一个可复现的软件问题，定位原因并给出可执行的修复建议。",
    scope: "一个 Web 项目、一个明确问题，最多 2 小时远程诊断。",
    delivery: "资料齐备、双方确认排期后 3 个工作日内交付。",
    deliverables: ["一次远程问题排查", "问题原因与排查记录", "修复建议及后续工作评估"],
    exclusions: "不包含完整功能开发、硬件维修、源码不可访问项目或第三方平台解封。",
    preparation: "请提供问题现象、复现步骤、技术栈和经过脱敏的必要日志。",
  },
  {
    id: "page-improvement", name: "前端单页面优化", category: "前端开发", icon: "mobile", priceCents: 69900,
    summary: "优化一个已有 Web 页面，改善布局、移动端适配和关键交互状态。",
    scope: "一个已有页面、已有组件库，最多 5 处双方确认的布局或交互改动。",
    delivery: "资料齐备、双方确认排期后 5 个工作日内交付。",
    deliverables: ["对应页面源代码修改", "目标屏幕尺寸适配", "一次范围内反馈调整及改动说明"],
    exclusions: "不包含整站重设计、新增后端接口、第三方付费素材或未约定的新功能。",
    preparation: "请提供可运行源码、页面地址、目标截图或具体改动清单。",
  },
  {
    id: "api-integration", name: "单接口对接服务", category: "系统集成", icon: "workflow", priceCents: 99900,
    summary: "将一个有正式文档的业务接口接入已有 Web 项目，并验证关键结果。",
    scope: "一个项目、一个业务接口，复用已有登录、请求封装和运行环境。",
    delivery: "文档与测试权限齐备、双方确认排期后 7 个工作日内交付。",
    deliverables: ["接口调用与必要页面接入", "成功、失败及字段边界处理", "联调记录、配置说明与源码交付"],
    exclusions: "不包含支付全链路、接口逆向、平台审核、额外接口或第三方服务费用。",
    preparation: "请提供正式接口文档、脱敏示例、测试环境及已获授权的访问方式。",
  },
].map(item => Object.freeze(item)));

export const purchaseRules = Object.freeze({ contactNameMax: 40, emailMax: 254, requirementsMax: 1000, termsVersion: "2026-10-10", orderMinutes: 30 });
export const paymentStatuses = Object.freeze({ PENDING: "待支付", PAID: "付款已确认", CLOSED: "交易已关闭" });
export const findServiceOffer = id => serviceOffers.find(item => item.id === id);

// 金额以整数分存储；对外支付参数用十进制字符串，避免浮点运算改变订单金额。
export function centsToAmount(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new TypeError("金额必须是非负整数分。");
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}
export function amountToCents(amount) {
  if (typeof amount !== "string" || !/^\d{1,9}(?:\.\d{1,2})?$/.test(amount)) throw new TypeError("支付金额格式无效。");
  const [whole, decimal = ""] = amount.split(".");
  return Number(BigInt(whole) * 100n + BigInt(decimal.padEnd(2, "0")));
}
export function validatePurchase(input) {
  const data = {
    serviceId: typeof input?.serviceId === "string" ? input.serviceId : "",
    contactName: typeof input?.contactName === "string" ? input.contactName.trim() : "",
    email: typeof input?.email === "string" ? input.email.trim() : "",
    expectedAmountCents: input?.expectedAmountCents,
    requirements: typeof input?.requirements === "string" ? input.requirements.trim() : "",
  };
  const errors = {};
  const offer = findServiceOffer(data.serviceId);
  if (!offer) errors.serviceId = "请选择有效的服务商品。";
  else if (data.expectedAmountCents !== offer.priceCents) errors.serviceId = "服务价格已调整，请刷新页面并重新确认。";
  if (!data.contactName) errors.contactName = "联系人不能为空。";
  else if (data.contactName.length > purchaseRules.contactNameMax) errors.contactName = `联系人最多允许 ${purchaseRules.contactNameMax} 个字符。`;
  if (!data.email) errors.email = "联系邮箱不能为空。";
  else if (data.email.length > purchaseRules.emailMax || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "请输入有效的联系邮箱。";
  if (!data.requirements) errors.requirements = "请简要说明需要处理的问题或服务目标。";
  else if (data.requirements.length > purchaseRules.requirementsMax) errors.requirements = `需求说明最多允许 ${purchaseRules.requirementsMax} 个字符。`;
  if (input?.acceptedTerms !== true || input?.termsVersion !== purchaseRules.termsVersion) errors.acceptedTerms = "请阅读并同意当前版本的服务购买条款与隐私说明。";
  return { data, errors };
}
