$(document).ready(function() {
    $(window).resize(STUDIP.conversations.scroll.recalcSize);

    // Modify sidebar
    $('#talks').closest('td').attr('colspan', 2).prev('td').remove();

    // Apply opening
    $('#talks a').click(function(event) {
        event.preventDefault();
        var contact = $(this).find('div');
        STUDIP.conversations.open(contact.attr('data-conversation_id'), contact.html());
    });
});

STUDIP.conversations.open = function(conversation_id, name) {

    //hide all conversations
    $('.conversation_contact').hide();

    var conversation = $('.scroll[data-id="' + conversation_id + '"]');
    if (conversation.length > 0) {
        $('.conversation_contact[data-contact="' + conversation_id + '"]').show();
    } else {
        var contact = $('<div>').addClass('conversation_contact').attr('data-contact', conversation_id);

        // Append header
        contact.append($('<h1>').addClass('head').html('Gespräch mit ' + name));

        var conversationWindow = $('<div>').addClass('conversation_window');
        var inputContainer = '<div class="message_footer"><div class="enterbutton"><label>Senden mit Enter <input id="sendWithEnter" checked="" type="checkbox"></label><br><button type="submit" class="button" name="send">Senden</button></div><div id="message">' +
                '<textarea id="message_input" placeholder="Neue Nachricht"></textarea></div></div>';
        var scroll = $('<div>').addClass('scroll').attr('data-id', conversation_id).append('<div class="conversationdisplay" data-id="' + conversation_id + '"></div>');
        conversationWindow.append(scroll);
        conversationWindow.append(inputContainer);
        contact.append(conversationWindow);
        $('#main').append(contact);

        /*inputContainer.keypress(function(e) {
         e = e || event;
         if (e.keyCode === 13) {
         STUDIP.conversations.updateContact(conversation_id);
         var input = $(this).val();
         $.ajax({
         type: "POST",
         url: STUDIP.conversations.getUrl('index/send'),
         data: {conversation: conversation_id, message: input},
         dataType: "json"
         }).done(function(msg) {
         STUDIP.conversations.work(msg);
         });
         $(this).val('');
         }
         });*/

        STUDIP.conversations.scroll.recalcSize();
        STUDIP.conversations.loadMessages(conversation_id);
    }
};

// Set reserved heigth;
STUDIP.conversations.reservedHeight = 392;

STUDIP.conversations.scroll.recalcSize = function() {
    $(".scroll").height($(window).outerHeight(true) - STUDIP.conversations.reservedHeight);
};