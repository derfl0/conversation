$(document).ready(function() {
    // Captain Hook
    $('#barBottomright ul').prepend($('li#conversations_contact').show());

    // Apply click to all loaded contacts
    $('#conversations_contact a').click(function() {
        $('#conversation_box').toggle();
        $('#conversation').toggleClass('clicked');
    });

    // Open conversations on click
    $('div#contact_box a').click(function() {
        STUDIP.conversations.open($(this).attr('data-id'), $(this).html());
    });

    STUDIP.conversations.cookie.load();
    $.each(STUDIP.conversations.persistent, function(id, value) {
        if (id !== null) {
            STUDIP.conversations.open(id, value.name, value.visible);
        }
    });

});

STUDIP.conversations.cookie = {
    add: function(conversation_id, name, position) {
        STUDIP.conversations.persistent[conversation_id] = {name: name, position: position, visible: true};
        STUDIP.conversations.cookie.store();
    },
    remove: function(conversation_id) {
        delete STUDIP.conversations.persistent[conversation_id];
        STUDIP.conversations.cookie.store();
    },
    toggle: function (conversation_id, visible) {
        if (!STUDIP.conversations.persistent.hasOwnProperty(conversation_id)) {
            return;
        }
        if (arguments.length === 1) {
            visible = !STUDIP.conversations.persistent[conversation_id].visible;
        }
        STUDIP.conversations.persistent[conversation_id].visible = visible;
        STUDIP.conversations.cookie.store();
    },
    load: function() {
        STUDIP.conversations.persistent = {};
        var value = "; " + document.cookie;
        var parts = value.split("; conversations=");
        if (parts.length == 2)
            STUDIP.conversations.persistent = $.parseJSON(parts.pop().split(";").shift());
        if (STUDIP.conversations.persistent === undefined) {
            STUDIP.conversations.persistent = {};
        }
    },
    store: function() {
        document.cookie = "conversations=" + JSON.stringify(STUDIP.conversations.persistent) + "; path=/";
    }
};

STUDIP.conversations.open = function(conversation_id, name, visible) {

    STUDIP.conversations.cookie.add(conversation_id, name);

    var conversation = $('.conversation_window[data-contact="' + conversation_id + '"]');
    if (conversation.length > 0) {
        if (!conversation.is(":visible")) {
            conversation.parent().prepend(conversation);
            conversation.show();
        }
    } else {
        var contact = $('<header>').addClass('conversation_contact').attr('data-contact', conversation_id).click(STUDIP.conversations.markRead(conversation_id));

        // Append the close icon
        contact.append($('<img>').attr('src', STUDIP.ASSETS_URL + 'images/icons/12/blue/decline.png').click(function(event) {
            $(this).parents('.conversation_window').hide();
            STUDIP.conversations.cookie.remove(conversation_id, name, $('.conversation_contact').length);
        }));

        // Append the name
        contact.append($('<a>').html(name).click(function(event) {
            $(this).parent().nextAll().toggle();
        }));
        var conversationWindow = $('<div>').addClass('conversation_window').attr('data-contact', conversation_id);
        var inputContainer = $('<input type="text">').addClass('conversation_input').data('conversation_id', conversation_id);
        var scroll = $('<div>').addClass('scroll').attr('data-id', conversation_id).append('<div class="conversationdisplay" data-id="' + conversation_id + '"></div>');
        conversationWindow.append(contact);
        conversationWindow.append(scroll);
        conversationWindow.append(inputContainer);
        $('#conversations_container').prepend(conversationWindow);

        inputContainer.keypress(function(e) {
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
        });

        STUDIP.conversations.loadMessages(conversation_id);
    }
};

STUDIP.conversations.contact.moveToTop = function(conversation_id) {
    STUDIP.conversations.getContact(conversation_id).insertAfter($('#contact_box header'));
};
