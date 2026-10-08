import { ViteSSG } from "vite-ssg";
import App from "./App.vue";
import { routes } from "./routes.js";
import "./styles/main.css";

export const createApp = ViteSSG(App, {
  routes,
  base: import.meta.env.BASE_URL,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, top: 104 };
    return { top: 0 };
  },
});