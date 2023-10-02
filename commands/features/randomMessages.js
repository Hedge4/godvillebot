// triggers the bot reacts to, and their possible reactions
const messageEvents = {
    GodvilleHalloween: {
        active() { return (new Date).getMonth() === 9; }, // only in October for Halloween
        minDelay: 0.5 * (60 * 1000), // in minutes
        maxDelay: 15 * (60 * 1000),
        autoDelete: true,
        deleteAfter: 2 * 1000,
        channelId: '313398424911347712',
        messages: [
            'https://cdn.discordapp.com/attachments/353554102833250305/1025469102912966756/IMG_20220930_140327.jpg',
        ],
    }, GodBotIsWatching: {
        active() { return true; },
        minDelay: 0.5 * (60 * 60 * 1000), // in hours
        maxDelay: 18 * (60 * 60 * 1000),
        autoDelete: true,
        deleteAfter: 4 * 1000,
        channelId: '313398424911347712',
        messages: [
            'https://cdn.discordapp.com/attachments/353554102833250305/1025469102912966756/IMG_20220930_140327.jpg',
        ],
    },
};


// executed once on bot startup
async function setup(client) {
    // set a timer for each messageEvent according to the stored delays
    Object.values(messageEvents).forEach(async e => {
        const channel = await client.channels.fetch(e.channelId);
        const timeout = random(e.minDelay, e.maxDelay);

        setTimeout(() => {
            sendMessage(e, channel);
            // if not active, schedule next check for 12 hours later
        }, e.active() ? timeout : 12 * 60 * 60 * 1000);
    });
}

// triggers when the delay has elapsed
function sendMessage(messageEvent, channel) {
    // schedule new messageEvent immediately
    const timeout = random(messageEvent.minDelay, messageEvent.maxDelay);

    setTimeout(() => {
        sendMessage(messageEvent, channel);
        // if not active, schedule next check for 12 hours later
    }, messageEvent.active() ? timeout : 12 * 60 * 60 * 1000);

    // return if the messageEvent is currently not active
    if (!messageEvent.active()) return;

    // if active and not returned, send a random message
    channel.send(messageEvent.messages[Math.floor(Math.random() * messageEvent.messages.length)]).then(msg => {
        if (messageEvent.autoDelete) {
            setTimeout(() => {
                msg.delete().catch(/* do nothing */);
            }, messageEvent.deleteAfter);
        }
    });
}

const random = (min, max) => min + Math.round(Math.random() * (max - min));

module.exports = setup;
