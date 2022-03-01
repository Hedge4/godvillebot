const { logs, mutedRole } = require('../../configurations/config.json');

// setup for reacting to bot mentions in the godville server
const botMentionCooldown = new Set();

// how the bot can react when you ping it
const mentionReactions = ['YOU FOOL, YOU DARE MENTION ME???',
    'I\'ll pretend I didn\'t see that :eyes:',
    'https://media.tenor.com/images/10c1188bf1df85272a39c17ce863081c/tenor.gif',
    'oh boy you\'ve done it now, coming over to break your kneecaps rn',
    'don\'t ping me or I *will* pee your pants!',
    'hang on I\'m unfriending you on Facebook.',
    'I\'m busy right now, can I ignore you some other time?',
    'initiating **DISCNAME** extermination process...',
    'your inability to talk with an actual human is concerning :no_mouth:',
    'wow, is that the sound of nothing interesting?',
    'stand still while I tie your shoelaces together!'];


// react when someoene mentions the bot
async function mentionReact(message, client) {
    if (botMentionCooldown.has(message.author.id)) {
        botMentionCooldown.delete(message.author.id);
        const logsChannel = client.channels.cache.get(logs);
        message.member.roles.add(mutedRole);
        message.reply('Don\'t spam mention me.');
        setTimeout(() => {
            message.member.roles.remove(mutedRole);
            message.channel.send(`Unmuted ${message.author}.`);
            console.log(`Unmuted ${message.author.tag}.`);
            logsChannel.send(`Unmuted ${message.author.tag}.`);
        }, 60 * 1000);
        console.log(`Muted ${message.author.tag} for one minute for spam mentioning the bot.`);
        logsChannel.send(`Muted ${message.author.tag} for one minute for spam mentioning the bot.`);
    } else {
        botMentionCooldown.add(message.author.id);
        setTimeout(() => {
            botMentionCooldown.delete(message.author.id);
        }, 20 * 1000);
        message.reply(mentionReactions[Math.floor(Math.random() * mentionReactions.length)].replace('DISCNAME', `${message.author.tag}`));
    }
}

module.exports = mentionReact;