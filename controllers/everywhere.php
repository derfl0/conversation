<?php

require_once 'app/controllers/studip_controller.php';

class EverywhereController extends StudipController {

    const MESSAGES_LOAD = 50; //how many messages should be loaded on first open and on backscroll
    const CONVERSATION_PURGE = 5184000; // After how many days of inactivity should a conversation disapear (initial 60 days)

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
    public function index_action($start = null) {

        Navigation::activateItem('/messaging/conversations');

        //clear session savings
        $_SESSION['conversations']['online'] = array();
        $_SESSION['conversations']['conversations'] = array();
        $_SESSION['conversations']['last_onlinecheck'] = 0;
        $this->setInfoBox();

        // Set the starting point
        $this->start = $start ? : 0;
    }

    public function contacts_action() {
        foreach (Conversation::updates(time() - self::CONVERSATION_PURGE) as $conv) {
            $conversations[$conv->id] = $conv->name;
        }
        $this->render_json($conversations);
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
