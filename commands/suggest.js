const { suggest_blocked, suggestion_channel } = require('../config.json');

async function suggest(client, message) {
    if (!suggest_blocked.includes(message.author.id)) {
        let suggestion = message.content.slice(8).trim();
        suggestion = suggestion.split('`');
        suggestion = suggestion.join('');
        if (suggestion.length <= 20) {return message.reply('please add enough detail and make the description of your suggestion at least 20 characters!');}
        if (suggestion.length >= 800) {return message.reply('please be a bit more concise in your description and use less than 800 characters!');}
        const channel = await client.channels.get(suggestion_channel[0]);
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

async function accept(message, client) {
    let args = message.content.slice(7).trim().split(' ');
    let ID = 0;
    if (!args[0] || !args[0].length || isNaN(args[0])) {
        return message.delete();
    } else {
        ID = args[0];
        args.shift();
    }
    args = args.join(' ');
    if (!args || !args.length) {
        args = 'No comment provided.';
    }
    const author = message.author.tag;
    message.delete();
    const old_channel = await client.channels.get(suggestion_channel[0]);
    const new_channel = await client.channels.get(suggestion_channel[1]);
    const old_msg = await old_channel.fetchMessage(ID);
    const contents = old_msg.content;
    old_msg.delete();
    new_channel.send(`${author} accepted :white_check_mark: a suggestion with comment:\n"${args}"\n\`\`\`Suggestion: ${contents.slice(4, -1).replace(/`/g, '\n')}\`\`\``);
}

async function reject(message, client) {
    let args = message.content.slice(7).trim().split(' ');
    let ID = 0;
    if (!args[0] || !args[0].length || isNaN(args[0])) {
        return message.delete();
    } else {
        ID = args[0];
        args.shift();
    }
    args = args.join(' ');
    if (!args || !args.length) {
        args = 'No comment provided.';
    }
    const author = message.author.tag;
    message.delete();
    const old_channel = await client.channels.get(suggestion_channel[0]);
    const new_channel = await client.channels.get(suggestion_channel[2]);
    const old_msg = await old_channel.fetchMessage(ID);
    const contents = old_msg.content;
    old_msg.delete();
    new_channel.send(`${author} rejected :x: a suggestion with comment:\n"${args}"\n\`\`\`Suggestion: ${contents.slice(4, -1).replace(/`/g, '\n')}\`\`\``);
}

exports.suggestion = suggest;
exports.accept = accept;
exports.reject = reject;