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

    //Delay between onlinechecks
    const ONLINE_CHECK_DELAY = 10;

    function __construct() {
        parent::__construct();
        if (UpdateInformation::isCollecting()) {
            $this->update();
        } else {
            $navigation = Navigation::getItem('/messaging');
            $conversation_navi = new AutoNavigation(_('Gespräche'), PluginEngine::getUrl('conversations/index'));
            $navigation->addSubNavigation('conversations', $conversation_navi);
        }

        // if conversations is everywhere load it everywhere
        if (Config::get()->CONVERSATIONS_EVERYWHERE) {
            PageLayout::addStylesheet($this->getPluginURL() . "/assets/everywhere.css");
            PageLayout::addScript($this->getPluginURL() . "/assets/conversations.js");
            PageLayout::addScript($this->getPluginURL() . "/assets/everywhere.js");
        }
    }

    function perform($unconsumed_path) {
        PageLayout::addStylesheet($this->getPluginURL() . "/assets/style.css");
        PageLayout::addScript($this->getPluginURL() . "/assets/conversations.js");
        PageLayout::addScript($this->getPluginURL() . "/assets/dragndrop.js");

        //chose style
        $styles = glob(__DIR__ . "/styles/*");
        if ($styles) {
            if (count($styles) > 1) {
                
            } else {
                PageLayout::addStylesheet($this->getPluginURL() . "/styles/" . basename($styles[0]));
            }
        } else {
            throw new Exception("No style found");
        }


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
        if (stripos(Request::get("page"), "plugins.php/conversations") !== false) {
            $this->setupAutoload();

            // Load parameters
            $params = Request::getArray("page_info");
            $lastUpdateTime = $params['conversations']['lastUpdate'];

            if ($updated = Conversation::updates($lastUpdateTime - 1)) {
                foreach ($updated as $updatedConv) {
                    $updatedConv->activate();
                    $updatedConv->decode($result);
                    $lastUpdate = min(array($lastUpdateTime, $updatedConv->update->chdate));

                    // Decode our messages into the result
                    $messages = ConversationMessage::findBySQL('conversation_id = ? AND mkdate >= ?', array($updatedConv->conversation_id, $lastUpdate));
                    foreach ($messages as $message) {
                        $message->decode($result);
                    }
                }
                // update the send of the last update
                $result['lastUpdate'] = time();
            }
            if ($_SESSION['conversations']['last_onlinecheck'] < time() - self::ONLINE_CHECK_DELAY) {
                $_SESSION['conversations']['last_onlinecheck'] = time();
                $_SESSION['conversations']['last_online_cache'] = Conversation::getOnlineConversations();
            }
            $result['online'] = $_SESSION['conversations']['last_online_cache'];
            UpdateInformation::setInformation("conversations.update", $result);
        }
    }

}

?>
