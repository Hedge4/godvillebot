const block = require('./block.js');
const admin_only = require('./commands/admin_commands');

function redirect(cmd, content, message, client, blockedData) {
    switch (cmd) {
        case 'break':
            return admin_only.break(message, client);
        case 'block':
            return block.block(message, client, blockedData);
        case 'unblock':
            return block.unblock(message, client, blockedData);
        case 'blocklist':
            return block.blockList(message, client);
        case 'purge':
            return admin_only.purge(client, message);
    default:
            return message.reply(`${cmd} command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;