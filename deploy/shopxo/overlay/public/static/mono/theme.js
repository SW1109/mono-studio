(function () {
  "use strict";
  var key = "guangnian-theme";
  var root = document.documentElement;
  var system = window.matchMedia("(prefers-color-scheme: dark)");
  var preference = "system";
  function normalize(value) {
    return value === "light" || value === "dark" ? value : "system";
  }
  try { preference = normalize(localStorage.getItem(key)); } catch (_) { /* 隐私模式下仍可在本页切换。 */ }
  function apply() {
    var theme = preference === "system" ? (system.matches ? "dark" : "light") : preference;
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    root.style.colorScheme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#07060b" : "#faf9fc";
    document.querySelectorAll("[data-theme-choice]").forEach(function (input) {
      input.checked = input.value === preference;
    });
    window.dispatchEvent(new CustomEvent("mono-theme-change", { detail: { theme: theme, preference: preference } }));
  }
  // 在样式和应用加载前确定主题，预渲染页面也不会先闪成另一种颜色。
  apply();
  system.addEventListener("change", function () { if (preference === "system") apply(); });
  window.addEventListener("storage", function (event) {
    if (event.key === key || event.key === null) { preference = normalize(event.newValue); apply(); }
  });
  document.addEventListener("DOMContentLoaded", apply, { once: true });
  window.addEventListener("mono-theme-ready", apply);
  document.addEventListener("change", function (event) {
    var input = event.target;
    if (!input.matches("[data-theme-choice]")) return;
    preference = normalize(input.value);
    try { localStorage.setItem(key, preference); } catch (_) {}
    apply();
  });
  document.addEventListener("click", function (event) {
    document.querySelectorAll(".theme-picker[open]").forEach(function (picker) {
      if (!picker.contains(event.target)) picker.open = false;
    });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".theme-picker[open]").forEach(function (picker) {
      picker.open = false;
      picker.querySelector("summary").focus();
    });
  });
})();
