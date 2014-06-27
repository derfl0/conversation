STUDIP.conversations = {
    username: '',
    lastUpdate: 0,
    reservedHeight: 392,
    getUrl: function(link) {
        return STUDIP.URLHelper.getURL("plugins.php/conversations/" + link);
    },
    periodicalPushData: function() {
        return {
            'lastUpdate': STUDIP.conversations.lastUpdate
        };
    },
    update: function(json) {
        STUDIP.conversations.work(json);
    },
    getScroll: function(id) {
        return $("div.scroll[data-id='" + id + "']");
    },
    getConversation: function(id) {
        return $("div.conversationdisplay[data-id='" + id + "']");
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
    loadMessages: function(conversation_id) {
        var last = STUDIP.conversations.getScroll(conversation_id).find('article:first').attr('id');
        $.ajax({
            type: "POST",
            url: STUDIP.conversations.getUrl('index/loadMessages'),
            data: {
                conversation: conversation_id,
                lastMessage: last
            },
            dataType: "json"
        }).done(function(msg) {
            STUDIP.conversations.work(msg, function() {
                STUDIP.conversations.scroll.oldMessages();
            });
        });
    },
    work: function(json) {
        if (json !== null) {

            var conversations = json['conversations'];
            if (conversations) {
                $('#main').show();
                $.each(conversations, function() {
                    
                    // Open conversation 
                    STUDIP.conversations.open(this.id, this.name);
                    STUDIP.conversations.updateContact(this.id);
                    STUDIP.conversations.conversation.work(this);
                });
            }
            var messages = json['messages'];
            if (messages) {

                // Prepare all included messages for scrolling
                $.each(messages, function() {
                    STUDIP.conversations.scroll.prepareScroll(this.conversation);
                });

                // Workout all messages
                $.each(messages, function() {
                    STUDIP.conversations.message.work(this);
                });

                STUDIP.conversations.scroll.doAllScroll();

            }
            var online = json['online'];
            if (online) {
                $('.conversation').removeClass('online');
                $.each(online, function() {
                    $('.conversation[data-conversation_id="' + this + '"]').addClass('online');
                });
            }
            if (typeof (callback) === 'function') {
                callback();
            }

            // Update lastUpdate
            if (json['lastUpdate']) {
                STUDIP.conversations.lastUpdate = json['lastUpdate'];
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
    },
    updateContact: function(conversation_id) {
        var contact = STUDIP.conversations.getContact(conversation_id);
         contact.addClass('newMessage');
         contact.prependTo($('#contact_box'));
    },
    getContact: function(conversation_id) {
        return $('#contact_box [data-id="'+conversation_id+'"]');
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
            var day = STUDIP.conversations.message.getDay(msg['date'], msg['conversation']);

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
            STUDIP.conversations.work(msg);
        });
    },
    getDay: function(stamp, conversation) {
        var date = new Date(stamp * 1000);
        var current = STUDIP.conversations.getConversation(conversation);
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
        return STUDIP.conversations.message.getDay(stamp, conversation);
    }
};

STUDIP.conversations.conversation = {
    start: function() {
        $("div.scroll:not([data-id='" + STUDIP.conversations.current_id + "'])").hide(0);
        if (STUDIP.conversations.currentConversation().length <= 0) {
            $('#conversation').append('<div class="scroll" data-id="' + STUDIP.conversations.current_id + '"><div class="conversationdisplay" data-id="' + STUDIP.conversations.current_id + '"></div></div>');
            STUDIP.conversations.recalcSize();
            STUDIP.conversations.instantScroll = true;
            STUDIP.conversations.loadMessages();
        } else {
            $("div.scroll[data-id='" + STUDIP.conversations.current_id + "']").show(0);
        }
    },
    apply: function() {
        $('.new_conv').click(function(e) {
            e.preventDefault();
            //we loaded manually so dont auto scrollback
            STUDIP.conversations.conversation.click($(this));
        });
        $('.new_conv').removeClass('new_conv');
    },
    new : function(paticipant, realname) {
        if (paticipant !== myId) {
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
        }
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
        STUDIP.conversations.current_id = obj.attr('data-conversation_id');
        $('#username').html(obj.html());
        STUDIP.conversations.conversation.start();
        obj.removeClass('newMessage');
        $('.conversation').removeClass('clicked');
        obj.addClass('clicked');
        STUDIP.conversations.updateDateClass();
    }
};

STUDIP.conversations.scroll = {
    prepareScroll: function(conversation_id) {
        var scroll = STUDIP.conversations.getScroll(conversation_id);

        // Check if field wasnt loaded before
        if (scroll.find('section').length === 0) {
            scroll.data('instantScroll', true);
        } else {
            scroll.data('scrolling', scroll[0].scrollHeight - scroll.scrollTop() <= scroll.outerHeight() + 10);
        }
        if (scroll.length > 0) {
            scroll.data('scrollFrom', scroll[0].scrollHeight - scroll.scrollTop());
        }
        scroll.addClass('needsScrolling');
    },
    doScroll: function(scroll) {
        if (scroll.data('instantScroll')) {
            scroll.data('instantScroll', false);
            scroll.animate({scrollTop: scroll[0].scrollHeight - scroll.data('scrollFrom')}, 0, function() {
                STUDIP.conversations.scroll.oldMessages(scroll);
            });
        } else if (scroll.data('scrolling')) {
            scroll.animate({scrollTop: scroll[0].scrollHeight}, 500);
        }
    },
    doAllScroll: function() {
        $('.needsScrolling').each(function(index) {
            STUDIP.conversations.scroll.doScroll($(this));
        }).removeClass('needsScrolling');
    },
    oldMessages: function(scroll) {
        scroll.scroll(function() {
            if ($(this).scrollTop() < 500) {
                $(this).unbind("scroll");
                scroll.data('instantScroll', true);
                STUDIP.conversations.loadMessages(scroll.attr('data-id'));
            }
        });
    }
};