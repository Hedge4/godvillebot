const suggestion_channel = '670981969596645407';

async function suggest(client, message) {
    const suggestion = message.content.slice(8).trim();
    if (suggestion.length <= 10) {return message.reply('please add enough detail and make the description of your suggestion at least 40 characters!');}
    if (suggestion.length >= 500) {return message.reply('please be a bit more concise in your description and use less than 500 characters!');}
    const channel = await client.fetchChannel(suggestion_channel);
    if (channel === undefined) {message.reply('the message couldn\'t be sent.');}
    channel.send(`${message.author.tag} sent the following suggestion from ${message.channel.name}:\n` + '`' + suggestion + '`');
    message.reply('thank you for your suggestion!');
}

exports.suggest = suggest;