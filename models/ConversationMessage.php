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
    
    public static function insert($conv, $message, $file = null, $author = null) {
        if (!$author) {
            $author = $GLOBALS['user']->id;
        }
        $conversation = new self();
        $conversation->conversation_id = $conv;
        $conversation->author_id = $author;
        $conversation->text = $message;
        $conversation->file = $file;
        $conversation->store();
        return $conversation;
    }
    
    public function decode(&$into) {
        $user = new User($this->author_id);
        
        // if we have a file we need to fetch the data 
        if ($this->file) {
            $doc = new StudipDocument($this->file);
            $filelink = "<a href='".GetDownloadLink($this->file, $doc->filename)."'>".$doc->filename.Assets::img('/images/icons/48/grey/file.png')."</a>";
        }
        
        $obj = array(
            'id' => $this->message_id,
            'conversation' => $this->conversation_id,
            'author' => utf8_encode($user->username),
            'text' => utf8_encode(nl2br(htmlReady($this->text))),
            'file' => $filelink,
            'date' => $this->mkdate
        );
        $into['messages'][] = $obj;
    }

}

?>
