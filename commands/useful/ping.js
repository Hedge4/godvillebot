const { prefix } = require('../../configurations/config.json');
const logger = require('../features/logging');

async function main(message, client) {
    const ping = Date.now() - message.createdTimestamp;

    let response;
    if (message.content.startsWith(`${prefix}ping`)) {
        response = 'Pong! 🏓 ― ';
    } else if (message.content.startsWith(`${prefix}pong`)) {
        response = 'Ping! 🏓 ― ';
    }

    message.reply(`${response ? response : ''}Latency is ${ping}ms. Discord API latency is ${Math.round(client.ws.ping)}ms.`);
    logger.log(`${message.author.tag}/${message.author.id} requested the bot's ping - Bot: ${ping}ms, API: ${client.ws.ping}ms.`);
}

module.exports = main;