const { logs, adminRole } = require('../../configurations/config.json');

async function main(message, content, client) {

    if (content.trim().length < 1) {
        return message.reply('you need to use this command with the ID of the message you want to make into a vote.'
            + '\n\nTo get the ID of a message, you need to enable Developer Mode in the \'Behavior\' tab of your User Settings.'
            + 'Once you\'ve done this, right click/hold the message and a \'Copy ID\' option will appear.');
    }

    const messageID = content.trim();
    if (isNaN(messageID)) {
        return message.reply(`a message ID has to be a number, which '${messageID}' isn't.`
            + '\n\nTo get the ID of a message, you need to enable Developer Mode in the \'Behavior\' tab of your User Settings.'
            + 'Once you\'ve done this, right click/hold the message and a \'Copy ID\' option will appear.');
    }

    let targetMsg;
    try {
        targetMsg = await message.channel.messages.fetch(messageID);
    } catch (error) {
        return message.reply('I couldn\'t find a message with that ID in this channel.');
    }

    let logsText = `${message.author.tag} made a message from ${targetMsg.author.tag} in ${message.channel.name} into a vote.`;
    const reactionList = ['313788789787197441', '313798262484107274', '313788834640953346'];
    const reactionCount = targetMsg.reactions.cache.array().length;

    if (reactionCount > 0) {
        if (message.member.roles.cache.has(adminRole)) {
            // try to remove the reactions already on the message if the user is a mod
            try {
                await message.reactions.removeAll();
            } catch (error) {
                return message.reply(`this message already has reactions which I tried to remove, but something went wrong. Error: ${error}`);
            }
            logsText += `${reactionCount} old reactions on the message were removed to do this.`;
            react(message, reactionList);
        } else {
            return message.reply('this message already has reactions. This command will clear those, so only a moderator can do this.');
        }
    } else {
        react(message, reactionList);
    }

    const logsChannel = client.channels.cache.get(logs);
    console.log(logsText);
    logsChannel.send(logsText);
    message.channel.send('Done!');
    react(targetMsg, reactionList);
}

function react(message, reactionList) {
    message.react(reactionList.shift())
        .catch((e) => {
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