STUDIP.conversations.contact = {
    init: function() {
        $('#conversations_contact a').click(function() {
            if ($('#contact_box').length > 0) {
                $('#contact_box').toggle();
            } else {
                $(this).parent().append('<div id="contact_box"></div>');
                $.ajax({
                    type: "GET",
                    url: STUDIP.conversations.getUrl("everywhere/contacts"),
                    dataType: "json"
                }).done(function(json) {
                    STUDIP.conversations.contact.parseJson(json);
                });
            }
        });

    },
    parseJson: function(json) {
        $.each(json, function(id, value) {
            $('#contact_box').append($('<p>' + value + '</p>').click(function() {
                STUDIP.conversations.everywhere.open(id, value);
            }));
        });
    }
};

STUDIP.conversations.everywhere = {
    open: function(conversation_id, name) {
        $.ajax({
            type: "GET",
            url: STUDIP.conversations.getUrl("index/loadMessages"),
            data: {conversation: conversation_id},
            dataType: "json"
        }).done(function(json) {
            var contact = $('<li>').addClass('conversation_contact').attr('data-contact', conversation_id);
            
            // Append the close icon
            contact.append($('<a>').html('[X]').click(function(event) {
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
            STUDIP.conversations.work(json);

            // Bind keypress event
            inputContainer.keypress(function(e) {
                e = e || event;
                if (e.keyCode === 13) {
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
        });
    }
},
$(document).ready(function() {
    // Captain Hook
    $('#layout_footer ul').prepend($('<li id="conversations_contact"><a>Kontakte</a></li>'));
    STUDIP.conversations.contact.init();

});