<?php
// Real MySQL transactions with deterministic stand-ins for inventory/messages/plugins.
// This exercises native OrderService/PayLogService, not a full ShopXO HTTP installation.
namespace app\service {
    class BuyService {
        public static function MoreOrderPayBeginCheck($params) { return \DataReturn('ok',0); }
        public static function OrderInventoryDeduct($params) {
            \think\facade\Db::name('Goods')->where(['id'=>1])->dec('inventory',1)->update();
            if(getenv('MONO_TEST_FAIL')) return \DataReturn('simulated inventory failure',-1);
            return \DataReturn('ok',0);
        }
    }
    class MessageService {
        public static function MessageAdd(...$params) { \think\facade\Db::name('MonoEffects')->insert(['kind'=>'message']); return true; }
    }
    class UserService {
        public static function LoginUserInfo() { return ['id'=>1]; }
        public static function UserInfo($field,$id) { return ['id'=>$id]; }
        public static function UserHandle($user) { return $user; }
    }
    class PaymentService {
        public static function PaymentData($params) {
            $row = \think\facade\Db::name('Payment')->where($params['where'])->find();
            if($row) $row['apply_terminal'] = json_decode($row['apply_terminal'],true);
            return $row;
        }
    }
}
namespace {
    function DataReturn($msg,$code=0,$data=[]) { return compact('msg','code','data'); }
    function MyLang($key,$params=[]) { return $key; }
    function ParamsChecked($params,$rules) { return true; }
    function MyConfig($key) { return []; }
    function MyC($key,$default=null) { return $key==='common_goods_sales_count_inc_rules' ? 0 : $default; }
    function MyConst($key) { return []; }
    function config($key,$default=null) { return $key==='mono_payment.manual_service_delivery' ? true : $default; }
    function PriceNumberFormat($value) { return number_format((float)$value,2,'.',''); }
    function EventReturnHandle($result) { return $result; }
    function MyEventTrigger($name,$params) {
        if(in_array($name,['plugins_service_order_pay_notify_handle','plugins_service_order_pay_handle_begin','plugins_service_order_pay_success_handle_end'],true)) {
            \think\facade\Db::name('MonoEffects')->insert(['kind'=>$name]);
            usleep(15000);
        }
        return DataReturn('ok',0);
    }
    $root = getenv('SHOPXO_SOURCE');
    $connection = json_decode(file_get_contents(getenv('SHOPXO_TEST_CONFIG')),true,512,JSON_THROW_ON_ERROR);
    if(!preg_match('/^mono_test_[a-z0-9_]+$/D',$connection['database'])) throw new \RuntimeException('Test database required');
    require $root.'/vendor/autoload.php';
    define('APPLICATION_CLIENT_TYPE','pc');
    \think\facade\Db::setConfig(['default'=>'mysql','connections'=>['mysql'=>array_merge($connection,[
        'type'=>'mysql','charset'=>'utf8mb4','prefix'=>'sxo_','debug'=>false,'fields_strict'=>true,
    ])]]);
    $action = $argv[1] ?? 'notify';
    if($action === 'pay') {
        $result = \app\service\OrderService::Pay(['ids'=>[$argv[2]],'payment_id'=>2,'user'=>['id'=>1]]);
    } else {
        $log = \think\facade\Db::name('PayLog')->where(['id'=>(int)$argv[2]])->find();
        $result = \app\service\OrderService::NotifyHandle([
            'out_trade_no'=>$log['log_no'], 'trade_no'=>'TRADE_'.$log['id'],
            'pay_price'=>$argv[3] ?? $log['total_price'], 'subject'=>'fixture receipt', 'buyer_user'=>'fixture buyer',
        ], ['id'=>1,'payment'=>'Alipay','name'=>'Alipay']);
    }
    echo json_encode($result,JSON_UNESCAPED_UNICODE).PHP_EOL;
    exit($result['code']===0 ? 0 : 1);
}
