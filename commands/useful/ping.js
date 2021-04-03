const { logs } = require('../../configurations/config.json');

async function main(message, client) {
    const logsChannel = client.channels.cache.get(logs);
    const ping = Date.now() - message.createdTimestamp;
    message.reply(`🏓 ― Latency is ${ping}ms. Discord API latency is ${Math.round(client.ws.ping)}ms.`);
    logsChannel.send(`${message.author.tag} / ${message.author.id} requested the bot's ping - Bot: ${ping}ms, API: ${client.ws.ping}ms.`);
    console.log(`${message.author.tag} / ${message.author.id} requested the bot's ping - Bot: ${ping}ms, API: ${client.ws.ping}ms.`);
}

module.exports = main;