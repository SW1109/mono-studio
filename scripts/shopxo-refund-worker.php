<?php
namespace payment {
    class Alipay {
        public function __construct($params=[]) {}
        public function Refund($params) {
            $id = \mono\PaymentGuard::refundRequestId($params);
            $connection = json_decode(file_get_contents(getenv('SHOPXO_TEST_CONFIG')),true);
            // Separate committed connection simulates a gateway that survives a local rollback.
            $db = new \PDO('mysql:host='.$connection['hostname'].';port='.$connection['hostport'].';dbname='.$connection['database'], $connection['username'],$connection['password']);
            $query = $db->prepare('INSERT INTO sxo_mono_gateway_refunds(request_id,amount) VALUES(?,?) ON DUPLICATE KEY UPDATE request_id=request_id');
            $query->execute([$id,$params['refund_price']]);
            usleep(25000);
            return \DataReturn('ok',0,['trade_no'=>$params['trade_no'],'refund_price'=>$params['refund_price'],'request_params'=>['out_request_no'=>$id]]);
        }
    }
}
namespace app\service {
    class OrderService {
        public static function BusinessTypeName() { return 'order'; }
        public static function OrderList($params) {
            $order = \think\facade\Db::name('Order')->where($params['where'])->find();
            if(!$order) return \DataReturn('missing',-1);
            $order['items'] = \think\facade\Db::name('OrderDetail')->where(['order_id'=>$order['id']])->select()->toArray();
            return \DataReturn('ok',0,[$order]);
        }
        public static function OrderHistoryAdd(...$params) { return true; }
    }
    class PaymentService { public static function PaymentData($params) { return ['payment'=>'Alipay','config'=>[]]; } }
    class OrderCurrencyService { public static function OrderCurrencyGroupList($id) { return []; } }
    class IntegralService { public static function OrderGoodsIntegralRollback($params) { return \DataReturn('ok',0); } }
    class BuyService { public static function OrderInventoryRollback($params) { return \DataReturn('ok',0); } }
    class MessageService { public static function MessageAdd(...$params) { return true; } }
    class RefundLogService { public static function RefundLogInsert($params) { \think\facade\Db::name('MonoRefundLogs')->insert(['amount'=>$params['refund_price']]); return true; } }
}
namespace {
    function DataReturn($msg,$code=0,$data=[]) { return compact('msg','code','data'); }
    function MyLang($key,$params=[]) { return $key; }
    function ParamsChecked($params,$rules) { return true; }
    function MyConfig($key) { return []; }
    function MyC($key,$default=null) { return $default; }
    function MyConst($key) { return []; }
    function config($key,$default=null) { return $key==='mono_payment.refund_v2_from' ? 1000 : $default; }
    function PriceNumberFormat($value) { return number_format((float)$value,2,'.',''); }
    function EventReturnHandle($result) { return $result; }
    function MyEventTrigger($name,$params) {
        if($name==='plugins_service_order_aftersale_audit_handle_end' && getenv('MONO_TEST_FAIL')) return DataReturn('simulated local failure',-1);
        return DataReturn('ok',0);
    }
    $root = getenv('SHOPXO_SOURCE');
    $connection = json_decode(file_get_contents(getenv('SHOPXO_TEST_CONFIG')),true,512,JSON_THROW_ON_ERROR);
    if(!preg_match('/^mono_test_[a-z0-9_]+$/D',$connection['database'])) throw new \RuntimeException('Test database required');
    require $root.'/vendor/autoload.php';
    \think\facade\Db::setConfig(['default'=>'mysql','connections'=>['mysql'=>array_merge($connection,['type'=>'mysql','charset'=>'utf8mb4','prefix'=>'sxo_','debug'=>false,'fields_strict'=>true])]]);
    $result = \app\service\OrderAftersaleService::AftersaleAudit(['id'=>$argv[1], 'refundment'=>$argv[2] ?? 0]);
    echo json_encode($result,JSON_UNESCAPED_UNICODE).PHP_EOL;
    exit($result['code']===0 ? 0 : 1);
}
