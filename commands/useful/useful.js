const spoiler = require('./spoiler.js');
const code = require('./code.js');
const ping = require('./ping.js');
const react = require('./react.js');
const makevote = require('./makevote.js');
const suggest = require('./suggest');
const reminder = require('./reminder.js');
const botTime = require('./botTime.js');
const parseUrl = require('./urlParser.js');

function redirect(cmd, content, message, client) {
    switch (cmd) {
        case 'suggest':
            return suggest.suggestion(client, message, content);
        case 'spoiler':
            return spoiler(message);
        case 'code':
            return code(message);
        case 'ping':
            return ping(message, client);
        case 'react':
            return react(message, content);
        case 'makevote':
            return makevote(message, content);
        case 'remindme':
            return reminder.create(message, content);
        case 'bottime':
            return botTime(message);
        case 'url':
            return parseUrl(message, content);
        default:
            return message.reply(`The '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;