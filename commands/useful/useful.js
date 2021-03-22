const spoiler = require('./spoiler.js');
const code = require('./code.js');

function redirect(cmd, content, message, Discord, client) {
    switch (cmd) {
        case 'spoiler':
            return spoiler(client, message);
        case 'code':
            return code(message);
        default:
            return message.reply(`${cmd} command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;