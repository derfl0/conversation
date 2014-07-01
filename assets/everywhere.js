$(document).ready(function() {
    // Captain Hook
    $('#layout_footer ul').prepend($('<li id="conversations_contact"><a>Kontakte</a></li>'));

    // Apply click to all loaded contacts
    $('#conversations_contact a').click(function() {
        if ($('#contact_box').length > 0) {
            $('#contact_box').toggle();
        } else {
            $(this).parent().append($('<div>').attr('id', 'contact_box').append($('<header>').append($('<a>').attr('href', STUDIP.conversations.getUrl('')).html('Gespräche'))));
            $.ajax({
                type: "GET",
                url: STUDIP.conversations.getUrl("everywhere/contacts"),
                dataType: "json"
            }).done(function(json) {
                $.each(json.conversations, function(id, value) {
                    $('#contact_box').append($('<a>' + value.name + '</a>').addClass('contact').attr('data-id', value.id).click(function() {
                        STUDIP.conversations.open(value.id, value.name);
                    }));
                });
            });
        }
    });
    
    STUDIP.conversations.cookie.load();
    $.each(STUDIP.conversations.persistent, function(id, value) {
        if (id !== null) {
            STUDIP.conversations.open(id, value.name);
        }
    });

});

STUDIP.conversations.cookie = {
    add: function(conversation_id, name, position) {
        STUDIP.conversations.persistent[conversation_id] = {name: name, position: position};
        STUDIP.conversations.cookie.store();
    },
    remove: function(conversation_id) {
        delete STUDIP.conversations.persistent[conversation_id];
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

STUDIP.conversations.open = function(conversation_id, name) {

    STUDIP.conversations.cookie.add(conversation_id, name);

    var conversation = $('.conversation_contact[data-contact="' + conversation_id + '"]');
    if (conversation.length > 0) {
        if (!conversation.is(":visible")) {
            conversation.parent().prepend(conversation);
            conversation.show();
        }
    } else {
        var contact = $('<li>').addClass('conversation_contact').attr('data-contact', conversation_id);

        // Append the close icon
        contact.append($('<img>').attr('src', STUDIP.ASSETS_URL + 'images/icons/12/blue/decline.png').click(function(event) {
            $(this).parent('li').hide();
            STUDIP.conversations.cookie.remove(conversation_id, name, $('.conversation_contact').length);
        }));

        // Append the name
        contact.append($('<a>').html(name).click(function(event) {
            $(this).next('.conversation_window').toggle();
        }));
        var conversationWindow = $('<div>').addClass('conversation_window');
        var inputContainer = $('<input type="text">').addClass('conversation_input').data('conversation_id', conversation_id);
        var scroll = $('<div>').addClass('scroll').attr('data-id', conversation_id).append('<div class="conversationdisplay" data-id="' + conversation_id + '"></div>');
        conversationWindow.append(scroll);
        conversationWindow.append(inputContainer);
        contact.append(conversationWindow);
        $('#layout_footer ul').prepend(contact);

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
