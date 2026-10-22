<?php
// Operations entrypoint is deliberately unavailable over HTTP.
if(PHP_SAPI !== 'cli') { http_response_code(404); exit; }

require __DIR__.'/public/core.php';
require __DIR__.'/vendor/autoload.php';
(new \think\App())->initialize();

use think\facade\Db;
use app\service\PaymentService;
use app\service\OrderService;

$arguments = array_slice($argv, 1);
$command = array_shift($arguments) ?? 'help';
$options = [];
foreach($arguments as $argument)
{
    if(in_array($argument, ['--apply','--scheduled'], true)) { $options[substr($argument,2)] = true; continue; }
    if(!preg_match('/^--(limit|log-no|aftersale-id|refund-request-no)=(.+)$/D', $argument, $match)) { fwrite(STDERR, "参数无效\n"); exit(2); }
    if(isset($options[$match[1]])) { fwrite(STDERR, "参数不能重复\n"); exit(2); }
    $options[$match[1]] = $match[2];
}

function mono_output($result) { echo json_encode($result, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES).PHP_EOL; }
function mono_payment($log)
{
    if($log['payment'] !== 'Alipay') throw new \RuntimeException('此工具只适配已核验的支付宝插件');
    $payment = PaymentService::PaymentData(['where'=>['payment'=>'Alipay']]);
    if(empty($payment['config'])) throw new \RuntimeException('支付配置不可用');
    return [$payment, new \payment\Alipay($payment['config'])];
}

try {
    if($command === 'issues')
    {
        $logs = Db::name('PayLog')->where(['business_type'=>'order', 'status'=>1])->where('subject', 'like', 'MONO_REVIEW:%')
            ->field('id,log_no,total_price,pay_price,subject,pay_time')->order('id asc')->limit(100)->select()->toArray();
        foreach($logs as $log) mono_output($log);
    } elseif($command === 'reconcile') {
        $limit = $options['limit'] ?? '20';
        if(!preg_match('/^[1-9][0-9]?$/D', (string) $limit) && $limit !== '100') throw new \RuntimeException('limit 应为 1–100');
        $cursor = null; $after = 0;
        if(!empty($options['scheduled']))
        {
            if(isset($options['log-no'])) throw new \RuntimeException('定时扫描不能同时指定支付单');
            $directory = __DIR__.'/runtime/mono';
            if(!is_dir($directory) && !mkdir($directory,0700,true)) throw new \RuntimeException('无法创建核对游标目录');
            $cursor = fopen($directory.'/reconcile.cursor','c+');
            if(!$cursor || !flock($cursor,LOCK_EX|LOCK_NB)) throw new \RuntimeException('已有核对任务正在运行');
            $saved = trim(stream_get_contents($cursor));
            if(preg_match('/^[0-9]{1,18}$/D',$saved)) $after = (int) $saved;
        }
        $query = Db::name('PayLog')->where(['business_type'=>'order', 'payment'=>'Alipay', 'status'=>0]);
        if(isset($options['log-no'])) {
            if(!preg_match('/^[A-Za-z0-9_-]{1,64}$/D', $options['log-no'])) throw new \RuntimeException('支付单号格式无效');
            $query->where('log_no', $options['log-no']);
        } else {
            // Older missing callbacks remain addressable by --log-no.
            $query->where('add_time', '>=', time()-86400*7);
        }
        $base_query = clone $query;
        if($cursor) $query->where('id','>',$after);
        $logs = $query->order('id asc')->limit((int) $limit)->select()->toArray();
        if($cursor && empty($logs) && $after > 0) $logs = $base_query->order('id asc')->limit((int) $limit)->select()->toArray();
        $failed = false;
        foreach($logs as $log)
        {
            [$payment, $provider] = mono_payment($log);
            $result = $provider->Query(['order_no'=>$log['log_no'], 'pay_price'=>$log['total_price']]);
            if($result['code'] != 0) {
                mono_output(['log_no'=>$log['log_no'], 'state'=>'unconfirmed']); $failed = true; continue;
            }
            $data = $result['data']; $status = $data['trade_status'] ?? 'UNKNOWN';
            $applied = false;
            if(!empty($options['apply']) && in_array($status, ['TRADE_SUCCESS','TRADE_FINISHED'], true))
            {
                $ret = OrderService::NotifyHandle([
                    'out_trade_no'=>$log['log_no'], 'trade_no'=>$data['trade_no'] ?? '',
                    'pay_price'=>$data['total_amount'], 'subject'=>'支付宝主动核对',
                    'buyer_user'=>$data['buyer_user_id'] ?? '',
                ], $payment);
                if($ret['code'] != 0) { $failed = true; $status = 'LOCAL_REVIEW_REQUIRED'; }
                else $applied = true;
            }
            mono_output(['log_no'=>$log['log_no'], 'state'=>$status, 'applied'=>$applied]);
        }
        if($cursor)
        {
            $last = empty($logs) ? 0 : (int) $logs[count($logs)-1]['id'];
            rewind($cursor); ftruncate($cursor,0);
            if(fwrite($cursor,(string)$last) === false || !fflush($cursor)) throw new \RuntimeException('核对游标保存失败');
            if(function_exists('fsync')) fsync($cursor);
            flock($cursor,LOCK_UN); fclose($cursor);
        }
        if($failed) exit(1);
    } elseif($command === 'refund-query') {
        $id = $options['aftersale-id'] ?? '';
        if(!preg_match('/^[1-9][0-9]{0,18}$/D', $id)) throw new \RuntimeException('请指定实际售后编号');
        $aftersale = Db::name('OrderAftersale')->where(['id'=>$id])->find();
        if(empty($aftersale)) throw new \RuntimeException('售后不存在');
        $logs = Db::name('PayLog')->alias('pl')->join('pay_log_value plv', 'pl.id=plv.pay_log_id')
            ->where(['plv.business_id'=>$aftersale['order_id'], 'pl.business_type'=>'order', 'pl.status'=>1])
            ->where('pl.subject', 'not like', 'MONO_REVIEW:%')->where('pl.subject', 'not like', 'MONO_RESOLVED:%')->field('pl.*')->select()->toArray();
        if(count($logs) !== 1) throw new \RuntimeException('支付记录不唯一，须人工核对');
        $log = $logs[0]; [, $provider] = mono_payment($log);
        $params = ['order_no'=>$log['log_no'], 'trade_no'=>$log['trade_no'], 'refund_price'=>$aftersale['price'], 'aftersale'=>$aftersale];
        if(isset($options['refund-request-no'])) {
            $params['refund_request_no'] = $options['refund-request-no'];
            $result = $provider->RefundReceiptQuery($params);
        } else $result = $provider->RefundQuery($params);
        mono_output(['aftersale_id'=>$id, 'confirmed'=>$result['code'] == 0]);
        if($result['code'] != 0) exit(1);
    } elseif($command === 'resolve-issue') {
        $number = $options['log-no'] ?? '';
        if(!preg_match('/^[A-Za-z0-9_-]{1,64}$/D',$number)) throw new \RuntimeException('请指定原支付单号');
        $log = Db::name('PayLog')->where(['log_no'=>$number,'business_type'=>'order','status'=>1])->find();
        if(empty($log) || strpos($log['subject'],'MONO_REVIEW:') !== 0) throw new \RuntimeException('该支付单不在待核对队列');
        [, $provider] = mono_payment($log);
        $request_id = $options['refund-request-no'] ?? '';
        $ret = $provider->RefundReceiptQuery(['order_no'=>$number,'trade_no'=>$log['trade_no'],'refund_price'=>$log['pay_price'],'refund_request_no'=>$request_id]);
        if($ret['code'] != 0) throw new \RuntimeException('未能确认原交易全额退款');
        if(!empty($options['apply']))
        {
            Db::startTrans();
            try {
                $locked = Db::name('PayLog')->where(['id'=>$log['id']])->lock(true)->find();
                if($locked['trade_no'] !== $log['trade_no'] || !\mono\PaymentGuard::sameAmount($locked['pay_price'],$log['pay_price'])) throw new \RuntimeException('交易记录变化，请重新查单');
                if(strpos($locked['subject'],'MONO_REVIEW:') === 0)
                {
                    $saved = \app\service\RefundLogService::RefundLogInsert([
                        'pay_id'=>$log['id'],'user_id'=>$log['user_id'],'business_id'=>0,
                        'business_type'=>'mono-issue','payment'=>'Alipay','payment_name'=>$log['payment_name'],
                        'pay_price'=>$log['pay_price'],'refund_price'=>$log['pay_price'],'trade_no'=>$log['trade_no'],
                        'refundment'=>0,'msg'=>'异常收款已核验全额原路退款',
                        'request_params'=>['out_request_no'=>$request_id],'return_params'=>$ret['data']['return_params'],
                    ]);
                    if(!$saved || Db::name('PayLog')->where(['id'=>$log['id']])->update(['subject'=>'MONO_RESOLVED:refund:'.$request_id]) !== 1) throw new \RuntimeException('退款回执保存失败');
                }
                Db::commit();
            } catch(\Throwable $error) { Db::rollback(); throw $error; }
        }
        mono_output(['log_no'=>$number,'full_refund_verified'=>true,'applied'=>!empty($options['apply'])]);
    } else {
        echo "php mono-payments.php issues\nphp mono-payments.php reconcile [--log-no=支付单号] [--limit=20] [--scheduled] [--apply]\nphp mono-payments.php refund-query --aftersale-id=售后编号 [--refund-request-no=原请求号]\nphp mono-payments.php resolve-issue --log-no=原支付单 --refund-request-no=已退款请求号 [--apply]\n";
        if($command !== 'help') exit(2);
    }
} catch(\Throwable $error) {
    // Never print database DSNs, private keys, gateway payloads or customer contact data.
    fwrite(STDERR, "操作未完成，请检查服务端配置和原交易记录；未直接修改金额或退款状态。\n");
    exit(1);
}
