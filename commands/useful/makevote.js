const { botOwners, roles } = require('../../configurations/config.json');
const logger = require('../features/logging.js');
let reacting = false;

async function main(message, content) {
    if (reacting) {
        return message.reply('I\'m already working on a different message! Try again in a few seconds.');
    }

    // if this regex passes, the input is correct. We don't need to check anything else
    const parsedArgs = /^(?:https?:\/\/discord\.com\/channels\/\d+\/\d+\/(\d{11,})|(\d{11,}))?\s*([2-9]|10)?$/i.exec(content);
    if (!parsedArgs) {
        return message.reply('Your command appears to be incorrect. First write down the ID or URL to the message you want to make into a poll, or write nothing to use the most recent message. Then write a number 2-10 for a multiple-choice poll, or nothing for an encourage/miracle/punish poll. Make sure there are no extra characters.');
    }

    let targetMsg;
    if (parsedArgs[1] || parsedArgs[2]) {
        // set messageId to the id group that isn't null
        const messageId = parsedArgs[1] ? parsedArgs[1] : parsedArgs[2];
        try {
            targetMsg = await message.channel.messages.fetch(messageId);
        } catch (error) {
            return message.reply(`I couldn't find a message with id ${messageId} in this channel.`);
        }
    } else {
        // if no messageId was found use second latest message in channel (skip the command)
        const latestMessages = await message.channel.messages.fetch({ limit: 2 });
        if (latestMessages.size < 2) return message.reply('Couldn\'t find the latest message in this channel to reply to.');
        targetMsg = latestMessages.last();
    }

    let reactionList;
    const amount = parsedArgs[3];
    if (!amount) {
        // if no amount is given, make enc/mir/pun poll
        reactionList = ['313788789787197441', '313798262484107274', '313788834640953346'];
    } else if (amount == 10) {
        // the regex already makes sure the amount is in the range 2-10
        reactionList = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    } else {
        reactionList = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'].slice(0, amount);
    }

    let logsText = `${message.author.tag} made a message from ${targetMsg.author.tag} in ${message.channel.name} into a vote.`;
    const reactionCount = targetMsg.reactions.cache.size;

    if (reactionCount > 0) {
        if (message.member.roles.cache.has(roles.admin) || Object.values(botOwners).includes(message.author.id)) {
            // try to remove the reactions already on the message if the user is a mod
            try {
                await targetMsg.reactions.removeAll();
            } catch (error) {
                logger.log(`Bot couldn't remove old reactions from a message. Error: ${error}`);
                return message.reply(`This message already has reactions which I tried to remove, but something went wrong. Error: ${error}`);
            }
            logsText += ` ${reactionCount} old reactions on the message were removed to do this.`;
            reacting = true;
            react(targetMsg, reactionList);
        } else {
            return message.reply('This message already has reactions. This command would clear those, so only mods can do this.');
        }
    } else {
        reacting = true;
        react(targetMsg, reactionList);
    }

    logger.log(logsText);
    setTimeout(() => { // delete command after finishing
        message.delete();
    }, 100);
}

function react(message, reactionList) {
    message.react(reactionList.shift())
        .catch((e) => {
            setTimeout(() => {
                reacting = false;
            }, 1000);
            logger.log(`Error while adding vote options. Error: ${e}`);
            return message.channel.send(`❗ Oops! ❗ Something went wrong while I was adding vote options. Error: ${e}`);
        });
    if (reactionList.length < 1) {
        setTimeout(() => {
            reacting = false;
        }, 1000);
        return;
    }

    setTimeout(() => {
        react(message, reactionList);
    }, 1000);
}

module.exports = main;