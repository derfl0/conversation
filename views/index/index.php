<div id="main" <?= $hasConversations ? "" : "style='display: none;'" ?>>
    <h1 id="head"><?= _('Gespräch mit') ?> <span id="username"></span></h1>
    <div id="conversation">
        
    </div>
    <div class="message_footer">
        <div class="enterbutton">           
            <label>Senden mit Enter <input type="checkbox" id="sendWithEnter" CHECKED /></label><br>
            <?= \Studip\Button::create(_('Senden'), 'send') ?>
        </div>
        <div id="message">
            <textarea id="message_input" placeholder="<?= _('Neue Nachricht') ?>"></textarea>
        </div>
    </div>
</div>
<script>
    var urlSend = '<?= $controller->url_for('index/send') ?>';
    var urlLoadMessages = '<?= $controller->url_for('index/loadMessages') ?>';
    var urlLoadUsername = '<?= $controller->url_for('index/nameFromUsername') ?>';
    var myId = '<?= $GLOBALS['user']->username ?>';
    STUDIP.conversations.lastUpdate = <?= time() ?>;
</script>