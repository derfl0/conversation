<h1><?= _('Gespräch mit') ?> <span id="username">blablabla</span></h1>
<div id="conversation">
    ladidadidadida
</div>
<textarea id="message" placeholder="<?= _('Neue Nachricht') ?>"></textarea>
<?= _('Senden mit Enter') ?>
<input type="checkbox">
<?= \Studip\Button::create(_('Senden')) ?>

<script>
    var urlSend = '<?= $controller->url_for('index/send') ?>';
    var urlLoadConversations = '<?= $controller->url_for('index/loadConversations') ?>';
    var urlLoadMessages = '<?= $controller->url_for('index/loadMessages') ?>';
</script>