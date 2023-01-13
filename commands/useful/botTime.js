const { prefix } = require('../../configurations/config.json');
const logger = require('../features/logging.js');

async function main(message) {
    let text = 'Here are the unix timestamp, UTC time, and my time:\n';
    const date = new Date();
    text += `${date.getTime()}: `;
    text += `${date.toUTCString()}\n`;
    text += `${date.toString()}`;

    message.reply(text);
    logger.log(`${message.author.tag} / ${message.author.id} used the ${prefix}botTime command in ${message.channel.name}.`);
}

module.exports = main;