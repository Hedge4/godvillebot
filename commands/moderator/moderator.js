const block = require('./block.js');
const breakCmd = require('./break');
const purge = require('./purge');

function redirect(cmd, content, message, client, blockedData) {
    switch (cmd) {
        case 'break':
            return breakCmd(message, client);
        case 'block':
            return block.block(message, client, blockedData);
        case 'unblock':
            return block.unblock(message, client, blockedData);
        case 'blocklist':
            return block.blockList(message, client);
        case 'purge':
            return purge(client, message);
        default:
            return message.reply(`The '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;