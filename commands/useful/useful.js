const spoiler = require('./spoiler.js');
const code = require('./code.js');
const ping = require('./ping.js');
const react = require('./react.js');
const makevote = require('./makevote.js');
const suggest = require('./suggest');

function redirect(cmd, content, message, Discord, client) {
    switch (cmd) {
        case 'suggest':
            return suggest.suggestion(client, message, content);
        case 'spoiler':
            return spoiler(client, message);
        case 'code':
            return code(message);
        case 'ping':
            return ping(message, client);
        case 'react':
            return react(message, content, client);
        case 'makevote':
            return makevote(message, content);
        default:
            return message.reply(`The '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;