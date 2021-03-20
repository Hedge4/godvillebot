const spoiler = require('./spoiler.js');
const code = require('./code.js');

function redirect(message, Discord, client, cmd) {
    if (cmd === 'spoiler') {
        spoiler(client, message);
    } else if (cmd === 'code') {
        code(message);
    }
}

module.exports = redirect;