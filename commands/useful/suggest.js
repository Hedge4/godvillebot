const { botServerChannels, owner, logs } = require('../../configurations/config.json');

async function suggest(client, message, content) {
    const logsChannel = client.channels.cache.get(logs);
    if (!suggestBlocked.includes(message.author.id)) {
        let suggestion = content.split('`');
        suggestion = suggestion.join('');
        if (suggestion.length <= 20) {return message.reply('please add enough detail and make the description of your suggestion at least 20 characters!');}
        if (suggestion.length >= 800) {return message.reply('please be a bit more concise in your description and use less than 800 characters!');}
        const channel = await client.channels.cache.get(botServerChannels[0]);
        if (channel === undefined) {message.reply('the message couldn\'t be sent.');}
        channel.send(` --- ${message.author.tag} sent the following suggestion from channel ${message.channel.name}:\n` + '`' + suggestion + '`')
        .then(botMessage => {
            botMessage.react('👍');
            botMessage.react('🤷');
            botMessage.react('👎');
        });
        console.log(`${message.author.tag} made a bot suggestion in ${message.channel.name} with text: ${suggestion}.`);
        logsChannel.send(`${message.author.tag} made a bot suggestion in ${message.channel.name} with text: ${suggestion}.`);
        return message.reply('thank you for your suggestion!');
    } else {
        console.log(`${message.author.tag} tried to make a bot suggestion in ${message.channel.name}, but they're blocked from doing so.`);
        logsChannel.send(`${message.author.tag} tried to make a bot suggestion in ${message.channel.name}, but they're blocked from doing so.`);
        return message.reply('you are not allowed to use that command.');
    }
}

// detect a message in the suggestion/log server
function onMessage(message, client) {
    if (message.channel.id === botServerChannels[0]) {
        if (owner.includes(message.author.id)) {
            if (message.content.toLowerCase().startsWith('accept')) {
                return accept(message, client);
            }
            if (message.content.toLowerCase().startsWith('reject')) {
                return reject(message, client);
            }
        }
    }
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
    const old_channel = await client.channels.cache.get(botServerChannels[0]);
    const new_channel = await client.channels.cache.get(botServerChannels[1]);
    const old_msg = await old_channel.messages.fetch(ID);
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
    const old_channel = await client.channels.cache.get(botServerChannels[0]);
    const new_channel = await client.channels.cache.get(botServerChannels[2]);
    const old_msg = await old_channel.messages.fetch(ID);
    const contents = old_msg.content;
    old_msg.delete();
    new_channel.send(`${author} rejected :x: a suggestion with comment:\n"${args}"\n\`\`\`Suggestion: ${contents.slice(4, -1).replace(/`/g, '\n')}\`\`\``);
}

exports.suggestion = suggest;
exports.handleMessage = onMessage;