<script setup>
/*
 * 第二屏 Cesium 三维场景
 * 负责商用 3D Tiles / ion 数据源加载、空间数据叠加、镜头切换和 Viewer 生命周期清理。
 */
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import {
  ArcType,
  buildModuleUrl,
  Cartesian2,
  Cartesian3,
  Color,
  createGooglePhotorealistic3DTileset,
  createOsmBuildingsAsync,
  createWorldTerrainAsync,
  DistanceDisplayCondition,
  ImageryLayer,
  Ion,
  IonWorldImageryStyle,
  LabelStyle,
  Math as CesiumMath,
  NearFarScalar,
  PolylineGlowMaterialProperty,
  TileMapServiceImageryProvider,
  VerticalOrigin,
  Viewer,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { cesiumSource } from "../config/cesiumSources";

const props = defineProps({
  viewMode: {
    type: String,
    default: "earth",
    validator: (value) => ["earth", "city"].includes(value),
  },
});

const emit = defineEmits({
  status: (payload) => Boolean(payload?.state && payload?.source),
});

const container = useTemplateRef("container");
let viewer;
let disposed = false;
let overviewEntities = [];

// 城市视角以新加坡为默认落点：Google 摄影测量覆盖稳定，天际线和滨海区域的展示层次更完整。
const CAMERA_VIEWS = Object.freeze({
  earth: {
    destination: Cartesian3.fromDegrees(109.5, 27.5, 9_200_000),
    orientation: {
      heading: CesiumMath.toRadians(0),
      pitch: CesiumMath.toRadians(-89),
      roll: 0,
    },
  },
  city: {
    destination: Cartesian3.fromDegrees(103.8558, 1.2838, 1_750),
    orientation: {
      heading: CesiumMath.toRadians(24),
      pitch: CesiumMath.toRadians(-31),
      roll: 0,
    },
  },
});

const NETWORK_CITIES = Object.freeze([
  { name: "北京", lon: 116.4074, lat: 39.9042, color: "#FF713A" },
  { name: "上海", lon: 121.4737, lat: 31.2304, color: "#FFB15C" },
  { name: "深圳", lon: 114.0579, lat: 22.5431, color: "#FF713A" },
  { name: "新加坡", lon: 103.8198, lat: 1.3521, color: "#FFD3A8" },
]);

const CITY_SENSORS = Object.freeze([
  { name: "港口吞吐", value: "92.4%", lon: 103.8468, lat: 1.2658, height: 260 },
  { name: "交通指数", value: "畅通", lon: 103.8521, lat: 1.2794, height: 210 },
  { name: "能源负载", value: "68 MW", lon: 103.8607, lat: 1.2842, height: 310 },
  { name: "空气质量", value: "AQI 31", lon: 103.8692, lat: 1.2814, height: 235 },
]);

/**
 * 发布场景加载状态，让父组件负责状态文案而不是读取 Cesium 内部对象
 * @param {"loading"|"ready"|"degraded"|"error"} state 场景状态
 * @param {string} source 当前实际使用的数据源名称
 * @param {string} [message] 补充说明
 * @returns {void}
 */
function reportStatus(state, source, message = "") {
  emit("status", { state, source, message });
}

/**
 * 应用渲染质量参数；限制到 2 倍像素比，避免高 DPI 屏幕把显存开销无限放大
 * @param {Viewer} targetViewer Cesium Viewer 实例
 * @returns {void}
 */
function configureRenderQuality(targetViewer) {
  const { scene } = targetViewer;
  targetViewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 2);

  scene.backgroundColor = Color.fromCssColorString("#05070b");
  scene.highDynamicRange = true;
  scene.postProcessStages.fxaa.enabled = true;
  scene.fog.enabled = true;
  scene.fog.density = 0.00012;
  scene.fog.minimumBrightness = 0.22;
  scene.screenSpaceCameraController.enableCollisionDetection = true;
  scene.screenSpaceCameraController.minimumZoomDistance = 18;
  scene.screenSpaceCameraController.maximumZoomDistance = 24_000_000;

  if (scene.context.webgl2) scene.msaaSamples = 4;

  const bloom = scene.postProcessStages.bloom;
  bloom.enabled = true;
  bloom.uniforms.glowOnly = false;
  bloom.uniforms.contrast = 118;
  bloom.uniforms.brightness = -0.22;
  bloom.uniforms.delta = 1;
  bloom.uniforms.sigma = 2.8;
  bloom.uniforms.stepSize = 3;

  scene.globe.baseColor = Color.fromCssColorString("#11141a");
  scene.globe.enableLighting = true;
  scene.globe.showGroundAtmosphere = true;
  scene.globe.maximumScreenSpaceError = 1.15;
  scene.globe.tileCacheSize = 320;
  scene.globe.depthTestAgainstTerrain = true;
}

/**
 * 加载 Google 摄影测量 3D Tiles
 * 直接 API Key 优先；未提供时由已配置的 Cesium ion Token 代理访问。
 * @param {Viewer} targetViewer Cesium Viewer 实例
 * @returns {Promise<string>} 实际数据源名称
 */
async function loadGooglePhotorealistic(targetViewer) {
  if (cesiumSource.ionAccessToken) Ion.defaultAccessToken = cesiumSource.ionAccessToken;

  const tileset = await createGooglePhotorealistic3DTileset(
    cesiumSource.googleApiKey || undefined,
    {
      // 低于 Cesium 默认误差可换取近景建筑纹理清晰度，继续降低会显著增加网络与显存压力。
      maximumScreenSpaceError: 5,
      cacheBytes: 768 * 1024 * 1024,
      maximumCacheOverflowBytes: 256 * 1024 * 1024,
      cullWithChildrenBounds: true,
      preloadWhenHidden: false,
      showCreditsOnScreen: true,
    },
  );

  if (disposed || !targetViewer || targetViewer.isDestroyed()) return cesiumSource.label;

  targetViewer.scene.primitives.add(tileset);
  targetViewer.scene.globe.show = false;
  return cesiumSource.label;
}

/**
 * 加载 Cesium ion 全球地形、商业影像和 OSM Buildings
 * ion Community 套餐仅用于评估，正式商用必须使用符合业务分发范围的付费套餐。
 * @param {Viewer} targetViewer Cesium Viewer 实例
 * @returns {Promise<string>} 实际数据源名称
 */
async function loadIonWorld(targetViewer) {
  Ion.defaultAccessToken = cesiumSource.ionAccessToken;

  const [terrainProvider, buildings] = await Promise.all([
    createWorldTerrainAsync({ requestWaterMask: true, requestVertexNormals: true }),
    createOsmBuildingsAsync({ maximumScreenSpaceError: 5 }),
  ]);

  if (disposed || !targetViewer || targetViewer.isDestroyed()) return cesiumSource.label;

  targetViewer.terrainProvider = terrainProvider;
  targetViewer.imageryLayers.add(
    ImageryLayer.fromWorldImagery({ style: IonWorldImageryStyle.AERIAL_WITH_LABELS }),
  );
  targetViewer.scene.primitives.add(buildings);
  return cesiumSource.label;
}

/**
 * 加载随 Cesium 包发布的 Natural Earth 预览底图
 * 该分支不冒充生产级高清数据，只保证未配置密钥时页面仍可运行和演示空间叠加能力。
 * @param {Viewer} targetViewer Cesium Viewer 实例
 * @returns {Promise<string>} 降级数据源名称
 */
async function loadLocalPreview(targetViewer) {
  targetViewer.scene.globe.show = true;

  const provider = await TileMapServiceImageryProvider.fromUrl(
    buildModuleUrl("Assets/Textures/NaturalEarthII"),
  );

  if (disposed || !targetViewer || targetViewer.isDestroyed()) return "Local Natural Earth Preview";

  const layer = targetViewer.imageryLayers.addImageryProvider(provider);
  layer.brightness = 0.8;
  layer.contrast = 1.18;
  layer.saturation = 0.88;
  layer.gamma = 0.95;
  return "Local Natural Earth Preview";
}

/**
 * 按配置加载商用数据源，远程鉴权或网络失败时恢复本地椭球与预览底图
 * @param {Viewer} targetViewer Cesium Viewer 实例
 * @returns {Promise<{source:string,degraded:boolean,message:string}>} 实际加载结果
 */
async function loadSceneSource(targetViewer) {
  try {
    if (cesiumSource.provider === "google") {
      return {
        source: await loadGooglePhotorealistic(targetViewer),
        degraded: false,
        message: "全球摄影测量实景已加载",
      };
    }

    if (cesiumSource.provider === "ion") {
      return {
        source: await loadIonWorld(targetViewer),
        degraded: false,
        message: "全球地形、影像与建筑白模已加载",
      };
    }

    return {
      source: await loadLocalPreview(targetViewer),
      degraded: true,
      message: "未配置商用数据密钥，当前为本地预览底图",
    };
  } catch (error) {
    console.error("商用 Cesium 数据源加载失败，已切换本地预览。", error);
    targetViewer.imageryLayers.removeAll();
    const source = await loadLocalPreview(targetViewer);
    return {
      source,
      degraded: true,
      message: "远程数据源加载失败，请检查 API Key、域名限制和服务配额",
    };
  }
}

/**
 * 将跨城市网络实体登记到总览叠加层，由镜头模式统一控制显隐。
 * @param {Viewer} targetViewer Cesium Viewer 实例
 * @param {object} options Cesium Entity 配置
 * @returns {import("cesium").Entity} 已创建的实体
 */
function addOverviewEntity(targetViewer, options) {
  const entity = targetViewer.entities.add(options);
  overviewEntities.push(entity);
  return entity;
}

/**
 * 同步总览叠加层状态；城市近景仅保留当地传感器，避免其他城市标注悬浮在实景上。
 * @param {"earth"|"city"} mode 当前镜头模式
 * @returns {void}
 */
function syncOverviewVisibility(mode) {
  const visible = mode === "earth";
  overviewEntities.forEach((entity) => {
    entity.show = visible;
  });
  viewer?.scene.requestRender();
}

/**
 * 添加城市节点与跨区域空间链路，让业务数据和真实地理位置保持同一坐标系
 * @param {Viewer} targetViewer Cesium Viewer 实例
 * @returns {void}
 */
function addNetworkData(targetViewer) {
  overviewEntities = [];
  NETWORK_CITIES.forEach((city) => {
    const markerColor = Color.fromCssColorString(city.color);

    addOverviewEntity(targetViewer, {
      name: city.name,
      position: Cartesian3.fromDegrees(city.lon, city.lat, 18_000),
      point: {
        pixelSize: 9,
        color: markerColor,
        outlineColor: Color.WHITE.withAlpha(0.92),
        outlineWidth: 2,
        scaleByDistance: new NearFarScalar(80_000, 1.35, 12_000_000, 0.55),
        distanceDisplayCondition: new DistanceDisplayCondition(0, 14_000_000),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: city.name,
        font: "600 14px Inter, Microsoft YaHei, sans-serif",
        style: LabelStyle.FILL_AND_OUTLINE,
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK.withAlpha(0.88),
        outlineWidth: 4,
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -15),
        scaleByDistance: new NearFarScalar(80_000, 1.1, 12_000_000, 0.62),
        distanceDisplayCondition: new DistanceDisplayCondition(0, 14_000_000),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  });

  // 高度按链路跨度分级，防止多条弧线在同一平面互相遮挡。
  const routes = [
    [NETWORK_CITIES[0], NETWORK_CITIES[1], 520_000],
    [NETWORK_CITIES[1], NETWORK_CITIES[2], 380_000],
    [NETWORK_CITIES[2], NETWORK_CITIES[3], 760_000],
    [NETWORK_CITIES[3], NETWORK_CITIES[1], 920_000],
  ];

  routes.forEach(([from, to, height], index) => {
    const midLon = (from.lon + to.lon) / 2;
    const midLat = (from.lat + to.lat) / 2;
    const routeColor = index % 2 === 0
      ? Color.fromCssColorString("#FF713A")
      : Color.fromCssColorString("#FFB15C");

    addOverviewEntity(targetViewer, {
      polyline: {
        positions: Cartesian3.fromDegreesArrayHeights([
          from.lon, from.lat, 20_000,
          midLon, midLat, height,
          to.lon, to.lat, 20_000,
        ]),
        width: 3,
        arcType: ArcType.NONE,
        material: new PolylineGlowMaterialProperty({
          color: routeColor.withAlpha(0.92),
          glowPower: 0.3,
          taperPower: 0.72,
        }),
        distanceDisplayCondition: new DistanceDisplayCondition(120_000, 16_000_000),
      },
    });
  });

  // 城市传感器只在 100 km 内显示，避免地球总览被局部业务标签干扰。
  CITY_SENSORS.forEach((sensor, index) => {
    const sensorColor = index % 2 === 0
      ? Color.fromCssColorString("#FF713A")
      : Color.fromCssColorString("#FFB15C");
    const groundPosition = Cartesian3.fromDegrees(sensor.lon, sensor.lat, 8);
    const sensorPosition = Cartesian3.fromDegrees(sensor.lon, sensor.lat, sensor.height);

    targetViewer.entities.add({
      name: sensor.name,
      position: sensorPosition,
      point: {
        pixelSize: 8,
        color: sensorColor,
        outlineColor: Color.WHITE.withAlpha(0.9),
        outlineWidth: 2,
        distanceDisplayCondition: new DistanceDisplayCondition(0, 100_000),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `${sensor.name}  ${sensor.value}`,
        font: "600 13px Inter, Microsoft YaHei, sans-serif",
        style: LabelStyle.FILL_AND_OUTLINE,
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK.withAlpha(0.9),
        outlineWidth: 4,
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -13),
        distanceDisplayCondition: new DistanceDisplayCondition(0, 100_000),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      polyline: {
        positions: [groundPosition, sensorPosition],
        width: 2,
        arcType: ArcType.NONE,
        material: new PolylineGlowMaterialProperty({
          color: sensorColor.withAlpha(0.86),
          glowPower: 0.42,
          taperPower: 0.9,
        }),
        distanceDisplayCondition: new DistanceDisplayCondition(0, 100_000),
      },
    });

    targetViewer.entities.add({
      position: groundPosition,
      ellipse: {
        semiMajorAxis: 74 + index * 9,
        semiMinorAxis: 74 + index * 9,
        material: sensorColor.withAlpha(0.16),
        outline: true,
        outlineColor: sensorColor.withAlpha(0.82),
        height: 8,
        distanceDisplayCondition: new DistanceDisplayCondition(0, 100_000),
      },
    });
  });
}

/**
 * 飞行到地球总览或真实城市近景
 * @param {"earth"|"city"} mode 目标镜头模式
 * @param {number} [duration=1.8] 镜头过渡时间（秒）
 * @returns {void}
 */
function flyToView(mode, duration = 1.8) {
  if (!viewer || viewer.isDestroyed()) return;

  const resolvedMode = CAMERA_VIEWS[mode] ? mode : "earth";
  syncOverviewVisibility(resolvedMode);
  viewer.camera.flyTo({ ...CAMERA_VIEWS[resolvedMode], duration });
}

/**
 * 创建 Viewer 并按当前配置完成数据源、数据层和初始镜头装载
 * @returns {Promise<void>}
 */
async function initializeViewer() {
  if (!container.value) return;

  reportStatus("loading", cesiumSource.label, "正在建立真实世界三维场景");

  viewer = new Viewer(container.value, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    baseLayer: false,
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity,
  });

  configureRenderQuality(viewer);
  const result = await loadSceneSource(viewer);

  if (disposed || !viewer || viewer.isDestroyed()) return;

  addNetworkData(viewer);
  flyToView(props.viewMode, 2.4);
  reportStatus(result.degraded ? "degraded" : "ready", result.source, result.message);
}

watch(
  () => props.viewMode,
  (mode) => flyToView(mode),
);

onMounted(() => {
  initializeViewer().catch((error) => {
    console.error("Cesium 场景初始化失败。", error);
    reportStatus("error", cesiumSource.label, "三维场景初始化失败，请检查浏览器 WebGL 支持");
  });
});

onBeforeUnmount(() => {
  disposed = true;
  if (viewer && !viewer.isDestroyed()) viewer.destroy();
});
</script>

<template>
  <!-- Cesium 会把 Canvas、版权归属和内部容器挂载到该节点。 -->
  <div ref="container" class="cesium-globe" aria-label="可切换地球总览与真实城市近景的三维场景"></div>
</template>

<style scoped>
.cesium-globe {
  width: 100%;
  height: 100%;
  min-height: 100%;
  background: #05070b;
}

:deep(.cesium-viewer),
:deep(.cesium-viewer-cesiumWidgetContainer),
:deep(.cesium-widget),
:deep(canvas) {
  width: 100%;
  height: 100%;
}

/* Google 与 Cesium 要求版权归属清晰可见，禁止通过透明度或遮罩弱化。 */
:deep(.cesium-widget-credits) {
  max-width: calc(100% - 24px);
  padding: 4px 8px;
  color: #f5f4f0;
  background: rgba(5, 7, 11, 0.72);
  border-radius: 5px 0 0 0;
  font-size: 10px;
  opacity: 1;
}

:deep(.cesium-credit-logoContainer) {
  display: inline-flex;
  align-items: center;
}

@media (max-width: 768px) {
  .cesium-globe {
    min-height: 100%;
  }

  :deep(.cesium-widget-credits) {
    max-width: calc(100% - 12px);
    font-size: 8px;
  }
}
</style>