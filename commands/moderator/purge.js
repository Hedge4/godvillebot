const logger = require('../features/logging.js');
const { channels } = require('../../configurations/config.json');

const purgeable = [channels.appeals];

async function purge(client, message) {
    if (purgeable.includes(message.channel.id)) {
        message.delete();
        message.channel.bulkDelete(100, true)
            .then(messages => {
                client.channels.cache.get(channels.modLogs).send(`Purged ${messages.size} ${quantiseWords(messages.size, 'message')} in ${message.channel.name}. Command used by ${message.author.tag}.`);
                logger.toConsole(`Purged ${messages.size} ${quantiseWords(messages.size, 'message')} in ${message.channel.name}. Command used by ${message.author.tag}.`);
                message.reply(`Purged ${messages.size} ${quantiseWords(messages.size, 'message')}.`);
            })
            .catch(console.error);
    } else { message.reply('That command can not be used in this channel.'); }
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;

module.exports = purge;