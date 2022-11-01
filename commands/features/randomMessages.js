// triggers the bot reacts to, and their possible reactions
const messageEvents = [
    {
        name: 'GodvilleHalloween',
        active: false,
        minDelay: 0.5 * (60 * 1000), // in minutes
        maxDelay: 15 * (60 * 1000),
        autoDelete: true,
        deleteAfter: 2 * 1000,
        channelId: '313398424911347712',
        messages: [
            'https://cdn.discordapp.com/attachments/353554102833250305/1025469102912966756/IMG_20220930_140327.jpg',
        ],
    },
];


// executed once on bot startup
async function setup(client) {
    // set a timer for each messageEvent according to the stored delays
    messageEvents.forEach(async e => {
        if (!e.active) return;

        const channel = await client.channels.fetch(e.channelId);
        const timeout = e.minDelay + Math.round(Math.random() * e.maxDelay);

        setTimeout(() => {
            sendMessage(e, channel);
        }, timeout);
    });
}

// triggers when the delay has elapsed
function sendMessage(messageEvent, channel) {
    channel.send(messageEvent.messages[Math.floor(Math.random() * messageEvent.messages.length)]).then(msg => {
        if (messageEvent.autoDelete) {
            setTimeout(() => {
                msg.delete().catch(/* do nothing */);
            }, messageEvent.deleteAfter);
        }
    });

    // schedule new messageEvent
    const timeout = messageEvent.minDelay + Math.round(Math.random() * messageEvent.maxDelay);

    setTimeout(() => {
        sendMessage(messageEvent, channel);
    }, timeout);
}

module.exports = setup;
