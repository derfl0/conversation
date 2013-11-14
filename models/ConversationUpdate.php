<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of ConversationUser
 *
 * @author intelec
 */
class ConversationUpdate extends SimpleORMap {
    public function __construct($id = null) {
        $this->db_table = 'conversations_update';
        parent::__construct($id);
    }
}

?>
