var conversation_id = null;
var username = '';
var displayUsername = '';
var reloadTimer = 3000;
var fullheight = 420;
$(window).resize(recalcSize);
function recalcSize() {
    $(".scroll").height($(window).height() - fullheight);
}

function newConversation(paticipant, realname) {
    $("div .conversationdisplay").hide(200);
    $('#username').html(realname);
    $.ajax({
        type: "POST",
        url: urlLoadUsername,
        data: {username: paticipant}
    }).done(function(msg) {
        $('#username').html(msg);
        $('#user_1').val('');
    });
    conversation_id = null;
    username = paticipant;
    $('#main').show();
}

function loadMessages(last) {
    $.ajax({
        type: "POST",
        url: urlLoadMessages,
        data: {conversation: conversation_id,
            lastMessage: last},
        dataType: "json"
    }).done(function(msg) {
        var scrollTop = $('.scroll').scrollTop();
        var height = $('.scroll')[0].scrollHeight;
        workJSON(msg);
        $('.scroll').scrollTop($('.scroll')[0].scrollHeight - height + scrollTop);
        if (msg && msg['messages'] && msg['messages'].length > 1) {
            scrollOldMessages();
        }
    });
}

STUDIP.conversations = {
    update: function(json) {
        scrollScreen(false);
        workJSON(json);
        scrollScreen(true);
    }
}


function workJSON(json) {
    if (json !== null) {
        var conversations = json['conversations'];
        if (conversations) {
            $('#main').show();
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
        var online = json['online'];
        if (online) {
            $('.conversation').removeClass('online');
            $.each(online, function() {
                $('.conversation[data-conversation_id="' + this + '"]').addClass('online');
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
        $('#talks').prepend('<div class="new_conv conversation" data-conversation_id="' + conv['id'] + '" data-date="' + conv['date'] + '">' + conv['name'] + '</div>');
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
        var output = '<div class="message ' + classtype + '" data-from="' + msg['author'] + '" data-message_id="' + msg['id'] + '" data-date="' + msg['date'] + '">';
        output += '<div class="message_header date ' + dateclass + '">' + date.toLocaleDateString() + '</div>';
        //output += '<div class="message_header time">' + date.toLocaleTimeString() + '</div>';
        output += '<div class="message_header time">' + date.getHours() + ":" + ("0" + date.getMinutes()).slice(-2) + '</div>';
        output += '<div class="text"><p>';
        if (msg['file']) {
            output += msg['file'];
        } else {
            output += msg['text'];
        }
        output += '</p></div>';
        output += '</div>';

        //select messageboxes
        var olderMessages = $(".conversationdisplay:visible .message").filter(function(index) {
            return $(this).attr("data-date") > msg['date'];
        });
        if (olderMessages.length > 0) {
            olderMessages.first().before(output);
        } else {
            $("div [data-id='" + msg['conversation'] + "']").append(output);
        }
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
        clickConversation($(this));
    });
    $('.new_conv').removeClass('new_conv');
}

function clickConversation(obj) {
    conversation_id = obj.attr('data-conversation_id');
    $('#username').html(obj.html());
    startConversation();
    loadMessages();
    obj.removeClass('newMessage');
    $('.conversation').removeClass('clicked');
    obj.addClass('clicked');
}

function startConversation() {
    $("div .conversationdisplay:not([data-id='" + conversation_id + "'])").hide(200);
    if ($("div [data-id='" + conversation_id + "']").length <= 0) {
        $('#conversation').append('<div class="conversationdisplay" data-id="' + conversation_id + '"></div>');
    } else {
        $("div [data-id='" + conversation_id + "']").show(200);
    }
}

function currentConversation() {
    return $("div .conversationdisplay[data-id='" + conversation_id + "']");
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
    var message = $('#message_input').val();
    $('#message_input').val('');
    $("#user_1").val('');
    $.ajax({
        type: "POST",
        url: urlSend,
        data: {conversation: conversation_id, message: message, username: username},
        dataType: "json"
    }).done(function(msg) {
        scrollScreen(false);
        workJSON(msg);
        scrollScreen(true);
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
    }).always(function() {
        setTimeout(function() {
            update();
        }, reloadTimer);
    });
}

function setUserSearch() {
    $("#user_1").click(function() {
        $(this).val('');
    });
}

function setMessageSender() {
    $("#message_input").keyup(function(e) {
        e = e || event;
        if (e.keyCode === 13) {
            if ($('#sendWithEnter').prop('checked') !== e.ctrlKey) {
                sendMessage();
            }
        }
        return true;
    });
    $(".button[name='send']").click(function() {
        sendMessage();
    });
}

/**
 * Function to call loading old messages if we reach the top
 * @returns {undefined}
 */
function scrollOldMessages() {
    $('.scroll').scroll(function() {
        if ($(this).scrollTop() < 500) {
            $(this).unbind('scroll');
            loadMessages(currentConversation().find('.message:first').attr('data-message_id'));
        }
    });
}

$(document).ready(function() {
    setUserSearch();
    setMessageSender();
    applyConversation();
    $('.conversation:first').click();
    recalcSize();
});