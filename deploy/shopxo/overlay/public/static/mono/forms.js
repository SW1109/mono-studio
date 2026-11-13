(function () {
  "use strict";
  var nextId = 0;

  function passwordButton(button) {
    var field = button.closest(".am-form-input-material,.am-form-group")?.querySelector("input");
    if (!field) return;
    var visible = field.type === "text";
    button.setAttribute("aria-label", visible ? "隐藏密码" : "显示密码");
    button.setAttribute("aria-pressed", String(visible));
    button.title = visible ? "隐藏密码" : "显示密码";
  }

  function enhance(root) {
    var closes = root.querySelectorAll?.("#user-verify-win .am-close") || [];
    closes.forEach(function (button) { button.setAttribute("aria-label", "关闭验证码窗口"); button.title = "关闭验证码窗口"; });
    var groups = [];
    if (root.matches?.(".am-form-input-material,.am-form-group")) groups.push(root);
    groups.push.apply(groups, root.querySelectorAll?.(".am-form-input-material,.am-form-group") || []);
    groups.forEach(function (group) {
      var fields = group.querySelectorAll(":scope > input:not([type=hidden]), :scope > textarea, :scope > select");
      var field = fields.length === 1 ? fields[0] : null;
      var label = group.querySelector(":scope > label");
      if (!field || !label) return;
      if (!field.id) {
        do { nextId += 1; } while (document.getElementById("gn-field-" + nextId));
        field.id = "gn-field-" + nextId;
      }
      label.htmlFor = field.id;
      if (field.required && !label.querySelector(".gn-field-required,.am-form-group-label-tips-must")) {
        var marker = document.createElement("span");
        marker.className = "gn-field-required";
        marker.setAttribute("aria-hidden", "true");
        marker.textContent = "*";
        label.appendChild(marker);
      }
      if (group.closest(".user-form-content-container")) {
        if (field.name === "accounts") {
          field.autocomplete = field.type === "email" ? "email" : "username";
          field.spellcheck = false;
          if (group.closest(".form-validation-sms")) field.inputMode = "tel";
        }
        if (field.name === "pwd") field.autocomplete = group.closest(".user-login-content-container") ? "current-password" : "new-password";
        if (field.name === "verify" && field.type === "number") field.inputMode = "numeric";
      }
      group.querySelectorAll(".eye-submit").forEach(passwordButton);
      group.querySelectorAll(".am-position-verify img").forEach(function (img) {
        img.alt = "图形验证码";
        img.setAttribute("role", "button");
        img.setAttribute("aria-label", "刷新图形验证码");
        img.tabIndex = 0;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.body.classList.contains("gn-themed")) return;
    enhance(document.body);
    // 弹窗内容由原生商城按需插入，只补标签关系与控件说明，不接管提交、验证码或校验规则。
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) { if (node.nodeType === 1) enhance(node); });
      });
    }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", function (event) {
      var button = event.target.closest?.(".eye-submit");
      if (button) requestAnimationFrame(function () { passwordButton(button); });
    });
    document.addEventListener("keydown", function (event) {
      if ((event.key === "Enter" || event.key === " ") && event.target.matches(".am-position-verify img[role=button]")) {
        event.preventDefault();
        event.target.click();
      }
    });
  }, { once: true });
})();
