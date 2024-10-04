const { channels } = require('../../configurations/config.json');
const logger = require('../features/logging');

function leaveGuild(client, message) {
    const serverName = message.guild.name;
    const serverID = message.guildId;
    const modLogs = client.channels.cache.get(channels.modLogs);
    // TODO: also await logger.log before leaving
    logger.log(`${message.author.tag}/${message.author.id} forced the bot to leave ${serverName}/${serverID}.`);
    const modLogPromise = modLogs.send(`${message.author.tag}/${message.author.id} forced the bot to leave ${serverName}/${serverID}.`);
    const byeMsgPromise = message.reply('Cya! :wave:');

    // race both reply and modlog being sent versus 2s delay, then leave
    const timeoutPromise = new Promise((resolve) => { setTimeout(resolve, 2000); });
    Promise.race([timeoutPromise, Promise.all([modLogPromise, byeMsgPromise])]).then(() => {
        // leave server
        message.guild.leave()
            .then(() => {
                logger.log(`Left server ${serverName}/${serverID}.`);
            })
            .catch((error) => {
                logger.log(`ERROR: Failed to leave server ${serverName}/${serverID}`);
                logger.error(error);
                modLogs.send(`ERROR: Failed to leave server ${serverName}/${serverID}: ${error}`);
                message.reply('Failed to leave! Please try to kick me instead.');
            });
    });
}

module.exports = leaveGuild;