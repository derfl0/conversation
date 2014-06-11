STUDIP.conversations.contact = {
    init: function() {
        $('#conversations_contact').click(function() {
            if ($('#contact_box').length > 0) {
                $('#contact_box').toggle();
            } else {
                $(this).append('<div id="contact_box"></div>');
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
        $.each(json, function(name, value) {
            $('#contact_box').append($('<p>'+value+'</p>'));
        });
    }
};

STUDIP.conversations.everywhere = {
    loadUrl: STUDIP.conversations.getUrl("everywhere/conversation"),
    open: function(conversation_id) {
                        $.ajax({
                    type: "GET",
                    url: STUDIP.conversations.contact.loadUrl,
                    dataType: "json"
                }).done(function(json) {
                    console.log(json);
                    STUDIP.conversations.contact.parseJson(json);
                });
        $('#layout_footer ul').prepend($('<li class="conversation"><a>Kontakte</a></li>'));
    }
}

$(document).ready(function() {
    // Captain Hook
    $('#layout_footer ul').prepend($('<li id="conversations_contact"><a>Kontakte</a></li>'));
    STUDIP.conversations.contact.init();
    //STUDIP.conversations.startup();
});