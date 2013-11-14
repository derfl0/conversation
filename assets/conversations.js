var conversation_id = null;
var username = '';
var displayUsername = '';

function newConversation() {
    displayUsername = $('#user_2').val();
    $('#username').html(displayUsername);
        username = $('#user_2_realvalue').val();
    alert(username);
}

function sendMessage() {
    var message = $('#message').val();
    $('#message').val('');
    $.ajax({
        type: "POST",
        url: urlSend,
        data: {conversation: conversation_id, message: message, username: username},
        //dataType: "json"
    }).done(function(msg) {
        alert(msg);
        
    });
}

$(document).ready(function() {
    $("#user_2").keyup(function(e) {
        e = e || event;
        if (e.keyCode === 13) {
            //
            newConversation();
        }
        return true;
    });

    $("#message").keyup(function(e) {
        e = e || event;
        if (e.keyCode === 13 && e.ctrlKey) {
            sendMessage();
        }
        return true;
    });

});
