const { logs } = require('../../configurations/config.json');
let reacting = false;
const maxReactions = 20;

async function main(message, content, client) {
    if (reacting) {
        return message.reply('I\'m already reacting to a different message! Try again in a few seconds.');
    }

    const splitContent = content.indexOf(' ');
    if (splitContent < 1) {
        return message.reply('you need to enter both the ID of a message to react to, and a reaction.'
            + '\n\nTo get the ID of a message, you need to enable Developer Mode in the \'Behavior\' tab of your User Settings.'
            + ' Once you\'ve done this, right click/hold the message and a \'Copy ID\' option will appear.');
    }
    const messageID = content.substring(0, splitContent);
    if (isNaN(messageID)) {
        return message.reply(`a message ID has to be a number, which '${messageID}' isn't.`
            + '\n\nTo get the ID of a message, you need to enable Developer Mode in the \'Behavior\' tab of your User Settings.'
            + ' Once you\'ve done this, right click/hold the message and a \'Copy ID\' option will appear.');
    }
    const reaction = content.toLowerCase().substring(splitContent).trim();

    const reactionList = [];
    const reactionArray = reaction.replace(/\s/g, '').split('');
    for (let i = 0; i < reactionArray.length; i++) {
        const e = reactionArray[i];

        if (!(e in alphabet)) {
            return message.reply(`'${e}' isn't in my dictionary, so I can't react with that emoji. Please use only letters.`);
        }

        if (reactionList.includes(alphabet[e])) continue;
        reactionList.push(alphabet[e]);

        if (reactionList.length >= 20) break;
    }

    let targetMsg;
    try {
        targetMsg = await message.channel.messages.fetch(messageID);
    } catch (error) {
        return message.reply('I couldn\'t find a message with that ID in this channel.');
    }
    const reactionCount = targetMsg.reactions.cache.array().length;
    if (reactionCount >= maxReactions) {
        return message.reply('this message already has the maximum amount of reactions.');
    }

    if (reactionList.length > maxReactions - reactionCount) {
        return message.reply(`your reaction can be ${maxReactions - reactionCount} different characters at most - keep in mind duplicate letters will be removed!`);
    }

    const logsChannel = client.channels.cache.get(logs);
    logsChannel.send(`${message.author.tag} reacted '${reaction}' to a message from ${targetMsg.author.tag} in ${message.channel.name}.`);
    console.log(`${message.author.tag} reacted '${reaction}' to a message from ${targetMsg.author.tag} in ${message.channel.name}.`);
    reacting = true;
    setTimeout(() => {
        message.delete();
    }, 100);
    react(targetMsg, reactionList);
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

    '0': '0️⃣',
    '1': '1️⃣',
    '2': '2️⃣',
    '3': '3️⃣',
    '4': '4️⃣',
    '5': '5️⃣',
    '6': '6️⃣',
    '7': '7️⃣',
    '8': '8️⃣',
    '9': '9️⃣',

    '!': '❕',
    '?': '❔',
    '#': '#️⃣',
    '*': '*️⃣',
    '>': '▶️',
    '<': '◀️',
    '$': '💲',
    '+': '➕',
    '-': '➖',
};