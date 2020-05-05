const bubblewrap = require('./bubblewrap.js');
const minesweeper = require('./minesweeper.js');

function redirect(message, Discord, client, cmd) {
    if (cmd === 'bubblewrap') {
        bubblewrap(message, client);
    }
    if (cmd === 'minesweeper') {
        minesweeper(message);
    }
}

module.exports = redirect;