// IMPORTANT
// No messages older than two weeks can be bulk deleted. This is a Discord limitation.

const { channels } = require('../../configurations/config.json');
const main = require('../../index');
const logger = require('../features/logging');

const PURGE_LIMIT = 100; // Discord API limit for bulk delete
const DISCORD_EPOCH = 1420070400000; // Discord's epoch, milliseconds


// channels the bot automatically purges, and the purge settings
const autoPurged = [
    {
        channelId: channels.logville,
        repeatDelay: 12 * (60 * 60 * 1000), // check every 12 hours
        purgeDelay: 10 * (24 * 60 * 60 * 1000), // only purge older than 10 days
        allowedMessages: 1, // keep the last message
    },
];


// executed once on bot startup
async function onStartup() {
    // set a timer for each purgeInstance according to the stored delays
    autoPurged.forEach(async purgeInstance => {
        const client = main.getClient();
        const channel = await client.channels.fetch(purgeInstance.channelId);

        // immediately purge, which will also schedule the next purge
        purgeMessages(purgeInstance, channel);
    });
}


// triggers when the delay has elapsed
async function purgeMessages(purgeInstance, channel) {
    let finished; // for recursion

    try {
        // calculate the timestamp for before which messages should be purged
        const purgeTimestamp = Date.now() - purgeInstance.purgeDelay;
        // create the Discord snowflake for the before parameter
        const beforeSnowflake = createDiscordSnowflake(purgeTimestamp);
        const messages = await channel.messages.fetch({ limit: PURGE_LIMIT, before: beforeSnowflake });

        // bulk delete messages
        const resMessages = await channel.bulkDelete(messages, true);
        logger.log(`AutoPurge <#${purgeInstance.channelId}>: Purged ${resMessages.size} messages.`);

        if ((purgeInstance.allowedMessages && messages.size > resMessages.size + purgeInstance.allowedMessages)
            || (!purgeInstance.allowedMessages && messages.size > resMessages.size)
        ) {
            const logMsg = `AutoPurge <#${purgeInstance.channelId}>: Purged less messages than fetched (${resMessages.size} instead of ${messages.size}), some could not be deleted.`;
            // const client = main.getClient();
            // const adminChannel = await client.channels.fetch(channels.losAdminos);
            // adminChannel.send(logMsg);
            logger.log(logMsg);
            finished = true;
        }

        // we've reached the end of the channel, stop purging
        if (!finished && resMessages.size !== PURGE_LIMIT) {
            logger.log(`AutoPurge <#${purgeInstance.channelId}>: No more messages to be deleted, channel is clean.`);
            finished = true;
        }
    } catch (error) {
        const client = main.getClient();
        const adminChannel = await client.channels.fetch(channels.losAdminos);
        adminChannel.send(`Error purging messages from <#${purgeInstance.channelId}>: ${error}`);
    }

    // schedule next purge
    setTimeout(() => {
        purgeMessages(purgeInstance, channel);
    }, finished ? purgeInstance.repeatDelay : 5000); // 5 seconds delay if not finished
}


function createDiscordSnowflake(timestamp) {
    // Discord snowflakes are 64-bit unsigned integers
    // Compose the snowflake with the timestamp and other fields
    const snowflake = BigInt(timestamp - DISCORD_EPOCH) << BigInt(22);
    return snowflake.toString();
}


exports.setup = onStartup;
