<?php
namespace app\service;

/** 仅为公开页面生成搜索元信息；金额和商品信息来自当前商城数据。 */
class MonoSeoService
{
    public static function Origin(): string
    {
        return rtrim(MyC('mono_website_origin', 'https://guangnian.xin'), '/');
    }

    public static function GoodsUrl(int $id): string
    {
        return self::Origin().'/shop/?s=goods/index/id/'.$id.'.html';
    }

    public static function HeadData(string $controller, string $action, array $goods = [], array $floors = []): array
    {
        $isHome = strtolower($controller) === 'index' && strtolower($action) === 'index';
        $isGoods = strtolower($controller) === 'goods' && strtolower($action) === 'index' && !empty($goods['id']);
        // 合同入口的占位价格并非服务报价，不能作为可售商品供搜索或 AI 引用。
        if ($isGoods && MonoContractService::IsContractGoods($goods['id'], $goods['coding'] ?? '')) { $isGoods = false; }
        $result = ['indexable' => $isHome || $isGoods, 'canonical' => '', 'json' => '', 'image' => '', 'title' => '', 'description' => ''];
        if (!$result['indexable']) { return $result; }
        $origin = self::Origin();
        $site = json_decode(file_get_contents(ROOT.'mono-site-navigation.json'), true, 512, JSON_THROW_ON_ERROR);
        $organizationId = $origin.'/#organization';
        $canonical = $isGoods ? self::GoodsUrl((int)$goods['id']) : $origin.'/shop/';
        $title = $isGoods ? $goods['title'].' · '.$site['name'] : '软件技术服务商城 · '.$site['name'];
        $description = $isGoods ? (($goods['seo_desc'] ?? '') ?: ($goods['simple_desc'] ?? '')) : MyC('home_seo_site_description');
        $image = $isGoods && !empty($goods['images']) ? $goods['images'] : $origin.'/social-card.png';
        if (str_starts_with($image, '/static/')) { $image = $origin.'/shop/public'.$image; }
        elseif (str_starts_with($image, '/')) { $image = $origin.$image; }
        if (!preg_match('~^https?://~', $image)) { $image = $origin.'/social-card.png'; }
        $graph = [
            ['@type'=>'Organization', '@id'=>$organizationId, 'name'=>$site['name'], 'url'=>$origin.'/', 'email'=>$site['email'], 'logo'=>$origin.'/favicon.png'],
            ['@type'=>$isHome ? 'CollectionPage' : 'WebPage', '@id'=>$canonical.'#webpage', 'url'=>$canonical, 'name'=>$title, 'description'=>$description, 'inLanguage'=>'zh-CN', 'about'=>['@id'=>$organizationId], 'isPartOf'=>['@id'=>$origin.'/#website']],
        ];
        $graph[] = ['@type'=>'WebSite', '@id'=>$origin.'/#website', 'url'=>$origin.'/', 'name'=>$site['name'], 'inLanguage'=>'zh-CN', 'publisher'=>['@id'=>$organizationId]];
        if (!empty($site['identity']['creditCode'])) {
            $graph[0]['identifier'] = ['@type'=>'PropertyValue', 'propertyID'=>'统一社会信用代码', 'value'=>$site['identity']['creditCode']];
        }
        if (!empty($site['shortName'])) { $graph[0]['alternateName'] = $site['shortName']; }
        if (!empty($site['description'])) { $graph[0]['description'] = $site['description']; }
        if ($isHome) {
            // 与当前首页共用楼层数据及 FAQ 文件，不复制数据库价格或生成隐藏商品。
            $items = [];
            foreach ($floors as $floor) {
                foreach (($floor['goods'] ?? []) as $item) {
                    if (empty($item['id']) || isset($items[$item['id']]) || MonoContractService::IsContractGoods($item['id'], $item['coding'] ?? '')) { continue; }
                    $items[$item['id']] = ['@type'=>'ListItem', 'position'=>count($items)+1, 'name'=>$item['title'], 'url'=>self::GoodsUrl((int)$item['id'])];
                }
            }
            if ($items) {
                $graph[] = ['@type'=>'ItemList', '@id'=>$canonical.'#services', 'name'=>'可选软件技术服务', 'numberOfItems'=>count($items), 'itemListElement'=>array_values($items)];
                $graph[1]['mainEntity'] = ['@id'=>$canonical.'#services'];
            }
            $catalogue = json_decode(file_get_contents(ROOT.'mono-service-catalog.json'), true, 512, JSON_THROW_ON_ERROR);
            $questions = [];
            foreach (($catalogue['purchaseFaqs'] ?? []) as $faq) {
                $questions[] = ['@type'=>'Question', 'name'=>$faq['question'], 'acceptedAnswer'=>['@type'=>'Answer', 'text'=>$faq['answer']]];
            }
            if ($questions) {
                $graph[] = ['@type'=>'FAQPage', '@id'=>$canonical.'#faq', 'mainEntity'=>$questions];
                $graph[1]['hasPart'] = ['@id'=>$canonical.'#faq'];
            }
        }
        if ($isGoods) {
            $offer = ['@type'=>'Offer', 'url'=>$canonical, 'priceCurrency'=>'CNY', 'price'=>(string)$goods['min_price'], 'seller'=>['@id'=>$organizationId]];
            if ((string)$goods['min_price'] !== (string)$goods['max_price']) {
                $offer = ['@type'=>'AggregateOffer', 'url'=>$canonical, 'priceCurrency'=>'CNY', 'lowPrice'=>(string)$goods['min_price'], 'highPrice'=>(string)$goods['max_price']];
            }
            $graph[] = ['@type'=>'Service', '@id'=>$canonical.'#service', 'name'=>$goods['title'], 'description'=>$description, 'image'=>$image, 'url'=>$canonical, 'serviceType'=>'远程软件技术服务', 'provider'=>['@id'=>$organizationId], 'offers'=>$offer];
            $graph[1]['mainEntity'] = ['@id'=>$canonical.'#service'];
            $graph[1]['breadcrumb'] = ['@id'=>$canonical.'#breadcrumb'];
            $graph[] = ['@type'=>'BreadcrumbList', '@id'=>$canonical.'#breadcrumb', 'itemListElement'=>[
                ['@type'=>'ListItem','position'=>1,'name'=>'首页','item'=>$origin.'/'],
                ['@type'=>'ListItem','position'=>2,'name'=>'服务商城','item'=>$origin.'/shop/'],
                ['@type'=>'ListItem','position'=>3,'name'=>$goods['title'],'item'=>$canonical],
            ]];
        }
        // JSON 进入 script 原文，必须转义标签边界；不写入销量、评分或未经证实的经营主体。
        return array_merge($result, ['canonical'=>$canonical, 'title'=>$title, 'description'=>$description, 'image'=>$image, 'json'=>json_encode(['@context'=>'https://schema.org','@graph'=>$graph], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR)]);
    }
}
