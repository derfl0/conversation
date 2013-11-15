<div id="debug" style="background-color: #c4c4c4; position: fixed;"></div>
<h1 <?= $hasConversations ? "" : "style='display: none;'" ?>><?= _('Gespräch mit') ?> <span id="username"></span></h1>
<div id="conversation"></div>
<textarea  <?= $hasConversations ? "" : "style='display: none;'" ?> id="message" placeholder="<?= _('Neue Nachricht') ?>"></textarea>
<div class="enterbutton" style="display: none">
<?= \Studip\Button::create(_('Senden')) ?>
</div>
<script>
    var urlSend = '<?= $controller->url_for('index/send') ?>';
    var urlLoadConversations = '<?= $controller->url_for('index/loadConversations') ?>';
    var urlLoadMessages = '<?= $controller->url_for('index/loadMessages') ?>';
    var urlUpdate = '<?= $controller->url_for('index/update') ?>';
    var myId = '<?= $GLOBALS['user']->username ?>';
</script>