const { channels } = require('../../configurations/config.json');

const bubblewrap = require('./bubblewrap.js');
const minesweeper = require('./minesweeper.js');
const randomnickname = require('./randomnickname.js');
const noCommand = require('./noCommand.js');
const bonkCommand = require('./bonkCommand.js');

function redirect(cmd, content, message, Discord, client) {
    // these functions should only work in command channels
    const isCommandChannel = Object.values(channels.commandsAllowed).includes(message.channel.id);

    switch (cmd) {
        case 'bubblewrap':
            return isCommandChannel ? bubblewrap(client, message) : undefined;
        case 'minesweeper':
            return isCommandChannel ? minesweeper(client, message) : undefined;
        case 'randomnick':
            return isCommandChannel ? randomnickname(message, client) : undefined;
        case 'no':
            return noCommand(message);
        case 'bonk':
            return bonkCommand(message);
        default:
            return message.reply(`The '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;