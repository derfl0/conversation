<?php

require_once 'app/controllers/studip_controller.php';

class IndexController extends StudipController {

    const KEEP_ALIVE = false;
    const TIMEOUT = 15; // seconds to timeout
    const RELOAD = 800000; // microseconds to reload

    /**
     * Diese Methode wird bei jedem Pfad aufgerufen
     */

    public function before_filter(&$action, &$args) {
        parent::before_filter($action, $args);

        if (UpdateInformation::isCollecting()) {
            $this->set_layout(null);
        } else {
            $this->set_layout($GLOBALS['template_factory']->open('layouts/base'));
        }
    }

    public function index_action() {
        $_SESSION['conversations']['online'] = array();
        $_SESSION['conversations']['conversations'] = array();
        $this->setInfoBox();
        $this->quicksearch = $this->createQuickSearch();
        $_SESSION['conversations']['last_update'] = time();
    }

    public function send_action() {
        if ($_FILES['file'] || $msg = Request::get('message')) {

            // parse us some conversation id
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

            // could we really find a conversation?
            if ($conversation_id) {
                // if we got a file upload it
                if ($_FILES['file']) {
                    $new = StudipDocument::createWithFile($_FILES['file']['tmp_name'], array(
                                "filename" => $_FILES['file']['name'],
                                "user_id" => $GLOBALS['user']->id,
                                "seminar_id" => $GLOBALS['user']->id,
                                "description" => $_FILES['file']["type"],
                                "filesize" => $_FILES['file']['size']
                    ));
                    $fileid = $new->id;
                }
                $newMessage = ConversationMessage::insert($conversation_id, utf8_decode($msg), $fileid);
                DBManager::get()->query("UPDATE conversations_update SET chdate = '" . time() . "' WHERE conversation_id = $conversation_id");
                $newMessage->decode($result);
            }
        }
        echo json_encode($result);
        $this->render_nothing();
    }

    /**
     * Loads the latest messages out of the database
     */
    public function update_action() {
        if (self::KEEP_ALIVE) {
            $result = $this->keepAliveUpdate();
        } else {
            if ($updated = Conversation::updates($_SESSION['conversations']['last_update'] - 3)) {
                foreach ($updated as $updatedConv) {
                    $this->activateConversation($updatedConv);
                    $updatedConv->decode($result);
                    $lastUpdate = min(array($_SESSION['conversations']['last_update'], $updatedConv->update->chdate));
                    $messages = ConversationMessage::findBySQL('conversation_id = ? AND mkdate >= ?', array($updatedConv->conversation_id, $_SESSION['conversations']['last_update']));
                    $messages = SimpleORMapCollection::createFromArray($messages);
                    foreach ($messages->orderBy('mkdate ASC') as $message) {
                        $message->decode($result);
                    }
                }
            }
        }

        // update the send of the last update
        $_SESSION['conversations']['last_update'] = time();

        // update online users
        $result['online'] = $this->online();
        echo json_encode($result);
        $this->render_nothing();
    }

    public function loadMessages_action() {
        $messages = ConversationMessage::findByConversation_id(Request::get('conversation'));
        $messages = SimpleORMapCollection::createFromArray($messages);
        foreach ($messages->orderBy('mkdate ASC') as $msg) {
            $msg->decode($result);
        }
        echo json_encode($result);
        $this->render_nothing();
    }

    private function createQuickSearch() {
        $quicksearch = QuickSearch::get("user", new StandardSearch("username"))
                ->setInputStyle("width: 200px");
        //$quicksearch->fireJSFunctionOnSelect('newConversation');
        return $quicksearch->render();
    }

    private function setInfoBox() {
        $this->setInfoBoxImage('infobox/studygroup.jpg');

        $this->addToInfobox(_('Suche'), $this->createQuickSearch(), 'icons/16/blue/search.png');
        if ($convs = Conversation::updates()) {
            $this->hasConversations = true;
            foreach ($convs as $conv) {
                $this->activateConversation($conv);
                if (!$this->messages) {
                    
                }
                $conversations .= "<div class='new_conv conversation' data-date='$conv->date' data-conversation_id='$conv->conversation_id'>$conv->name</div>";
            }
        } else {
            $conversations = '<div id="no_talks">' . _('Keine Gespräche') . '</div>';
        }
        $this->addToInfobox(_('Suche'), "<div id='new_talks' style='display:none;'></div>");
        $this->addToInfobox(_('Gespräche'), "<div id='talks'>$conversations</div>");
    }

    private function activateConversation($conversation) {
        //activate the conversation for the user
        $_SESSION['conversations']['conversations'][] = $conversation->conversation_id;

        //select other users that may activate online status on this conversation
        $others = DBManager::get()->prepare("SELECT user_id FROM conversations WHERE user_id != ? AND conversation_id = ?");
        $others->execute(array($GLOBALS['user']->id, $conversation->conversation_id));
        while ($user = $others->fetch(PDO::FETCH_COLUMN)) {
            $_SESSION['conversations']['online'][$user] = $conversation->conversation_id;
        }
    }

    private function keepAliveUpdate() {
        $start = time();
        while (time() - $start < self::TIMEOUT) {
            if ($updated = Conversation::updates($_SESSION['conversations']['last_update'] - 3)) {
                foreach ($updated as $updatedConv) {

                    $this->activateConversation($updatedConv);

                    $updatedConv->decode($result);
                    $lastUpdate = min(array($_SESSION['conversations']['last_update'], $updatedConv->update->chdate));
                    $messages = ConversationMessage::findBySQL('conversation_id = ? AND mkdate >= ?', array($updatedConv->conversation_id, $_SESSION['conversations']['last_update']));
                    $messages = SimpleORMapCollection::createFromArray($messages);
                    foreach ($messages->orderBy('mkdate ASC') as $message) {
                        $message->decode($result);
                    }
                }
                break;
            }
            usleep(self::RELOAD);
        }
        return $result;
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
