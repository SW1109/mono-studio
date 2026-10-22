<?php
// Temporary database only; never accepts a production database name.
$connection = json_decode(file_get_contents(getenv('SHOPXO_TEST_CONFIG')),true,512,JSON_THROW_ON_ERROR);
$name = $connection['database'];
if(!preg_match('/^mono_test_[a-z0-9_]+$/D',$name)) throw new RuntimeException('Test database required');
$db = new PDO('mysql:host='.$connection['hostname'].';port='.$connection['hostport'].';charset=utf8mb4', $connection['username'], $connection['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$action = $argv[1] ?? 'inspect';
if($action==='cleanup') { $db->exec('DROP DATABASE IF EXISTS `'.$name.'`'); exit; }
if($action==='setup') {
    $db->exec('CREATE DATABASE `'.$name.'` CHARACTER SET utf8mb4');
    $db->exec('USE `'.$name.'`');
    $db->exec("CREATE TABLE sxo_order (id INT PRIMARY KEY,user_id INT NOT NULL DEFAULT 1,total_price DECIMAL(12,2) NOT NULL DEFAULT 299,status INT NOT NULL DEFAULT 1,pay_status INT NOT NULL DEFAULT 0,pay_price DECIMAL(12,2) NOT NULL DEFAULT 0,pay_time BIGINT NOT NULL DEFAULT 0,upd_time BIGINT NOT NULL DEFAULT 0,payment_id INT NOT NULL DEFAULT 1,is_under_line INT NOT NULL DEFAULT 0,order_model INT NOT NULL DEFAULT 3,order_no VARCHAR(64) NOT NULL DEFAULT 'ORDER',client_type VARCHAR(16) NOT NULL DEFAULT 'pc') ENGINE=InnoDB;");
    $db->exec("CREATE TABLE sxo_pay_log (id INT PRIMARY KEY,log_no VARCHAR(64) NOT NULL UNIQUE,total_price DECIMAL(12,2) NOT NULL DEFAULT 299,pay_price DECIMAL(12,2) NOT NULL DEFAULT 0,status INT NOT NULL DEFAULT 0,payment VARCHAR(64) NOT NULL DEFAULT 'Alipay',business_type VARCHAR(32) NOT NULL DEFAULT 'order',trade_no VARCHAR(64) NOT NULL DEFAULT '',buyer_user VARCHAR(64) NOT NULL DEFAULT '',subject VARCHAR(255) NOT NULL DEFAULT '',payment_name VARCHAR(64) NOT NULL DEFAULT '',pay_time BIGINT NOT NULL DEFAULT 0) ENGINE=InnoDB;");
    $db->exec('CREATE TABLE sxo_pay_log_value (id INT AUTO_INCREMENT PRIMARY KEY,pay_log_id INT,business_id INT) ENGINE=InnoDB');
    $db->exec('CREATE TABLE sxo_goods (id INT PRIMARY KEY,inventory INT,sales_count INT) ENGINE=InnoDB');
    $db->exec('CREATE TABLE sxo_order_detail (id INT PRIMARY KEY,order_id INT,goods_id INT,title VARCHAR(64),buy_number INT) ENGINE=InnoDB');
    $db->exec('CREATE TABLE sxo_order_address (id INT PRIMARY KEY,order_id INT) ENGINE=InnoDB');
    $db->exec('CREATE TABLE sxo_mono_effects (id INT AUTO_INCREMENT PRIMARY KEY,kind VARCHAR(128)) ENGINE=InnoDB');
    $db->exec('CREATE TABLE sxo_order_status_history (id INT AUTO_INCREMENT PRIMARY KEY,order_id INT,new_status INT,original_status INT,msg VARCHAR(255),creator INT,creator_name VARCHAR(255),add_time BIGINT) ENGINE=InnoDB');
    $db->exec('CREATE TABLE sxo_payment (id INT PRIMARY KEY,is_enable INT,is_open_user INT,apply_terminal TEXT,payment VARCHAR(32)) ENGINE=InnoDB');
    $db->exec("INSERT INTO sxo_payment VALUES(1,1,1,'[\"pc\"]','Alipay'),(2,0,1,'[\"pc\"]','Alipay')");
    $db->exec('INSERT INTO sxo_goods VALUES(1,100,0)');
    foreach([1,2,3,4,5,6,7,8] as $id) {
        $status = $id===2 ? 5 : 1;
        $owner = $id===6 || $id===7 ? 2 : 1;
        $price = $id===4 ? 399 : ($id===7 ? 0 : 299);
        $db->exec("INSERT INTO sxo_order(id,user_id,total_price,status) VALUES($id,$owner,$price,$status)");
        if($id<=5) $db->exec("INSERT INTO sxo_order_detail VALUES($id,$id,1,'fixture service',1)");
    }
    foreach([1=>1,2=>2,3=>3,4=>3,5=>4,6=>5] as $log=>$order) {
        $db->exec("INSERT INTO sxo_pay_log(id,log_no) VALUES($log,'LOG_$log')");
        $db->exec("INSERT INTO sxo_pay_log_value(pay_log_id,business_id) VALUES($log,$order)");
    }
} elseif($action==='refund-setup') {
    $db->exec('USE `'.$name.'`');
    $db->exec('ALTER TABLE sxo_order ADD refund_price DECIMAL(12,2) DEFAULT 0,ADD returned_quantity INT DEFAULT 0,ADD buy_number_count INT DEFAULT 1,ADD preferential_price DECIMAL(12,2) DEFAULT 0,ADD close_time BIGINT DEFAULT 0');
    $db->exec('ALTER TABLE sxo_order_detail ADD refund_price DECIMAL(12,2) DEFAULT 0,ADD returned_quantity INT DEFAULT 0,ADD total_price DECIMAL(12,2) DEFAULT 299,ADD upd_time BIGINT DEFAULT 0');
    $db->exec("CREATE TABLE sxo_order_aftersale (id INT PRIMARY KEY,order_id INT,order_detail_id INT,user_id INT DEFAULT 1,goods_id INT DEFAULT 1,status INT DEFAULT 2,price DECIMAL(12,2),number INT DEFAULT 0,type INT DEFAULT 0,refundment INT DEFAULT 0,audit_time BIGINT DEFAULT 0,upd_time BIGINT DEFAULT 0,add_time BIGINT DEFAULT 1001) ENGINE=InnoDB");
    $db->exec('CREATE TABLE sxo_order_aftersale_status_history (id INT AUTO_INCREMENT PRIMARY KEY,order_aftersale_id INT,new_status INT,original_status INT,msg VARCHAR(255),creator INT,creator_name VARCHAR(255),add_time BIGINT) ENGINE=InnoDB');
    $db->exec('CREATE TABLE sxo_mono_gateway_refunds (request_id VARCHAR(64) PRIMARY KEY,amount DECIMAL(12,2)) ENGINE=InnoDB');
    $db->exec('CREATE TABLE sxo_mono_refund_logs (id INT AUTO_INCREMENT PRIMARY KEY,amount DECIMAL(12,2)) ENGINE=InnoDB');
    $db->exec("INSERT INTO sxo_order(id,status,pay_status,pay_price) VALUES(9,2,1,299)");
    $db->exec("INSERT INTO sxo_order_detail(id,order_id,goods_id,title,buy_number) VALUES(9,9,1,'refund service',1)");
    $db->exec("INSERT INTO sxo_pay_log(id,log_no,status,pay_price,trade_no) VALUES(7,'LOG_7',1,299,'TRADE_7')");
    $db->exec("INSERT INTO sxo_pay_log_value(pay_log_id,business_id) VALUES(7,9)");
    $db->exec('INSERT INTO sxo_order_aftersale(id,order_id,order_detail_id,price) VALUES(1,9,9,100),(2,9,9,100),(3,9,9,150),(4,9,9,50)');
} elseif($action==='refund-inspect') {
    $db->exec('USE `'.$name.'`');
    echo json_encode([
        'order'=>$db->query('SELECT * FROM sxo_order WHERE id=9')->fetch(PDO::FETCH_ASSOC),
        'gateway'=>$db->query('SELECT * FROM sxo_mono_gateway_refunds ORDER BY request_id')->fetchAll(PDO::FETCH_ASSOC),
        'logs'=>$db->query('SELECT * FROM sxo_mono_refund_logs ORDER BY id')->fetchAll(PDO::FETCH_ASSOC),
        'aftersales'=>$db->query('SELECT * FROM sxo_order_aftersale ORDER BY id')->fetchAll(PDO::FETCH_ASSOC),
    ]);
} elseif($action==='inspect') {
    $db->exec('USE `'.$name.'`');
    $result = [];
    foreach(['order','pay_log','goods','mono_effects','order_status_history'] as $table) $result[$table]=$db->query('SELECT * FROM sxo_'.$table.' ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($result);
}
