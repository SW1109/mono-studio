<?php
// +----------------------------------------------------------------------
// | 光年合同项目付款：上传合同、服务端校验金额、订单扩展信息与私有文件下载
// +----------------------------------------------------------------------
namespace app\service;

use think\facade\Db;

class MonoContractService
{
    public const ALIPAY_FEE_BASIS_POINTS = 60;
    private static $config = null;

    public static function Config(): array
    {
        if (self::$config === null) {
            $path = ROOT.'mono-contract-payment.json';
            self::$config = is_file($path) ? (json_decode(file_get_contents($path), true) ?: []) : [];
        }
        return self::$config;
    }

    public static function IsContractGoods($goodsId, $coding = ''): bool
    {
        $config = self::Config();
        // 即使配置缺失，也按商品编码拦截，避免合同商品走 0.01 占位价的普通购买流程。
        if ($coding !== '' && $coding === ($config['coding'] ?? 'CONTRACT_PAY')) {
            return true;
        }
        return !empty($config['goodsId']) && intval($config['goodsId']) === intval($goodsId);
    }

    public static function ValidateAmount($amount): array
    {
        $config = self::Config();
        $min = isset($config['amountMin']) ? (float) $config['amountMin'] : 1.00;
        $max = isset($config['amountMax']) ? (float) $config['amountMax'] : 200000.00;
        if (!is_string($amount) && !is_int($amount) && !is_float($amount)) {
            return DataReturn('请填写合同金额', -1);
        }
        $amount = trim((string) $amount);
        if (!preg_match('/^(?:0|[1-9][0-9]{0,8})(?:\.[0-9]{1,2})?$/D', $amount)) {
            return DataReturn('合同金额格式不正确，最多保留两位小数', -1);
        }
        $cents = (int) round(((float) $amount) * 100);
        $minCents = (int) round($min * 100);
        $maxCents = (int) round($max * 100);
        if ($cents < $minCents || $cents > $maxCents) {
            return DataReturn('合同金额需在 '.number_format($min, 2, '.', '').' 至 '.number_format($max, 2, '.', '').' 元之间', -1);
        }
        return DataReturn('ok', 0, [
            'amount' => number_format($cents / 100, 2, '.', ''),
            'cents'  => $cents,
        ]);
    }

    public static function CalculatePayment($amount): array
    {
        $valid = self::ValidateAmount($amount);
        if ($valid['code'] != 0) {
            return $valid;
        }
        // 按分计算 0.6% 手续费并四舍五入，避免浮点误差影响订单与支付宝实付金额。
        $cents = $valid['data']['cents'];
        $feeCents = intdiv($cents * self::ALIPAY_FEE_BASIS_POINTS + 5000, 10000);
        return DataReturn('ok', 0, $valid['data'] + [
            'fee_basis_points' => self::ALIPAY_FEE_BASIS_POINTS,
            'fee_rate' => number_format(self::ALIPAY_FEE_BASIS_POINTS / 100, 1, '.', '').'%',
            'fee_amount' => number_format($feeCents / 100, 2, '.', ''),
            'payment_amount' => number_format(($cents + $feeCents) / 100, 2, '.', ''),
        ]);
    }

    public static function ValidateUpload(array $file): array
    {
        $config = self::Config();
        $maxBytes = isset($config['maxUploadBytes']) ? (int) $config['maxUploadBytes'] : 10485760;
        $allowed = isset($config['allowedExtensions']) && is_array($config['allowedExtensions']) ? $config['allowedExtensions'] : ['pdf', 'jpg', 'jpeg', 'png'];
        if (empty($file['tmp_name']) || !is_string($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return DataReturn('请上传合同文件', -1);
        }
        $error = intval($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($error !== UPLOAD_ERR_OK) {
            return DataReturn(in_array($error, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? '合同文件超过上传大小限制' : '合同文件上传失败，请重试', -1);
        }
        $size = intval($file['size'] ?? 0);
        if ($size <= 0 || $size > $maxBytes) {
            return DataReturn('合同文件大小需在 1 字节至 '.self::FormatBytes($maxBytes).' 之间', -1);
        }
        $original = basename((string) ($file['name'] ?? ''));
        $original = preg_replace('/[\x00-\x1f\x7f]/u', '', $original);
        $original = mb_substr($original, 0, 120, 'UTF-8');
        $extension = strtolower((string) pathinfo($original, PATHINFO_EXTENSION));
        if ($extension === '' || !in_array($extension, $allowed, true)) {
            return DataReturn('合同文件仅支持 '.implode('、', array_map('strtoupper', $allowed)).' 格式', -1);
        }
        $tmp = (string) $file['tmp_name'];
        $handle = fopen($tmp, 'rb');
        if ($handle === false) {
            return DataReturn('合同文件无法读取', -1);
        }
        $head = fread($handle, 16);
        fclose($handle);
        $magic = false;
        if ($extension === 'pdf' && is_string($head) && str_starts_with($head, '%PDF-')) {
            $magic = 'application/pdf';
        } elseif (in_array($extension, ['jpg', 'jpeg'], true) && is_string($head) && str_starts_with($head, "\xFF\xD8\xFF")) {
            $magic = 'image/jpeg';
        } elseif ($extension === 'png' && is_string($head) && str_starts_with($head, "\x89PNG\r\n\x1A\n")) {
            $magic = 'image/png';
        }
        if ($magic === false) {
            return DataReturn('合同文件内容与扩展名不匹配，请重新选择', -1);
        }
        return DataReturn('ok', 0, ['original'=>$original, 'extension'=>$extension, 'size'=>$size, 'mime'=>$magic]);
    }

    public static function SaveUpload(array $file, array $valid, int $userId): array
    {
        $config = self::Config();
        $storageDir = trim((string) ($config['storageDir'] ?? 'runtime/contracts'), '/');
        $relativeDir = $storageDir.'/'.date('Ym');
        $absoluteDir = ROOT.$relativeDir;
        if (!is_dir($absoluteDir) && !mkdir($absoluteDir, 0750, true) && !is_dir($absoluteDir)) {
            return DataReturn('合同文件目录不可写，请联系工作室', -1);
        }
        $name = bin2hex(random_bytes(16)).'.'.$valid['extension'];
        $absolute = $absoluteDir.'/'.$name;
        if (!move_uploaded_file((string) $file['tmp_name'], $absolute)) {
            return DataReturn('合同文件保存失败，请重试', -1);
        }
        @chmod($absolute, 0640);
        $sha256 = hash_file('sha256', $absolute);
        return DataReturn('ok', 0, [
            'user_id'     => $userId,
            'original'    => $valid['original'],
            'path'        => $relativeDir.'/'.$name,
            'size'        => $valid['size'],
            'mime'        => $valid['mime'],
            'sha256'      => $sha256,
            'created_at'  => time(),
        ]);
    }

    public static function DiscardUpload(array $upload): void
    {
        $path = ROOT.(string) ($upload['path'] ?? '');
        if ($path !== ROOT && is_file($path)) {
            @unlink($path);
        }
    }

    public static function CreateUploadToken(array $upload, string $amount, string $contractNo): string
    {
        $config = self::Config();
        $secret = (string) ($config['downloadSecret'] ?? '');
        if ($secret === '') {
            throw new \RuntimeException('合同付款配置缺少下载密钥');
        }
        $payment = self::CalculatePayment($amount);
        if ($payment['code'] != 0) {
            throw new \RuntimeException($payment['msg']);
        }
        $payload = [
            'user_id'     => intval($upload['user_id']),
            'goods_id'    => intval($config['goodsId'] ?? 0),
            'amount'      => $amount,
            'payment'     => $payment['data'],
            'contract_no' => $contractNo,
            'original'    => $upload['original'],
            'path'        => $upload['path'],
            'size'        => intval($upload['size']),
            'mime'        => $upload['mime'],
            'sha256'      => $upload['sha256'],
            'created_at'  => intval($upload['created_at'] ?? time()),
        ];
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $encoded = rtrim(strtr(base64_encode($json), '+/', '-_'), '=');
        return $encoded.'.'.hash_hmac('sha256', $encoded, $secret);
    }

    public static function ReadUploadToken(string $token, int $userId): array
    {
        $config = self::Config();
        $secret = (string) ($config['downloadSecret'] ?? '');
        $parts = explode('.', $token);
        if ($secret === '' || count($parts) !== 2 || !preg_match('/^[A-Za-z0-9_-]+$/D', $parts[0]) || !preg_match('/^[a-f0-9]{64}$/D', $parts[1])) {
            return DataReturn('合同上传凭据无效，请重新上传', -1);
        }
        if (!hash_equals(hash_hmac('sha256', $parts[0], $secret), $parts[1])) {
            return DataReturn('合同上传凭据校验失败，请重新上传', -1);
        }
        $encoded = strtr($parts[0], '-_', '+/');
        $encoded .= str_repeat('=', (4 - strlen($encoded) % 4) % 4);
        $json = base64_decode($encoded, true);
        $payload = is_string($json) ? json_decode($json, true) : null;
        if (!is_array($payload) || empty($payload['path']) || empty($payload['amount'])) {
            return DataReturn('合同上传凭据内容无效，请重新上传', -1);
        }
        if (intval($payload['user_id']) !== $userId) {
            return DataReturn('合同上传凭据不属于当前账号', -1);
        }
        if (intval($payload['goods_id']) !== intval($config['goodsId'] ?? 0)) {
            return DataReturn('合同上传凭据与合同商品不匹配', -1);
        }
        if (time() - intval($payload['created_at'] ?? 0) > 3600) {
            return DataReturn('合同上传已超过一小时，请重新上传', -1);
        }
        $full = realpath(ROOT.(string) $payload['path']);
        $base = realpath(ROOT.trim((string) ($config['storageDir'] ?? 'runtime/contracts'), '/'));
        if ($full === false || $base === false || !str_starts_with($full, $base.DS) || !is_file($full)) {
            return DataReturn('合同文件不存在或已清理，请重新上传', -1);
        }
        return DataReturn('ok', 0, $payload);
    }

    public static function BuyOverride(array $goods, array $params): array
    {
        if (!self::IsContractGoods($goods['goods_id'] ?? 0, (string) ($goods['coding'] ?? ''))) {
            return DataReturn('ok', 0, $goods);
        }
        $userId = intval($params['user']['id'] ?? 0);
        $token = trim((string) ($params['contract_upload_token'] ?? ''));
        if ($userId <= 0 || $token === '') {
            return DataReturn('合同商品仅支持通过合同付款表单下单', -1);
        }
        $upload = self::ReadUploadToken($token, $userId);
        if ($upload['code'] != 0) {
            return $upload;
        }
        $amount = self::CalculatePayment($params['contract_price'] ?? '');
        if ($amount['code'] != 0) {
            return $amount;
        }
        if (number_format((float) $upload['data']['amount'], 2, '.', '') !== $amount['data']['amount']) {
            return DataReturn('合同金额与上传凭据不一致，请重新提交', -1);
        }
        if (($upload['data']['payment'] ?? null) !== $amount['data']) {
            return DataReturn('支付金额明细已变化，请重新提交合同付款', -1);
        }
        $price = $amount['data']['payment_amount'];
        $goods['price'] = $price;
        $goods['original_price'] = $price;
        $goods['total_price'] = PriceNumberFormat($goods['stock'] * (float) $price);
        if (isset($goods['price_container']) && is_array($goods['price_container'])) {
            $goods['price_container']['price'] = $price;
            $goods['price_container']['original_price'] = $price;
        }
        $goods['mono_contract_upload'] = $upload['data'];
        return DataReturn('ok', 0, $goods);
    }

    public static function AttachToOrder(int $orderId, int $userId, array $upload): void
    {
        $config = self::Config();
        $secret = (string) ($config['downloadSecret'] ?? '');
        if ($secret === '') {
            throw new \RuntimeException('合同付款配置缺少下载密钥');
        }
        $order = Db::name('Order')->where(['id'=>$orderId, 'user_id'=>$userId])->field('id,extension_data')->find();
        if (empty($order)) {
            throw new \RuntimeException('订单不存在或不属于当前账号');
        }
        $extension = empty($order['extension_data']) ? [] : json_decode($order['extension_data'], true);
        if (!is_array($extension)) {
            $extension = [];
        }
        $downloadToken = $orderId.'.'.hash_hmac('sha256', (string) $orderId, $secret);
        $extension[] = [
            'name'       => '合同文件',
            'tips'       => '合同编号：'.(empty($upload['contract_no']) ? '未填写' : $upload['contract_no']).'；文件：'.$upload['original'].'（'.self::FormatBytes(intval($upload['size'])).'）',
            'url'        => MyUrl('index/contract/download', ['token'=>$downloadToken]),
            'business'   => [
                'type'        => 'mono_contract',
                'contract_no' => (string) ($upload['contract_no'] ?? ''),
                'original'    => $upload['original'],
                'path'        => $upload['path'],
                'size'        => intval($upload['size']),
                'mime'        => $upload['mime'],
                'sha256'      => $upload['sha256'],
            ],
            'is_buy_show' => 1,
        ];
        if (!empty($upload['payment'])) {
            $payment = $upload['payment'];
            $extension[] = [
                'name' => '支付金额明细',
                'tips' => '合同金额：'.$payment['amount'].' 元；支付宝手续费（'.$payment['fee_rate'].'）：'.$payment['fee_amount'].' 元；实付金额：'.$payment['payment_amount'].' 元',
                'business' => ['type'=>'mono_contract_payment'] + $payment,
                'is_buy_show' => 1,
            ];
        }
        Db::name('Order')->where(['id'=>$orderId])->update(['extension_data'=>json_encode($extension, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    }

    public static function Download(string $token): void
    {
        $config = self::Config();
        $secret = (string) ($config['downloadSecret'] ?? '');
        $parts = explode('.', $token);
        if ($secret === '' || count($parts) !== 2 || !preg_match('/^[1-9][0-9]{0,18}$/D', $parts[0]) || !preg_match('/^[a-f0-9]{64}$/D', $parts[1]) || !hash_equals(hash_hmac('sha256', $parts[0], $secret), $parts[1])) {
            self::NotFound();
        }
        $orderId = intval($parts[0]);
        $order = Db::name('Order')->where(['id'=>$orderId])->field('id,extension_data')->find();
        if (empty($order) || empty($order['extension_data'])) {
            self::NotFound();
        }
        $extension = json_decode($order['extension_data'], true);
        $file = null;
        if (is_array($extension)) {
            foreach ($extension as $entry) {
                if (isset($entry['business']['type']) && $entry['business']['type'] === 'mono_contract' && !empty($entry['business']['path'])) {
                    $file = $entry['business'];
                    break;
                }
            }
        }
        if (empty($file)) {
            self::NotFound();
        }
        $full = realpath(ROOT.(string) $file['path']);
        $base = realpath(ROOT.trim((string) ($config['storageDir'] ?? 'runtime/contracts'), '/'));
        if ($full === false || $base === false || !str_starts_with($full, $base.DS) || !is_file($full)) {
            self::NotFound();
        }
        $mime = (string) ($file['mime'] ?? 'application/octet-stream');
        if (!in_array($mime, ['application/pdf', 'image/jpeg', 'image/png'], true)) {
            $mime = 'application/octet-stream';
        }
        $original = (string) ($file['original'] ?? 'contract');
        header('Content-Type: '.$mime);
        header('Content-Disposition: attachment; filename="contract"; filename*=UTF-8\'\''.rawurlencode($original));
        header('Content-Length: '.filesize($full));
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: private, no-store');
        readfile($full);
        exit;
    }

    public static function FormatBytes(int $bytes): string
    {
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 1, '.', '').' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 1, '.', '').' KB';
        }
        return $bytes.' B';
    }

    private static function NotFound(): void
    {
        http_response_code(404);
        exit('合同文件不存在或链接已失效');
    }
}
