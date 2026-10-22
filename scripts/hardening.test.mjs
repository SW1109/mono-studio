import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, writeFile, access, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { notificationGuard, clientAddress } from "../server/rate-limit.mjs";
import { applyUnifiedPatch } from "./lib/unified-patch.mjs";
import { commerceRequest } from "../src/api/commerce.js";
import { paymentConfig } from "../server/config.mjs";
import { createCommerceServer } from "../server/app.mjs";
import { phpBinary, inspectPhpRuntime } from "./lib/php-runtime.mjs";

test("PHP 安全版本策略、Composer 约束及部署检查文件的摘要保持一致", async () => {
  const policy = JSON.parse(await readFile("deploy/shopxo/php-security-policy.json", "utf8"));
  const composer = JSON.parse(await readFile("deploy/shopxo/dependencies/composer.json", "utf8"));
  const dependencies = JSON.parse(await readFile("deploy/shopxo/dependencies/composer.lock", "utf8"));
  assert.equal(composer.require.php, policy.composerConstraint);
  assert.equal(dependencies.platform.php, policy.composerConstraint);
  const lock = JSON.parse(await readFile("deploy/shopxo/upstream.lock.json", "utf8"));
  for (const [path, digest] of Object.entries(lock.runtimeFiles)) {
    assert.equal(createHash("sha256").update(await readFile(join("deploy/shopxo", path))).digest("hex"), digest, path);
  }
});

test("缺失或无效 PHP 检查不能被当成已通过版本基线", () => {
  const missing = join(tmpdir(), "mono-php-not-installed", "php");
  assert.throws(() => inspectPhpRuntime(missing), /无法检查 PHP/);
  assert.deepEqual(inspectPhpRuntime(missing, { allowMissing: true }), { status: "not-run-php-unavailable", webWorkersVerified: false });
  assert.throws(() => inspectPhpRuntime(process.execPath, { allowMissing: true }), /没有返回有效结果/);
});

test("PHP 检查拒绝所有受影响补丁版本和预发行版，各支持分支独立判断", t => {
  const php = phpBinary();
  const available = spawnSync(php, ["--version"], { encoding: "utf8", windowsHide: true });
  if (available.error?.code === "ENOENT") { t.skip("本机未安装 PHP，由订单中心 CI 执行。"); return; }
  const program = String.raw`
    require 'deploy/shopxo/php-runtime-check.php';
    $policy = json_decode(file_get_contents('deploy/shopxo/php-security-policy.json'), true);
    $cases = [
      '7.4.33' => false, '8.2.35' => false,
      '8.3.0' => false, '8.3.8' => false, '8.3.35' => false, '8.3.36' => true, '8.3.37' => true,
      '8.4.26' => false, '8.4.27' => true, '8.4.28' => true,
      '8.5.11' => false, '8.5.12' => true, '8.5.13' => true,
      '8.3.36-1+deb12u1' => true, '8.3.36RC1' => false, '8.3.36-dev' => false,
      '8.5.12-beta1' => false, '8.6.0' => false, '8.3.36 bad' => false, '' => false,
    ];
    foreach ($cases as $version => $expected) {
      if ((monoPhpVersionAssessment($version, $policy)['status'] === 'passed') !== $expected) {
        fwrite(STDERR, 'Wrong PHP version decision: '.$version); exit(1);
      }
    }
    foreach (['0', 'off', '', false] as $disabled) {
      if (monoPhpHardeningAssessment(['session.upload_progress.enabled' => $disabled, 'fatal_error_backtraces' => $disabled], '8.5.12')) exit(2);
    }
    if (count(monoPhpHardeningAssessment(['session.upload_progress.enabled' => '1', 'fatal_error_backtraces' => '1'], '8.5.12')) !== 2) exit(3);
    echo count($cases).' PHP version boundaries checked';
  `;
  const result = spawnSync(php, ["-r", program], { encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  t.diagnostic(result.stdout);
});

test("生产 PHP 配置关闭受影响功能，检查明确区分 CLI 与网站进程", t => {
  const result = spawnSync(phpBinary(), ["-c", "deploy/shopxo/php-production.ini", "deploy/shopxo/php-runtime-check.php", "--json", "--require-hardening"], { encoding: "utf8", windowsHide: true });
  if (result.error?.code === "ENOENT") { t.skip("本机未安装 PHP，由订单中心 CI 执行。"); return; }
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "passed");
  assert.equal(report.configuration["session.upload_progress.enabled"], "0");
  assert.deepEqual(report.hardeningIssues, []);
  assert.equal(report.sapi, "cli");
  assert.equal(report.webWorkersVerified, false);
  const unsafe = spawnSync(phpBinary(), ["-c", "deploy/shopxo/php-production.ini", "-d", "session.upload_progress.enabled=1", "deploy/shopxo/php-runtime-check.php", "--json", "--require-hardening"], { encoding: "utf8", windowsHide: true });
  assert.equal(unsafe.status, 1, unsafe.stdout + unsafe.stderr);
  assert.equal(JSON.parse(unsafe.stdout).status, "rejected");
});

test("回调具有独立 IP、全局与并发预算，释放幂等且窗口可恢复", () => {
  let time = 0;
  const admit = notificationGuard({ perMinute: 2, globalPerMinute: 3, concurrency: 1, now: () => time });
  const release = admit("a");
  assert.throws(() => admit("b"), error => error.status === 429);
  release(); release();
  admit("a")();
  assert.throws(() => admit("a"), error => error.status === 429);
  admit("b")();
  assert.throws(() => admit("c"), error => error.status === 429);
  time = 60000;
  admit("a")();
  assert.equal(clientAddress({ socket: { remoteAddress: "203.0.113.1" }, headers: { "x-real-ip": "192.0.2.1" } }, true), "203.0.113.1");
  assert.equal(clientAddress({ socket: { remoteAddress: "127.0.0.1" }, headers: { "x-real-ip": "bad,ip" } }, true), "127.0.0.1");
});

test("无效回调达到独立限流后返回可重试失败，普通目录仍可访问", async () => {
  let verifications = 0;
  const provider = { verifyNotification() { verifications++; return false; } };
  const server = createCommerceServer({ ...paymentConfig({}), database: ":memory:" }, { provider });
  await new Promise(done => server.listen(0, "127.0.0.1", done));
  const base = `http://127.0.0.1:${server.address().port}/api/commerce`;
  try {
    for (let i = 0; i < 240; i++) {
      const response = await fetch(base + "/alipay/notify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "sign=invalid" });
      assert.equal(response.status, 200);
      assert.equal(await response.text(), "failure");
    }
    const blocked = await fetch(base + "/alipay/notify", { method: "POST" });
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get("retry-after"), "60");
    assert.equal(verifications, 240);
    assert.equal((await fetch(base + "/catalog")).status, 200);
  } finally { await new Promise(done => server.close(done)); }
});

test("订单 POST 超时只发送一次、保留幂等标识，调用方取消原因保持不变", async t => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    calls++;
    assert.equal(options.headers["Idempotency-Key"], "same-key-for-retry");
    return new Promise((_done, reject) => {
      if (options.signal.aborted) reject(options.signal.reason);
      else options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
    });
  });
  await assert.rejects(commerceRequest("/orders", { method: "POST", body: {}, idempotencyKey: "same-key-for-retry", timeoutMs: 10 }), error => error.code === "TIMEOUT");
  assert.equal(calls, 1);
  const controller = new AbortController(), reason = new Error("user navigation");
  controller.abort(reason);
  await assert.rejects(commerceRequest("/orders", { signal: controller.signal, idempotencyKey: "same-key-for-retry" }), error => error === reason);
});

test("网关 HTML、损坏 JSON 与字段错误返回可理解的订单错误", async t => {
  let response;
  t.mock.method(globalThis, "fetch", async () => response);
  for (const body of ["<html>upstream error</html>", "{broken", "null", "[]"]) {
    response = new Response(body, { headers: { "Content-Type": "application/json" } });
    await assert.rejects(commerceRequest("/catalog"), /订单服务暂时不可用/);
  }
  response = new Response(JSON.stringify({ error: "请检查信息", fields: { email: "邮箱无效" } }), { status: 422, headers: { "Content-Type": "application/json" } });
  await assert.rejects(commerceRequest("/orders"), error => error.status === 422 && error.fields.email === "邮箱无效");
});

test("固定补丁支持多文件和 CRLF，拒绝越界、重复与部分写入", async () => {
  const root = await mkdtemp(join(tmpdir(), "mono-patch-test-"));
  const patch = "--- a/a.php\n+++ b/a.php\n@@ -1,2 +1,2 @@\n one\n-two\n+changed\n";
  try {
    await writeFile(join(root, "a.php"), "one\r\ntwo\r\n");
    await applyUnifiedPatch(root, patch);
    assert.equal(await readFile(join(root, "a.php"), "utf8"), "one\r\nchanged\r\n");
    await writeFile(join(root, "a.php"), "one\ntwo");
    await assert.rejects(applyUnifiedPatch(root, patch + patch), /重复/);
    assert.equal(await readFile(join(root, "a.php"), "utf8"), "one\ntwo");
    for (const path of ["../outside.php", "/outside.php", "a/../../outside.php", "C:/outside.php"]) {
      await assert.rejects(applyUnifiedPatch(root, patch.replaceAll("a.php", path)));
    }
    await assert.rejects(applyUnifiedPatch(root, patch + "--- a/missing.php\n+++ b/missing.php\n@@ -1 +1 @@\n-x\n+y\n"));
    assert.equal(await readFile(join(root, "a.php"), "utf8"), "one\ntwo");
    await assert.rejects(applyUnifiedPatch(root, patch.replace(" one", " wrong")), /上下文不匹配/);
    await applyUnifiedPatch(root, patch);
    assert.equal(await readFile(join(root, "a.php"), "utf8"), "one\nchanged");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("ShopXO 扩展均有内容摘要，生成目录可用时验证最终 PHP 文件并执行边界测试", async t => {
  const lock = JSON.parse(await readFile("deploy/shopxo/upstream.lock.json", "utf8"));
  for (const [path, digest] of Object.entries(lock.overlays)) {
    assert.equal(createHash("sha256").update(await readFile(join("deploy/shopxo/overlays", path))).digest("hex"), digest, path);
  }
  const php = phpBinary();
  const available = spawnSync(php, ["--version"], { encoding: "utf8", windowsHide: true });
  if (available.error?.code === "ENOENT") { t.diagnostic("本机无 PHP；完整检查通过 npm run test:shopxo 执行。摘要检查已通过。"); return; }
  assert.equal(available.status, 0);
  const root = resolve(process.env.SHOPXO_SOURCE || "artifacts/order-center/shopxo");
  try { await access(join(root, "extend/payment/Alipay.php")); }
  catch { t.diagnostic("当前只执行扩展函数测试；生成源码的完整检查由 npm run test:shopxo 强制执行。"); }
  const result = spawnSync(php, ["scripts/shopxo-guard.test.php", root], { encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  t.diagnostic(result.stdout.trim());
});
