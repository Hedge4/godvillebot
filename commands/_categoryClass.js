module.exports = class Category {
    constructor(name, description, help, options = {}) {
        this.name = name;
        this.description = description;
        this.help = help;

        // default to [] unless set in options
        this.enabledChannels = options.enabledChannels || [];
        this.enabledRoles = options.enabledRoles || [];
        this.disabledChannels = options.disabledChannels || [];
        this.disabledRoles = options.disabledRoles || [];
    }

    checkChannelPerms(channel) {
        if (this.enabledChannels.length === 0) {
            return !this.disabledChannels.includes(channel);
        } else {
            return this.enabledChannels.includes(channel);
        }
    }

    checkUserPerms(role) {
        if (this.enabledRoles.length === 0) {
            return !this.disabledRoles.includes(role);
        } else {
            return this.enabledRoles.includes(role);
        }
    }

    initialise() {
        // Perform any initialisation logic here
    }
};

// Set default values for the class properties
// Category.prototype.enabledChannels = [];
// Category.prototype.enabledRoles = [];
// Category.prototype.disabledChannels = [];
// Category.prototype.disabledRoles = [];

// Category.prototype.help = {};
// Category.prototype.name = '';
// Category.prototype.description = '';
