var conversation_id = null;
var username = '';
var displayUsername = '';
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

STUDIP.conversations = {
    fullheight: 420,
    startup: function() {
        $(window).resize(STUDIP.conversations.recalcSize);
        STUDIP.conversations.recalcSize();
        $("#user_1").click(function() {
            $(this).val('');
        });
        STUDIP.conversations.setMessageSender();
        applyConversation();
        $('.conversation:first').click();
    },
    update: function(json) {
        scrollScreen(false);
        workJSON(json);
        scrollScreen(true);
    },
    conversation: function(id) {
        return $("div.conversationdisplay[data-id='" + id + "']");
    },
    currentConversation: function() {
        return STUDIP.conversations.conversation(conversation_id);
    },
    recalcSize: function() {
        $(".scroll").height($(window).height() - STUDIP.conversations.fullheight);
    },
    setMessageSender: function() {
        $("#message_input").keyup(function(e) {
            e = e || event;
            if (e.keyCode === 13) {
                if ($('#sendWithEnter').prop('checked') !== (e.ctrlKey || e.shiftKey)) {
                    sendMessage();
                }
            }
            return true;
        });
        $(".button[name='send']").click(function() {
            sendMessage();
        });
    },
    loadMessages: function(last) {
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
            // adjust scrolling to get it back to the original position
            $('.scroll').animate({
                scrollTop: ($('.scroll')[0].scrollHeight - height + scrollTop)
            }, 0, function() {
                if (msg && msg['messages'] && msg['messages'].length > 1) {
                    scrollOldMessages();
                }
            });
        });
    }

}

STUDIP.conversations.message = {
    exists: function(id) {
        return $("div[data-message_id='" + id + "']").length > 0;
    },
    getAuthorType: function(author) {
        if (author === myId) {
            return "mine";
        }
        return "other";
    },
    work: function(msg) {
        if (!STUDIP.conversations.message.exists(msg['id'])) {
            var date = new Date(msg['date'] * 1000);
            var classtype = STUDIP.conversations.message.getAuthorType(msg['author']);
            var output = '<div class="message ' + classtype + '" data-from="' + msg['author'] + '" data-message_id="' + msg['id'] + '" data-date="' + msg['date'] + '">';
            output += '<div class="message_header date">' + date.toLocaleDateString() + '</div>';
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
            var olderMessages = $(".conversationdisplay[data-id='" + msg['conversation'] + "'] .message").filter(function(index) {
                return $(this).attr("data-date") > msg['date'];
            });
            if (olderMessages.length > 0) {
                olderMessages.first().before(output);
            } else {
                $("div.conversationdisplay[data-id='" + msg['conversation'] + "']").append(output);
            }
            updateDate(msg['conversation'], msg['date']);
        }
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
                STUDIP.conversations.message.work(this);
            });
            updateDateClass();
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

function updateDateClass() {
    currentConversation().find('.first').removeClass('first');
    var oldDateString;
    $.each(currentConversation().find('.date'), function() {
        if ($(this).html() !== oldDateString) {
            $(this).addClass('first');
            oldDateString = $(this).html();
        }
    });
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

//we loaded manually so dont auto scrollback
        $('.scroll').unbind('scroll');
        clickConversation($(this));
    });
    $('.new_conv').removeClass('new_conv');
}

function clickConversation(obj) {
//save scroll top to div
    currentConversation().attr('data-scroll', $('.scroll').scrollTop());
    conversation_id = obj.attr('data-conversation_id');
    $('#username').html(obj.html());
    if (startConversation()) {
        STUDIP.conversations.loadMessages();
    } else {
        $('.scroll').animate({scrollTop: currentConversation().attr('data-scroll')}, 100, function() {
            scrollOldMessages();
        });
    }
    obj.removeClass('newMessage');
    $('.conversation').removeClass('clicked');
    obj.addClass('clicked');
    updateDateClass();
}

/**
 * Starts a conversation with the global conversation_id
 * 
 * @returns boolean true if it is a new conversation, false if an old one
 */
function startConversation() {
    $("div .conversationdisplay:not([data-id='" + conversation_id + "'])").hide(200);
    if ($("div [data-id='" + conversation_id + "']").length <= 0) {
        $('#conversation').append('<div class="conversationdisplay" data-id="' + conversation_id + '"></div>');
        return true;
    } else {
        $("div [data-id='" + conversation_id + "']").show(200);
    }
    return false;
}

function currentConversation() {
    return $("div .conversationdisplay[data-id='" + conversation_id + "']");
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

/**
 * Function to call loading old messages if we reach the top
 * @returns {undefined}
 */
function scrollOldMessages() {
    $('.scroll').scroll(function() {
        if ($(this).scrollTop() < 500) {
            $(this).unbind('scroll');
            STUDIP.conversations.loadMessages(currentConversation().find('.message:first').attr('data-message_id'));
        }
    });
}

/**
 * Things we actually need to do after loading
 */
$(document).ready(function() {
    STUDIP.conversations.startup();
});