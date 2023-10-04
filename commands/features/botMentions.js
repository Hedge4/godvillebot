const { serversServed, botOwners, roles } = require('../../configurations/config.json');
const logger = require('./logging');

// setup for reacting to bot mentions in the godville server
const botMentionCooldown = new Set();

// how the bot can react when you ping it
const mentionReactions = [
    'YOU FOOL, YOU DARE MENTION ME???',
    'I\'ll pretend I didn\'t see that :eyes:',
    'https://media.tenor.com/images/10c1188bf1df85272a39c17ce863081c/tenor.gif',
    'oh boy you\'ve done it now, coming over to break your kneecaps rn',
    'don\'t ping me or I *will* pee your pants!',
    'hang on I\'m unfriending you on Facebook',
    'I\'m busy right now, can I ignore you some other time?',
    'initiating **DISCNAME** extermination process...',
    'your inability to talk with an actual human is concerning :no_mouth:',
    'wow, is that the sound of nothing interesting?',
    'stand still while I tie your shoelaces together!',
    'The desperation is strong in this one.',
    'How long does it take for you to realise that you\'re irrelevant to me?',
    'Nobody summons me without my permission!',
    'It must be difficult for you, exhausting your entire vocabulary in one sentence',
    'shhh... That\'s the sound of no one caring',
    'http://media.tenor.com/4IrGnLvq3B8AAAPo/dont-ping-me-dont-ping-me-every-again.mp4',
    'https://66.media.tumblr.com/85649825a5392e8cd3d832a4ed1534f5/tumblr_njpy6zj5by1tq4of6o1_500.gif',
    'https://media.tenor.com/nt19-OsRRY0AAAAM/inside-out-joy.gif',
    'What\'s up **DISCNAME** :sunglasses:',
    'https://media.tenor.com/mV75yoDbITYAAAAM/joey-tribbiani-friends.gif',
];

const muteReactions = [
    'Don\'t spam mention me.',
    'Don\'t spam mention me.',
    'If no one else wants to talk to you I surely don\'t! Muted.',
];

const unmuteReactions = [
    'Unmuted **DISCNAME**.',
    'Unmuted **DISCNAME**.',
    'It\'s been a minute, whatever <@DISCID>.',
];


// react when someoene mentions the bot
async function mentionReact(message, client) {
    if (Object.values(botOwners).includes(message.author.id)) return;

    if (botMentionCooldown.has(message.author.id)) {
        botMentionCooldown.delete(message.author.id); // why do I bother deleting this

        // no fetch for the servers, they should be cached upon client initialisation
        const gvServer = client.guilds.cache.get(serversServed.godvilleServer);
        const testServer = client.guilds.cache.get(serversServed.botServer);

        // members are undefined if the try clause fails
        const gvMember = await gvServer.members.fetch(message.author.id).catch(() => { /*do nothing*/ });
        const botMember = await testServer.members.fetch(message.author.id).catch(() => { /*do nothing*/ });

        try {
            if (gvMember) await gvMember.roles.add(roles.mutedMainServer);
            if (botMember) await botMember.roles.add(roles.mutedBotServer);
            setTimeout(async () => {
                try {
                    if (gvMember) await gvMember.roles.remove(roles.mutedMainServer);
                    if (botMember) await botMember.roles.remove(roles.mutedBotServer);
                    let text = unmuteReactions[Math.floor(Math.random() * unmuteReactions.length)];
                    text = text.replace('DISCNAME', `${message.author.tag}`);
                    text = text.replace('DISCID', `${message.author.id}`);
                    message.channel.send(text);
                    logger.log(`Unmuted ${message.author.tag}. (Mute reason: Spam mentioning me)`);
                } catch (error) {
                    logger.log(`Couldn't unmute ${message.author.tag} here and/or in the bot's server, oopsie.`);
                    logger.log(error);
                }
            }, 2 * 60 * 1000);
            logger.log(`Muted ${message.author.tag} for two minutes for spam mentioning the bot.`);
        } catch (error) {
            logger.log(`Couldn't mute ${message.author.tag} here and/or in the bot's server for spam mentioning me.`);
            logger.log(error);
        } finally {
            let text = muteReactions[Math.floor(Math.random() * muteReactions.length)];
            text = text.replace('DISCNAME', `${message.author.tag}`);
            text = text.replace('DISCID', `<@${message.author.id}>`);
            message.reply(text);
        }
    } else {
        botMentionCooldown.add(message.author.id);
        setTimeout(() => {
            botMentionCooldown.delete(message.author.id);
        }, 20 * 1000);

        let insult = mentionReactions[Math.floor(Math.random() * mentionReactions.length)];
        insult = insult.replace('DISCNAME', `${message.author.tag}`);
        insult = insult.replace('DISCID', `${message.author.id}`);
        message.reply(insult);
    }
}

module.exports = mentionReact;