(function () {
  "use strict";
  var root = document.documentElement;
  // 亮色及跟随系统暂时停用，忽略旧偏好，官网与商城统一使用暗色。
  function apply() {
    root.dataset.theme = "dark";
    root.dataset.themePreference = "dark";
    root.style.colorScheme = "dark";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = "#08090b";
    window.dispatchEvent(new CustomEvent("mono-theme-change", { detail: { theme: "dark", preference: "dark" } }));
  }
  // 在样式和应用加载前确定主题，预渲染页面也不会先闪成另一种颜色。
  apply();
  document.addEventListener("DOMContentLoaded", apply, { once: true });
})();
