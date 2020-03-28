const spoiler = require('./spoiler.js');

function redirect(message, Discord, client, cmd) {
    if (cmd === 'spoiler') {
        spoiler(message);
    }
}

module.exports = redirect;