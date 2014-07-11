<li id="conversations_contact">
    <a id="conversation" class="<?= $newMessages ? 'new' : '' ?>">
    </a>
    <div id="conversation_box">
        <div id="contact_box">
            <? foreach ($conversations as $conversation): ?>
                <a data-id="<?= $conversation->conversation_id ?>" class="<?= $conversation->readdate < $conversation->update->chdate ? 'newMessage' : '' ?>">
                    <?= $conversation->getAvatar() ?> 
                    <?= htmlReady($conversation->name) ?>
                </a>
            <? endforeach ?>
        </div>
        <footer>
            <a href="<?= $url ?>">
                <?= _('Alle Gespräche') ?>
            </a>
        </footer>
    </div>
</li>