/*
 * Cesium 商用数据源配置
 * 供第二屏三维场景读取构建期环境变量，密钥必须在服务商后台限制可用域名与 API 权限。
 */

const supportedProviders = new Set(["google", "ion", "local"]);
const requestedProvider = String(import.meta.env.VITE_CESIUM_PROVIDER || "google").toLowerCase();
const googleApiKey = String(import.meta.env.VITE_GOOGLE_MAP_TILES_API_KEY || "").trim();
const ionAccessToken = String(import.meta.env.VITE_CESIUM_ION_TOKEN || "").trim();

/**
 * 根据显式配置和可用凭据决定场景数据源
 * Google 模式缺少密钥时允许使用 ion 代理；二者都不可用时退回本地开发底图。
 * @returns {"google"|"ion"|"local"} 当前实际使用的数据源类型
 */
function resolveProvider() {
  const provider = supportedProviders.has(requestedProvider) ? requestedProvider : "google";

  if (provider === "google" && (googleApiKey || ionAccessToken)) return "google";
  if (provider === "ion" && ionAccessToken) return "ion";
  return "local";
}

const provider = resolveProvider();

export const cesiumSource = Object.freeze({
  provider,
  googleApiKey,
  ionAccessToken,
  isPhotorealistic: provider === "google",
  isCommercialSource: provider !== "local",
  label: provider === "google"
    ? "Google Photorealistic 3D Tiles"
    : provider === "ion"
      ? "Cesium World Terrain · OSM Buildings"
      : "Local Natural Earth Preview",
});