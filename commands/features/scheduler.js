const FieldValue = require('firebase-admin').firestore.FieldValue;
const logger = require('./commands/features/logging');

const allowedTypes = ['reminder'];
let eventsDoc;
let nextId = 0;


function startup(dbDoc) {
    eventsDoc = dbDoc;
    dbDoc.get().then(doc => {
        Object.keys(doc).forEach(key => {
            const event = doc[key];
            event.id = key; // for deletion from the database later
            const timestamp = event.timestamp;
            delete event.timestamp; // this is only necessary in the database
            scheduleEvent(event, timestamp);
        });
    });
}

// errors originating from this function should be logged where it's called from
function createEvent(event) {
    return new Promise((resolve, reject) => {
        if (!eventsDoc) reject('Scheduler.js wasn\'t initialised properly!'); // deny event creation
        if (!event || !event.type || !event.timestamp) reject('The event parameter, type or timestamp wasn\'t given! This is a code error.');

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

    switch(type) {
        case 'reminder':
            return 0;
        default:
            logger.log(`SCHEDULER ERROR: Failed to execute event ${id} of invalid type ${type}.`);
    }
}

exports.start = startup;
exports.create = createEvent;