<?php

require_once 'bootstrap.php';

/**
 * Raumbelegung - Plugin zur Anzeige aller Raumbelegungen an einem Tag
 *
 * Das Raumbelegungsplugin zeigt alle Termine geornet nach Raum und Zeit in
 * einer Liste oder einer Tabelle an. Root verfügt über die 
 * Einstellungsmöglichkeit, Raume und deren Oberkategorien auszublenden, bzw
 * diese zu ordnen.
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of
 * the License, or (at your option) any later version.
 *
 * @author      Florian Bieringer <florian.bieringer@uni-passau.de>
 * @license     http://www.gnu.org/licenses/gpl-2.0.html GPL version 2
 * @category    Stud.IP
 */
class Conversations extends StudipPlugin implements SystemPlugin {

    function __construct() {
        parent::__construct();
        if (!Request::isXhr()) {
            $navigation = Navigation::getItem('/messaging');
            $conversation_navi = new AutoNavigation(_('Gespräche'), PluginEngine::getUrl('Conversations/index'));
            $navigation->addSubNavigation('conversations', $conversation_navi);

            // since we dont need to migrate all messages we dont need an admin menu anymore
            /*if ($GLOBALS['perm']->have_perm('root')) {
                Navigation::addItem('/admin/config/conversations', new AutoNavigation(_('Gespräche'), PluginEngine::getUrl('Conversations/admin')));
            }*/
        } else {
            $this->update();
        }
    }

    function perform($unconsumed_path) {
        PageLayout::addStylesheet($this->getPluginURL() . "/assets/style.css");
        PageLayout::addScript($this->getPluginURL() . "/assets/conversations.js");
        PageLayout::addScript($this->getPluginURL() . "/assets/dragndrop.js");
        $this->setupAutoload();
        $dispatcher = new Trails_Dispatcher(
                $this->getPluginPath(), rtrim(PluginEngine::getLink($this, array(), null), '/'), 'index'
        );
        $dispatcher->plugin = $this;
        $dispatcher->dispatch($unconsumed_path);
    }

    private function setupAutoload() {
        if (class_exists("StudipAutoloader")) {
            StudipAutoloader::addAutoloadPath(__DIR__ . '/models');
        } else {
            spl_autoload_register(function ($class) {
                        include_once __DIR__ . $class . '.php';
                    });
        }
    }

    private function update() {
        $this->setupAutoload();
        if ($updated = Conversation::updates($_SESSION['conversations']['last_update'] - 3)) {
            foreach ($updated as $updatedConv) {
                $updatedConv->activate();
                $updatedConv->decode($result);
                $lastUpdate = min(array($_SESSION['conversations']['last_update'], $updatedConv->update->chdate));
                $messages = ConversationMessage::findBySQL('conversation_id = ? AND mkdate >= ?', array($updatedConv->conversation_id, $_SESSION['conversations']['last_update']));
                $messages = SimpleORMapCollection::createFromArray($messages);
                foreach ($messages->orderBy('mkdate ASC') as $message) {
                    $message->decode($result);
                }
                // update online users
                foreach (get_users_online() as $online) {
                    //if we have a conversation with the user activate id!
                    if ($_SESSION['conversations']['online'][$online['user_id']]) {
                        $result[$_SESSION['conversations']['online'][$online['user_id']]] = true;
                    }
                }
                $result['online'] = array_keys($result);
            }
            // update the send of the last update
            $_SESSION['conversations']['last_update'] = time();
        }
        UpdateInformation::setInformation("conversations.update", $result);
    }

}
?>
