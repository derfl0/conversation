var conversation_id = null;
var username = '';
var displayUsername = '';
var reloadTimer = 3000;
var fullheight = 420;

$(window).resize(recalcSize);

function recalcSize() {
    $(".scroll").height($(window).height() - fullheight);
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
            scrollScreen(false);
            $.each(messages, function() {
                workMessage(this);
            });
            scrollScreen(true);
        }
                var online = json['online'];
        if (online) {
            $('.conversation').removeClass('online');
            $.each(online, function() {
                $('.conversation[data-conversation_id="'+this+'"]').addClass('online');
            });
        }
    }
}

function scrollScreen(action) {
    var elem = $(".scroll");
    if (action) {
        if (scrolling) {
            elem.animate({scrollTop: elem[0].scrollHeight});
        }
    } else {
        scrolling = elem[0].scrollHeight - elem.scrollTop() <= elem.outerHeight() + 10;
    }
}

function workConversation(conv) {
    $('#no_talks').hide();
    if ($("div [data-conversation_id='" + conv['id'] + "']").length <= 0) {
        $('#talks').append('<div class="new_conv conversation" data-conversation_id="' + conv['id'] + '" data-date="' + conv['date'] + '">' + conv['name'] + '</div>');
        applyConversation();
        if (!conversation_id) {
            $("div [data-conversation_id='" + conv['id'] + "']").click();
        }
    }
    updateDate(conv['id'], conv['date']);
}

function workMessage(msg) {
    if ($("div [data-message_id='" + msg['id'] + "']").length <= 0) {
        var date = new Date(msg['date'] * 1000);
        // check if the date is the first time displayed
        if ($(".conversationdisplay:visible div:contains('" + date.toLocaleDateString() + "')").length <= 0) {
            var dateclass = "first";
        } else {
            var dateclass = "second";
        }
        // check if it is a message from me or from another
        if (msg['author'] === myId) {
            var classtype = "mine";
        } else {
            var classtype = "other";
        }
        var output = '<div class="message ' + classtype + '" data-from="' + msg['author'] + '" data-message_id="' + msg['id'] + '">';
        output += '<div class="message_header date ' + dateclass + '">' + date.toLocaleDateString() + '</div>';
        output += '<div class="message_header time">' + date.toLocaleTimeString() + '</div>';
        output += '<div class="text">';
        if (msg['file']) {
            output += msg['file'];
        } else {
            output += msg['text'];
        }
        output += '</div>';
        output += '</div>';
        $("div [data-id='" + msg['conversation'] + "']").append(output);
        updateDate(msg['conversation'], msg['date']);
    }
}

function updateDate(conversation, date) {
    var div = $("div [data-conversation_id='" + conversation + "']");
    if (div.attr('data-date') < date) {
        div.attr('data-date', date);
        if (conversation_id !== conversation) {
            div.addClass('newMessage');
        }
        $('div.conversation').not(div).first().before(div);
    }
}

function applyConversation() {
    $('.new_conv').click(function() {
        conversation_id = $(this).attr('data-conversation_id');
        $('#username').html($(this).html());
        startConversation();
        loadMessages();
        $(this).removeClass('newMessage');
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