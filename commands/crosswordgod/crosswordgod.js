const solveCrossword = require('./mainSolver.js');
const newspaper = require('./newspaperManager.js');
const omnibus = require('./omnibusManager.js');
const newsUpdates = require('./newsUpdates.js');

function redirect(cmd, content, message, Discord, client) {
    switch (cmd) {
        case 'solvecrossword':
            return solveCrossword.solveWords(message, content);
        case 'solvehtml':
            return solveCrossword.solveHtml(message);
        case 'newspaper':
            return newspaper.send(message, Discord);
        case 'newspaperupdate':
            return newsUpdates.askUpdate(message);
        case 'renewnewspaper':
            return newspaper.renewRequest(message, Discord);
        case 'renewomnibus':
            return omnibus.refresh(message, Discord, client);
        case 'createomnibusbackup':
            return omnibus.createBackup(message);
        default:
            return message.reply(`The '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;