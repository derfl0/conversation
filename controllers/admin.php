<?php

require_once 'app/controllers/studip_controller.php';

class AdminController extends StudipController {

    public function before_filter(&$action, &$args) {
        $GLOBALS['perm']->check('root');
        parent::before_filter($action, $args);
        if (Request::isXhr()) {
            $this->set_layout(null);
        } else {
            $this->set_layout($GLOBALS['template_factory']->open('layouts/base'));
        }
    }

    public function index_action() {
        if (Request::submitted('simulate')) {
            $time = microtime(1);
            $this->work("SELECT DISTINCT message_id FROM message_user u WHERE user_id != '____%system%____' AND user_id != '' GROUP BY message_id HAVING COUNT(2) LIMIT 1000");
            $worktime = microtime(1) - $time;
            $counter = DBManager::get()->query("SELECT DISTINCT message_id FROM message_user u WHERE user_id != '____%system%____' AND user_id != '' GROUP BY message_id HAVING COUNT(2)");
            $count = $counter->rowCount();
            $this->output = "Estimated runtime: " . round($worktime * $count / 60000, 2) . " min";
        }
        if (Request::submitted('migrate')) {
            $this->work("SELECT DISTINCT message_id FROM message_user u WHERE user_id != '____%system%____' AND user_id != '' GROUP BY message_id HAVING COUNT(2)");
        }
    }

    private function work($sql) {
        DBManager::get()->query("TRUNCATE TABLE conversations");
        DBManager::get()->query("TRUNCATE TABLE conversations_update");
        DBManager::get()->query("TRUNCATE TABLE conversation_messages");
        $stmt = DBManager::get()->query($sql);
        $data = DBManager::get()->prepare("SELECT autor_id, user_id, message, message.mkdate FROM message JOIN message_user USING (message_id) WHERE message_id = ? AND autor_id != user_id");
        while ($result = $stmt->fetch(PDO::FETCH_COLUMN)) {
            //echo "$result<br>";
            $data->execute(array($result));
            $new = $data->fetch(PDO::FETCH_ASSOC);
            if ($new['autor_id'] != '____%system%____' 
                    && $new['user_id'] != '____%system%____' 
                    && $new['user_id'] != null
                    && $new['autor_id'] != null
                    && $new['message'] != ''
                    && $new['message'] != null) {
            ConversationMessage::insert($this->getConversation($new['autor_id'], $new['user_id']), $new['message'] ? : "", $new['autor_id']);
            } 
        }
    }

    private function getConversation($autor, $user) {
        if ($this->cache[$autor . $user]) {
            return $this->cache[$autor . $user];
        }
        if ($this->cache[$user . $autor]) {
            return $this->cache[$user . $autor];
        }
        //echo "NEW BETWEEN $autor, $user<br>";
        $conv = Conversation::withUser($autor, $user);
        $this->cache[$autor . $user] = $conv->id;
        return $conv->id;
    }

}

?>
