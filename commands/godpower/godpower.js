const toggleMentions = require('./togglementions');
const displayLevel = require('./levelcard');
const displayGold = require('./goldcard');
const getRanking = require('./ranking');
const limitedCommands = require('./daily');

function redirect(cmd, content, message, Discord, client, userData, limitedCommandsData) {
    switch (cmd) {
        case 'level':
            return displayLevel(message, content, userData, Discord, client);
        case 'gold':
            return displayGold(message, content, userData, Discord, client);
        case 'toggle-mentions':
            return toggleMentions(message, userData, client);
        case 'ranking':
            return getRanking(message, content, userData, client);
        case 'daily':
            return limitedCommands.daily(message, limitedCommandsData, userData);
        default:
            return message.reply(`The '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;