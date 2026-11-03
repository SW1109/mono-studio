<?php
/** 显式维护工作室服务目录；保留商品 ID、账号、订单、真实统计和支付参数。 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options = getopt('', ['apply', 'backup:']);
$apply = array_key_exists('apply', $options);
$root = __DIR__;
$source = $root.'/mono-service-catalog.json';
$catalogue = json_decode(file_get_contents($source), true, 512, JSON_THROW_ON_ERROR);
$site = json_decode(file_get_contents($root.'/mono-site-navigation.json'), true, 512, JSON_THROW_ON_ERROR);
$sourceHash = hash_file('sha256', $source);
$marker = $root.'/runtime/mono-studio-catalog.json';
if (is_file($marker)) {
    $previous = json_decode(file_get_contents($marker), true, 512, JSON_THROW_ON_ERROR);
    if (($previous['sourceSha256'] ?? '') === $sourceHash) {
        echo json_encode(['alreadyApplied'=>true,'products'=>$previous['products'],'merchantEditsPreserved'=>true], JSON_UNESCAPED_UNICODE)."\n";
        exit;
    }
}
if (empty($catalogue['catalogVersion']) || empty($catalogue['services']) || !is_array($catalogue['services'])) { throw new RuntimeException('服务目录缺少版本或商品。'); }
$ids = [];
foreach ($catalogue['services'] as $service) {
    if (!preg_match('/^[a-z][a-z0-9-]{2,60}$/', $service['id'] ?? '') || isset($ids[$service['id']])) { throw new RuntimeException('服务标识重复或格式错误。'); }
    $ids[$service['id']] = true;
    // 上限来自当前 ShopXO 商品表的字符列定义，金额对应 decimal(10,2)。
    foreach (['name'=>160,'summary'=>230,'category'=>60,'period'=>230,'keywords'=>130] as $field=>$limit) {
        if (!is_string($service[$field] ?? null) || $service[$field] === '' || mb_strlen($service[$field], 'UTF-8') > $limit) { throw new RuntimeException('商品字段不符合数据库约束：'.$field); }
    }
    if (!preg_match('/^(?:0|[1-9][0-9]{0,7})\.[0-9]{2}$/', $service['price'] ?? '') || (float)$service['price'] <= 0) { throw new RuntimeException('商品价格必须是大于零且保留两位小数的金额。'); }
    foreach (['scope','delivery','exclusions','preparation','acceptance','caption'] as $field) {
        if (!is_string($service[$field] ?? null) || $service[$field] === '') { throw new RuntimeException('缺少服务说明：'.$field); }
    }
    if (empty($service['deliverables']) || !is_array($service['deliverables']) || array_filter($service['deliverables'], fn($value) => !is_string($value) || $value === '')) { throw new RuntimeException('交付清单不能为空。'); }
    if (!is_file($root.'/public/static/mono/'.$service['id'].'.webp')) { throw new RuntimeException('商品封面尚未准备：'.$service['id']); }
}
$config = require $root.'/config/database.php';
$c = $config['connections']['mysql'];$prefix = $c['prefix'];
if (!preg_match('/^[a-zA-Z0-9_]+$/', $prefix)) { throw new RuntimeException('不支持的表前缀。'); }
$db = new PDO('mysql:host='.$c['hostname'].';port='.$c['hostport'].';dbname='.$c['database'].';charset=utf8mb4', $c['username'], $c['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$lookup = $db->prepare('SELECT * FROM `'.$prefix.'goods` WHERE coding IN (?,?) ORDER BY id');
$existing = [];$plan = [];
foreach ($catalogue['services'] as $service) {
    $lookup->execute(['GN-SERVICE-'.$service['id'],'MONO-PREVIEW-'.$service['id']]);$matches = $lookup->fetchAll(PDO::FETCH_ASSOC);
    if (count($matches) > 1 || (!empty($matches[0]) && ((int)$matches[0]['is_exist_many_spec'] !== 0 || (int)$matches[0]['is_delete_time'] !== 0))) { throw new RuntimeException('商品已有多规格、已删除或编码重复，请先人工核对：'.$service['id']); }
    $existing[$service['id']] = $matches[0] ?? null;
    $plan[] = ['action'=>empty($matches) ? 'create' : 'update','id'=>$matches[0]['id'] ?? null,'slug'=>$service['id'],'name'=>$service['name'],'price'=>$service['price']];
}
if (!$apply) { echo json_encode(['mode'=>'check','database'=>$c['database'],'catalogVersion'=>$catalogue['catalogVersion'],'plan'=>$plan,'paymentConfigurationChanged'=>false], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n";exit; }
$backup = $options['backup'] ?? '';
if (!is_file($backup) || filesize($backup) < 32 || file_get_contents($backup, false, null, 0, 2) !== "\x1f\x8b") { throw new RuntimeException('正式维护必须提供本次有效的 SQL gzip 备份：--apply --backup=/private/database.sql.gz'); }
$backupHandle = gzopen($backup, 'rb');
if ($backupHandle === false || gzread($backupHandle, 256) === '') { throw new RuntimeException('SQL 备份无法解压读取。'); }
gzclose($backupHandle);
$insert = function(string $table, array $row) use ($db,$prefix): int {
    $fields = array_keys($row);
    $db->prepare('INSERT INTO `'.$prefix.$table.'` (`'.implode('`,`',$fields).'`) VALUES ('.implode(',',array_fill(0,count($fields),'?')).')')->execute(array_values($row));
    return (int)$db->lastInsertId();
};
$update = function(string $table, int $id, array $row) use ($db,$prefix): void {
    $sets = array_map(fn($field) => '`'.$field.'`=?',array_keys($row));
    $db->prepare('UPDATE `'.$prefix.$table.'` SET '.implode(',',$sets).' WHERE id=?')->execute(array_merge(array_values($row),[$id]));
};
$e = fn($text) => htmlspecialchars((string)$text, ENT_QUOTES, 'UTF-8');
$now = time();$mapping = [];
try {
    $db->beginTransaction();
    $protected = [];
    foreach (['user','order','payment'] as $table) { $protected[$table] = hash('sha256',json_encode($db->query('SELECT * FROM `'.$prefix.$table.'` ORDER BY id')->fetchAll(PDO::FETCH_ASSOC))); }
    $categories = [];
    foreach ($catalogue['services'] as $position=>$service) {
        $category = $service['category'];
        if (!isset($categories[$category])) {
            $find = $db->prepare('SELECT id FROM `'.$prefix.'goods_category` WHERE pid=0 AND name=? LIMIT 1');$find->execute([$category]);$categoryId = $find->fetchColumn();
            if (!$categoryId) { $categoryId = $insert('goods_category',['name'=>$category,'vice_name'=>'明确范围，按约交付','is_home_recommended'=>1,'is_enable'=>1,'sort'=>100-count($categories),'add_time'=>$now,'upd_time'=>$now]); }
            $categories[$category] = (int)$categoryId;
        }
        $content = '<article class="gn-service-details"><header><p class="gn-detail-kicker">软件技术服务 · 远程人工交付</p><h2>'.$e($service['caption']).'</h2><p>'.$e($service['summary']).'</p></header><dl class="gn-detail-facts"><div><dt>服务方式</dt><dd>远程沟通与实施</dd></div><div><dt>参考周期</dt><dd>'.$e($service['period']).'</dd></div><div><dt>计价单位</dt><dd>每个约定项目 / 次</dd></div></dl>';
        foreach (['scope'=>'服务范围','delivery'=>'交付周期与排期'] as $field=>$label) { $content .= '<section><h3>'.$label.'</h3><p>'.$e($service[$field]).'</p></section>'; }
        $content .= '<section><h3>你会收到什么</h3><ol class="gn-delivery-list">';
        foreach ($service['deliverables'] as $index=>$item) { $content .= '<li><span>0'.($index+1).'</span><p>'.$e($item).'</p></li>'; }
        $content .= '</ol></section>';
        foreach (['preparation'=>'开始前请准备','acceptance'=>'如何验收','exclusions'=>'不包含的事项'] as $field=>$label) { $content .= '<section><h3>'.$label.'</h3><p>'.$e($service[$field]).'</p></section>'; }
        $content .= '<section><h3>购买与售后</h3><div class="gn-detail-questions">';
        foreach (array_merge($catalogue['purchaseFaqs'] ?? [],$service['questions'] ?? []) as $faq) { $content .= '<details><summary>'.$e($faq['question']).'</summary><p>'.$e($faq['answer']).'</p></details>'; }
        $content .= '</div></section><footer><p>服务提供方：'.$e($site['name']).'</p><p>邮箱：<a href="mailto:'.$e($site['email']).'">'.$e($site['email']).'</a> · 微信：'.$e($site['wechat']).'</p><p>下单前请先联系确认条件与排期。未确认的额外需求与第三方费用，不包含在套餐价格中。</p><a href="https://guangnian.xin/service-terms/">阅读服务条款与隐私说明 ↗</a></footer></article>';
        $image = '/static/mono/'.$service['id'].'.webp';
        $row = ['title'=>$service['name'],'simple_desc'=>$service['summary'],'spec_desc'=>'标准服务套餐 · 远程人工交付','coding'=>'GN-SERVICE-'.$service['id'],'site_type'=>3,'images'=>$image,'share_images'=>$image,'price'=>$service['price'],'min_price'=>$service['price'],'max_price'=>$service['price'],'original_price'=>'','min_original_price'=>'0.00','max_original_price'=>'0.00','inventory'=>1,'inventory_unit'=>'项','is_deduction_inventory'=>0,'buy_min_number'=>1,'buy_max_number'=>1,'is_shelves'=>1,'content_web'=>$content,'seo_title'=>$service['name'].' | 光年数智技术服务','seo_keywords'=>$service['keywords'],'seo_desc'=>$service['summary'],'sort_level'=>1000-$position,'upd_time'=>$now];
        $old = $existing[$service['id']];
        if ($old) { $id = (int)$old['id'];$update('goods',$id,$row); }
        else { $id = $insert('goods',$row+['add_time'=>$now]); }
        $db->prepare('DELETE FROM `'.$prefix.'goods_category_join` WHERE goods_id=?')->execute([$id]);
        $insert('goods_category_join',['goods_id'=>$id,'category_id'=>$categories[$category],'add_time'=>$now]);
        $photos = $db->query('SELECT id FROM `'.$prefix.'goods_photo` WHERE goods_id='.$id.' ORDER BY id')->fetchAll(PDO::FETCH_COLUMN);
        if ($photos) { $update('goods_photo',(int)$photos[0],['images'=>$image,'is_show'=>1]); }
        else { $insert('goods_photo',['goods_id'=>$id,'images'=>$image,'is_show'=>1,'add_time'=>$now]); }
        $update('goods',$id,['photo_count'=>max(1,count($photos))]);
        $specs = $db->query('SELECT id FROM `'.$prefix.'goods_spec_base` WHERE goods_id='.$id.' ORDER BY id')->fetchAll(PDO::FETCH_COLUMN);
        if (count($specs) > 1) { throw new RuntimeException('存在额外规格，停止覆盖：'.$service['id']); }
        $spec = ['price'=>$service['price'],'original_price'=>'0.00','inventory'=>1,'buy_min_number'=>1,'buy_max_number'=>1,'inventory_unit'=>'项'];
        if ($specs) { $update('goods_spec_base',(int)$specs[0],$spec); }
        else { $insert('goods_spec_base',$spec+['goods_id'=>$id,'add_time'=>$now]); }
        foreach (['服务类型'=>'软件技术服务','交付方式'=>'远程人工交付','参考周期'=>$service['period'],'开始条件'=>'资料齐备并确认排期','购买建议'=>'下单前联系确认服务范围'] as $name=>$value) {
            $key = md5('mono-service-'.$service['id'].'-'.$name);
            $find = $db->prepare('SELECT id FROM `'.$prefix.'goods_params` WHERE goods_id=? AND md5_key=? LIMIT 1');$find->execute([$id,$key]);$parameterId = $find->fetchColumn();
            if ($parameterId) { $update('goods_params',(int)$parameterId,['name'=>$name,'value'=>$value]); }
            else { $insert('goods_params',['goods_id'=>$id,'scope'=>1,'name'=>$name,'value'=>$value,'md5_key'=>$key,'add_time'=>$now]); }
        }
        $mapping[$service['id']] = $id;
    }
    $settings = ['home_static_cache_version'=>str_replace('-', '', $catalogue['catalogVersion']).'-services','home_seo_site_title'=>'软件技术服务商城 | 光年数智','home_seo_site_keywords'=>'光年数智,软件技术服务,网站开发,前端优化,接口对接,Excel自动化','home_seo_site_description'=>'选购光年数智的软件技术服务：故障诊断、页面优化、接口对接、企业官网搭建、Excel 自动化与 SEO 基础优化，明确范围，按约交付。','common_user_center_notice'=>'请在订单中保留必要的服务需求，勿提交密码、密钥或敏感业务数据。','common_site_fictitious_title'=>'服务交付说明','common_site_fictitious_use_tips'=>'按商品约定远程人工交付，周期从资料齐备并确认排期后开始计算。','common_customer_store_chat_email'=>$site['email'],'common_customer_store_describe'=>'软件技术服务咨询与售后；请提供商品名称或订单号。'];
    // 公告与站点名称由 mono-site-config.json 统一维护，此处不再写入，避免重跑目录脚本时覆盖为过期文案。
    $statement = $db->prepare('UPDATE `'.$prefix.'config` SET value=?,upd_time=? WHERE only_tag=?');
    foreach ($settings as $key=>$value) { $statement->execute([$value,$now,$key]); }
    // 演示分类不再占据首页；保留原分类记录及其他商品，不清空历史表。
    $db->prepare('UPDATE `'.$prefix.'goods_category` SET is_home_recommended=0 WHERE name=?')->execute(['专业技术服务']);
    foreach ($protected as $table=>$digest) {
        if (hash('sha256',json_encode($db->query('SELECT * FROM `'.$prefix.$table.'` ORDER BY id')->fetchAll(PDO::FETCH_ASSOC))) !== $digest) { throw new RuntimeException('受保护的数据发生变化，事务已停止：'.$table); }
    }
    $db->commit();
} catch (Throwable $error) { if ($db->inTransaction()) { $db->rollBack(); }throw $error; }
$receipt = ['catalogVersion'=>$catalogue['catalogVersion'],'appliedAt'=>date(DATE_ATOM),'sourceSha256'=>$sourceHash,'backupSha256'=>hash_file('sha256',$backup),'products'=>$mapping,'paymentConfigurationChanged'=>false,'userAndOrderDataPreserved'=>true];
if (file_put_contents($marker,json_encode($receipt,JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n") === false) { throw new RuntimeException('商品已保存，但发布记录写入失败，请核对运行目录权限。'); }
echo json_encode($receipt,JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n";
