const toggleMentions = require('./togglementions.js');
const displayLevel = require('./levelcard.js');
const displayGold = require('./goldcard.js');
const getRanking = require('./ranking.js');
const limitedCommands = require('./daily.js');
const changegold = require('./changegold.js');

function redirect(cmd, content, message, Discord, client, userData, limitedCommandsData) {
    switch (cmd) {
        case 'level':
            return displayLevel(message, content, userData, Discord, client);
        case 'gold':
            return displayGold(message, content, userData, Discord, client);
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