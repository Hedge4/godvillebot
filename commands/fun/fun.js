const bubblewrap = require('./bubblewrap.js');

function redirect(message, Discord, client, cmd) {
    if (cmd === 'bubblewrap') {
        bubblewrap(message, client);
    }
}

module.exports = redirect;