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
        contact.append($('<h1>').addClass('head').html('Gespr�ch mit ' + name));

        var conversationWindow = $('<div>').addClass('conversation_window');

        // Create footer
        var inputContainer = $('<div>').addClass('message_footer');
        inputContainer.append('<div class="message_footer"><div class="enterbutton"><label>Senden mit Enter <input class="sendWithEnter" checked="" type="checkbox"></label><br><button type="submit" class="button" name="send">Senden</button></div><div id="message">' +
                '<textarea class="message_input" placeholder="Neue Nachricht"></textarea></div>');
        var scroll = $('<div>').addClass('scroll').attr('data-id', conversation_id).append('<div class="conversationdisplay" data-id="' + conversation_id + '"></div>');
        conversationWindow.append(scroll);
        conversationWindow.append(inputContainer);
        contact.append(conversationWindow);
        $('#main').append(contact);

        inputContainer.find(".message_input").keyup(function(e) {
            e = e || event;
            if (e.keyCode === 13) {
                if (inputContainer.find('.sendWithEnter').prop('checked') !== (e.ctrlKey || e.shiftKey)) {
                    STUDIP.conversations.message.send(conversation_id, $(this).val());
                    $(this).val('');
                }
            }
        });
        inputContainer.find("button[name='send']").click(function() {
            var input = inputContainer.find('.message_input');
            STUDIP.conversations.message.send(conversation_id, input.val());
            input.val('');
        });

        STUDIP.conversations.scroll.recalcSize();
        STUDIP.conversations.loadMessages(conversation_id);
    }
};

STUDIP.conversations.new = function(username) {

    // load real name
    var name = '';
    $.ajax({
        type: "POST",
        url: STUDIP.conversations.getUrl('index/nameFromUsername'),
        data: {username: username}
    }).done(function(msg) {
        name = msg;
        $('input[name="user_parameter"]').val('');

        //hide all conversations
        $('.conversation_contact').hide();
        var contact = $('<div>').addClass('conversation_contact').attr('data-contact', username);

        // Append header
        contact.append($('<h1>').addClass('head').html('Gespr�ch mit ' + name));

        var conversationWindow = $('<div>').addClass('conversation_window');

        // Create footer
        var inputContainer = $('<div>').addClass('message_footer');
        inputContainer.append('<div class="message_footer"><div class="enterbutton"><label>Senden mit Enter <input class="sendWithEnter" checked="" type="checkbox"></label><br><button type="submit" class="button" name="send">Senden</button></div><div id="message">' +
                '<textarea class="message_input" placeholder="Neue Nachricht"></textarea></div>');
        var scroll = $('<div>').addClass('scroll').attr('data-id', username).append('<div class="conversationdisplay" data-id="' + username + '"></div>');
        conversationWindow.append(scroll);
        conversationWindow.append(inputContainer);
        contact.append(conversationWindow);
        $('#main').append(contact);

        inputContainer.find(".message_input").keyup(function(e) {
            e = e || event;
            if (e.keyCode === 13) {
                if (inputContainer.find('.sendWithEnter').prop('checked') !== (e.ctrlKey || e.shiftKey)) {
                    STUDIP.conversations.message.send(null, $(this).val(), username);
                    $(this).val('');
                }
            }
        });
        inputContainer.find("button[name='send']").click(function() {
            var input = inputContainer.find('.message_input');
            STUDIP.conversations.message.send(null, input.val(), username);
            input.val('');
        });

        STUDIP.conversations.scroll.recalcSize();

    });
};

// Set reserved heigth;
STUDIP.conversations.reservedHeight = 392;

STUDIP.conversations.scroll.recalcSize = function() {
    $(".scroll").height($(window).outerHeight(true) - STUDIP.conversations.reservedHeight);
};