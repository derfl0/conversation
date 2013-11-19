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
}

?>
