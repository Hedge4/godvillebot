const toggleMentions = require('./togglementions');
const displayLevel = require('./levelcard');
const displayGold = require('./goldcard');
const getRanking = require('./ranking');
const limitedCommands = require('../limited_commands');

function redirect(cmd, content, message, Discord, client, userData, limitedCommandsData) {
    switch (cmd) {
        case 'level':
            return displayLevel(message, userData, Discord, client);
        case 'gold':
            return displayGold(message, userData, Discord, client);
        case 'toggle-mentions':
            return toggleMentions(message, userData, client);
        case 'ranking':
            return getRanking(message, userData, client);
        case 'daily':
            return limitedCommands.daily(client, message, limitedCommandsData, userData);
        default:
            return;
    }
}

module.exports = redirect;