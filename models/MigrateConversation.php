<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of Conversation
 *
 * @author intelec
 */
class Conversation {

    public $id;
    public $vorname;
    public $nachname;
    public $avatar;

    public function __construct($username = "") {
        if ($username != "") {
            $this->loadFromUsername();
        }
    }
    
    public function loadAvatar() {
        $this->avatar = Avatar::getAvatar($this->id)->getImageTag(Avatar::SMALL);
    }

    public static function allForUser($user) {
        $conversations = array();
        $db = DBManager::get();
        $sql = "SELECT distinct partner.user_id as id, pmd5.vorname, pmd5.nachname, pmd5.username
            FROM message_user partner 
            JOIN message_user self USING (message_id)
            JOIN auth_user_md5 pmd5 ON (partner.user_id = pmd5.user_id)
            WHERE self.user_id = ?
            AND partner.user_id <> ?";
        $stmt = $db->prepare($sql);
        $stmt->execute(array($user,$user));
        while ($result = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $conv = new Conversation();
            $conv->id = $result['id'];
            $conv->username = $result['username'];
            $conv->vorname = $result['vorname'];
            $conv->nachname = $result['nachname'];
            $conv->loadAvatar();
            $conversations[] = $conv;
        }
        return $conversations;
    }

    public function loadFromUsername($username) {
        $db = DBManager::get();
                $sql = "SELECT user_id as id, vorname, nachname
            FROM auth_user_md5
            WHERE username = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute(array($username));
        if ($result = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $this->id = $result['id'];
            $this->username = $username;
            $this->vorname = $result['vorname'];
            $this->nachname = $result['nachname'];
            $this->loadAvatar();
        }
    }
}

?>
