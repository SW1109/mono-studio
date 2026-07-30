# MONO STUDIO · Vue 3D

原静态单页已迁移到 Vue 3 + Vite，并将 3D 能力拆成两个独立渲染层：

- `ThreeHero.vue`：首页轻量品牌视觉，使用 npm 版 Three.js。
- `CesiumExperience.vue`：空间数据展示入口，点击后才加载 CesiumJS。
- `CesiumGlobe.vue`：Cesium Viewer 生命周期、本地 Natural Earth 图层和城市标注。
- `useSiteInteractions.js`：保留原页面滚动、视差、轮播、终端和交互逻辑。

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

构建输出位于 `dist/`。Cesium 的 `Workers`、`Assets`、`ThirdParty` 和 `Widgets` 会自动复制到 `dist/cesium/`。

## Cesium

Cesium 场景默认使用随包发布的 Natural Earth 图层，不需要 Cesium Ion Token。场景位于 Hero 后的第二屏：桌面端接近该区块时自动懒加载，移动端进入区块后加载；按钮可作为手动启动入口。开发时也可以访问：

```text
/?scene=cesium
```

如果后续需要 3D Tiles、地形或 Ion 资产，可在 `CesiumGlobe.vue` 中配置 Token 和对应 Provider。
