<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of ConversationMessage
 *
 * @author intelec
 */
class ConversationMessage extends SimpleORMap {

    public function __construct($id = null) {
        $this->db_table = 'conversation_messages';
        parent::__construct($id);
    }

    public static function insert($conv, $message) {
        $conversation = new self();
        $conversation->conversation_id = $conv;
        $conversation->author_id = $GLOBALS['user']->id;
        $conversation->text = $message;
        $conversation->store();
        return $conversation;
    }
    
    public function decode(&$into) {
        $user = new User($this->author_id);
        $obj = array(
            'id' => $this->message_id,
            'conversation' => $this->conversation_id,
            'author' => $user->username,
            'text' => $this->text,
            'date' => $this->mkdate
        );
        $into['messages'][] = $obj;
    }

}

?>
