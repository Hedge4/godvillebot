const logger = require('../features/logging');
let reacting = false;
const maxReactions = 20;

async function main(message, content) {
    if (reacting) {
        return message.reply('I\'m already reacting to a different message! Try again in a few seconds.');
    }

    const splitContent = content.indexOf(' ');
    if (splitContent < 1) {
        return message.reply('You need to enter both the ID of a message to react to, and a reaction.'
            + '\n\nTo get the ID of a message, you need to enable Developer Mode in the \'Behavior\' tab of your User Settings.'
            + ' Once you\'ve done this, right click/hold the message and a \'Copy ID\' option will appear.');
    }
    const messageID = content.substring(0, splitContent);
    if (isNaN(messageID)) {
        return message.reply(`A message ID has to be a number, which '${messageID}' isn't.`
            + '\n\nTo get the ID of a message, you need to enable Developer Mode in the \'Behavior\' tab of your User Settings.'
            + ' Once you\'ve done this, right click/hold the message and a \'Copy ID\' option will appear.');
    }

    let reaction = content.toLowerCase().substring(splitContent);
    // these are messy so we nope them
    reaction = reaction.replace(/<(?:@!?&?|#)[0-9]+>/g, '');
    // .trim() might be redundant here with the extra regex
    reaction = reaction.trim().replace(/\s/g, '');
    if (reaction.length < 1) {
        return message.reply('The text you entered was filtered out, try another reaction.');
    }

    const regexEmoji = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
    const emojiResults = {};
    // we don't need more than 20 unique emojis
    while ([...new Set(Object.values(emojiResults))].length < 20) {
        const res = regexEmoji.exec(reaction);
        if (!res) break;
        // obj.index = emoji
        emojiResults[res.index] = res[0];
    }

    const reactionList = [];
    for (let i = 0; i < reaction.length; i++) {
        const e = reaction[i];

        if (e in alphabet) {
            if (reactionList.includes(alphabet[e])) continue; // already in list? wheeeeee we skip
            reactionList.push(alphabet[e]);
        } else {
            // if not in alphabet, we check if our emoji thingy found a match
            if (!(i in emojiResults)) continue; // no match? No care
            if (reactionList.includes(emojiResults[i])) continue; // already in list? wheeeeee we skip
            reactionList.push(emojiResults[i]);
        }

        if (reactionList.length >= 20) break;
    }

    let targetMsg;
    try {
        targetMsg = await message.channel.messages.fetch(messageID);
    } catch (error) {
        return message.reply('I couldn\'t find a message with that ID in this channel.');
    }
    const reactionCount = targetMsg.reactions.cache.size;
    if (reactionCount >= maxReactions) {
        return message.reply('This message already has the maximum amount of reactions.');
    }

    // remove any overflow of reactions
    if (reactionList.length > maxReactions - reactionCount) {
        reactionList.splice(maxReactions - reactionCount);
    }

    logger.log(`${message.author.tag} reacted '${reaction}' to a message from ${targetMsg.author.tag} in ${message.channel.name}. ReactionList (${reactionList.length}): ${reactionList.join()}`);
    reacting = true;
    setTimeout(() => {
        message.delete().catch(() => { /*I don't careeeeeee*/ });
    }, 100);
    react(targetMsg, reactionList);
}

function react(message, reactionList) {
    message.react(reactionList.shift())
        .catch(() => { /*Do nothing, this error is common and it clogs up the console. Me is lazy*/ });

    // we done!
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