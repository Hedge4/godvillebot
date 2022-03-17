const solveCrossword = require('./mainSolver.js');
const newspaper = require('./newspaperManager.js');
const omnibus = require('./omnibusManager.js');
const newsUpdates = require('./newsUpdates.js');

function redirect(cmd, content, message) {
    switch (cmd) {
        case 'solvecrossword':
            return solveCrossword.solveWords(message, content);
        case 'solvehtml':
            return solveCrossword.solveHtml(message);
        case 'newspaper':
            return newspaper.send(message);
        case 'newsdelay':
            return newsUpdates.askUpdate(message);
        case 'refreshnews':
            return newspaper.renewRequest(message);
        case 'refreshomnibus':
            return omnibus.refresh(message);
        case 'omnibusbackup':
            return omnibus.createBackup(message);
        default:
            return message.reply(`The '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;