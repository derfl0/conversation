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

    public function __construct($id = null) {
        $this->db_table = 'conversations';
        /* $this->has_many['users'] = array(
          'class_name' => 'ConversationUser'
          ); */
        $this->has_one['update'] = array(
            'class_name' => 'ConversationUpdate',
            'foreign_key' => 'conversation_id'
        );
        parent::__construct($id);
    }

    public static function withUser($user) {
        $sql = "SELECT b.* FROM conversations a JOIN conversations b USING (conversation_id) WHERE a.user_id = ? and b.user_id = ? LIMIT 1";
        $stmt = DBManager::get()->prepare($sql);
        $stmt->execute(array($GLOBALS['user']->id, User::findByUsername($user)->id));
        if ($result = $stmt->fetchAll(PDO::FETCH_ASSOC)) {
            return self::import($result[0]);
        } else {
            return self::createWithUser($user);
        }
    }

    public static function createWithUser($user) {
        $new = new ConversationUpdate();
        $new->store();
        $other = User::findByUsername($user);
        $usersConv = Conversation::create(array(
            'conversation_id' => $new->id,
            'user_id' => $GLOBALS['user']->id,
            'name' => $other->getFullName()
        ));
        Conversation::create(array(
            'conversation_id' => $new->id,
            'user_id' => $other->id,
            'name' => $GLOBALS['user']->getFullName()
        ));
        return $usersConv;
    }
    
    public function decode() {
        return array(
            'id' => $this->id,
            'name' => $this->name,
            'date' => $this->update->chdate
        );
    }

    /*
      public static function findByUsers($users) {
      foreach (Conversation::findByUser_id($GLOBALS['user']->id) as $conversation) {
      if (count($conversation->users) == count($users)) {
      $correct = TRUE;
      foreach ($users as $user) {
      if (!$conversation->users->findOneBy('user_id', $user)) {
      $correct = FALSE;
      break;
      }
      }
      if ($correct) {
      return $conversation;
      }
      }
      }
      $newConversation = new Conversation();
      $newConversation->store();
      $users[] = $GLOBALS['user']->id;
      foreach ($users as $user) {
      ConversationUser::create(array($newConversation->id, $user));
      }
      return $newConversation;
      } */
}

?>
