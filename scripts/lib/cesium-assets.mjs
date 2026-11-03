import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

export function cesiumAssets() {
  let config;
  return {
    name: "studio-cesium-assets",
    configResolved(value) { config = value; },
    configureServer(server) {
      const prefix = `${config.base}cesium/`;
      server.middlewares.use((request, _response, next) => {
        if (request.url?.startsWith(prefix)) request.url = `${config.base}node_modules/cesium/Build/Cesium/${request.url.slice(prefix.length)}`;
        next();
      });
    },
    async writeBundle(options) {
      if (config.build.ssr || !options.dir) return;
      const destination = resolve(options.dir, "cesium");
      await mkdir(destination, { recursive: true });
      await Promise.all(["Workers", "ThirdParty", "Assets", "Widgets"].map(name => cp(resolve(config.root, "node_modules/cesium/Build/Cesium", name), resolve(destination, name), { recursive: true })));
    },
  };
}
