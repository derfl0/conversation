$(document).ready(function() {
    $(window).resize(STUDIP.conversations.scroll.recalcSize);

    // Modify sidebar
    $('#contact_box').closest('td').attr('colspan', 2).prev('td').remove();

    // Apply opening
    $('#contact_box a').click(function(event) {
        event.preventDefault();

        $(this).removeClass('newMessage');

        //hide all conversations
        $('.conversation_contact').hide();
        STUDIP.conversations.open($(this).attr('data-id'), $(this).html());
    });

    // And open first chat
    if (STUDIP.conversations.openConversation) {
        $('#contact_box a[data-id="' + STUDIP.conversations.openConversation + '"]').click();
    } else {
        $('#contact_box a:first').click();
    }
});

STUDIP.conversations.open = function(conversation_id, name) {
    var contact = $('.conversation_contact[data-contact="' + conversation_id + '"]');
    if (contact.length === 0) {
        contact = $('<div>').hide().addClass('conversation_contact').attr('data-contact', conversation_id);

        // Append header
        contact.append($('<h1>').addClass('head').html('Gespräch mit ' + name));

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

    // show the contact if nothing is visible
    if ($('.conversation_contact:visible').length === 0) {
        contact.show();
        STUDIP.conversations.loadAvatar(conversation_id);
    }
};

STUDIP.conversations.loadAvatar = function(conversation_id) {
    $.ajax({
        type: "GET",
        url: STUDIP.conversations.getUrl("index/avatar"),
        data: {conversation_id: conversation_id},
        dataType: "html"
    }).done(function(html) {
        $('.sidebar-image').remove('.sidebar-context');
        $('.sidebar-image').append(html);
    });
};

STUDIP.conversations.updateContact = function(conversation_id, name) {
    var contact = STUDIP.conversations.getContact(conversation_id);

    // Create contact if not existing
    if (contact.length === 0) {
        contact = $('<a>').attr('data-id', conversation_id).html(name).attr('href', STUDIP.conversations.getUrl('index/index/' + conversation_id)).click(function(event) {
            event.preventDefault();
            $(this).removeClass('newMessage');
            $('.conversation_contact').hide();
            STUDIP.conversations.open(conversation_id, name);
        });
    }
    contact.prependTo($('#contact_box'));


    // check if we need to apply the newMessage thingy
    if ($('.scroll[data-id="' + conversation_id + '"]:visible').length === 0) {
        contact.addClass('newMessage');
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
        contact.append($('<h1>').addClass('head').html('Gespräch mit ' + name));

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
                    $(this).parents('div.conversation_contact[data-contact="' + username + '"]').remove();
                }
            }
        });
        inputContainer.find("button[name='send']").click(function() {
            var input = inputContainer.find('.message_input');
            STUDIP.conversations.message.send(null, input.val(), username);
            $(this).parents('div.conversation_contact[data-contact="' + username + '"]').remove();
        });

        STUDIP.conversations.scroll.recalcSize();

    });
};

// Set reserved heigth;
STUDIP.conversations.reservedHeight = 392;

STUDIP.conversations.scroll.recalcSize = function() {
    $(".scroll").height($(window).outerHeight(true) - STUDIP.conversations.reservedHeight);
};
