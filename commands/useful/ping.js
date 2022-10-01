const logger = require('../features/logging');

async function main(message, client) {
    const ping = Date.now() - message.createdTimestamp;
    message.reply(`🏓 ― Latency is ${ping}ms. Discord API latency is ${Math.round(client.ws.ping)}ms.`);
    logger.log(`${message.author.tag} / ${message.author.id} requested the bot's ping - Bot: ${ping}ms, API: ${client.ws.ping}ms.`);
}

module.exports = main;