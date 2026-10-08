/*
 * Cesium 商用数据源配置
 * 供独立演示读取构建期环境变量，密钥必须在服务商后台限制可用域名与 API 权限。
 */

const supportedProviders = new Set(["google", "ion", "local"]);
const requestedProvider = String(import.meta.env.VITE_CESIUM_PROVIDER || "local").toLowerCase();
const googleApiKey = String(import.meta.env.VITE_GOOGLE_MAP_TILES_API_KEY || "").trim();
const ionAccessToken = String(import.meta.env.VITE_CESIUM_ION_TOKEN || "").trim();
// 天地图密钥（tk）：Google/Bing 实景瓦片不含可切换语言的文字图层，中文地名注记改用天地图 WMTS 叠加。
// 申请地址 https://console.tianditu.gov.cn/api/key ，未配置时中文注记自动关闭、回退到原有实景表现。
const tiandituToken = String(import.meta.env.VITE_TIANDITU_TOKEN || "").trim();

/**
 * 根据显式配置和可用凭据决定场景数据源
 * Google 模式缺少密钥时允许使用 ion 代理；二者都不可用时退回本地开发底图。
 * @returns {"google"|"ion"|"local"} 当前实际使用的数据源类型
 */
function resolveProvider() {
  const provider = supportedProviders.has(requestedProvider) ? requestedProvider : "local";

  if (provider === "google" && (googleApiKey || ionAccessToken)) return "google";
  if (provider === "ion" && ionAccessToken) return "ion";
  return "local";
}

const provider = resolveProvider();

export const cesiumSource = Object.freeze({
  provider,
  googleApiKey,
  ionAccessToken,
  tiandituToken,
  // 有 tk 才叠加中文注记；实景瓦片本身无法翻译，此开关决定是否挂载天地图注记图层。
  hasChineseLabels: Boolean(tiandituToken),
  isPhotorealistic: provider === "google",
  isCommercialSource: provider !== "local",
  label: provider === "google"
    ? "Google Photorealistic 3D Tiles"
    : provider === "ion"
      ? "Cesium World Terrain · OSM Buildings"
      : "Local Natural Earth Preview",
});