const { token, channels } = require('../../configurations/config.json');

async function pauseBot(message, client) {
    let args = message.content.slice(6).trim().split(' ')[0];
    if (!args) { args = 1; }
    if (isNaN(args)) { return (message.reply('Please specify a number of minutes that the bot should pause for.')); }
    args = Math.ceil(args);
    if (args < 1 || args > 60) { return message.reply('The number of minutes should be in the range 1-60.'); }
    await message.channel.send(`Got it. I will be offline for ${args} minutes, or until the hosting service resets.`);
    await client.channels.cache.get(channels.modLogs).send(`${message.author.tag} paused the bot for ${args} ${quantiseWords(args, 'minute')}.`);
    await client.destroy();
    setTimeout(resumeBot, args * 60000, client, message);
}

async function resumeBot(client, message) {
    await client.login(token);
    message.channel.send('Back online!');
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;

exports.break = pauseBot;