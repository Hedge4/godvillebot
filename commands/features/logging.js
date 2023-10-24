// const { channels } = require('../../configurations/config.json');
// const getters = require('../../index.js');

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

    async enqueue(logMessage) {
        let queueEmptied = Promise.resolve();

        // empty queue first if it would become too large
        if (this.#totalLength() + logMessage.length > maxQueueSize) {
            queueEmptied = this.#empty();
        }

        // if logMessage is not a string, don't cocatenate content but immediately send as is
        if (typeof logMessage !== 'string') {
            // empty queue first if it already has elements
            if (this.#elements.length > 0) queueEmptied = this.#empty();
            // await emptying (if emptying started and queueEmptied is now pending)
            await queueEmptied;
            queueEmptied = sendChannel(logMessage); // store Promise if we need to await again
            return;
        }

        // don't queue if the element is too large, send immediately and return
        if (logMessage.length > maxQueueSize) {
            // empty queue first if it already has elements
            if (this.#elements.length > 0) queueEmptied = this.#empty();
            // await emptying (if emptying started and queueEmptied is now pending)
            await queueEmptied;
            queueEmptied = sendChannel(logMessage); // store Promise if we need to await again
            return;
        }

        // not too large, so add to queue
        this.#elements.push(logMessage);

        // set clear timer if this is the first element
        if (this.#elements.length === 1) {
            // set timer if not already active to clear queue every x milliseconds
            this.#timeout = setTimeout(function() {
                this.#empty();
            }.bind(this), queueWaitTime);
        }
    }

    /**
     * Empties the queue and sends the messages to the channel.
     * returns {Promise} - A promise that resolves when the queue is empty.
     */
    async #empty() {
        // copy entire array and empty it
        const combinedMessage = (this.#elements.splice(0, this.#elements.length)).join('\n');
        // clear timer in case it wasn't cleared yet
        if (this.#timeout && !this.#timeout._destroyed) {
            clearTimeout(this.#timeout);
        }

        // in case queue was empty
        if (!combinedMessage) return;

        // we can await #empty() function before sending another logMessage
        await sendChannel(combinedMessage);
    }
}

const queueWaitTime = 0.5 * 1000; // ms
const maxQueueSize = 500; // characters
const channelQueue = new FakeQueue();

// todo: if started == false for 5 minutes, try to reconfigure with client and logs (and login???)
// if that fails as well, try again after 5 more minutes, et cetera
// maybe make method for this in index.js instead and just activate that instead - other source would be failed startup

function startup(channel) {
    if (channel) {
        logsChannel = channel;
        started = true;
    }
}

function logBoth(logMessage) {
    logConsole(logMessage);
    logChannel(logMessage);
}

/**
 * Takes an object or string and adds it to the queue.
 * @param {Object|String} logMessage - The object or string to be logged.
 */
function logChannel(logMessage) {
    // get text from object if it's an object, empty string if there is no text
    const isPlainString = typeof logMessage === 'string';
    const logText = isPlainString ? logMessage : logMessage.content || '';

    const urlRegex = /https?:\/\/\S+/g;
    // characters at the end of a sentence shouldn't be part of the URL
    const urlBreakoffChars = ['\'', '.', '"', '!', '?', ':', ';', ')', ']', '}'];

    // Add <> brackets around URL, preserve final character if it's typically at the end of a sentence
    const result = logText.replace(urlRegex, function(match) {
        // Check if the final character is one in the list
        const finalChar = match.slice(-1);
        if (urlBreakoffChars.includes(finalChar)) {
            match = `<${match.slice(0, -1)}>${finalChar}`;
        } else {
            match = `<${match}>`;
        }
        return match;
    });

    // add to queue
    if (isPlainString) {
        channelQueue.enqueue(result);
    } else {
        // result is only truthy if logMessage had a property 'content'
        if (result) logMessage.content = result;
        channelQueue.enqueue(logMessage);
    }
}

async function sendChannel(logMessage) {
    if (started) {
        // we can await sendChannel() before sending another logMessage
        // we use Promise.race() to make sure we don't wait forever if something goes wrong
        await Promise.race([
            logsChannel.send(logMessage),
            new Promise(resolve => setTimeout(resolve, queueWaitTime)),
        ])
            .catch(e => {
                console.log('ERROR: LOGGER MODULE DOESN\'T LOG TO LOG CHANNEL!!! ' + e);
                console.log(`Message: ${logMessage}`);
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