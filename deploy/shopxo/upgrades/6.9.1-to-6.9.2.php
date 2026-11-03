<?php
/**
 * 光年实例的增量迁移；结构和新增默认设置来自 ShopXO v6.9.2 官方固定提交。
 * 来源 gongfuxiang/shopxo@9a0a99fd54be5decc4c8587a5d07bbec7b80d399（MIT）。
 * 官方在线升级需要绑定应用商店账号；本脚本仅处理已对比确认的版本差异。
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options = getopt('', ['root:', 'backup:', 'apply']);
try {
    $root = realpath($options['root'] ?? '');
    if (!$root || !is_file($root.'/config/database.php')) { throw new RuntimeException('请通过 --root 指定已安装的商城副本。'); }
    $schema = file_get_contents($root.'/config/shopxo.sql');
    if (hash('sha256', $schema) !== '7b744c70490a7906171b6420fbdfacadc6d7dd13acd898dc2c14b34e8ff19f6b') {
        throw new RuntimeException('目标源码不是已核对的 v6.9.2 数据结构，已停止。');
    }
    $apply = array_key_exists('apply', $options);
    if ($apply && (!is_file($options['backup'] ?? '') || file_get_contents($options['backup'], false, null, 0, 2) !== "\x1f\x8b")) {
        throw new RuntimeException('执行前必须通过 --backup 指定本次一致性 SQL 的 gzip 备份。');
    }
    $config = require $root.'/config/database.php';
    $c = $config['connections']['mysql'];
    $prefix = $c['prefix'];
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $prefix)) { throw new RuntimeException('不支持的表前缀。'); }
    $db = new PDO('mysql:host='.$c['hostname'].';port='.$c['hostport'].';dbname='.$c['database'].';charset='.$c['charset'], $c['username'], $c['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $exists = function ($table) use ($db, $prefix) {
        $q = $db->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?');
        $q->execute([$prefix.$table]);
        return (int)$q->fetchColumn() === 1;
    };
    $columns = function ($table) use ($db, $prefix) { return array_column($db->query('SHOW COLUMNS FROM `'.$prefix.$table.'`')->fetchAll(), null, 'Field'); };
    // 分批取哈希，校验迁移没有改动商品、账号、订单或支付参数；不输出业务数据。
    $snapshot = function () use ($db, $prefix, $exists) {
        $hashes = [];
        foreach (['goods','user','order','order_detail','payment','role'] as $table) {
            if (!$exists($table)) { continue; }
            $hash = hash_init('sha256');
            foreach ($db->query('SELECT * FROM `'.$prefix.$table.'` ORDER BY id') as $row) { hash_update($hash, serialize($row)); }
            $hashes[$table] = hash_final($hash);
        }
        return $hashes;
    };
    $before = $snapshot();
    $originalSettings = $db->query('SELECT only_tag,value FROM `'.$prefix.'config` ORDER BY only_tag')->fetchAll(PDO::FETCH_KEY_PAIR);
    $ddl = [];
    $attachment = $columns('attachment');
    foreach (['upload_user_id','upload_source'] as $field) {
        if (isset($attachment[$field])) {
            $type = $field === 'upload_source' ? 'tinyint' : 'int';
            if (!str_starts_with($attachment[$field]['Type'], $type) || $attachment[$field]['Null'] !== 'NO' || $attachment[$field]['Default'] !== '0') {
                throw new RuntimeException('已有附件归属字段与目标契约不符：'.$field);
            }
            continue;
        }
        if (!preg_match('/^\s*`'.$field.'`[^\r\n]+/m', $schema, $match)) { throw new RuntimeException('目标结构缺少附件归属定义。'); }
        $ddl[] = 'ALTER TABLE `'.$prefix.'attachment` ADD COLUMN '.rtrim(trim($match[0]), ',');
    }
    $indexes = $db->query('SHOW INDEX FROM `'.$prefix.'attachment`')->fetchAll();
    $uploadIndex = array_values(array_filter($indexes, fn($row) => $row['Key_name'] === 'upload_user'));
    if (empty($uploadIndex)) { $ddl[] = 'ALTER TABLE `'.$prefix.'attachment` ADD INDEX `upload_user` (`upload_source`,`upload_user_id`)'; }
    elseif (array_column($uploadIndex, 'Column_name') !== ['upload_source','upload_user_id']) { throw new RuntimeException('已有附件索引与目标契约不符。'); }
    foreach (['i18n_value','slider'] as $table) {
        if ($exists($table)) { continue; }
        if (!preg_match('/CREATE TABLE `sxo_'.$table.'`.*?;\s*(?:\r?\n|$)/s', $schema, $match)) { throw new RuntimeException('目标结构缺少新表定义。'); }
        $ddl[] = preg_replace('/AUTO_INCREMENT\s*=\s*\d+\s*/', '', str_replace('`sxo_'.$table.'`', '`'.$prefix.$table.'`', trim($match[0])));
    }
    $settings = json_decode(<<<'JSON'
[
  {
    "only_tag": "common_exhibition_mode_hide_price",
    "name": "展示模式隐藏价格",
    "describe": "开启后，在展示型（站点类型或商品类型为展示）下优先隐藏售价和原价，覆盖网站设置中「显示商品售价」「显示商品原价」开关",
    "error_tips": "请选择是否展示模式隐藏价格",
    "type": "common",
    "value": "0"
  },
  {
    "only_tag": "common_exhibition_mode_hide_price_text",
    "name": "展示模式隐藏价格替换文字",
    "describe": "开启隐藏价格后，价格行仍显示，金额替换为该文字，如联系客服；留空则不显示价格行",
    "error_tips": "请填写展示模式隐藏价格替换文字",
    "type": "common",
    "value": ""
  },
  {
    "only_tag": "common_multilingual_write_entry_status",
    "name": "多语言配置入口",
    "describe": "开启后表单字段显示多语言设置入口",
    "error_tips": "请选择多语言配置入口",
    "type": "common",
    "value": "0"
  },
  {
    "only_tag": "common_goods_detail_spec_page_show",
    "name": "商品详情规格内页展示",
    "describe": "默认不内嵌；一层规格仅单层商品页内直选；多层规格则多层也在详情页内选择",
    "error_tips": "请选择商品详情规格内页展示方式",
    "type": "common",
    "value": "0"
  },
  {
    "only_tag": "common_cache_data_file_expire",
    "name": "文件缓存有效时间",
    "describe": "单位秒，默认0表示永久，仅文件缓存生效",
    "error_tips": "请填写文件缓存有效时间",
    "type": "common",
    "value": "0"
  }
]
JSON, true, 512, JSON_THROW_ON_ERROR);
    $missingSettings = array_values(array_filter($settings, fn($row) => !array_key_exists($row['only_tag'], $originalSettings)));
    $report = ['mode'=>$apply?'apply':'check', 'database'=>$c['database'], 'ddlStatements'=>count($ddl), 'newConfigurationKeys'=>array_column($missingSettings,'only_tag'), 'legacySlideRetained'=>true];
    if (!$apply) { echo json_encode($report, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT)."\n"; exit; }
    // MySQL DDL 会自行提交；保留旧轮播表和备份，避免为更新版本删除旧数据。
    foreach ($ddl as $sql) { $db->exec($sql); }
    $db->beginTransaction();
    foreach ($missingSettings as $row) {
        $fields = array_keys($row);
        $q = $db->prepare('INSERT INTO `'.$prefix.'config` (`'.implode('`,`',$fields).'`) VALUES ('.implode(',',array_fill(0,count($fields),'?')).')');
        $q->execute(array_values($row));
    }
    $report['permissionRoutesUpdated'] = $db->exec("UPDATE `".$prefix."power` SET control='Slider' WHERE control='Slide'");
    $report['slidesCopied'] = 0;
    if ($exists('slide')) {
        $legacyFields = array_keys($columns('slide'));
        if ($legacyFields !== array_keys($columns('slider'))) { throw new RuntimeException('新旧轮播字段不一致，已停止数据复制。'); }
        $fields = '`'.implode('`,`',$legacyFields).'`';
        $report['slidesCopied'] = $db->exec('INSERT INTO `'.$prefix.'slider` ('.$fields.') SELECT '.implode(',',array_map(fn($field)=>'o.`'.$field.'`',$legacyFields)).' FROM `'.$prefix.'slide` o LEFT JOIN `'.$prefix.'slider` n ON n.id=o.id WHERE n.id IS NULL');
    }
    if ($before !== $snapshot()) { throw new RuntimeException('迁移期间业务记录发生变化，已回滚配置修改。'); }
    $afterSettings = $db->query('SELECT only_tag,value FROM `'.$prefix.'config`')->fetchAll(PDO::FETCH_KEY_PAIR);
    foreach ($originalSettings as $key=>$value) { if (!array_key_exists($key,$afterSettings) || $value !== $afterSettings[$key]) { throw new RuntimeException('既有配置值发生变化，已回滚配置修改。'); } }
    $db->commit();
    $report['businessDataPreserved'] = true;
    $report['existingConfigurationPreserved'] = true;
    $report['completedAt'] = date(DATE_ATOM);
    file_put_contents($root.'/runtime/mono-studio-upgrade-6.9.2.json', json_encode($report, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT)."\n");
    echo json_encode($report, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT)."\n";
} catch (Throwable $error) {
    if (isset($db) && $db->inTransaction()) { $db->rollBack(); }
    fwrite(STDERR, '升级迁移失败：'.$error->getMessage()."\n");
    exit(1);
}
