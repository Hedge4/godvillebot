const toggleMentions = require('./togglementions');
const displayLevel = require('./levelcard');
const displayGold = require('./goldcard');
const getRanking = require('./ranking');
const limitedCommands = require('./daily');
const changegold = require('./changegold');

function redirect(cmd, content, message, client, userData, limitedCommandsData) {
    switch (cmd) {
        case 'level':
            return displayLevel(message, content, userData, client);
        case 'gold':
            return displayGold(message, content, userData, client);
        case 'toggle-mentions':
            return toggleMentions(message, userData);
        case 'ranking':
            return getRanking(message, content, userData);
        case 'daily':
            return limitedCommands.daily(message, limitedCommandsData, userData);
        case 'changegold':
            return changegold(message, content, userData);
        default:
            return message.reply(`The '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;