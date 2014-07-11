<?php
class UserspecificUpdates extends DBMigration
{
    function up(){
        DBManager::get()->query("ALTER TABLE conversations ADD readdate int(11) NOT NULL DEFAULT '0'");
    }

    function down()
    {
        DBManager::get()->query('ALTER TABLE conversations DROP readdate');
    }

}