<?php
class UserspecificUpdates extends DBMigration
{
    function up(){
        DBManager::get()->query("ALTER TABLE conversations ADD readdate int(11) NOT NULL DEFAULT '0'");
        StudipAutoloader::addAutoloadPath(__DIR__ . '/../models');
        Conversation::expireTableScheme();
    }

    function down()
    {
        DBManager::get()->query('ALTER TABLE conversations DROP readdate');
    }

}