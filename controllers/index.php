<?php

require_once 'app/controllers/studip_controller.php';

class IndexController extends StudipController {

    /**
     * Diese Methode wird bei jedem Pfad aufgerufen
     */
    public function before_filter(&$action, &$args) {
        parent::before_filter($action, $args);

        if (Request::isXhr()) {
            $this->set_layout(null);
        } else {
            $this->set_layout($GLOBALS['template_factory']->open('layouts/base'));
        }
    }

    public function index_action() {
        $this->setInfoBox();
        $this->quicksearch = $this->createQuickSearch();
    }

    public function send_action() {
        if ($msg = Request::get('message')) {
            if (!$conversation_id = Request::get('conversation')) {
                $newConversation = Request::get('username') ? Conversation::withUser(Request::get('username')) : null;
                if ($newConversation) {
                    $conversation_id = $newConversation->conversation_id;
                    $newConversation->decode($result);
                }
            }
            if ($conversation_id) {
                $newMessage = ConversationMessage::insert($conversation_id, $msg);
                DBManager::get()->query("UPDATE conversations_update SET chdate = '".time()."' WHERE conversation_id = $conversation_id");
                $newMessage->decode($result);
            }
        }
        echo json_encode($result);
        $this->render_nothing();
    }

    public function loadConversations_action() {
        foreach (Conversation::findByUser_id($GLOBALS['user']->id) as $conv) {
            $conv->decode($result);
        }
        $_SESSION['conversations']['last_update'] = time();
        echo json_encode($result);
        $this->render_nothing();
    }
    
    public function update_action() {
        if ($updated = Conversation::updates($_SESSION['conversations']['last_update'])) {
            foreach ($updated as $updatedConv) {
                $updatedConv->decode($result);
                $lastUpdate = min(array($_SESSION['conversations']['last_update'], $updatedConv->update->chdate));
                foreach(ConversationMessage::findBySQL('conversation_id = ? AND mkdate >= ?', array($updatedConv->conversation_id, $_SESSION['conversations']['last_update'])) as $message) {
                    $message->decode($result);
                }
            }
        }
        echo json_encode($result);
        $this->render_nothing();
    }

    public function loadMessages_action() {
        foreach (ConversationMessage::findByConversation_id(Request::get('conversation')) as $msg) {
            $msg->decode($result);
        }
        echo json_encode($result);
        $this->render_nothing();
    }

    /////////////////////OLDIES BUT GOLDIES!

    public function loadAconversations_action($since = null) {
        foreach (Conversation::findByUser_id($GLOBALS['user']->id) as $conv) {
            if (!$since || $conv->update->chdate >= $since) {
                $result[$conv->conversation_id] = array('name' => $conv->name, 'chdate' => $conv->update->chdate);
            }
        }
        echo json_encode($result);
        $this->render_nothing();
    }

    public function load_action($conversation_id, $since = null) {
        $this->checkConversation($conversation_id);
        if ($since) {
            
        } else {
            $this->messages = ConversationMessage::findBySQL('conversation_id = ? LIMIT 50 ORDER BY mkdate DESC', array($conversation_id));
        }
    }

    public function start_action($user_id) {
        $newConversation = Conversation::findByUsers($user_id);
    }

    public function messages_action($id) {
        $sql = "SELECT m.message_id, m.message, m.mkdate, m.autor_id, a.vorname, a.nachname, d.name as filename FROM message m JOIN message_user mu USING (message_id) 
            JOIN auth_user_md5 a ON (m.autor_id = a.user_id)
            LEFT JOIN dokumente d ON (m.message_id = d.range_id)
            WHERE (mu.user_id = :other AND autor_id = :me) 
            OR (autor_id = :other AND mu.user_id = :me)";
        $db = DBManager::get();
        $stmt = $db->prepare($sql);
        $stmt->bindParam(':me', $GLOBALS['user']->id);
        $stmt->bindParam(':other', $id);
        $stmt->execute();
//$stmt->execute(array(":me" => $GLOBALS['user']->id, ":other" => $id));
        $alreadyDisplayed = array();
        while ($result = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (!in_array($result['message_id'], $alreadyDisplayed)) {
                if ($result['autor_id'] != $lastauthor) {
                    $lastauthor = $result['autor_id'];
                    echo "<p class='conversationheader'>" . Avatar::getAvatar($result['autor_id'])->getImageTag(Avatar::SMALL) . "{$result['vorname']} {$result['nachname']}<p>";
                }
                echo "<span class='conversationtext'>{$result['message']}<span><br>";
            }
            if ($result['filename']) {
                echo "<span class='conversationfile' style='color: red;'>{$result['filename']}<span><br>";
                $alreadyDisplayed[] = $result['message_id'];
            }
        }
        $this->render_nothing();
    }

    public function contact_action($id) {
        $sql = "SELECT m.message, m.mkdate, m.autor_id FROM message m JOIN message_user USING (message_id) 
            WHERE (user_id = :other AND autor_id = :me) 
            OR (autor_id = :other AND user_id = :me)";
        $db = DBManager::get();
        $stmt = $db->prepare($sql);
        $stmt->bindParam(':me', $GLOBALS['user']->id);
        $stmt->bindParam(':other', $id);
        $stmt->execute();
//$stmt->execute(array(":me" => $GLOBALS['user']->id, ":other" => $id));
        while ($result = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo $result['message'] . "<br>";
        }
        $this->render_nothing();
    }

    public function new_action() {
        if (Request::get('check')) {
            $conversation = Conversation::withUser(Request::get('user'));
            $message = new ConversationMessage();
            $message->conversation_id = $conversation->id;
            $message->author_id = $GLOBALS['user']->id;
            $message->text = Request::get('text');
            $message->store();
            return array('conversation' => json_encode($conversation), 'message' => json_encode($message));
        }
    }

    private function createQuickSearch() {
        $quicksearch = QuickSearch::get("user", new StandardSearch("username"))
                ->setInputStyle("width: 200px");
        return $quicksearch->render();
    }

    private function setInfoBox() {
        $this->setInfoBoxImage('infobox/studygroup.jpg');
        
        $this->addToInfobox(_('Neues Gespräch'), $this->createQuickSearch(), 'icons/16/blue/star.png');
        if ($convs = Conversation::findByUser_id($GLOBALS['user']->id)) {
            $this->hasConversations = true;
           foreach ($convs as $conv) {
               if (!$this->messages) {
                   
               }
               $conversations .= "<div class='new_conv conversation' data-conversation_id='$conv->conversation_id'>$conv->name</div>";
           }
        } else {
             $conversations = '<div id="no_talks">' . _('Keine Gespräche') . '</div>';
        }
        $this->addToInfobox(_('Gespräche'), "<div id='talks'>$conversations</div>");
    }

    private function checkConversation2($id) {
        if (!$GLOBALS['perm']->have_perm('root') && !ConversationUser::countBySql('conversation_id = ? AND user_id = ?', array($id, $GLOBALS['user']->id))) {
            throw Exception('Access denied', 0, 0);
        }
    }

    private function checkConversation($id) {
        
    }

    // customized #url_for for plugins
    public function url_for($to) {
        $args = func_get_args();

        # find params
        $params = array();
        if (is_array(end($args))) {
            $params = array_pop($args);
        }

        # urlencode all but the first argument
        $args = array_map("urlencode", $args);
        $args[0] = $to;

        return PluginEngine::getURL($this->dispatcher->plugin, $params, join("/", $args));
    }

}

?>
