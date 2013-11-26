<?= $output ?>
<form>
     <?= Studip\Button::create(_('Purge'), 'purge') ?>
    <?= Studip\Button::create(_('Simulate'), 'simulate') ?>
<?= Studip\Button::create(_('Migration'), 'migrate') ?>
</form>