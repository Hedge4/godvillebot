const logger = require('../features/logging');
const maxReactions = 20;
const skipChar = '~';
let reacting = false;

async function main(message, content) {
    if (reacting) {
        return message.reply('I\'m already reacting to a different message! Try again in a few seconds.');
    }

    // if this regex passes, the input is correct. We only need to check the separate reactions
    const parsedArgs = /^(?:(?:https?:\/\/discord\.com\/channels\/\d+\/\d+\/(\d+)|(\d{2,}))\s+)?(\S.*)/i.exec(content);
    if (!parsedArgs) {
        return message.reply('Your command appears to be incorrect. First write down the ID or url to the message you want me to react to, or write nothing to react to the latest message. Then write a number 2-10 for a multi-choice poll, or nothing for an encourage/miracle/punish poll. Make sure there are no extra characters.');
    }

    let targetMsg;
    if (parsedArgs[1] || parsedArgs[2]) {
        // set messageId to the id group that isn't null
        const messageId = parsedArgs[1] ? parsedArgs[1] : parsedArgs[2];
        try {
            targetMsg = await message.channel.messages.fetch(messageId);
        } catch (error) {
            return message.reply(`I couldn't find a message with ID ${messageId} in this channel.`);
        }
    } else {
        // if no messageId was found use second latest message in channel (skip the command)
        const latestMessages = await message.channel.messages.fetch({ limit: 2 });
        if (latestMessages.size < 2) return message.reply('Couldn\'t find the latest message in this channel to reply to.');
        targetMsg = latestMessages.last();
    }
    const reactionCount = targetMsg.reactions.cache.size;
    if (reactionCount >= maxReactions) {
        return message.reply('This message already has the maximum amount of reactions.');
    }

    let reaction = parsedArgs[3];
    reaction = reaction.replace(/<(?:@!?&?|#)[0-9]+>/g, ''); // remove mentions
    reaction = reaction.replace(/\s/g, ''); // remove whitespace
    if (reaction.length < 1) {
        return message.reply('The text you entered was filtered out, try another reaction.');
    }

    const emojiResults = {};
    // we don't need more than 20 unique emojis
    while ([...new Set(Object.values(emojiResults))].length < 20) {
        // detect and replace custom emojis
        const res1 = /<[^:>\s]*:[^:>\s]+:(\d+)>/gi.exec(reaction);
        if (!res1) break;
        // obj.index = custom emoji
        emojiResults[res1.index] = res1[1];

        // replace the found thingy with a placeholder char not in the reaction alphabet
        reaction = reaction.substring(0, res1.index) + skipChar + reaction.substring(res1.index + res1[0].length);
    }

    const length = [...new Set(Object.values(emojiResults))].length;
    // we don't know if these indices are earlier or later, so just set a limit of 20 extra emojis
    while ([...new Set(Object.values(emojiResults))].length < 20 + length) {
        // unicode stuffs
        const res2 = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu.exec(reaction);
        if (!res2) break;
        // obj.index = emoji
        emojiResults[res2.index] = res2[0];

        // replace the found thingy with a placeholder text not in the reaction alphabet
        const replaceText = new Array(res2[0].length + 1).join(skipChar); // same length so we don't overwrite indices already in the emojiResults object
        reaction = reaction.substring(0, res2.index) + replaceText + reaction.substring(res2.index + res2[0].length);
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

    // remove any overflow of reactions
    if (reactionList.length > maxReactions - reactionCount) {
        reactionList.splice(maxReactions - reactionCount);
    }

    logger.log(`${message.author.tag} reacted to a message from ${targetMsg.author.tag} in ${message.channel.name}. ReactionList (${reactionList.length}): ${reactionList.join()}`);
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

    // we not done!
    setTimeout(() => {
        react(message, reactionList);
    }, 1000);
}

module.exports = main;

// abcdefghijklmnopqrstuvwxyz
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