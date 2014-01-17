STUDIP.conversations = {
    fullheight: 420,
    username: '',
    current_id: null,
    startup: function() {
        $(window).resize(STUDIP.conversations.recalcSize);
        STUDIP.conversations.recalcSize();
        $("#user_1").click(function() {
            $(this).val('');
        });
        STUDIP.conversations.setMessageSender();
        STUDIP.conversations.conversation.apply();
        $('.conversation:first').click();
    },
    update: function(json) {
        STUDIP.conversations.scroll.screen(false);
        STUDIP.conversations.work(json);
        STUDIP.conversations.scroll.screen(true);
    },
    getConversation: function(id) {
        return $("div.conversationdisplay[data-id='" + id + "']");
    },
    currentConversation: function() {
        return STUDIP.conversations.getConversation(STUDIP.conversations.current_id);
    },
    recalcSize: function() {
        $(".scroll").height($(window).height() - STUDIP.conversations.fullheight);
    },
    setMessageSender: function() {
        $("#message_input").keyup(function(e) {
            e = e || event;
            if (e.keyCode === 13) {
                if ($('#sendWithEnter').prop('checked') !== (e.ctrlKey || e.shiftKey)) {
                    STUDIP.conversations.message.send();
                }
            }
            return true;
        });
        $(".button[name='send']").click(function() {
            STUDIP.conversations.message.send();
        });
    },
    loadMessages: function(last) {
        $.ajax({
            type: "POST",
            url: urlLoadMessages,
            data: {conversation: STUDIP.conversations.current_id,
                lastMessage: last},
            dataType: "json"
        }).done(function(msg) {
            var scrollTop = $('.scroll').scrollTop();
            var height = $('.scroll')[0].scrollHeight;
            STUDIP.conversations.work(msg);
            // adjust scrolling to get it back to the original position
            $('.scroll').animate({
                scrollTop: ($('.scroll')[0].scrollHeight - height + scrollTop)
            }, 0, function() {
                if (msg && msg['messages'] && msg['messages'].length > 1) {
                    STUDIP.conversations.scroll.oldMessages();
                }
            });
        });
    },
    work: function(json) {
        if (json !== null) {
            var conversations = json['conversations'];
            if (conversations) {
                $('#main').show();
                $.each(conversations, function() {
                    STUDIP.conversations.conversation.work(this);
                });
            }
            var messages = json['messages'];
            if (messages) {
                $.each(messages, function() {
                    STUDIP.conversations.message.work(this);
                });
                STUDIP.conversations.updateDateClass();
            }
            var online = json['online'];
            if (online) {
                $('.conversation').removeClass('online');
                $.each(online, function() {
                    $('.conversation[data-conversation_id="' + this + '"]').addClass('online');
                });
            }
        }
    },
    updateDateClass: function() {
        STUDIP.conversations.currentConversation().find('.first').removeClass('first');
        var oldDateString;
        $.each(STUDIP.conversations.currentConversation().find('.date'), function() {
            if ($(this).html() !== oldDateString) {
                $(this).addClass('first');
                oldDateString = $(this).html();
            }
        });
    },
    updateDate: function(conversation, date) {
        var div = $("div [data-conversation_id='" + conversation + "']");
        if (div.attr('data-date') < date) {
            div.attr('data-date', date);
            if (STUDIP.conversations.current_id !== conversation) {
                div.addClass('newMessage');
            }
            $('div.conversation').not(div).first().before(div);
        }
    }
};

STUDIP.conversations.message = {
    exists: function(id) {
        return $("article#" + id).length > 0;
    },
    getAuthorType: function(author) {
        if (author === myId) {
            return "mine";
        }
        return "other";
    },
    getTime: function(msg) {
        var date = new Date(msg['date'] * 1000);
        return date.getHours() + ":" + ("0" + date.getMinutes()).slice(-2);
    },
    work: function(msg) {
        if (!STUDIP.conversations.message.exists(msg['id'])) {
            var classtype = STUDIP.conversations.message.getAuthorType(msg['author']);

            var output2 = '<article id="' + msg['id'] + '"  data-date="' + msg['date'] + '" class="message ' + classtype + '">';
            output2 += '<header>' + msg['author'] + '</header>';
            output2 += '<time>' + STUDIP.conversations.message.getTime(msg) + '</time>';
            output2 += '<div class="content">';
            if (msg['file']) {
                output2 += msg['file'];
            } else {
                output2 += msg['text'];
            }
            output2 += '</div>';
            output2 += '</article>';

            // get the right day
            var day = STUDIP.conversations.message.getDay(msg['date']);

            //select messageboxes
            var olderMessages = day.find("article.message").filter(function(index) {
                return $(this).attr("data-date") > msg['date'];
            });
            if (olderMessages.length > 0) {
                olderMessages.first().before(output2);
            } else {
                day.append(output2);
            }
            STUDIP.conversations.updateDate(msg['conversation'], msg['date']);
        }
    },
    send: function() {
        var message = $('#message_input').val();
        $('#message_input').val('');
        $("#user_1").val('');
        $.ajax({
            type: "POST",
            url: urlSend,
            data: {conversation: STUDIP.conversations.current_id, message: message, username: STUDIP.conversations.username},
            dataType: "json"
        }).done(function(msg) {
            STUDIP.conversations.scroll.screen(false);
            STUDIP.conversations.work(msg);
            STUDIP.conversations.scroll.screen(true);
        });
    },
    getDay: function(stamp) {
        var date = new Date(stamp * 1000);
        var current = STUDIP.conversations.currentConversation();
        var dateString = date.toLocaleDateString();
        var dateSection = current.find('section:contains("' + dateString + '")');
        if (dateSection.length > 0) {
            return dateSection;
        }

        var newSection = '<section data-date="' + stamp + '"><header>' + dateString + '</header></section>';

        //find older sections
        var olderSections = current.find("section").filter(function(index) {
            return $(this).attr("data-date") > stamp;
        });
        if (olderSections.length > 0) {
            olderSections.first().before(newSection);
        } else {
            current.append(newSection);
        }

        return STUDIP.conversations.message.getDay(stamp);
    }
};

STUDIP.conversations.conversation = {
    start: function() {
        $("div .conversationdisplay:not([data-id='" + STUDIP.conversations.current_id + "'])").hide(200);
        if ($("div [data-id='" + STUDIP.conversations.current_id + "']").length <= 0) {
            $('#conversation').append('<div class="conversationdisplay" data-id="' + STUDIP.conversations.current_id + '"></div>');
            return true;
        } else {
            $("div [data-id='" + STUDIP.conversations.current_id + "']").show(200);
        }
        return false;
    },
    apply: function() {
        $('.new_conv').click(function() {

            //we loaded manually so dont auto scrollback
            $('.scroll').unbind('scroll');
            STUDIP.conversations.conversation.click($(this));
        });
        $('.new_conv').removeClass('new_conv');
    },
    new : function(paticipant, realname) {
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
        STUDIP.conversations.current_id = null;
        STUDIP.conversations.username = paticipant;
        $('#main').show();
    },
    work: function(conv) {
        $('#no_talks').hide();
        if ($("div [data-conversation_id='" + conv['id'] + "']").length <= 0) {
            $('#talks').prepend('<div class="new_conv conversation" data-conversation_id="' + conv['id'] + '" data-date="' + conv['date'] + '">' + conv['name'] + '</div>');
            STUDIP.conversations.conversation.apply();
            if (!STUDIP.conversations.current_id) {
                $("div [data-conversation_id='" + conv['id'] + "']").click();
            }
        }
        STUDIP.conversations.updateDate(conv['id'], conv['date']);
    },
    click: function(obj) {
        STUDIP.conversations.currentConversation().attr('data-scroll', $('.scroll').scrollTop());
        STUDIP.conversations.current_id = obj.attr('data-conversation_id');
        $('#username').html(obj.html());
        if (STUDIP.conversations.conversation.start()) {
            STUDIP.conversations.loadMessages();
        } else {
            $('.scroll').animate({scrollTop: STUDIP.conversations.currentConversation().attr('data-scroll')}, 100, function() {
                STUDIP.conversations.scroll.oldMessages();
            });
        }
        obj.removeClass('newMessage');
        $('.conversation').removeClass('clicked');
        obj.addClass('clicked');
        STUDIP.conversations.updateDateClass();
    }
};

STUDIP.conversations.scroll = {
    screen: function(action) {
        var elem = $(".scroll");
        if (action) {
            if (scrolling) {
                elem.animate({scrollTop: elem[0].scrollHeight});
            }
        } else {
            scrolling = elem[0].scrollHeight - elem.scrollTop() <= elem.outerHeight() + 10;
        }
    },
    oldMessages: function() {
        $('.scroll').scroll(function() {
            if ($(this).scrollTop() < 500) {
                $(this).unbind('scroll');
                STUDIP.conversations.loadMessages(STUDIP.conversations.currentConversation().find('article:first').attr('id'));
            }
        });
    }
};

$(document).ready(function() {
    STUDIP.conversations.startup();
});