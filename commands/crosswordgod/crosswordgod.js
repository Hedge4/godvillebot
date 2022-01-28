const logger = require('../features/logging');
const solveCrossword = require('./mainSolver.js');
const newspaper = require('./newspaperManager.js');
const omnibus = require('./omnibusManager.js');
const newsUpdates = require('./newsUpdates.js');

function redirect(cmd, content, message, Discord, client) {
    switch (cmd) {
        case 'solvecrossword':
            return solveCrossword.solveWords(message, content);
        case 'solvecrosswordhtml':
            return solveCrossword.solveHtml(message, content);
        case 'newspaper':
            return newspaper.send(message, Discord);
        case 'newspaperupdate':
            return newsUpdates.askUpdate(message);
        case 'renewnewspaper':
            logger.log(`${message.author.tag} forcefully renewed the newspaper in ${message.channel}.`);
            return newspaper.renew(message.channel, Discord);
        case 'renewomnibus':
            return omnibus.refresh(message, Discord, client);
        case 'createomnibusbackup':
            return omnibus.createBackup(message);
        default:
            return message.reply(`the '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;