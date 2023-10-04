// triggers the bot reacts to, and their possible reactions
const messageEvents = {
    GodvilleHalloween: {
        active() { return (new Date).getMonth() === 9; }, // only in October for Halloween
        minDelay: 0.5 * (60 * 1000), // in minutes
        maxDelay: 15 * (60 * 1000),
        autoDelete: 2 * 1000,
        channelId: '313398424911347712',
        messages: [
            'https://cdn.discordapp.com/attachments/353554102833250305/1025469102912966756/IMG_20220930_140327.jpg',
            'https://cdn.discordapp.com/attachments/313398424911347712/1158945920461844642/IMG_20220930_140729.jpg',
            'https://cdn.discordapp.com/attachments/313398424911347712/1158884815332970496/image0.gif',
            'https://cdn.discordapp.com/attachments/313398424911347712/1158884815790153758/image1.gif',
            { value: 'https://media.tenor.com/VXLAU_AIlF4AAAAC/jumpscare-ring-jumpscare.gif', autoDelete: 2.5 * 1000 },
            'https://upload.wikimedia.org/wikipedia/commons/5/5c/Grenn_gummy_jumpscare.gif',
            { value: 'https://media.discordapp.net/attachments/356861348371759114/1158955033128345611/ezgif.com-gif-maker.gif', autoDelete: 10.5 * 1000 },
        ],
    }, GodBotIsWatching: {
        active() { return true; },
        minDelay: 0.5 * (60 * 60 * 1000), // in hours
        maxDelay: 18 * (60 * 60 * 1000),
        autoDelete: 4 * 1000,
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
    const chosenMessage = messageEvent.messages[Math.floor(Math.random() * messageEvent.messages.length)];
    const autoDelete = chosenMessage.autoDelete || messageEvent.autoDelete; // object property has priority, falsy if both are undefined
    const messageContent = chosenMessage.value || chosenMessage; // value property if object, else it's the string itself

    channel.send(messageContent).then(msg => {
        // if defined, delete the message after autoDelete milliseconds
        if (!autoDelete) return;
        setTimeout(() => {
            msg.delete().catch(/* do nothing */);
        }, autoDelete);
    });
}

const random = (min, max) => min + Math.round(Math.random() * (max - min));

module.exports = setup;
