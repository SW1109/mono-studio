<?php
namespace mono;

/** Invariants shared by payment callbacks, queries and refunds. No merchant keys. */
final class PaymentGuard
{
    public static function cents($amount)
    {
        if(is_float($amount))
        {
            if(!is_finite($amount) || abs($amount * 100 - round($amount * 100)) > 0.00001)
            {
                throw new \InvalidArgumentException('金额精度无效');
            }
            $amount = number_format($amount, 2, '.', '');
        }
        if(!is_string($amount) && !is_int($amount)) throw new \InvalidArgumentException('金额格式无效');
        if(!preg_match('/^(0|[1-9][0-9]{0,8})(?:\.([0-9]{1,2}))?$/D', (string) $amount, $match)) throw new \InvalidArgumentException('金额格式无效');
        return ((int) $match[1]) * 100 + (int) str_pad($match[2] ?? '', 2, '0');
    }

    public static function sameAmount($expected, $actual)
    {
        try { return self::cents($expected) === self::cents($actual) && self::cents($expected) > 0; }
        catch(\InvalidArgumentException $error) { return false; }
    }

    public static function refundRequestId($params)
    {
        $id = $params['aftersale']['id'] ?? null;
        if((!is_int($id) && !is_string($id)) || !preg_match('/^[1-9][0-9]{0,18}$/D', (string) $id) || !is_string($params['order_no'] ?? null) || $params['order_no'] === '')
        {
            throw new \InvalidArgumentException('退款缺少已持久化的售后编号');
        }
        $cutoff = (int) config('mono_payment.refund_v2_from', 0);
        if($cutoff <= 0 || (int) ($params['aftersale']['add_time'] ?? 0) < $cutoff)
        {
            throw new \InvalidArgumentException('历史售后须先在支付宝核对原退款，不能自动更换退款请求号');
        }
        // Different aftersales have different IDs; retries of one aftersale are stable.
        return 'MONO'.substr(hash('sha256', $params['order_no'].':'.$id), 0, 60);
    }

    public static function refundMatches($result, $params)
    {
        return ($result['out_trade_no'] ?? '') === (string) $params['order_no'] &&
            ($result['trade_no'] ?? '') === (string) $params['trade_no'] &&
            self::sameAmount($params['refund_price'], $result['refund_fee'] ?? null);
    }

    /** Extract an exact top-level JSON object. Reject duplicate envelope keys. */
    public static function signedObject($json, $wanted)
    {
        if(!is_string($json) || strlen($json) > 262144) throw new \InvalidArgumentException('网关响应大小无效');
        $length = strlen($json); $index = 0; $seen = []; $found = null;
        $space = function() use ($json, $length, &$index) { while($index < $length && strpos(" \r\n\t", $json[$index]) !== false) $index++; };
        $space();
        if(($json[$index++] ?? '') !== '{') throw new \InvalidArgumentException('网关响应格式无效');
        while(true)
        {
            $space();
            if(($json[$index] ?? '') === '}') { $index++; break; }
            if(($json[$index] ?? '') !== '"') throw new \InvalidArgumentException('网关字段无效');
            $start = $index++; $escaped = false;
            while($index < $length)
            {
                $character = $json[$index++];
                if($escaped) $escaped = false;
                elseif($character === '\\') $escaped = true;
                elseif($character === '"') break;
            }
            $key = json_decode(substr($json, $start, $index-$start), true, 512, JSON_THROW_ON_ERROR);
            if(!is_string($key) || isset($seen[$key])) throw new \InvalidArgumentException('网关响应字段重复');
            $seen[$key] = true; $space();
            if(($json[$index++] ?? '') !== ':') throw new \InvalidArgumentException('网关字段格式无效');
            $space(); $start = $index; $depth = 0; $quoted = false; $escaped = false;
            while($index < $length)
            {
                $character = $json[$index];
                if($quoted)
                {
                    if($escaped) $escaped = false;
                    elseif($character === '\\') $escaped = true;
                    elseif($character === '"') $quoted = false;
                }
                elseif($character === '"') $quoted = true;
                elseif($character === '{' || $character === '[') $depth++;
                elseif($character === '}' || $character === ']') { if($depth === 0) break; $depth--; }
                elseif($character === ',' && $depth === 0) break;
                $index++;
            }
            $raw = trim(substr($json, $start, $index-$start));
            json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
            if($key === $wanted) { if(($raw[0] ?? '') !== '{') throw new \InvalidArgumentException('网关业务响应格式无效'); $found = $raw; }
            $space();
            if(($json[$index] ?? '') === '}') { $index++; break; }
            if(($json[$index++] ?? '') !== ',') throw new \InvalidArgumentException('网关响应不完整');
            $space();
            if(($json[$index] ?? '') === '}') throw new \InvalidArgumentException('网关响应末尾逗号无效');
        }
        $space();
        if($index !== $length || $found === null) throw new \InvalidArgumentException('网关响应不完整');
        return $found;
    }
}
