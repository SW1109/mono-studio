(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var body = document.body;
    if (!body.classList.contains("index-order-index")) return;
    var table = document.querySelector(".form-table-data-list");
    var controls = document.querySelector(".gn-order-view");
    if (!table || !controls) return;
    // 从原生表头读取字段标识，保留筛选、分页、批量付款和操作按钮的原有节点。
    var keys = Array.from(table.querySelectorAll("thead th")).map(function (head) {
      var name = Array.from(head.classList).find(function (value) { return value.indexOf("form-table-search-item-head-value-") === 0; });
      var key = name ? name.slice("form-table-search-item-head-value-".length) : "";
      head.dataset.orderColumn = key;
      return { key: key, label: head.querySelector(".am-text-left")?.textContent.trim() || "" };
    });
    table.querySelectorAll("tbody tr").forEach(function (row) {
      Array.from(row.children).forEach(function (cell, index) {
        cell.dataset.orderColumn = keys[index]?.key || "";
        cell.dataset.orderLabel = keys[index]?.label || "";
      });
    });
    body.dataset.orderView = "list";
    controls.hidden = false;
    controls.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-order-view]");
      if (!button) return;
      body.dataset.orderView = button.dataset.orderView;
      controls.querySelectorAll("button").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); });
      window.dispatchEvent(new Event("resize"));
    });
    // 字段设置面向完整明细表；打开时同步到明细视图，避免设置已选列却看不到。
    document.querySelector('[data-am-modal*="form-table-fields-popup"]')?.addEventListener("click", function () {
      controls.querySelector('[data-order-view="table"]').click();
    });
  }, { once: true });
})();
