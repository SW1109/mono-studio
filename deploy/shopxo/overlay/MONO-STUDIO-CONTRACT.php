<?php
/** 显式创建“合同项目付款”虚拟商品；不修改账号、订单或支付配置，不开启收款。 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options = getopt('', ['apply', 'backup:']);
$apply = array_key_exists('apply', $options);
$root = __DIR__;
$configPath = $root.'/mono-contract-payment.json';
$site = json_decode(file_get_contents($root.'/mono-site-navigation.json'), true, 512, JSON_THROW_ON_ERROR);
$database = require $root.'/config/database.php';
$c = $database['connections']['mysql'];
$prefix = $c['prefix'];
if (!preg_match('/^[a-zA-Z0-9_]+$/', $prefix)) { throw new RuntimeException('不支持的表前缀。'); }
$db = new PDO('mysql:host='.$c['hostname'].';port='.$c['hostport'].';dbname='.$c['database'].';charset=utf8mb4', $c['username'], $c['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$website = 'https://guangnian.xin';
$websiteRow = $db->query("SELECT `value` FROM `{$prefix}config` WHERE `only_tag`='mono_website_origin' LIMIT 1")->fetchColumn();
if (is_string($websiteRow) && preg_match('/^https:\/\/[a-z0-9.-]+$/i', $websiteRow)) { $website = rtrim($websiteRow, '/'); }
$e = fn($text) => htmlspecialchars((string) $text, ENT_QUOTES, 'UTF-8');
$lookup = $db->prepare('SELECT * FROM `'.$prefix.'goods` WHERE coding=? ORDER BY id');
$lookup->execute(['CONTRACT_PAY']);
$matches = $lookup->fetchAll(PDO::FETCH_ASSOC);
if (count($matches) > 1) { throw new RuntimeException('合同商品编码重复，请先人工核对。'); }
$existing = $matches[0] ?? null;
if ($existing && ((int) $existing['is_exist_many_spec'] !== 0 || (int) $existing['is_delete_time'] !== 0)) {
    throw new RuntimeException('合同商品已有多规格或已删除，请先人工核对。');
}
$plan = [
    'action' => $existing ? 'reuse' : 'create',
    'id' => $existing ? (int) $existing['id'] : null,
    'title' => '合同项目付款',
    'coding' => 'CONTRACT_PAY',
    'siteType' => 3,
    'placeholderPrice' => '0.01',
    'note' => '实际订单金额由合同付款表单在服务端校验后写入；不通过标准商品购买流程下单。',
];
if (!$apply) {
    echo json_encode(['mode'=>'check','database'=>$c['database'],'plan'=>$plan,'configExists'=>is_file($configPath),'paymentConfigurationChanged'=>false], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n";
    exit;
}
$backup = $options['backup'] ?? '';
if (!is_file($backup) || filesize($backup) < 32 || file_get_contents($backup, false, null, 0, 2) !== "\x1f\x8b") {
    throw new RuntimeException('正式维护必须提供本次有效的 SQL gzip 备份：--apply --backup=/private/database.sql.gz');
}
$backupHandle = gzopen($backup, 'rb');
if ($backupHandle === false || gzread($backupHandle, 256) === '') { throw new RuntimeException('SQL 备份无法解压读取。'); }
gzclose($backupHandle);
$now = time();
$insert = function (string $table, array $row) use ($db, $prefix): int {
    $fields = array_keys($row);
    $db->prepare('INSERT INTO `'.$prefix.$table.'` (`'.implode('`,`', $fields).'`) VALUES ('.implode(',', array_fill(0, count($fields), '?')).')')->execute(array_values($row));
    return (int) $db->lastInsertId();
};
$content = '<article class="gn-service-details gn-contract-details"><header><p class="gn-detail-kicker">合同项目付款 · 远程人工服务</p><h2>按合同约定金额付款</h2><p>适用于已确认合作内容与金额的项目。请先登录账号，上传双方确认的合同，填写合同编号与金额，再进入支付宝收银台。</p></header><dl class="gn-detail-facts"><div><dt>付款方式</dt><dd>支付宝电脑网站支付（费率 0.6%）</dd></div><div><dt>金额来源</dt><dd>合同金额加支付宝手续费</dd></div><div><dt>合同文件</dt><dd>PDF / JPG / PNG，最大 10MB</dd></div></dl><section><h3>付款步骤</h3><ol class="gn-delivery-list"><li><span>01</span><p>登录商城账号，打开本商品详情页。</p></li><li><span>02</span><p>上传双方确认的合同文件，填写合同编号与付款金额。</p></li><li><span>03</span><p>核对合同金额、手续费与实付金额后提交，进入支付宝收银台完成付款。</p></li><li><span>04</span><p>工作室核验合同与到账结果后，按合同约定安排履约。</p></li></ol></section><section><h3>金额与核验</h3><p>本商品不按页面标价销售，页面展示的 0.01 元仅为系统占位。请填写与合同一致的金额；支付宝费率为 0.6%，手续费按输入金额计算并四舍五入到分，实付金额为合同金额加手续费。例如输入 100.00 元，手续费 0.60 元，实付 100.60 元。金额必须落在系统允许的范围内；填写错误或与合同不一致时，工作室可以暂停履约、联系更正或按原路退款。</p></section><section><h3>合同文件使用</h3><p>合同文件仅用于本次交易核验，保存在非公开目录，不通过网页目录直接访问。订单详情页提供带签名的下载入口。请勿上传与本次交易无关的密码、密钥或其他敏感信息。</p></section><section><h3>支付结果</h3><p>支付结果以支付宝异步通知或交易查询结果为准，浏览器跳转仅作提示。未确认到账前，请不要重复付款；如已付款但订单状态未更新，请先联系工作室核对。</p></section><section><h3>售后与退款</h3><p>尚未开始履约且合同未进入执行阶段时，可按服务条款申请取消；已发生的工作按合同约定结算。退款原路退回，具体到账时间以支付宝为准。</p></section><footer><p>服务提供方：'.$e($site['name'] ?? '光年数智网络科技工作室').'</p><p>邮箱：<a href="mailto:'.$e($site['email'] ?? '').'">'.$e($site['email'] ?? '').'</a> · 微信：'.$e($site['wechat'] ?? '').'</p><p>下单前请确认合同主体、金额、服务范围与排期。本商品不代表对合同内容或履约结果的额外担保。</p><a href="'.$e($website).'/service-terms/">阅读服务条款与隐私说明 ↗</a></footer></article>';
$image = '/static/mono/contract-payment.webp';
$row = [
    'title' => '合同项目付款',
    'simple_desc' => '上传合同并填写约定金额，支付宝费率 0.6%，实付为合同金额加手续费。',
    'spec_desc' => '合同约定金额 · 远程人工服务',
    'coding' => 'CONTRACT_PAY',
    'site_type' => 3,
    'images' => $image,
    'share_images' => $image,
    'price' => '0.01',
    'min_price' => '0.01',
    'max_price' => '0.01',
    'original_price' => '',
    'min_original_price' => '0.00',
    'max_original_price' => '0.00',
    'inventory' => 1,
    'inventory_unit' => '份',
    'is_deduction_inventory' => 0,
    'buy_min_number' => 1,
    'buy_max_number' => 1,
    'is_shelves' => 1,
    'content_web' => $content,
    'seo_title' => '合同项目付款 | 光年数智',
    'seo_keywords' => '合同付款,项目付款,支付宝网页支付',
    'seo_desc' => '上传合同、填写约定金额并完成支付宝付款；金额与合同核验后安排履约。',
    'sort_level' => 1001,
    'upd_time' => $now,
];
try {
    $db->beginTransaction();
    $protected = [];
    foreach (['user', 'order', 'payment'] as $table) {
        $protected[$table] = hash('sha256', json_encode($db->query('SELECT * FROM `'.$prefix.$table.'` ORDER BY id')->fetchAll(PDO::FETCH_ASSOC)));
    }
    $categoryName = '合同与定制';
    $findCategory = $db->prepare('SELECT id FROM `'.$prefix.'goods_category` WHERE pid=0 AND name=? LIMIT 1');
    $findCategory->execute([$categoryName]);
    $categoryId = $findCategory->fetchColumn();
    if (!$categoryId) {
        $categoryId = $insert('goods_category', ['name'=>$categoryName,'vice_name'=>'按合同约定金额付款','is_home_recommended'=>1,'is_enable'=>1,'sort'=>101,'add_time'=>$now,'upd_time'=>$now]);
    }
    $categoryId = (int) $categoryId;
    if ($existing) {
        $goodsId = (int) $existing['id'];
    } else {
        $goodsId = $insert('goods', $row + ['add_time'=> $now]);
    }
    $join = $db->prepare('SELECT id FROM `'.$prefix.'goods_category_join` WHERE goods_id=? AND category_id=? LIMIT 1');
    $join->execute([$goodsId, $categoryId]);
    if (!$join->fetchColumn()) {
        $insert('goods_category_join', ['goods_id'=>$goodsId,'category_id'=>$categoryId,'add_time'=>$now]);
    }
    $photos = $db->query('SELECT id FROM `'.$prefix.'goods_photo` WHERE goods_id='.$goodsId.' ORDER BY id')->fetchAll(PDO::FETCH_COLUMN);
    if (!$photos) {
        $insert('goods_photo', ['goods_id'=>$goodsId,'images'=>$image,'is_show'=>1,'add_time'=>$now]);
        $db->prepare('UPDATE `'.$prefix.'goods` SET photo_count=1 WHERE id=?')->execute([$goodsId]);
    }
    $specs = $db->query('SELECT id FROM `'.$prefix.'goods_spec_base` WHERE goods_id='.$goodsId.' ORDER BY id')->fetchAll(PDO::FETCH_COLUMN);
    if (count($specs) > 1) { throw new RuntimeException('合同商品存在额外规格，停止操作。'); }
    $spec = ['price'=>'0.01','original_price'=>'0.00','inventory'=>1,'buy_min_number'=>1,'buy_max_number'=>1,'inventory_unit'=>'份'];
    if ($specs) {
        // 保留商家已维护的价格与库存；仅在缺失规格时创建。
    } else {
        $insert('goods_spec_base', $spec + ['goods_id'=>$goodsId,'add_time'=>$now]);
    }
    foreach (['付款方式'=>'合同约定金额','合同文件'=>'PDF/JPG/PNG，最大 10MB','到账确认'=>'以支付宝异步通知或交易查询为准','履约安排'=>'合同核验后联系确认'] as $name=>$value) {
        $key = md5('mono-contract-'.$name);
        $find = $db->prepare('SELECT id FROM `'.$prefix.'goods_params` WHERE goods_id=? AND md5_key=? LIMIT 1');
        $find->execute([$goodsId, $key]);
        if (!$find->fetchColumn()) {
            $insert('goods_params', ['goods_id'=>$goodsId,'scope'=>1,'name'=>$name,'value'=>$value,'md5_key'=>$key,'add_time'=>$now]);
        }
    }
    foreach ($protected as $table => $digest) {
        if (hash('sha256', json_encode($db->query('SELECT * FROM `'.$prefix.$table.'` ORDER BY id')->fetchAll(PDO::FETCH_ASSOC))) !== $digest) {
            throw new RuntimeException('受保护的数据发生变化，事务已停止：'.$table);
        }
    }
    $db->commit();
} catch (Throwable $error) {
    if ($db->inTransaction()) { $db->rollBack(); }
    throw $error;
}
$current = is_file($configPath) ? json_decode(file_get_contents($configPath), true) : [];
$secret = is_array($current) && !empty($current['downloadSecret']) ? (string) $current['downloadSecret'] : bin2hex(random_bytes(32));
$configData = [
    'version' => 1,
    'goodsId' => $goodsId,
    'coding' => 'CONTRACT_PAY',
    'amountMin' => 1.00,
    'amountMax' => 200000.00,
    'maxUploadBytes' => 10485760,
    'allowedExtensions' => ['pdf','jpg','jpeg','png'],
    'storageDir' => 'runtime/contracts',
    'downloadSecret' => $secret,
    'preparedAt' => date(DATE_ATOM),
];
file_put_contents($configPath, json_encode($configData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n");
@chmod($configPath, 0640);
$receipt = [
    'goodsId' => $goodsId,
    'coding' => 'CONTRACT_PAY',
    'action' => $plan['action'],
    'appliedAt' => date(DATE_ATOM),
    'backupSha256' => hash_file('sha256', $backup),
    'configSha256' => hash_file('sha256', $configPath),
    'paymentConfigurationChanged' => false,
    'userAndOrderDataPreserved' => true,
];
$marker = $root.'/runtime/mono-studio-contract.json';
if (file_put_contents($marker, json_encode($receipt, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n") === false) {
    throw new RuntimeException('商品已保存，但运行记录写入失败，请核对运行目录权限。');
}
echo json_encode($receipt, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n";
