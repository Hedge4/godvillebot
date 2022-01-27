const { adminRole } = require('../../configurations/config.json');
const logger = require('../features/logging');

async function main(message, content) {

    if (content.trim().length < 1) {
        return message.reply('you need to use this command with the ID of the message you want to make into a vote.'
            + '\n\nTo get the ID of a message, you need to enable Developer Mode in the \'Behavior\' tab of your User Settings.'
            + ' Once you\'ve done this, right click/hold the message and a \'Copy ID\' option will appear.');
    }

    let messageID;
    let reactionList;
    const splitIndex = content.indexOf(' ');
    if (splitIndex < 1) {
        messageID = content.trim();
        reactionList = ['313788789787197441', '313798262484107274', '313788834640953346'];
    } else {
        messageID = content.substring(0, splitIndex);
        const numberOfChoices = content.substring(splitIndex).trim();
        if (isNaN(numberOfChoices) || numberOfChoices < 1 || numberOfChoices > 10) {
            return message.reply('If you want to create a multiple choice poll, you can pass a number (1-10) into the command as the second argument.')
                + ` You passed '${numberOfChoices}'. If you don't want a multiple choice poll, only provide a message ID.`;
        } else if (numberOfChoices == 10) {
            reactionList = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
        } else { reactionList = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '0️⃣'].slice(0, numberOfChoices + 1); }
    }

    if (isNaN(messageID)) {
        return message.reply(`a message ID has to be a number, which '${messageID}' isn't.`
            + '\n\nTo get the ID of a message, you need to enable Developer Mode in the \'Behavior\' tab of your User Settings.'
            + ' Once you\'ve done this, right click/hold the message and a \'Copy ID\' option will appear.');
    }

    let targetMsg;
    try {
        targetMsg = await message.channel.messages.fetch(messageID);
    } catch (error) {
        return message.reply('I couldn\'t find a message with that ID in this channel.');
    }

    let logsText = `${message.author.tag} made a message from ${targetMsg.author.tag} in ${message.channel.name} into a vote.`;
    const reactionCount = targetMsg.reactions.cache.array().length;

    if (reactionCount > 0) {
        if (message.member.roles.cache.has(adminRole)) {
            // try to remove the reactions already on the message if the user is a mod
            try {
                await targetMsg.reactions.removeAll();
            } catch (error) {
                logger.log(`Bot couldn't remove old reactions from a message. Error: ${error}`);
                return message.reply(`this message already has reactions which I tried to remove, but something went wrong. Error: ${error}`);
            }
            logsText += ` ${reactionCount} old reactions on the message were removed to do this.`;
            react(targetMsg, reactionList);
        } else {
            return message.reply('this message already has reactions. This command will clear those, so only a moderator can do this.');
        }
    } else {
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
            logger.log(`Error while adding vote options. Error: ${e}`);
            return message.channel.send(`Oops, something went wrong while I was adding vote options. Error: ${e}`);
        });
    if (reactionList.length < 1) {
        return;
    }

    setTimeout(() => {
        react(message, reactionList);
    }, 1000);
}

module.exports = main;