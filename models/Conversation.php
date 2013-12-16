<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of Conversation
 *
 * @author intelec
 */
class Conversation extends SimpleORMap {

    public $date;

    public function __construct($id = null) {
        $this->db_table = 'conversations';
        /* $this->has_many['users'] = array(
          'class_name' => 'ConversationUser'
          ); */
        $this->has_one['update'] = array(
            'class_name' => 'ConversationUpdate',
            'foreign_key' => 'conversation_id'
        );
        $this->additional_fields['timestamp'] = true;
        parent::__construct($id);
        $this->timestamp = 123;
    }

    public static function withUser($user, $other = null) {
        $sql = "SELECT a.* FROM conversations a JOIN conversations b USING (conversation_id) WHERE a.user_id = ? and b.user_id = ? LIMIT 1";
        $stmt = DBManager::get()->prepare($sql);
        if (!$other) {
            $other = $GLOBALS['user']->id;
        }
        $stmt->execute(array($other, $user));
        if ($result = $stmt->fetchAll(PDO::FETCH_ASSOC)) {
            return self::import($result[0]);
        } else {
            return self::createWithUser($user, $other);
        }
    }

    public static function createWithUser($user, $self) {
        $new = new ConversationUpdate();
        $new->store();
        $other = new User($user);
        $myself = new User($self);
        $usersConv = Conversation::create(array(
                    'conversation_id' => $new->id,
                    'user_id' => $self,
                    'name' => $other->getFullName()
        ));
        Conversation::create(array(
            'conversation_id' => $new->id,
            'user_id' => $user,
            'name' => $myself->getFullName()
        ));
        $usersConv->migrate($user);
        return $usersConv;
    }

    public function decode(&$into) {

        $obj = array(
            'id' => $this->conversation_id,
            'date' => $this->update->chdate,
            'name' => utf8_encode($this->name),
        );
        $into['conversations'][] = $obj;
    }

    public static function updates($since = 0) {
        $sql = "SELECT c.*, u.chdate as date FROM conversations c JOIN conversations_update u USING (conversation_id) WHERE user_id = ? and chdate > ? ORDER BY chdate DESC";
        $stmt = DBManager::get()->prepare($sql);
        $stmt->execute(array($GLOBALS['user']->id, $since));
        while ($result = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $new = self::import($result);
            $new->date = $result['date'];
            $return[] = $new;
        }
        return $return;
    }

    public static function getOtherUser($conversation_id) {
        $others = DBManager::get()->prepare("SELECT user_id FROM conversations WHERE user_id != ? AND conversation_id = ?");
        $others->execute(array($GLOBALS['user']->id, $conversation_id));
        return $others->fetchAll(PDO::FETCH_COLUMN);
    }

    public function activate() {
        //activate the conversation for the user
        $_SESSION['conversations']['conversations'][] = $this->conversation_id;

        //select other users that may activate online status on this conversation
        $others = DBManager::get()->prepare("SELECT user_id FROM conversations WHERE user_id != ? AND conversation_id = ?");
        $others->execute(array($GLOBALS['user']->id, $this->conversation_id));
        while ($user = $others->fetch(PDO::FETCH_COLUMN)) {
            $_SESSION['conversations']['online'][$user] = $this->conversation_id;
        }
    }

    public function migrate($other) {
        $stmt = DBManager::get()->prepare("SELECT m.* FROM message
            JOIN message m USING (message_id)
            JOIN message_user u USING (message_id)
            JOIN message_user u2 USING (message_id)
            LEFT JOIN message_user u3 ON (u3.message_id = u.message_id AND u3.user_id != u.user_id AND u3.user_id != u2.user_id)
            WHERE u.user_id = ?
            AND u2.user_id = ?
            AND u3.user_id IS NULL");
        $stmt->execute(array($this->user_id, $other));
        while ($result = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $conversation = new ConversationMessage();
            $conversation->conversation_id = $this->conversation_id;
            $conversation->author_id = $result['autor_id'];
            $conversation->text = $result['message'];
            $conversation->file = null;
            $conversation->chdate = 0;
            $conversation->mkdate = $result['mkdate'];
            $conversation->store();
        }
    }

    public static function getOnlineConversations() {
        
        //stop complexity if we have started a conversation we are allowed to see the user
        $sql = "SELECT user_id FROM user_online WHERE last_lifesign > ?";
        $stmt = DBManager::get()->prepare($sql);
        $stmt->execute(array(time() - 300));
        
        while ($online = $stmt->fetch(PDO::FETCH_COLUMN)) {
            
            //if we have a conversation with the user activate id!
            if ($_SESSION['conversations']['online'][$online]) {
                $result[$_SESSION['conversations']['online'][$online]] = true;
            }
        }
        return array_keys($result);
    }

}

?>
