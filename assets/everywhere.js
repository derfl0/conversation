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
                    console.log(json);
                    STUDIP.conversations.contact.parseJson(json);
                });
            }
        });
    },
    parseJson: function(json) {
        $.each(json, function(id, value) {
            $('#contact_box').append($('<p>' + value + '</p>').click(function() {
                STUDIP.conversations.everywhere.open(id);
            }));
        });
    }
};

STUDIP.conversations.everywhere = {
    open: function(conversation_id) {
        /*$.ajax({
            type: "GET",
            url: STUDIP.conversations.getUrl("everywhere/conversation"),
            dataType: "json"
        }).done(function(json) {
            console.log(json);
            STUDIP.conversations.contact.parseJson(json);
        });*/
        $('#layout_footer ul').prepend($('<li class="conversation"><a>'+conversation_id+'</a></li>'));
    }
},

$(document).ready(function() {
    // Captain Hook
    $('#layout_footer ul').prepend($('<li id="conversations_contact"><a>Kontakte</a></li>'));
    STUDIP.conversations.contact.init();
    //STUDIP.conversations.startup();
});