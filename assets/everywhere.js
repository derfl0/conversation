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
            var contact = $('<li>').addClass('conversation_contact');
            contact.append($('<a>').html(name));
            var conversationWindow = $('<div>').addClass('conversation_window');
            conversationWindow.append($('<div>').addClass('scroll').attr('data-id', conversation_id).append('<div class="conversationdisplay" data-id="' + conversation_id + '"></div>'));
            contact.append(conversationWindow);
            $('#layout_footer ul').prepend(contact);
            STUDIP.conversations.work(json);
        });
    }
},
$(document).ready(function() {
    // Captain Hook
    $('#layout_footer ul').prepend($('<li id="conversations_contact"><a>Kontakte</a></li>'));
    STUDIP.conversations.contact.init();

});