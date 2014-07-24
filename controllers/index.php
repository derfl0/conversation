<?php

require_once 'app/controllers/studip_controller.php';

class IndexController extends StudipController {

    const MESSAGES_LOAD = 50; //how many messages should be loaded on first open and on backscroll
    const CONVERSATION_PURGE = 51840000; // After how many days of inactivity should a conversation disapear (initial 60 days)

    public function before_filter(&$action, &$args) {
        parent::before_filter($action, $args);
        if (Request::isXhr()) {
            $this->set_content_type('text/html;Charset=windows-1252');
            $this->set_layout(null);
        } else {
            $this->set_layout($GLOBALS['template_factory']->open('layouts/base'));
        }
    }

    /**
     * Actual interface
     */
    public function index_action($start = null) {

        Navigation::activateItem('/messaging/conversations');

        //clear session savings
        $_SESSION['conversations']['online'] = array();
        $_SESSION['conversations']['conversations'] = array();
        $_SESSION['conversations']['last_onlinecheck'] = 0;
        $this->setInfoBox();

        // Set the starting point
        if ($start) {
            PageLayout::addHeadElement('script', array(), 'STUDIP.conversations.openConversation = ' . $start);
        }
    }

    /**
     * Ajaxaction to send a message
     */
    public function send_action() {
        if ($_FILES['file'] || ($msg = Request::get('message')) && trim($msg) != "") {

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
    
    public function markRead_action($conversation_id) {
        $conversation = Conversation::find(array($conversation_id, $GLOBALS['user']->id));
        $conversation->readdate = time();
        $conversation->store();
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
        $user = User::findByUsername(utf8_decode(Request::get('username')));
        $avatar = Avatar::getAvatar($user->id)->getImageTag(Avatar::SMALL);
        echo utf8_encode($avatar . " " . $user->getFullName());
        $this->render_nothing();
    }
    
    public function avatar_action() {
        $conversation = Conversation::find(array(Request::get('conversation_id'), $GLOBALS['user']->id));
        $this->avatar = $conversation->getAvatar(Avatar::MEDIUM);
    }

    /**
     * Quicksearch for new user
     * @return quicksearch the quicksearch
     */
    private function createQuickSearch() {
        $quicksearch = QuickSearch::get("user", new StandardSearch("username"))
                ->setInputStyle("width: 200px");
        $quicksearch->fireJSFunctionOnSelect('STUDIP.conversations.new');
        return $quicksearch->render();
    }

    /**
     * Sets up the infobox
     */
    private function setInfoBox() {
        
        $sidebar = Sidebar::get();
        $sidebar->setImage(Assets::image_path("sidebar/smiley-sidebar.png"));

        // Add the Search
        $search = new SidebarWidget;
        $search->addElement(new WidgetElement($this->createQuickSearch()));
        $search->setTitle(_('Suche'));

        // Add the contactlist
        $contacts = new SidebarWidget;
        $contacts->setTitle(_('Gespräche'));
        $contacts->addElement(new WidgetElement("<div id='contact_box'>"));
        foreach (Conversation::updates(time() - self::CONVERSATION_PURGE) as $conv) {
            $this->activateConversation($conv);
            $contacts->addElement(new WidgetElement("<a data-date='$conv->date' data-id='$conv->conversation_id' class='".($conv->readdate < $conv->update->chdate ? 'newMessage' : '')."' href='" . $this->url_for('index/index/' . $conv->conversation_id) . "'>" . $conv->getAvatar() . " $conv->name</a>"));
        }
        $contacts->addElement(new WidgetElement("</div>"));

        $sidebar->addWidget($search, 'search');
        $sidebar->addWidget($contacts, 'contacts');
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

}
