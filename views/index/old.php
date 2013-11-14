<? Navigation::activateItem('/messaging/conversations'); ?>
<div id="fullheight" class="fullheight">
    <div class="conversations">
        <div class="conversation">
            <form onsubmit="return conversationAdd();">
                <?= $quicksearch ?>
            </form>
        </div>
        <div id="allConversations">
            <? foreach ($conversations as $conversation): ?>
                <div class="conversation" id="<?= $conversation->id ?>">
                    <?= $conversation->avatar ?> <?= $conversation->vorname ?>  <?= $conversation->nachname ?>
                </div>
            <? endforeach; ?>
        </div></div>

    <div class="talk">
        <div id="messages" class="messages"></div>
        <div class="bottom">
            <textarea id="msgsender" class="sender"></textarea>
        </div>
    </div>
</div>
<input id="path" type="hidden" value="<?= $path ?>"/>