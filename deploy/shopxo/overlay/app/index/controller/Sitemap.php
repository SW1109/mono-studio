<?php
namespace app\index\controller;

use think\facade\Db;
use app\service\MonoSeoService;
use app\service\MonoContractService;

/** 直接读取当前上架商品，后台增删改后无需重建官网站点地图。 */
class Sitemap extends Common
{
    public function Index()
    {
        $where = [['is_shelves','=',1], ['is_delete_time','=',0]];
        if (Db::name('Goods')->where($where)->count() > 50000) {
            return response('商品数量超过单份站点地图上限，需要拆分地图。', 503);
        }
        $rows = Db::name('Goods')->where($where)->field('id,coding,upd_time,add_time')->order('id')->select()->toArray();
        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        foreach ($rows as $row) {
            if (MonoContractService::IsContractGoods($row['id'], $row['coding'] ?? '')) { continue; }
            $url = htmlspecialchars(MonoSeoService::GoodsUrl((int)$row['id']), ENT_QUOTES | ENT_XML1, 'UTF-8');
            $timestamp = (int)($row['upd_time'] ?: $row['add_time']);
            $xml .= '<url><loc>'.$url.'</loc>'.($timestamp > 0 ? '<lastmod>'.gmdate('c', $timestamp).'</lastmod>' : '').'</url>';
        }
        return response($xml.'</urlset>', 200, ['Content-Type'=>'application/xml; charset=UTF-8', 'Cache-Control'=>'public, max-age=300', 'X-Robots-Tag'=>'noindex']);
    }
}
