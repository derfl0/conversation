var conversation_id = null;
var username = '';
var displayUsername = '';

function newConversation() {
    displayUsername = $('#user_1').val();
    $('#username').html(displayUsername);
    username = $('#user_1_realvalue').val();
}

function workJSON(json) {
    t();
    //alert(json['conversations']);
    //alert(json['messages']);
}

function sendMessage() {
    var message = $('#message').val();
    $('#message').val('');
    $.ajax({
        type: "POST",
        url: urlSend,
        data: {conversation: conversation_id, message: message, username: username},
        dataType: "json"
    }).done(function(msg) {
        workJSON(msg);

    });
}

function setUserSearch() {
    $("#user_1").keyup(function(e) {
        e = e || event;
        if (e.keyCode === 13) {
            newConversation();
        }
        return true;
    });
}

function setMessageSender() {
    $("#message").keyup(function(e) {
        e = e || event;
        if (e.keyCode === 13 && e.ctrlKey) {
            sendMessage();
        }
        return true;
    });
}

$(document).ready(function() {
    setUserSearch();
    setMessageSender();
});

function t() {
    alert('benis');
}