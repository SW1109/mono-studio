<?php
/**
 * 应用商城站点配置与内容（mono-site-config.json）。
 * 只写：站点配置项、商品分类、商品参数/库存、帮助中心文章；不改账号、订单与支付参数。
 * 用法：php MONO-STUDIO-SITE-CONFIG.php            仅检查差异
 *       php MONO-STUDIO-SITE-CONFIG.php --apply --backup=/private/this-release/database.sql.gz
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

$options = getopt('', ['apply', 'backup:']);
$apply = array_key_exists('apply', $options);
$root = __DIR__;
$specPath = $root.'/mono-site-config.json';
if (!is_file($specPath)) { fwrite(STDERR, "缺少 mono-site-config.json\n"); exit(1); }
$spec = json_decode(file_get_contents($specPath), true);
if (!is_array($spec) || empty($spec['configs'])) { fwrite(STDERR, "配置清单格式错误。\n"); exit(1); }

$database = require $root.'/config/database.php';
$c = $database['connections']['mysql'];
$prefix = $c['prefix'];
if (!preg_match('/^[a-zA-Z0-9_]+$/', $prefix)) { throw new RuntimeException('不支持的表前缀。'); }
$db = new PDO('mysql:host='.$c['hostname'].';port='.$c['hostport'].';dbname='.$c['database'].';charset=utf8mb4', $c['username'], $c['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

/** 计算需要写入的变更，不产生任何副作用。 */
$plan = function (PDO $db) use ($prefix, $spec): array {
    $changes = [];

    $configSelect = $db->prepare('SELECT `value` FROM `'.$prefix.'config` WHERE `only_tag`=? LIMIT 1');
    foreach ($spec['configs'] as $tag => $value) {
        $configSelect->execute([$tag]);
        $row = $configSelect->fetch(PDO::FETCH_ASSOC);
        if ($row === false) {
            $changes[] = ['type' => 'config', 'key' => $tag, 'action' => 'insert'];
        } elseif ((string) $row['value'] !== (string) $value) {
            $changes[] = ['type' => 'config', 'key' => $tag, 'action' => 'update'];
        }
    }

    $categorySelect = $db->prepare('SELECT * FROM `'.$prefix.'goods_category` WHERE `pid`=0 AND `name`=? LIMIT 1');
    foreach ($spec['categories'] ?? [] as $category) {
        $categorySelect->execute([$category['name']]);
        $row = $categorySelect->fetch(PDO::FETCH_ASSOC);
        $want = [
            'describe' => (string) ($category['describe'] ?? ''),
            'vice_name' => (string) ($category['vice_name'] ?? ''),
            'seo_title' => (string) ($category['seo_title'] ?? ''),
            'seo_keywords' => (string) ($category['seo_keywords'] ?? ''),
            'seo_desc' => (string) ($category['seo_desc'] ?? ''),
            'is_enable' => empty($category['disable']) ? 1 : 0,
        ];
        if ($row === false) { $changes[] = ['type' => 'category', 'key' => $category['name'], 'action' => 'missing']; continue; }
        $diff = [];
        foreach ($want as $field => $value) { if (isset($row[$field]) && (string) $row[$field] !== (string) $value) { $diff[] = $field; } }
        if ($diff) { $changes[] = ['type' => 'category', 'key' => $category['name'], 'action' => 'update', 'fields' => $diff]; }
    }

    $goodsSelect = $db->prepare('SELECT `id` FROM `'.$prefix.'goods` WHERE `coding`=? ORDER BY `id`');
    $paramSelect = $db->prepare('SELECT `id`, `value` FROM `'.$prefix.'goods_params` WHERE `goods_id`=? AND `name`=? ORDER BY `id`');
    foreach ($spec['goods'] ?? [] as $goods) {
        $goodsSelect->execute([$goods['coding']]);
        $goodsId = (int) $goodsSelect->fetchColumn();
        if (!$goodsId) { $changes[] = ['type' => 'goods', 'key' => $goods['coding'], 'action' => 'missing']; continue; }
        if (isset($goods['inventory'])) {
            $current = (int) $db->query('SELECT `inventory` FROM `'.$prefix.'goods` WHERE `id`='.$goodsId)->fetchColumn();
            if ($current !== (int) $goods['inventory']) { $changes[] = ['type' => 'goods', 'key' => $goods['coding'], 'action' => 'inventory', 'from' => $current, 'to' => (int) $goods['inventory']]; }
        }
        foreach ($goods['params'] ?? [] as $name => $value) {
            $paramSelect->execute([$goodsId, $name]);
            $row = $paramSelect->fetch(PDO::FETCH_ASSOC);
            if ($row === false) { $changes[] = ['type' => 'param', 'key' => $goods['coding'].' / '.$name, 'action' => 'insert']; }
            elseif ((string) $row['value'] !== (string) $value) { $changes[] = ['type' => 'param', 'key' => $goods['coding'].' / '.$name, 'action' => 'update']; }
        }
    }

    $articleCategory = (string) ($spec['articleCategory'] ?? '');
    if ($articleCategory !== '' && !empty($spec['articles'])) {
        $found = $db->prepare('SELECT `id` FROM `'.$prefix.'article_category` WHERE `pid`=0 AND `name`=? LIMIT 1');
        $found->execute([$articleCategory]);
        $categoryId = (int) $found->fetchColumn();
        $titleSelect = $db->prepare('SELECT `id`, `describe`, `content`, `seo_title`, `seo_keywords`, `seo_desc` FROM `'.$prefix.'article` WHERE `article_category_id`=? AND `title`=? LIMIT 1');
        foreach ($spec['articles'] as $article) {
            if (!$categoryId) { $changes[] = ['type' => 'article', 'key' => $article['title'], 'action' => 'insert']; continue; }
            $titleSelect->execute([$categoryId, $article['title']]);
            $row = $titleSelect->fetch(PDO::FETCH_ASSOC);
            if ($row === false) { $changes[] = ['type' => 'article', 'key' => $article['title'], 'action' => 'insert']; continue; }
            $diff = [];
            foreach ([['describe', 'describe'], ['content', 'content'], ['seo_title', 'seo_title'], ['seo_keywords', 'seo_keywords'], ['seo_desc', 'seo_desc']] as [$field, $key]) {
                if ((string) $row[$field] !== (string) ($article[$key] ?? '')) { $diff[] = $field; }
            }
            if ($diff) { $changes[] = ['type' => 'article', 'key' => $article['title'], 'action' => 'update', 'fields' => $diff]; }
        }
    }
    return $changes;
};

$changes = $plan($db);
$summary = ['mode' => $apply ? 'apply' : 'check', 'database' => $c['database'], 'specVersion' => $spec['version'] ?? '', 'changeCount' => count($changes), 'changes' => $changes];
if (!$apply) { echo json_encode($summary, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n"; exit; }
if (!$changes) { echo json_encode(['mode' => 'apply', 'result' => 'no-change'] + $summary, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n"; exit; }

$backup = $options['backup'] ?? '';
if (!is_file($backup) || filesize($backup) < 32 || file_get_contents($backup, false, null, 0, 2) !== "\x1f\x8b") {
    throw new RuntimeException('正式维护必须提供本次有效的 SQL gzip 备份：--apply --backup=/path/database-before.sql.gz');
}
$handle = gzopen($backup, 'rb');
if ($handle === false || gzread($handle, 256) === '') { throw new RuntimeException('SQL 备份无法解压读取。'); }
gzclose($handle);

$fingerprint = function (PDO $db) use ($prefix): array {
    $protected = [];
    foreach (['user', 'order', 'payment'] as $table) {
        $protected[$table] = hash('sha256', json_encode($db->query('SELECT * FROM `'.$prefix.$table.'` ORDER BY `id`')->fetchAll(PDO::FETCH_ASSOC), JSON_UNESCAPED_UNICODE));
    }
    return $protected;
};
$before = $fingerprint($db);
$now = time();

try {
    $db->beginTransaction();

    $configUpdate = $db->prepare('UPDATE `'.$prefix.'config` SET `value`=?, `upd_time`=? WHERE `only_tag`=?');
    $configInsert = $db->prepare('INSERT INTO `'.$prefix.'config` (`value`, `name`, `describe`, `error_tips`, `type`, `only_tag`, `upd_time`) VALUES (?,?,?,?,?,?,?)');
    foreach ($spec['configs'] as $tag => $value) {
        $configUpdate->execute([$value, $now, $tag]);
        if ($configUpdate->rowCount() === 0) {
            $type = str_starts_with($tag, 'home_') ? 'home' : (str_starts_with($tag, 'admin_') ? 'admin' : 'common');
            $configInsert->execute([$value, $tag, '由 mono-site-config.json 维护', '', $type, $tag, $now]);
        }
    }

    $categoryFind = $db->prepare('SELECT `id` FROM `'.$prefix.'goods_category` WHERE `pid`=0 AND `name`=? LIMIT 1');
    $categoryUpdate = $db->prepare('UPDATE `'.$prefix.'goods_category` SET `describe`=?, `vice_name`=?, `seo_title`=?, `seo_keywords`=?, `seo_desc`=?, `is_enable`=?, `upd_time`=? WHERE `id`=?');
    foreach ($spec['categories'] ?? [] as $category) {
        $categoryFind->execute([$category['name']]);
        $id = (int) $categoryFind->fetchColumn();
        if (!$id) { throw new RuntimeException('分类不存在：'.$category['name']); }
        $categoryUpdate->execute([
            (string) ($category['describe'] ?? ''), (string) ($category['vice_name'] ?? ''),
            (string) ($category['seo_title'] ?? ''), (string) ($category['seo_keywords'] ?? ''), (string) ($category['seo_desc'] ?? ''),
            empty($category['disable']) ? 1 : 0, $now, $id,
        ]);
    }

    $goodsFind = $db->prepare('SELECT `id` FROM `'.$prefix.'goods` WHERE `coding`=? ORDER BY `id`');
    $goodsInventory = $db->prepare('UPDATE `'.$prefix.'goods` SET `inventory`=?, `upd_time`=? WHERE `id`=?');
    $paramFind = $db->prepare('SELECT `id`, `value` FROM `'.$prefix.'goods_params` WHERE `goods_id`=? AND `name`=? ORDER BY `id`');
    $paramInsert = $db->prepare('INSERT INTO `'.$prefix.'goods_params` (`goods_id`, `scope`, `data_type`, `name`, `value`, `md5_key`, `add_time`) VALUES (?,1,1,?,?,?,?)');
    $paramUpdate = $db->prepare('UPDATE `'.$prefix.'goods_params` SET `value`=? WHERE `id`=?');
    foreach ($spec['goods'] ?? [] as $goods) {
        $goodsFind->execute([$goods['coding']]);
        $goodsId = (int) $goodsFind->fetchColumn();
        if (!$goodsId) { throw new RuntimeException('商品编码不存在：'.$goods['coding']); }
        if (isset($goods['inventory'])) { $goodsInventory->execute([(int) $goods['inventory'], $now, $goodsId]); }
        foreach ($goods['params'] ?? [] as $name => $value) {
            $paramFind->execute([$goodsId, $name]);
            $row = $paramFind->fetch(PDO::FETCH_ASSOC);
            if ($row === false) {
                $paramInsert->execute([$goodsId, $name, $value, md5($goodsId.'|'.$name.'|'.$value), $now]);
            } elseif ((string) $row['value'] !== (string) $value) {
                $paramUpdate->execute([$value, (int) $row['id']]);
            }
        }
    }

    $articleCategory = (string) ($spec['articleCategory'] ?? '');
    if ($articleCategory !== '' && !empty($spec['articles'])) {
        $categoryFind2 = $db->prepare('SELECT `id` FROM `'.$prefix.'article_category` WHERE `pid`=0 AND `name`=? LIMIT 1');
        $categoryFind2->execute([$articleCategory]);
        $categoryId = (int) $categoryFind2->fetchColumn();
        if (!$categoryId) {
            $db->prepare('INSERT INTO `'.$prefix.'article_category` (`pid`, `name`, `is_enable`, `sort`, `add_time`, `upd_time`) VALUES (0,?,1,0,?,?)')->execute([$articleCategory, $now, $now]);
            $categoryId = (int) $db->lastInsertId();
        }
        $articleFind = $db->prepare('SELECT `id` FROM `'.$prefix.'article` WHERE `article_category_id`=? AND `title`=? LIMIT 1');
        $articleUpdate = $db->prepare('UPDATE `'.$prefix.'article` SET `describe`=?, `content`=?, `seo_title`=?, `seo_keywords`=?, `seo_desc`=?, `is_enable`=1, `upd_time`=? WHERE `id`=?');
        $articleInsert = $db->prepare('INSERT INTO `'.$prefix.'article` (`title`, `describe`, `article_category_id`, `is_enable`, `content`, `access_count`, `is_home_recommended`, `seo_title`, `seo_keywords`, `seo_desc`, `add_time`, `upd_time`) VALUES (?,?,?,1,?,0,0,?,?,?,?,?)');
        foreach ($spec['articles'] as $article) {
            $articleFind->execute([$categoryId, $article['title']]);
            $articleId = (int) $articleFind->fetchColumn();
            $fields = [
                (string) ($article['describe'] ?? ''), (string) ($article['content'] ?? ''),
                (string) ($article['seo_title'] ?? ''), (string) ($article['seo_keywords'] ?? ''), (string) ($article['seo_desc'] ?? ''),
            ];
            if ($articleId) {
                $articleUpdate->execute([$fields[0], $fields[1], $fields[2], $fields[3], $fields[4], $now, $articleId]);
            } else {
                $articleInsert->execute([$article['title'], $fields[0], $categoryId, $fields[1], $fields[2], $fields[3], $fields[4], $now, $now]);
            }
        }
        $summary['articleCategoryId'] = $categoryId;
    }

    $db->commit();
} catch (Throwable $e) {
    if ($db->inTransaction()) { $db->rollBack(); }
    throw $e;
}

if ($fingerprint($db) !== $before) { throw new RuntimeException('账号/订单/支付表发生变化，请立即用本次备份恢复并人工核对。'); }
$summary['mode'] = 'applied';
$summary['protectedTablesUnchanged'] = true;
echo json_encode($summary, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n";
