const FieldValue = require('firebase-admin').firestore.FieldValue;
const logger = require('./logging');

const reminder = require('../useful/reminder');

const allowedTypes = ['reminder'];
let eventsDoc;
let nextId = 0;


function startup(dbDoc) {
    eventsDoc = dbDoc;
    dbDoc.get().then(doc => {
        const data = doc.data();
        if (!data) {
            logger.log('No scheduled events found in the database!');
            return;
        }
        let count = 0;
        let highestId = 0;

        Object.keys(data).forEach(key => {
            if (key === 'nextId') return; // only this property doesn't store an event so we skiiiip
            key = parseInt(key);
            if (isNaN(key)) return; // ewww that's a dirty key
            highestId = key > highestId ? key : highestId;

            const event = data[key];
            event.id = key; // for deletion from the database later
            const timestamp = event.timestamp;
            delete event.timestamp; // this is only necessary in the database
            scheduleEvent(event, timestamp);
            count++;
        });

        nextId = data['nextId'] || highestId;
        logger.log(`SCHEDULER: Scheduled ${count} events from the database. Next event id is ${nextId}.`);
    });
}

// errors originating from this function should be logged where it's called from
function createEvent(event) {
    return new Promise((resolve, reject) => {
        if (!eventsDoc) reject('Scheduler.js wasn\'t initialised properly!'); // deny event creation
        if (!event || !event.type || !event.timestamp) reject('The event parameter, type or timestamp wasn\'t given! This is a code error.');
        if (typeof event.id !== 'undefined') reject('ID property was already specified in the event object, but this property would be overwritten. This is a code error.');

        if (!allowedTypes.includes(event.type)) reject(`${event.type} is not a valid event type! This is a code error.`);


        const eventId = nextId++;
        eventsDoc.set({ [eventId]: event, nextId: nextId }, { merge: true })
            .then(() => {
                event.id = eventId; // for deletion from the database later
                const timestamp = event.timestamp;
                delete event.timestamp; // this is only necessary in the database
                scheduleEvent(event, timestamp);
                resolve(eventId); // for logging purposes
            }).catch(error => {
                // don't decrease nextId because of asynchronous code
                reject(error ? error.toString() : 'Failed to upload event to database.');
            });
    });
}

function scheduleEvent(event, timestamp) {
    const now = new Date().getTime();
    const delay = timestamp - now;

    // timeout delay is stored as a 32-bit signed int, which is a little over 24 days
    // plan events 3 days into the future at most for accuracy
    if (delay > 3 * 24 * 60 * 60 * 1000) {
        let reducedDelay = ~~(delay / 2);
        // use either the halfway point to the timestamp, or the max timeout possible
        reducedDelay = reducedDelay > Math.pow(2, 31) - 1 ? Math.pow(2, 31) - 1 : reducedDelay;

        // run scheduleEvent again closer to the intended timestamp
        setTimeout(() => {
            scheduleEvent(event, timestamp);
        }, reducedDelay);
        return;
    }

    // schedule the actual execution of the event (if it's within 3 days)
    setTimeout(() => {
        executeEvent(event);
    }, delay);
}

function executeEvent(event) {
    const type = event.type;
    const id = event.id;
    // we don't need type or id outside of this function
    delete event.type;
    delete event.id;

    // delete from Firebase
    eventsDoc.update({
        [id]: FieldValue.delete(),
    });

    switch (type) {
        case 'reminder':
            return reminder.send(event);
        default:
            logger.log(`SCHEDULER ERROR: Failed to execute event ${id} of invalid type ${type}.`);
    }
}

exports.start = startup;
exports.create = createEvent;