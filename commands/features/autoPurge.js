// IMPORTANT
// No messages older than two weeks can be bulk deleted. This is a Discord limitation.

const { channels } = require('../../configurations/config.json');
const main = require('../../index');
const logger = require('../features/logging');

const PURGE_LIMIT = 100; // Discord API limit for bulk delete
const DELAY_LIMIT = 14 * (24 * 60 * 60 * 1000); // Can not delete older than 2 weeks
const DISCORD_EPOCH = 1420070400000; // Discord's epoch, milliseconds


// channels the bot automatically purges, and the purge settings
const autoPurged = [
    {
        channelId: channels.logville,
        repeatDelay: 12 * (60 * 60 * 1000), // check every 12 hours
        purgeDelay: 10 * (24 * 60 * 60 * 1000), // only purge older than 10 days
    },
];


// executed once on bot startup
async function onStartup() {
    // set a timer for each purgeInstance according to the stored delays
    autoPurged.forEach(async purgeInstance => {
        const client = main.getClient();
        const channel = await client.channels.fetch(purgeInstance.channelId);

        if (!channel) {
            const adminChannel = await client.channels.fetch(channels.losAdminos);
            adminChannel.send(`AutoPurge error: Could not fetch channel <#${purgeInstance.channelId}> (${purgeInstance.channelId})`);
            logger.log(`AutoPurge <#${purgeInstance.channelId}> ERROR: Could not find channel ${purgeInstance.channelId}.`);
            return;
        }

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

        // filter out messages that are too old to be purged
        const filteredMessages = messages.filter(message => Date.now() - message.createdTimestamp < DELAY_LIMIT); // true if newer than MAX_DELAY
        const inaccessibleMessages = filteredMessages.size < messages.size; // true if there were inaccessible messages

        // bulk delete messages
        const resMessages = await channel.bulkDelete(filteredMessages, true);
        logger.log(`AutoPurge <#${purgeInstance.channelId}>: Purged ${resMessages.size} messages.`);

        // stop purging if less messages were deleted than the limit
        if (resMessages.size < PURGE_LIMIT) {
            finished = true;

            // throw error if messages were missed
            const missedMessages = filteredMessages.difference(resMessages);
            if (missedMessages.size > 0) {
                const newestMessage = missedMessages.first();
                const oldestMessage = missedMessages.last();
                const errorMessage = `At least ${missedMessages.size} messages could not be purged, but they should have been deletable. Oldest message: ${oldestMessage.id} (${oldestMessage.createdTimestamp}), newest message: ${newestMessage.id} (${newestMessage.createdTimestamp}). Current timestamp: ${Date.now()}.`;
                throw new Error(errorMessage);
            }

            // we've reached the end of the channel, stop purging
            if (!inaccessibleMessages) logger.log(`AutoPurge <#${purgeInstance.channelId}>: No more messages to be deleted, channel is clean.`);
            else logger.log(`AutoPurge <#${purgeInstance.channelId}>: No more messages to be deleted, channel is clean except for some inaccessible messages.`);
        }

    } catch (error) {
        finished = true; // break out of recursion
        const client = main.getClient();
        const adminChannel = await client.channels.fetch(channels.losAdminos);
        adminChannel.send(`Error purging messages from <#${purgeInstance.channelId}>: ${error}`);
        logger.log(`AutoPurge <#${purgeInstance.channelId}>: ${error}`);
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
