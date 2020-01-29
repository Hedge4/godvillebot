const { suggest_blocked } = require('../config.json');
const suggestion_channel = '670981969596645407';

async function suggest(client, message) {
    if (!suggest_blocked.includes(message.author.id)) {
        let suggestion = message.content.slice(8).trim();
        suggestion = suggestion.split('`');
        suggestion = suggestion.join('');
        if (suggestion.length <= 20) {return message.reply('please add enough detail and make the description of your suggestion at least 20 characters!');}
        if (suggestion.length >= 800) {return message.reply('please be a bit more concise in your description and use less than 800 characters!');}
        const channel = await client.channels.get(suggestion_channel);
        if (channel === undefined) {message.reply('the message couldn\'t be sent.');}
        channel.send(` --- ${message.author.tag} sent the following suggestion from channel ${message.channel.name}:\n` + '`' + suggestion + '`')
        .then(botMessage => {
            botMessage.react('👍');
            botMessage.react('🤷');
            botMessage.react('👎');
        });
        message.reply('thank you for your suggestion!');
    } else { return message.reply('you are not allowed to use that command.'); }
}

exports.suggestion = suggest;