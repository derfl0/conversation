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
    /*
     *  Ein Systemplugin wird auf JEDER Seite geladen (Konstruiert) deshalb
     * erzeugen wir hier den Navigationspunkt
     */

    function __construct() {
        parent::__construct();
        $navigation = Navigation::getItem('/messaging');
        $conversation_navi = new AutoNavigation(_('Gespräche'), PluginEngine::getUrl('Conversations/index'));
        $navigation->addSubNavigation('conversations', $conversation_navi);
    }

    function perform($unconsumed_path) {
        PageLayout::addStylesheet($this->getPluginURL() . "/assets/style.css");
        PageLayout::addScript($this->getPluginURL() . "/assets/conversations.js");
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

}

?>
