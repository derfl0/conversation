# Export von Tabelle conversation_messages
# ------------------------------------------------------------

CREATE TABLE `conversation_messages` (
  `message_id` int(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` int(11) NOT NULL,
  `author_id` varchar(32) COLLATE latin1_german1_ci NOT NULL,
  `text` text COLLATE latin1_german1_ci NOT NULL,
  `chdate` int(11) NOT NULL,
  `mkdate` int(11) NOT NULL,
  `file` varchar(32) COLLATE latin1_german1_ci DEFAULT NULL,
  PRIMARY KEY (`message_id`)
);



# Export von Tabelle conversations
# ------------------------------------------------------------

CREATE TABLE `conversations` (
  `conversation_id` int(11) NOT NULL,
  `user_id` varchar(32) COLLATE latin1_german1_ci NOT NULL,
  `name` varchar(255) COLLATE latin1_german1_ci DEFAULT NULL,
  PRIMARY KEY (`conversation_id`,`user_id`)
);



# Export von Tabelle conversations_update
# ------------------------------------------------------------

CREATE TABLE `conversations_update` (
  `conversation_id` int(11) NOT NULL AUTO_INCREMENT,
  `mkdate` int(11) NOT NULL,
  `chdate` int(11) NOT NULL,
  PRIMARY KEY (`conversation_id`)
);
