var conversation_id = null;
var username = '';
var displayUsername = '';

function newConversation() {
    displayUsername = $('#user_1').val();
    $('#username').html(displayUsername);
    username = $('#user_1_realvalue').val();
}

function loadMessages() {
    $.ajax({
        type: "POST",
        url: urlLoadMessages,
        data: {conversation: conversation_id},
        dataType: "json"
    }).done(function(msg) {
        workJSON(msg);
    });
}

function workJSON(json) {
    var conversations = json['conversations'];
    if (conversations) {
        $.each(conversations, function() {
            workConversation(this);
        });
    }
    var messages = json['messages'];
    if (messages) {
        $.each(messages, function() {
            workMessage(this);
        });
    }

}

function workConversation(conv) {
    $('#no_talks').hide();
    if ($("div [data-conversation_id='" + conv['id'] + "']").length > 0) {

    } else {
        $('#talks').append('<div class="new_conv" data-conversation_id="' + conv['id'] + '">' + conv['name'] + '</div>');
    }
}

function workMessage(msg) {
    if ($("div [data-message_id='" + msg['id'] + "']").length > 0) {

    } else {
        $('#conversation').append('<div class="arrow_box" data-message_id="' + msg['id'] + '">' + msg['text'] + '</div>');
    }
}

function applyConversation() {
    $('.new_conv').click(function() {
        conversation_id = $(this).attr('data-conversation_id');
        $('#username').html($(this).html());
        loadMessages();
    });
    $('.new_conv').removeClass('new_conv');
}

function loadConversations() {
    $.ajax({
        type: "POST",
        url: urlLoadConversations,
        data: {},
        dataType: "json"
    }).done(function(msg) {
        workJSON(msg);
        applyConversation();
    });
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
    loadConversations();
});

function t() {
    alert('benis');
}

function d(test) {
    alert(JSON.stringify(test));
}