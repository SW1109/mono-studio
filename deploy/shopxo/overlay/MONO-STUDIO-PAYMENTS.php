<?php
/** 由部署账号预建原生支付入口，避免运行时要求整个商城源码目录可写。 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options = getopt('', ['prepare']);
if (!array_key_exists('prepare', $options)) {
    fwrite(STDERR, "用法：php MONO-STUDIO-PAYMENTS.php --prepare\n");
    exit(1);
}
if (!is_file(__DIR__.'/config/database.php')) { throw new RuntimeException('请先完成原生商城安装。'); }
// 与线上根目录入口保持一致；仅准备默认系统的订单通知及回跳，不启用支付插件。
$_SERVER['SCRIPT_NAME'] = '/index.php';
define('IS_ROOT_ACCESS', true);
define('SYSTEM_TYPE', 'default');
require __DIR__.'/public/core.php';
require __DIR__.'/vendor/autoload.php';
(new \think\App())->initialize();
$entries = [];
foreach (['Alipay', 'JeePayAlipay', 'EPayLinksAlipay'] as $payment) {
    $result = \app\service\PaymentService::PaymentEntranceCreated([
        'payment' => $payment,
        'respond' => '/index/order/respond',
        'notify' => '/api/ordernotify/notify',
        'business' => [['name' => 'Order', 'desc' => '订单']],
    ]);
    if ($result['code'] !== 0) { throw new RuntimeException('支付入口准备失败：'.$result['msg']); }
    $checked = \app\service\PaymentService::EntranceFileChecked($payment, 'order');
    if ($checked['code'] !== 0) { throw new RuntimeException('生成后的支付入口文件不完整。'); }
    $entries[$payment] = \app\service\PaymentService::EntranceFileData($payment, 'order');
}
echo json_encode(['entries' => $entries, 'paymentConfigurationChanged' => false], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n";
