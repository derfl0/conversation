<?php

require_once 'app/controllers/studip_controller.php';

class IndexController extends StudipController {

    const MESSAGES_LOAD = 50; //how many messages should be loaded on first open and on backscroll

    public function before_filter(&$action, &$args) {
        parent::before_filter($action, $args);
        if (Request::isXhr()) {
            $this->set_layout(null);
        } else {
            $this->set_layout($GLOBALS['template_factory']->open('layouts/base'));
        }
    }

    /**
     * Actual interface
     */
    public function index_action() {

        //clear session savings
        $_SESSION['conversations']['online'] = array();
        $_SESSION['conversations']['conversations'] = array();
        $_SESSION['conversations']['last_update'] = time();
        $_SESSION['conversations']['last_onlinecheck'] = 0;
        $this->setInfoBox();
    }
    
    /**
     * Ajaxaction to send a message
     */
    public function send_action() {
        if ($_FILES['file'] || ($msg = Request::get('message')) && trim($msg) != "" ) {

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
     * Loading old messages from the database
     */
    public function loadMessages_action() {
        if ($last = Request::get('lastMessage')) {
            $where = "AND message_id < '$last'";
        }
        $messages = ConversationMessage::findBySQL('conversation_id = ? ' . $where . ' ORDER BY message_id DESC LIMIT ?', array(Request::get('conversation'), self::MESSAGES_LOAD));
        $messages = SimpleORMapCollection::createFromArray($messages);
        foreach ($messages->orderBy('mkdate ASC') as $msg) {
            $msg->decode($result);
        }
        echo json_encode($result);
        $this->render_nothing();
    }

    /**
     * Parses an userid to a username (Important for a new conversation)
     */
    public function nameFromUsername_action() {
        echo utf8_encode(User::findByUsername(utf8_decode(Request::get('username')))->getFullName());
        $this->render_nothing();
    }

    /**
     * Quicksearch for new user
     * @return quicksearch the quicksearch
     */
    private function createQuickSearch() {
        $quicksearch = QuickSearch::get("user", new StandardSearch("username"))
                ->setInputStyle("width: 200px");
        $quicksearch->fireJSFunctionOnSelect('STUDIP.conversations.conversation.new');
        return $quicksearch->render();
    }

    /**
     * Sets up the infobox
     */
    private function setInfoBox() {
        $this->setInfoBoxImage('infobox/studygroup.jpg');
        $this->addToInfobox(_('Suche'), $this->createQuickSearch(), 'icons/16/blue/search.png');
        if ($convs = Conversation::updates()) {
            $this->hasConversations = true;
            foreach ($convs as $conv) {
                $this->activateConversation($conv);
                $conversations .= "<div class='new_conv conversation' data-date='$conv->date' data-conversation_id='$conv->conversation_id'>$conv->name</div>";
            }
        } else {
            $conversations = '<div id="no_talks">' . _('Keine Gespräche') . '</div>';
        }
        $this->addToInfobox(_('Gespräche'), "<div id='talks'>$conversations</div>");
    }

    /**
     * Activates a conversation for a user
     * 
     * @param type $conversation
     */
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
