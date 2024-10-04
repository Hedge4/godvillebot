const { channels } = require('../../configurations/config.json');
const { DISCORD: { token } } = require('../../configurations/secret.json');
const logger = require('../features/logging');

async function pauseBot(message, client) {
    let mins = message.content.slice(6).trim().split(' ')[0];
    if (!mins) { mins = 1; }
    if (isNaN(mins)) { return (message.reply('Please specify a number of minutes that the bot should pause for.')); }
    mins = Math.ceil(mins);
    if (mins < 1 || mins > 60) { return message.reply('The number of minutes should be in the range 1-60.'); }

    logger.log(`${message.author.tag} paused the bot for ${mins} ${quantiseWords(mins, 'minute')}.`); // add await here?
    await message.channel.send(`Got it. I will be offline for ${mins} minutes, or until my server restarts.`);
    await client.channels.cache.get(channels.modLogs).send(`${message.author.tag} paused the bot for ${mins} ${quantiseWords(mins, 'minute')}. Links: <${message.url}>`);
    await client.destroy();
    setTimeout(resumeBot, mins * 60000, client, message, mins);
}

async function resumeBot(client, message, mins) {
    await client.login(token);
    logger.log(`Bot is back online after waiting ${mins} minutes.`);
    message.channel.send('Back online!');
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;

module.exports = pauseBot;