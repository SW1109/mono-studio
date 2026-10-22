import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const localChrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
export default defineConfig({
  testDir: "./scripts/browser",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: 0,
  reporter: "list",
  projects: [
    { name: "node", testMatch: "commerce.spec.mjs" },
    { name: "shopxo", testMatch: "shopxo.spec.mjs", use: { baseURL: "http://127.0.0.1:4179" } },
  ],
  use: {
    baseURL: "http://127.0.0.1:4178",
    trace: "retain-on-failure",
    launchOptions: process.platform === "win32" && existsSync(localChrome) ? { executablePath: localChrome } : {},
  },
  webServer: [{
    command: "node scripts/run-with-node.mjs node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4178 --strictPort --mode test",
    url: "http://127.0.0.1:4178",
    reuseExistingServer: false,
    env: { VITE_SHOPXO_ORIGIN: "", VITE_SHOPXO_PRODUCTS: "" },
  }, {
    command: "node scripts/run-with-node.mjs node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4179 --strictPort --mode test",
    url: "http://127.0.0.1:4179",
    reuseExistingServer: false,
    env: { VITE_SHOPXO_ORIGIN: "https://orders.example.com", VITE_SHOPXO_PRODUCTS: JSON.stringify({ "technical-review": 101, "page-improvement": 102, "api-integration": 103 }) },
  }],
});
