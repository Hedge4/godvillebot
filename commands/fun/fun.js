const bubblewrap = require('./bubblewrap.js');
const minesweeper = require('./minesweeper.js');
const randomnickname = require('./randomnickname.js');
const noCommand = require('./noCommand.js');
const bonkCommand = require('./bonkCommand.js');

function redirect(cmd, content, message, Discord, client) {
    switch (cmd) {
        case 'bubblewrap':
            return bubblewrap(client, message);
        case 'minesweeper':
            return minesweeper(client, message);
        case 'randomnick':
            return randomnickname(message, client);
        case 'no':
            return noCommand(message);
        case 'bonk':
            return bonkCommand(message);
        default:
            return message.reply(`The '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;