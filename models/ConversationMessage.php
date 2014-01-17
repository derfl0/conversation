<?php

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
        PersonalNotifications::add(
                Conversation::getOtherUser($conv), PluginEngine::getUrl('conversations/index'), $GLOBALS['user']->getFullName() . " " . _('hat dir eine Nachricht geschrieben'), "conversation", Avatar::getAvatar($GLOBALS['user']->id)->getURL(Avatar::MEDIUM)
        );
        return $conversation;
    }

    public function decode(&$into) {
        $user = new User($this->author_id);

        // if we have a file we need to fetch the data 
        if ($this->file) {
            $doc = new StudipDocument($this->file);
            /* Videotag not really supported :-/
             * 
             * 
              if (strpos($doc->description, "video") !== false) {
              $filelink = '<video width="320" height="240" controls>
              <source src="'.GetDownloadLink($this->file, $doc->filename).'" type="'.$doc->description.'">
              </video>';
              } else */ if (strpos($doc->description, "image") !== false) {
                $filelink = "<a href='" . GetDownloadLink($this->file, $doc->filename, 0) . "'><img class='file image' src='" . GetDownloadLink($this->file, $doc->filename) . "' /></a>";
            } else {
                $filelink = "<a href='" . GetDownloadLink($this->file, $doc->filename, 0, "force_download") . "'>" . $doc->filename . Assets::img('/images/icons/48/grey/file.png') . "</a>";
            }
        }
        if (UpdateInformation::isCollecting()) {
            $obj = array(
                'id' => $this->message_id,
                'conversation' => $this->conversation_id,
                'author' => $user->username,
                'text' => nl2br(formatReady($this->text)),
                'file' => $filelink,
                'date' => $this->mkdate
            );
        } else {
            $obj = array(
                'id' => $this->message_id,
                'conversation' => $this->conversation_id,
                'author' => utf8_encode($user->username),
                'text' => utf8_encode(nl2br(formatReady($this->text))),
                'file' => $filelink,
                'date' => $this->mkdate
            );
        }
        $into['messages'][] = $obj;
    }

}

?>
