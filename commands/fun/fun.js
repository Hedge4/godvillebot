const bubblewrap = require('./bubblewrap.js');
const minesweeper = require('./minesweeper.js');

function redirect(message, Discord, client, cmd) {
    if (cmd === 'bubblewrap') {
        bubblewrap(client, message);
    }
    if (cmd === 'minesweeper') {
        minesweeper(client, message);
    }
}

module.exports = redirect;