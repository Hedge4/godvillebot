// const { channels } = require('../configurations/config.json');
// const getters = require('../index.js');

let logsChannel;
let started = false;

// doesn't function like a queue but that's how I use it. Idk why I even made this
class FakeQueue {
    #timeout;
    #elements = [];

    #totalLength() {
        let sum = 0;
        this.#elements.forEach(element => {
            sum += element.length;
        });
        return sum;
    }

    enqueue(elem) {
        if (this.#totalLength() + elem.length > maxQueueSize) {
            // empty queue first if it would become too large
            this.#empty();
        }

        if (elem.length > maxQueueSize) {
            // don't add too queue if the element is too large
            sendChannel(elem);
        } else {
            // add to queue
            this.#elements.push(elem);

            // set clear timer if this is the first element
            if (this.#elements.length === 1) {
                // clear queue every x milliseconds
                this.#timeout = setTimeout(function() {
                    this.#empty();
                }.bind(this), queueWaitTime);
            }
        }
    }

    #empty() {
        // copy entire array and empty it
        const logMessage = (this.#elements.splice(0, this.#elements.length)).join('\n');
        // clear timer in case it wasn't cleared yet
        if (this.#timeout && !this.#timeout._destroyed) {
            clearTimeout(this.#timeout);
        }

        // in case something goes wrong and it has a length of 0
        if (logMessage) sendChannel(logMessage);
    }
}

const queueWaitTime = 0.5 * 1000; // ms
const maxQueueSize = 500; // characters
const channelQueue = new FakeQueue();

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
    channelQueue.enqueue(text);
}

function sendChannel(text) {
    if (started) {
        logsChannel.send(text)
            .catch(e => {
                console.log('ERROR: LOGGER MODULE DOESN\'T LOG TO LOG CHANNEL!!! ' + e);
                console.log(`Message: ${text}`);
            });
    } else {
        // restart or something?
    }
}

function logConsole(text) {
    console.log(text);
}

function getChannel() {
    return logsChannel;
}

// add recent memory that can be requested by bot owner (keep track of console only / channel only)

exports.start = startup;
exports.log = logBoth;
exports.toChannel = logChannel;
exports.toConsole = logConsole;
exports.getChannel = getChannel;