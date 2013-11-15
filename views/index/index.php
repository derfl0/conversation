<h1><?= _('Gespräch mit') ?> <span id="username">blablabla</span></h1>
<div id="conversation"></div>
<textarea id="message" placeholder="<?= _('Neue Nachricht') ?>"></textarea>
<div class="enterbutton" style="display: none">
<?= \Studip\Button::create(_('Senden')) ?>
</div>
<script>
    var urlSend = '<?= $controller->url_for('index/send') ?>';
    var urlLoadConversations = '<?= $controller->url_for('index/loadConversations') ?>';
    var urlLoadMessages = '<?= $controller->url_for('index/loadMessages') ?>';
    var myId = '<?= $GLOBALS['user']->id ?>';
</script>