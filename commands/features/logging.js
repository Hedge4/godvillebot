// const { logs } = require('../../configurations/config.json');
// const getters = require('../../index.js');

let logsChannel;
let started = false;

// make a queue of messages to log, clear this queue by 1 message every second and stop recursing if queue is empty
// when clearing queue, try to combine 5 messages at most into 1 with newlines (<500 characters total)
// if message in queue has more than 2000 chars, split it up in a smart way (find newline between 1900 and 2000? Then space?)

// todo: if started == false for 5 minutes, try to reconfigure with client and logs (and login???)
// if that fails as well, try again after 5 more minutes, et cetera
// maybe make method for this in index.js instead and just activate that instead - other source would be failed startup

function startup(input) {
    if (input) {
        logsChannel = input;
        started = true;
    }
}

function logBoth(text) {
    logConsole(text);
    logChannel(text);
}

function logChannel(text) {
    if (started) {
        logsChannel.send(text)
        .catch(e => console.log('ERROR: LOGGER MODULE DOESN\'T LOG TO LOG CHANNEL!!! ' + e));
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