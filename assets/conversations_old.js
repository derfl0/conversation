var fullheight = 290;
var messages = fullheight + 100;
var current;
var path;

$(window).resize(function() {
    $("#messages").height($(window).height() - messages);
    $("#fullheight").height($(window).height() - fullheight);
});

function reloadConversation() {
    var load = path + 'messages/' + current;
    $("#messages").load(load, scrollDown);
}

function conversationAdd() {
    var id = $("#username_1_realvalue").val();
    var benis = $.post(path + "messages/contact")
            .done(function(data) {
        alert("Data Loaded: " + data);
    });
    $("#allConversations").prepend(benis);
    $("#newid").slideDown();
    return false;
}

function scrollDown() {
    $('#messages').scrollTo('max', 200);
}

$(document).ready(function() {
    $("#messages").height($(window).height() - messages);
    $("#fullheight").height($(window).height() - fullheight);
    path = $("#path").val();

    $(".conversation").click(function() {
        current = $(this).attr('id');
        $(".conversation_active").attr('class', 'conversation');
        $(this).attr('class', 'conversation_active');
        reloadConversation();
    });

    $("#msgsender").keyup(function(e) {
        e = e || event;
        if (e.keyCode === 13 && e.ctrlKey) {
            $.post(path + "send/" + current, {message: $("#msgsender").val()}).done(function(data) {
                reloadConversation();
            });
            $("#msgsender").val("");

        }
        return true;
    });
    
    $(".conversation").eq(1).trigger('click');

    setInterval(reloadConversation, 10000);
});
