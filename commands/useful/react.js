const { logs } = require('../../configurations/config.json');
let reacting = false;

async function main(message, content, client) {
    if (reacting) {
        return message.reply('I\'m already reacting to a different message! Try again in a few seconds.');
    }

    const splitContent = content.indexOf(' ');
    if (splitContent < 1) {
        return message.reply('you need to enter both the ID of a message to react to, and a reaction.');
    }
    const messageID = content.substring(0, splitContent);
    if (isNaN(messageID)) {
        return message.reply(`a message ID has to be a number, which '${messageID}' isn't.`);
    }
    const reaction = content.toLowerCase().substring(splitContent).trim();

    const reactionList = [];
    const reactionArray = reaction.replace(/\s/g, '').split('');
    if (reactionArray.length > 20) {
        return message.reply('your reaction can be 20 characters at most - keep in mind duplicate letters will be removed!');
    }

    for (let i = 0; i < reactionArray.length; i++) {
        const e = reactionArray[i];

        if (!(e in alphabet)) {
            return message.reply(`'${e}' isn't in my dictionary, so I can't react with that emoji. Please use only letters.`);
        }

        if (alphabet[e] in reactionList) continue;
        reactionList.push(alphabet[e]);

        if (reactionList.length >= 20) break;
    }

    const logsChannel = client.channels.cache.get(logs);
    message.channel.messages.fetch(messageID)
        .then(msg => {
            logsChannel.send(`${message.author.tag} reacted '${reaction}' to a message in ${message.channel.name}.`);
            console.log(`${message.author.tag} reacted '${reaction}' to a message in ${message.channel.name}.`);
            react(msg, reactionList);
            reacting = true;
            message.delete();
        })
        .catch(() => { message.reply('I couldn\'t find a message with that ID in this channel.'); });
}

function react(message, reactionList) {
    message.react(reactionList.shift())
        .catch(() => { /*Do nothing, this error is common and it clogs up the console. Me is lazy*/ });
    if (reactionList.length < 1) {
        reacting = false;
        return;
    }

    setTimeout(() => {
        react(message, reactionList);
    }, 1000);
}

module.exports = main;

const alphabet = {
    'a': '🇦',
    'b': '🇧',
    'c': '🇨',
    'd': '🇩',
    'e': '🇪',
    'f': '🇫',
    'g': '🇬',
    'h': '🇭',
    'i': '🇮',
    'j': '🇯',
    'k': '🇰',
    'l': '🇱',
    'm': '🇲',
    'n': '🇳',
    'o': '🇴',
    'p': '🇵',
    'q': '🇶',
    'r': '🇷',
    's': '🇸',
    't': '🇹',
    'u': '🇺',
    'v': '🇻',
    'w': '🇼',
    'x': '🇽',
    'y': '🇾',
    'z': '🇿',
};