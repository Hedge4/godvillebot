//const { logs } = require('../../configurations/config.json');
// let started = false; // Possible: have check whether startup was done/restart bot if not. Error detection? Link to index.js?
let logsChannel;

function startup(input) {
    logsChannel = input;
}

function logBoth(text) {
    console.log(text);
    if (logsChannel) {
        logsChannel.send(text)
        .catch(e => console.log(e + 'ERROR: LOGGER MODULE DOESN\'T LOG TO LOG CHANNEL!!!'));
    } else {
        // restart or something?
    }
}

function logChannel(text) {
    if (logsChannel) {
        logsChannel.send(text)
        .catch(e => console.log(e + 'ERROR: LOGGER MODULE DOESN\'T LOG TO LOG CHANNEL!!!'));
    } else {
        // restart or something?
    }
}

function logConsole(text) {
    console.log(text);
}

// add recent memory that can be requested by bot owner (keep track of console only / channel only)

exports.start = startup;
exports.log = logBoth;
exports.toChannel = logChannel;
exports.toConsole = logConsole;