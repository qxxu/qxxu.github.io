(function($, window){

    var container = '<div id="badge-notification-container"></div>';

    var stylesClass='badge-styles';

    var styles =
        '   #badge-notification-container {' +
        '        z-index: 9999999999;' +
        '        position:absolute;' +
        '        bottom: 0;' +
        '        right: 20px;' +
        '        display: block;' +
        '        width: 300px;' +
        '        background-color: #77d051;' +
        '        color: #272727;' +
        '    }' +

        '    #badge-notification-container .badge-notification {' +
        '        height:64px;' +
        '        border-bottom: 1px solid #0a7432;' +
        '    }' +

        '    #badge-notification-container .badge-notification > * {' +
        '        display: inline-block;' +
        '        vertical-align: middle;' +
        '    }' +

        '    #badge-notification-container .badge-notification .badge-notification-message-body {' +
        '        margin-left: 10px;' +
        '        width: 80%;' +
        '        font-size: .89em;' +
        '        font-weight: bold;' +
        '    }' +

        '    #badge-notification-container .badge-notification img {' +
        '        width: 32px;' +
        '        height:32px;' +
        '        margin:8px;' +
        '    }';

    var BadgeNotificationManager = function() {
        this.cookieKey = 'BADGES';
        this.notifications = {};
        this.cookies = new CookieManager();
        this.addToPage();
    };

    BadgeNotificationManager.prototype.addToPage = function() {
        $('body').append(container);
        this.$parent = $('#badge-notification-container');
    };

    BadgeNotificationManager.prototype.checkForMessages = function() {
        var self = this;
        var badges = this.getNewBadges();
        badges.forEach(function(message) {
            self.addMessage(message)
        });
    };

    BadgeNotificationManager.prototype.addMessage = function(message) {
        var notification = new BadgeNotification(message, this);
        this.notifications[notification.id] = notification;
        notification.show();
    };

    BadgeNotificationManager.prototype.onMessageCleanup = function(badgeNotification) {
        badgeNotification.hide();
        delete this.notifications[badgeNotification.message.name];
    };

    BadgeNotificationManager.prototype.getNewBadges = function() {
        var badgesList, notificationJson,
            badges = this.cookies.get(this.cookieKey);
        this.cookies.remove(this.cookieKey);

        if(notificationJson = this.decodeCookie(badges)) {
            badgesList = JSON.parse(notificationJson);
        }

        return badgesList || [];
    };

    BadgeNotificationManager.prototype.decodeCookie = function(cookie) {
        if(cookie) {
            return window.atob(
                cookie.replace(/%3D/g, '=')
            );
        }
    };

    BadgeNotificationManager.listenForJQueryAjaxCalls = function() {
        BadgeNotificationManager.addCss();
        var badgeNotificationManager = new BadgeNotificationManager();

        $( document ).ajaxComplete(function() {
            badgeNotificationManager.checkForMessages();
        });

        badgeNotificationManager.checkForMessages();
    };

    BadgeNotificationManager.watchJQueryAjaxHeaders = function() {
        BadgeNotificationManager.addCss();
        var badgeNotificationManager = new BadgeNotificationManager();

        $( document ).ajaxComplete(function(e, xhr) {
            var headers = xhr.getAllResponseHeaders();
            badgeNotificationManager.checkForMessages();
        });
    };

    BadgeNotificationManager.addCss = function() {
        if($('.'+stylesClass).length < 1) {
            $('<style class=\"'+stylesClass+'\">' + styles + '</style>').appendTo("body");
        }
    };

    _.mixin({
        guid : function(){
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }
    });

    function CookieManager() {
    }

    CookieManager.prototype.get = function(key) {
        var cookies = document.cookie.split(';').reduce(function(dict, pair){
            pair = pair.split('=');
            dict[pair[0].trim()] = pair[1];
            return dict;
        }, {});

        if(key) {
            return cookies[key];
        } else {
            return cookies;
        }
    };

    CookieManager.prototype.remove = function(key) {
        document.cookie = key+'=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
    };

    window.BadgeNotificationManager = BadgeNotificationManager;

})(jQuery, window);