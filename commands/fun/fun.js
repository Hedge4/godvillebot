const bubblewrap = require('./bubblewrap.js');
const minesweeper = require('./minesweeper.js');

function redirect(cmd, content, message, Discord, client) {
    switch (cmd) {
        case 'bubblewrap':
            return bubblewrap(client, message);
        case 'minesweeper':
            return minesweeper(client, message);
        default:
            return message.reply(`the '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;