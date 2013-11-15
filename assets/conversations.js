var conversation_id = null;
var username = '';
var displayUsername = '';
var reloadTimer = 1000;
var fullheight = 420;

$(window).resize(recalcSize);

function recalcSize() {
    $("#conversation").height($(window).height() - fullheight);
}

function newConversation() {
    displayUsername = $('#user_1').val();
    $('#user_1').val('');
    $('#username').html(displayUsername);
    username = $('#user_1_realvalue').val();
    $('#user_1_realvalue').val('');
    conversation_id = null;
    $("div .conversationdisplay").hide(200);
    $('#message').show();
    $('#head').show();
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
    if (json !== null) {
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
}

function workConversation(conv) {
    $('#no_talks').hide();
    if ($("div [data-conversation_id='" + conv['id'] + "']").length <= 0) {
        $('#talks').append('<div class="new_conv" data-conversation_id="' + conv['id'] + '">' + conv['name'] + '</div>');
        applyConversation();
        if (!conversation_id) {
            $("div [data-conversation_id='" + conv['id'] + "']").click();
        }
    }
}

function workMessage(msg) {
    if ($("div [data-message_id='" + msg['id'] + "']").length <= 0) {
        if (msg['author'] == myId) {
            $("div [data-id='" + msg['conversation'] + "']").append('<div class="message mine" data-from="' + msg['author'] + '" data-message_id="' + msg['id'] + '">' + msg['text'] + '</div>');
        } else {
            $("div [data-id='" + msg['conversation'] + "']").append('<div class="message other" data-from="' + msg['author'] + '" data-message_id="' + msg['id'] + '">' + msg['text'] + '</div>');
        }
        $("#conversation").animate({scrollTop: $("#conversation").height()}, "slow");
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
    applyConversation();
    $('.conversation:first').click();
    recalcSize();
    setInterval(update, reloadTimer);
});

function t() {
    alert('benis');
}

function d(test) {
    alert(JSON.stringify(test));
}