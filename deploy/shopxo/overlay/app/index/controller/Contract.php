<?php
// +----------------------------------------------------------------------
// | 光年合同项目付款：上传合同、校验金额、创建订单并跳转支付宝收银台
// +----------------------------------------------------------------------
namespace app\index\controller;

use app\index\controller\Common;
use app\service\ApiService;
use app\service\BuyService;
use app\service\MonoContractService;
use app\service\PaymentService;

class Contract extends Common
{
    /** 合同商品详情页（未直接暴露下单入口）。 */
    public function Index()
    {
        IsUserLogin();
        $config = MonoContractService::Config();
        if (empty($config['goodsId'])) {
            return MyView('public/tips_error', ['msg'=>'合同付款商品尚未配置，请联系工作室。']);
        }
        return MyRedirect(MyUrl('index/goods/index', ['id'=>intval($config['goodsId'])]));
    }

    /** 提交合同与金额，创建待支付订单。 */
    public function Submit()
    {
        IsUserLogin();
        if (!$this->data_post) {
            return ApiService::ApiDataReturn(DataReturn('请求方式错误', -1));
        }
        $config = MonoContractService::Config();
        if (empty($config['goodsId'])) {
            return ApiService::ApiDataReturn(DataReturn('合同付款商品尚未配置，请联系工作室', -1));
        }
        if (empty($this->data_post['agreement'])) {
            return ApiService::ApiDataReturn(DataReturn('请先核对合同与金额，并勾选同意服务条款', -1));
        }
        $amount = MonoContractService::CalculatePayment($this->data_post['contract_price'] ?? '');
        if ($amount['code'] != 0) {
            return ApiService::ApiDataReturn($amount);
        }
        $file = $_FILES['contract_file'] ?? null;
        if (empty($file) || !is_array($file)) {
            return ApiService::ApiDataReturn(DataReturn('请上传合同文件', -1));
        }
        $valid = MonoContractService::ValidateUpload($file);
        if ($valid['code'] != 0) {
            return ApiService::ApiDataReturn($valid);
        }
        $contractNo = mb_substr(trim((string) ($this->data_post['contract_no'] ?? '')), 0, 80, 'UTF-8');
        $userNote = mb_substr(trim((string) ($this->data_post['user_note'] ?? '')), 0, 120, 'UTF-8');
        $upload = MonoContractService::SaveUpload($file, $valid['data'], intval($this->user['id']));
        if ($upload['code'] != 0) {
            return ApiService::ApiDataReturn($upload);
        }
        $upload['data']['contract_no'] = $contractNo;
        $upload['data']['payment'] = $amount['data'];
        $payment = PaymentService::PaymentData(['where'=>['payment'=>'Alipay','is_enable'=>1]]);
        if (empty($payment)) {
            MonoContractService::DiscardUpload($upload['data']);
            return ApiService::ApiDataReturn(DataReturn('支付宝支付尚未启用，请联系工作室后再付款', -1));
        }
        try {
            $token = MonoContractService::CreateUploadToken($upload['data'], $amount['data']['amount'], $contractNo);
        } catch (\Throwable $error) {
            MonoContractService::DiscardUpload($upload['data']);
            return ApiService::ApiDataReturn(DataReturn($error->getMessage(), -1));
        }
        $noteParts = ['合同付款'];
        if ($contractNo !== '') {
            $noteParts[] = '合同编号：'.$contractNo;
        }
        $noteParts[] = '合同文件：'.$upload['data']['original'];
        if ($userNote !== '') {
            $noteParts[] = '备注：'.$userNote;
        }
        $params = [
            'user'                  => $this->user,
            'creator'               => $this->user['id'],
            'creator_name'          => $this->user['username'],
            'buy_type'              => 'goods',
            'goods_data'            => [['goods_id'=>intval($config['goodsId']), 'stock'=>1, 'spec'=>[]]],
            'payment_id'            => intval($payment['id']),
            'contract_upload_token' => $token,
            'contract_price'        => $amount['data']['amount'],
            'user_note'             => implode('；', $noteParts),
        ];
        $ret = BuyService::OrderInsert($params);
        if ($ret['code'] != 0) {
            MonoContractService::DiscardUpload($upload['data']);
            return ApiService::ApiDataReturn($ret);
        }
        $orderIds = array_values(array_filter(array_map('intval', (array) ($ret['data']['order_ids'] ?? []))));
        if (empty($orderIds)) {
            MonoContractService::DiscardUpload($upload['data']);
            return ApiService::ApiDataReturn(DataReturn('订单号获取失败，请勿重复支付，联系工作室核对', -1));
        }
        try {
            MonoContractService::AttachToOrder($orderIds[0], intval($this->user['id']), $upload['data']);
        } catch (\Throwable $error) {
            return ApiService::ApiDataReturn(DataReturn('订单已创建，但合同信息写入失败，请勿重复支付；请联系工作室并提供订单号', -1, ['order_ids'=>$orderIds]));
        }
        return ApiService::ApiDataReturn(DataReturn('订单已创建，请核对金额并完成支付', 0, [
            'order_ids' => $orderIds,
            'payment'   => $amount['data'],
            'jump_url'  => MyUrl('index/order/pay', ['ids'=>implode(',', $orderIds)]),
        ]));
    }

    /** 合同文件下载：使用订单号 + HMAC 签名，客户与管理员均可通过订单详情访问。 */
    public function Download()
    {
        $token = (string) ($this->data_request['token'] ?? '');
        if ($token === '') {
            http_response_code(404);
            exit('合同文件不存在或链接已失效');
        }
        MonoContractService::Download($token);
    }
}
