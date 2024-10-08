const { channels } = require('../../configurations/config.json');

const bubblewrap = require('./bubblewrap.js');
const minesweeper = require('./minesweeper.js');
const randomnickname = require('./randomnickname.js');
const noCommand = require('./noCommand.js');
const bonkCommand = require('./bonkCommand.js');
const hugCommand = require('./hugCommand.js');
const roll = require('./diceRoll.js');
const pet = require('./petCommand.js');

function redirect(cmd, content, message, client) {
    // these functions should only work in command channels
    const isCommandChannel = Object.values(channels.commandsAllowed).includes(message.channel.id);

    switch (cmd) {
        case 'bubblewrap':
            return isCommandChannel ? bubblewrap(client, message) : undefined;
        case 'minesweeper':
            return isCommandChannel ? minesweeper(message) : undefined;
        case 'randomnick':
            return isCommandChannel ? randomnickname(message) : undefined;
        case 'no':
            return noCommand(message);
        case 'bonk':
            return bonkCommand(message);
        case 'hug':
            return hugCommand(message);
        case 'roll':
            return roll(message, content);
        case 'pet':
            return pet(message);
        default:
            return message.reply(`The '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;