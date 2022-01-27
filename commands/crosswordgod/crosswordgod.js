const solveCrossword = require('./mainSolver.js');
const newspaper = require('./newspaperManager.js');

function redirect(cmd, content, message, Discord, client) {
    switch (cmd) {
        case 'solvecrossword':
            return solveCrossword.solveWords(message, content);
        case 'solvecrosswordhtml':
            return solveCrossword.solveHtml(message, content);
        case 'newspaper':
            return newspaper.update(message, Discord);
        default:
            return message.reply(`the '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;