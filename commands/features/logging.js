// const { channels } = require('../../configurations/config.json');
// const getters = require('../../index.js');

let logsChannel;
let started = false;

// doesn't function like a queue but that's how I use it. Idk why I even made this
class FakeQueue {
    #timeout;
    #elements = [];
    #pending = Promise.resolve();

    #messageLength(element) {
        if (typeof element === 'string') return element.length;
        return typeof element?.content === 'string' ? element.content.length : 0;
    }

    #totalLength() {
        let sum = 0;
        this.#elements.forEach(element => {
            sum += this.#messageLength(element);
        });
        return sum;
    }

    enqueue(logMessage) {
        const operation = this.#pending.then(async function() {
            await this.#enqueue(logMessage);
        }.bind(this));
        this.#pending = operation.catch(function(error) {
            console.error('ERROR: LOGGER QUEUE FAILED: ' + error);
        });
        return operation;
    }

    async #enqueue(logMessage) {
        let queueEmptied = Promise.resolve();

        // empty queue first if it would become too large
        if (this.#totalLength() + this.#messageLength(logMessage) > maxQueueSize) {
            queueEmptied = this.#emptyNow();
        }

        // if logMessage is not a string, don't cocatenate content but immediately send as is
        if (typeof logMessage !== 'string') {
            // empty queue first if it already has elements
            if (this.#elements.length > 0) queueEmptied = this.#emptyNow();
            // await emptying (if emptying started and queueEmptied is now pending)
            await queueEmptied;
            queueEmptied = sendChannel(logMessage); // store Promise if we need to await again
            return;
        }

        // don't queue if the element is too large, send immediately and return
        if (logMessage.length > maxQueueSize) {
            // empty queue first if it already has elements
            if (this.#elements.length > 0) queueEmptied = this.#emptyNow();
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
                this.empty();
            }.bind(this), queueWaitTime);
        }
    }

    empty() {
        const operation = this.#pending.then(function() {
            return this.#emptyNow();
        }.bind(this));
        this.#pending = operation.catch(function(error) {
            console.error('ERROR: LOGGER QUEUE FAILED: ' + error);
        });
        return operation;
    }

    /**
     * Empties the queue and sends the messages to the channel.
     * returns {Promise} - A promise that resolves when the queue is empty.
     */
    async #emptyNow() {
        // copy entire array and empty it
        const combinedMessage = (this.#elements.splice(0, this.#elements.length)).join('\n');
        // clear timer in case it wasn't cleared yet
        if (this.#timeout && !this.#timeout._destroyed) {
            clearTimeout(this.#timeout);
        }
        this.#timeout = undefined;

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
    // TODO: return a Promise that resolves when channel is done
    logConsole(logMessage);
    logChannel(logMessage);
}

function logError(logMessage) {
    if (!(logMessage instanceof Error)) {
        return logBoth(logMessage);
    }

    console.error(logMessage);
    logMessage = logMessage.stack;
    logChannel('```' + logMessage + '```');
}

/**
 * Takes an object or string and adds it to the queue.
 * @param {Object|String} logMessage - The object or string to be logged.
 */
function logChannel(logMessage) {
    // TODO: return a Promise that resolves when the message is sent
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

async function logFile(file, message) {
    await channelQueue.empty();

    try {
        if (!file || !Buffer.isBuffer(file.attachment) || !file.name) {
            throw new Error('The file must have a Buffer attachment and a name.');
        }
        if (file.attachment.length > 1024 * 1024) {
            throw new Error('The file exceeds the 1MB limit.');
        }
    } catch (error) {
        if (message) logBoth(message);
        logBoth(error);
        return;
    }

    if (message) logConsole(message);
    logConsole(`Logger: Sent file ${file.name} (${file.attachment.length} bytes).`);
    await sendChannel({ content: message, files: [file] });
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
        // TODO: implement
    }
}

function logConsole(text) {
    console.log(text);
}

function getChannel() {
    return logsChannel;
}

exports.start = startup;
exports.log = logBoth;
exports.error = logError;
exports.toChannel = logChannel;
exports.logFile = logFile;
exports.toConsole = logConsole;
exports.getChannel = getChannel;
