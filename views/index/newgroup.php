<form class="studip_form">
    <label><?= _('Gruppenname') ?>
        <input type="text" placeholder="<?= _('Gruppenname') ?>" required="true" />
    </label>

    <h3><?= _('Gruppenteilnehmer') ?></h3>
    <div id="groupmembers"></div>
    <?= $quicksearch ?>
    <?= \Studip\Button::create(_('Erstellen'), 'create') ?>
</form>
<div style="display: none">
    <article id="<?= $GLOBALS['user']->username ?>">Ignore me :)</article>
</div>

<style>
    article {
        padding: 2px;
    }
</style>

<script>
    function addMember(user, name) {
        if ($('article#' + user).length === 0) {
            $('#groupmembers').append('<article id="' + user + '"><input type="hidden" name="groupuser[]" value="' + user + '" />' + name + '</article>');
            $('#user_1').val('');
        }
    }
</script>