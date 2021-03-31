const spoiler = require('./spoiler.js');
const code = require('./code.js');
const randomnickname = require('./randomnickname.js');
const suggest = require('../suggest');

function redirect(cmd, content, message, Discord, client) {
    switch (cmd) {
        case 'suggest':
            return suggest.suggestion(client, message, content);
        case 'spoiler':
            return spoiler(client, message);
        case 'code':
            return code(message);
        case 'randomnick':
            return randomnickname(message, client);
        default:
            return message.reply(`the '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;