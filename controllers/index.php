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
        $_SESSION['conversations']['last_update'] = time();
    }

    public function send_action() {
        if ($msg = Request::get('message')) {
            if (!$conversation_id = Request::get('conversation')) {
                if (Request::get('username')) {
                    $user = User::findByUsername(Request::get('username'));
                    $newConversation = $user ? Conversation::withUser($user->id) : null;
                }
                if ($newConversation) {
                    $conversation_id = $newConversation->conversation_id;
                    $newConversation->decode($result);
                }
            }
            if ($conversation_id) {
                $newMessage = ConversationMessage::insert($conversation_id, utf8_decode($msg));
                DBManager::get()->query("UPDATE conversations_update SET chdate = '".time()."' WHERE conversation_id = $conversation_id");
                $newMessage->decode($result);
            }
        }
        echo json_encode($result);
        $this->render_nothing();
    }

    public function update_action() {
        if ($updated = Conversation::updates($_SESSION['conversations']['last_update'] - 3)) {
            foreach ($updated as $updatedConv) {
                $updatedConv->decode($result);
                $lastUpdate = min(array($_SESSION['conversations']['last_update'], $updatedConv->update->chdate));
                foreach(ConversationMessage::findBySQL('conversation_id = ? AND mkdate >= ?', array($updatedConv->conversation_id, $_SESSION['conversations']['last_update'])) as $message) {
                    $message->decode($result);
                }
            }
            $_SESSION['conversations']['last_update'] = time();
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

    private function createQuickSearch() {
        $quicksearch = QuickSearch::get("user", new StandardSearch("username"))
                ->setInputStyle("width: 200px");
        return $quicksearch->render();
    }

    private function setInfoBox() {
        $this->setInfoBoxImage('infobox/studygroup.jpg');
        
        $this->addToInfobox(_('Neues Gespräch'), $this->createQuickSearch(), 'icons/16/blue/star.png');
        if ($convs = Conversation::updates()) {
            $this->hasConversations = true;
           foreach ($convs as $conv) {
               if (!$this->messages) {
                   
               }
               $conversations .= "<div class='new_conv conversation' data-date='$conv->date' data-conversation_id='$conv->conversation_id'>$conv->name</div>";
           }
        } else {
             $conversations = '<div id="no_talks">' . _('Keine Gespräche') . '</div>';
        }
        $this->addToInfobox(_('Gespräche'), "<div id='talks'>$conversations</div>");
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
