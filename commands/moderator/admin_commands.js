const { purge_channels, token, modlogs } = require('../../configurations/config.json');


async function purge(client, message) {
        if (purge_channels.includes(message.channel.id)) {
            message.delete();
            message.channel.bulkDelete(100, true)
            .then(messages => {
                client.channels.cache.get(modlogs).send(`Purged ${messages.size} messages in ${message.channel.name}. Command used by ${message.author.tag}.`);
                console.log(`Purged ${messages.size} messages in ${message.channel.name}. Command used by ${message.author.tag}.`);
                message.reply(`purged ${messages.size} messages.`);
            })
            .catch(console.error);
        } else { message.reply('that command can not be used in this channel.'); }
}

async function pause_bot(message, client) {
    let args = message.content.slice(6).trim().split(' ')[0];
    if (!args) { args = 1; }
    if (isNaN(args)) { return(message.reply('please specify a number of minutes that the bot should pause for.')); }
    args = Math.ceil(args);
    if (args < 1 || args > 60) { return message.reply('the number of minutes should be in the range 1-60.'); }
    await message.channel.send(`Got it. I will be offline for ${args} minutes, or until the hosting service resets.`);
    await client.channels.cache.get(modlogs).send(`${message.author.tag} paused the bot for ${args} minutes.`);
    await client.destroy();
    setTimeout(resume_bot, args * 60000, client, message);
}

async function resume_bot(client, message) {
    await client.login(token);
    message.channel.send('Back online!');
}

exports.purge = purge;
exports.break = pause_bot;