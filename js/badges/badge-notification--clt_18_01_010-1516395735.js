(function($, window){
    var _template = _.template('<div class="badge-notification" id="<%= id %>" >'+
                        '<img src="<%= image %>" alt="<%= name %> Badge" \>' +
                        '<div class="badge-notification-message-body">' +
                            '<span class="badge-notification-message"><%= message %></span>' +
                        '</div>' +
                   '</div>');

    var BadgeNotification = function(message, manager) {
        this.showTime = 800;

        this.timeout = 6000;
        this.manager = manager;
        this.$parent = manager.$parent;
        this.message = message;
        this.message.id = 'badge-notification-'+_.guid();

        this.render()
    };

    BadgeNotification.prototype.render = function() {
        var $view = $(_template(this.message));
        this.$parent.append($view);
        this.$view = $('#'+this.message.id);
        this.$view.hide();
    };

    BadgeNotification.prototype.show = function() {
        var self = this;
        this.$view.show(this.showTime);

        this.timeout = setTimeout(function() {
            self.manager.onMessageCleanup(self);
        }, this.timeout)
    };

    BadgeNotification.prototype.hide = function() {
        this.$view.hide(this.showTime);
    };

    window.BadgeNotification = BadgeNotification;
})(jQuery, window);

