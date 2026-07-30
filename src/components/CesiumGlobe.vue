<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  ArcType,
  buildModuleUrl,
  Cartesian2,
  Cartesian3,
  Color,
  LabelStyle,
  Math as CesiumMath,
  PolylineGlowMaterialProperty,
  TileMapServiceImageryProvider,
  VerticalOrigin,
  Viewer,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

const container = ref(null);
let viewer;
let disposed = false;

onMounted(async () => {
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

  viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 2);
  viewer.scene.backgroundColor = Color.fromCssColorString("#070709");
  viewer.scene.highDynamicRange = true;
  viewer.scene.postProcessStages.fxaa.enabled = true;
  if (viewer.scene.context.webgl2) viewer.scene.msaaSamples = 4;
  viewer.scene.globe.baseColor = Color.fromCssColorString("#121216");
  viewer.scene.globe.enableLighting = true;
  viewer.scene.globe.showGroundAtmosphere = true;
  viewer.scene.globe.maximumScreenSpaceError = 1.35;
  viewer.scene.globe.tileCacheSize = 240;
  viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;

  const bloom = viewer.scene.postProcessStages.bloom;
  bloom.enabled = true;
  bloom.uniforms.glowOnly = false;
  bloom.uniforms.contrast = 126;
  bloom.uniforms.brightness = -0.18;
  bloom.uniforms.delta = 1;
  bloom.uniforms.sigma = 3.2;
  bloom.uniforms.stepSize = 4;

  try {
    const naturalEarth = await TileMapServiceImageryProvider.fromUrl(
      buildModuleUrl("Assets/Textures/NaturalEarthII"),
    );
    if (!disposed && viewer && !viewer.isDestroyed()) {
      const layer = viewer.imageryLayers.addImageryProvider(naturalEarth);
      layer.brightness = 0.72;
      layer.contrast = 1.28;
      layer.saturation = 0.76;
      layer.gamma = 0.92;
    }
  } catch (error) {
    console.warn("Cesium local imagery could not be loaded; using globe base color.", error);
  }

  const cities = [
    { name: "北京", lon: 116.4074, lat: 39.9042 },
    { name: "上海", lon: 121.4737, lat: 31.2304 },
    { name: "深圳", lon: 114.0579, lat: 22.5431 },
  ];

  cities.forEach((city) => {
    viewer.entities.add({
      name: city.name,
      position: Cartesian3.fromDegrees(city.lon, city.lat, 15000),
      point: {
        pixelSize: 10,
        color: Color.fromCssColorString("#FF5C1A"),
        outlineColor: Color.WHITE.withAlpha(0.85),
        outlineWidth: 2,
      },
      label: {
        text: city.name,
        font: "500 14px Inter, Microsoft YaHei, sans-serif",
        style: LabelStyle.FILL_AND_OUTLINE,
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 3,
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: new Cartesian2(0, -14),
      },
    });
  });

  const routeColor = Color.fromCssColorString("#FF5C1A");
  const routes = [
    [cities[0], cities[1]],
    [cities[1], cities[2]],
    [cities[2], cities[0]],
  ];
  routes.forEach(([from, to], index) => {
    const midLon = (from.lon + to.lon) / 2;
    const midLat = (from.lat + to.lat) / 2;
    viewer.entities.add({
      polyline: {
        positions: Cartesian3.fromDegreesArrayHeights([
          from.lon, from.lat, 20_000,
          midLon, midLat, 420_000 + index * 120_000,
          to.lon, to.lat, 20_000,
        ]),
        width: 3,
        arcType: ArcType.NONE,
        material: new PolylineGlowMaterialProperty({
          color: routeColor.withAlpha(0.92),
          glowPower: 0.24,
          taperPower: 0.65,
        }),
      },
    });
  });

  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(112, 30, 9_800_000),
    orientation: {
      heading: 0,
      pitch: CesiumMath.toRadians(-90),
      roll: 0,
    },
    duration: 2.2,
  });

});

onBeforeUnmount(() => {
  disposed = true;
  if (viewer && !viewer.isDestroyed()) viewer.destroy();
});
</script>

<template>
  <div ref="container" class="cesium-globe" aria-label="可交互三维地球场景"></div>
</template>

<style scoped>
.cesium-globe {
  width: 100%;
  height: 100%;
  min-height: 100%;
  background: #070709;
}

:deep(.cesium-viewer),
:deep(.cesium-viewer-cesiumWidgetContainer),
:deep(.cesium-widget),
:deep(canvas) {
  width: 100%;
  height: 100%;
}

:deep(.cesium-widget-credits) {
  font-size: 9px;
  opacity: 0.55;
}

@media (max-width: 768px) {
  .cesium-globe {
    min-height: 100%;
  }
}
</style>
