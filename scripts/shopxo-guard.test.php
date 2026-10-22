<?php
// Pure PHP boundary tests. Test keys only; never reaches a payment gateway.
$root = $argv[1] ?? '';
$cutoff = 1000;
function config($name, $default = null) { global $cutoff; return $name === 'mono_payment.refund_v2_from' ? $cutoff : $default; }
require __DIR__.'/../deploy/shopxo/overlays/extend/mono/PaymentGuard.php';
use mono\PaymentGuard;
$checks = 0;
function check($value, $label) { global $checks; $checks++; if(!$value) throw new \RuntimeException($label); }
function rejects($operation) { try { $operation(); } catch(\Throwable $error) { return true; } return false; }
check(PaymentGuard::cents('299.00') === 29900, 'integer cents');
check(PaymentGuard::cents(0.29) === 29, 'database float precision');
foreach(['1.001', '-1', '1e3', '', null, true, '9999999999', [], INF, 1.001] as $bad) check(rejects(fn()=>PaymentGuard::cents($bad)), 'invalid amount');
check(!PaymentGuard::sameAmount('299', '299.01') && !PaymentGuard::sameAmount('0', '0'), 'strict positive equality');
$params = ['order_no'=>'PAY1', 'trade_no'=>'TRADE1', 'refund_price'=>'100.00', 'aftersale'=>['id'=>1,'add_time'=>1001]];
$id = PaymentGuard::refundRequestId($params);
check($id === PaymentGuard::refundRequestId($params) && strlen($id) === 64, 'retry identity');
$second = $params; $second['aftersale']['id'] = 2;
check($id !== PaymentGuard::refundRequestId($second), 'same-amount distinct refunds');
$legacy = $params; $legacy['aftersale']['add_time'] = 999;
check(rejects(fn()=>PaymentGuard::refundRequestId($legacy)), 'legacy uncertain refund must not get a new ID');
check(PaymentGuard::refundMatches(['out_trade_no'=>'PAY1','trade_no'=>'TRADE1','refund_fee'=>'100'], $params), 'refund receipt');
foreach(['out_trade_no'=>'OTHER', 'trade_no'=>'OTHER', 'refund_fee'=>'99.99'] as $key=>$value) {
    $receipt = ['out_trade_no'=>'PAY1','trade_no'=>'TRADE1','refund_fee'=>'100']; $receipt[$key] = $value;
    check(!PaymentGuard::refundMatches($receipt, $params), 'refund binding');
}
$raw = '{ "code": "10000", "text": "中文 } \\" {", "nested": [1,{"a":2}] }';
$json = '{"result":'.$raw.',"sign":"test"}';
check(PaymentGuard::signedObject($json, 'result') === $raw, 'original signed bytes');
foreach(['{"result":{},"result":{}}', '{"result":{},"r\u0065sult":{}}', '{"result":{},}', '{"result":{}} trailing', '{"result":[]}', '{"nested":{"result":{}}}', '{"result":', str_repeat('a', 262145)] as $bad) {
    check(rejects(fn()=>PaymentGuard::signedObject($bad, 'result')), 'malformed envelope');
}
if($root && is_file($root.'/extend/payment/Alipay.php')) {
    require $root.'/extend/payment/Alipay.php';
    $options = ['private_key_bits'=>2048, 'private_key_type'=>OPENSSL_KEYTYPE_RSA];
    $opensslConfig = dirname(PHP_BINARY).'/extras/ssl/openssl.cnf';
    if(is_file($opensslConfig)) $options['config'] = $opensslConfig;
    $key = openssl_pkey_new($options);
    check($key !== false, 'test RSA key generation');
    $public = openssl_pkey_get_details($key)['key'];
    // Plugin accepts base64 DER content in its existing backoffice fields.
    $public = preg_replace('/-----[^-]+-----|\s/', '', $public);
    $provider = new \payment\Alipay(['out_rsa_public'=>$public]);
    $method = new \ReflectionMethod($provider, 'SyncRsaVerify');
    openssl_sign($raw, $signature, $key, OPENSSL_ALGO_SHA256);
    $envelope = ['result'=>json_decode($raw, true, 512, JSON_THROW_ON_ERROR), 'sign'=>base64_encode($signature), '_mono_raw_response'=>$json];
    check($method->invoke($provider, $envelope, 'result') === true, 'raw RSA signature');
    $envelope['result']['code'] = '40004';
    check($method->invoke($provider, $envelope, 'result') === false, 'consumed data must equal signed data');
}
echo "PHP payment guard: {$checks} checks passed\n";
