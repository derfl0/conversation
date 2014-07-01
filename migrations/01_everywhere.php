<?php
class Everywhere extends DBMigration
{
    function up(){
                Config::get()->create('CONVERSATIONS_EVERYWHERE', array(
            'value' => 1,
            'is_default' => 1,
            'type' => 'boolean',
            'range' => 'global',
            'section' => 'global',
            'description' => _('Quickmessaging')
        ));
    }

    function down()
    {
        Config::get()->delete('CONVERSATIONS_EVERYWHERE');
    }

}