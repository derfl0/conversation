$(document).ready(function() {
    $(window).resize(STUDIP.conversations.recalcSize);
    STUDIP.conversations.recalcSize();
    $("#user_1").click(function() {
        $(this).val('');
    });
    STUDIP.conversations.setMessageSender();
    STUDIP.conversations.conversation.apply();

    // If we were given a conversation to start with
    if (STUDIP.conversations.startingPoint !== 0) {
        $('.conversation[data-conversation_id=' + STUDIP.conversations.startingPoint + ']').click();
    } else {
        $('.conversation:first').click();
    }

    // Modify sidebar
    $('#talks').closest('td').attr('colspan', 2).prev('td').remove();
});

STUDIP