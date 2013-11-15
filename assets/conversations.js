var conversation_id = null;
var username = '';
var displayUsername = '';
var reloadTimer = 1000;

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
    if ($("div [data-message_id='" + msg['id'] + "']").length <= 0) {
        if (msg['author'] == myId) {
            $("div [data-id='" + msg['conversation'] + "']").append('<div class="message mine" data-from="' + msg['author'] + '" data-message_id="' + msg['id'] + '">' + msg['text'] + '</div>');
        } else {
            $("div [data-id='" + msg['conversation'] + "']").append('<div class="message other" data-from="' + msg['author'] + '" data-message_id="' + msg['id'] + '">' + msg['text'] + '</div>');
        }
    }
}

function applyConversation() {
    $('.new_conv').click(function() {
        conversation_id = $(this).attr('data-conversation_id');
        $('#username').html($(this).html());
        startConversation();
        loadMessages();
    });
    $('.new_conv').removeClass('new_conv');
}

function startConversation() {
    $("div .conversationdisplay:not([data-id='" + conversation_id + "'])").hide(200);
    if ($("div [data-id='" + conversation_id + "']").length <= 0) {
        $('#conversation').append('<div class="conversationdisplay" data-id="' + conversation_id + '"></div>');
    } else {
        $("div [data-id='" + conversation_id + "']").show(200);
    }
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

function update() {
    $.ajax({
        type: "POST",
        url: urlUpdate,
        data: {},
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
    setInterval(update, reloadTimer);
});

function t() {
    alert('benis');
}

function d(test) {
    alert(JSON.stringify(test));
}