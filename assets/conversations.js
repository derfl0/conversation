STUDIP.conversations = {
    username: '',
    lastUpdate: 0,
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
                $.each(conversations, function() {

                    // Open conversation 
                    STUDIP.conversations.open(this.id, this.name);
                    STUDIP.conversations.updateContact(this.id, this.name);
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
                $('#contact_box *.online').removeClass('online');
                $.each(online, function() {
                    $('#contact_box *[data-id="' + this + '"]').addClass('online');
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
    open: function() {
    },
    updateContact: function(conversation_id, name) {
        var contact = STUDIP.conversations.getContact(conversation_id);

        // Create contact if not existing
        if (contact.length === 0) {
            contact = $('<a>').attr('data-id', conversation_id).html(name).attr('href', STUDIP.conversations.getUrl('index/index/' + conversation_id)).click(function(event) {
                event.preventDefault();
                STUDIP.conversations.open(conversation_id, name);
            });
        }
        STUDIP.conversations.contact.moveToTop(conversation_id);
    },
    getContact: function(conversation_id) {
        return $('#contact_box [data-id="' + conversation_id + '"]');
    },
    markRead: function(conversation_id) {
        $.ajax(STUDIP.conversations.getUrl('index/markRead/' + conversation_id));
        STUDIP.conversations.getContact(conversation_id).removeClass('newMessage');
        if ($('div#contact_box a.newMessage').length === 0) {
            $('a#conversation').removeClass('new');
        }
    }
};

STUDIP.conversations.message = {
    exists: function(id) {
        return $("article#" + id).length > 0;
    },
    getTime: function(msg) {
        var date = new Date(msg['date'] * 1000);
        return date.getHours() + ":" + ("0" + date.getMinutes()).slice(-2);
    },
    work: function(msg) {
        if (!STUDIP.conversations.message.exists(msg['id'])) {

            var output2 = '<article id="' + msg['id'] + '"  data-date="' + msg['date'] + '" class="message ' + msg['class'] + '">';
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

            // Update contact with new message if the message came from the other
            if (msg['class'] !== 'mine') {
                STUDIP.conversations.contact.newMessage(msg['conversation']);
            }
        }
    },
    send: function(conversation_id, message, username) {
        $.ajax({
            type: "POST",
            url: STUDIP.conversations.getUrl('index/send'),
            data: {conversation: conversation_id, message: message, username: username},
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

STUDIP.conversations.contact = {
    newMessage: function(conversation_id) {
        if ($('.scroll[data-id="' + conversation_id + '"]:visible').length === 0) {
            STUDIP.conversations.getContact(conversation_id).addClass('newMessage');
        }
    },
    moveToTop: function(conversation_id) {
        STUDIP.conversations.getContact(conversation_id).prependTo($('#contact_box')); 
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