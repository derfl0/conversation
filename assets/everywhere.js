STUDIP.conversations.contact = {
    init: function() {
        $('#conversations_contact a').click(function() {
            if ($('#contact_box').length > 0) {
                $('#contact_box').toggle();
            } else {
                $(this).parent().append($('<div>').attr('id', 'contact_box').append($('<header>').append($('<a>').attr('href', STUDIP.conversations.getUrl('')).html('Gespr�che'))));
                $.ajax({
                    type: "GET",
                    url: STUDIP.conversations.getUrl("everywhere/contacts"),
                    dataType: "json"
                }).done(function(json) {
                    STUDIP.conversations.contact.parseJson(json.conversations);
                });
            }
        });

    },
    parseJson: function(json) {
        $.each(json, function(id, value) {
            console.log(value);
            $('#contact_box').append($('<p>' + value.name + '</p>').addClass('contact').attr('data-id', value.id).click(function() {
                STUDIP.conversations.open(value.id, value.name);
            }));
        });
    }
};

STUDIP.conversations.open = function(conversation_id, name) {
    var conversation = $('.conversation_contact[data-contact="' + conversation_id + '"]');
    if (conversation.length > 0) {
        conversation.show();
    } else {
        var contact = $('<li>').addClass('conversation_contact').attr('data-contact', conversation_id);

        // Append the close icon
        contact.append($('<img>').attr('src', STUDIP.ASSETS_URL+'images/icons/12/blue/decline.png').click(function(event) {
            $(this).parent('li').hide();
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

$(document).ready(function() {
    // Captain Hook
    $('#layout_footer ul').prepend($('<li id="conversations_contact"><a>Kontakte</a></li>'));
    STUDIP.conversations.contact.init();

});