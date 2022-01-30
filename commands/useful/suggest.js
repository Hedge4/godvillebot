const { botServerChannels, owner, logs, botvilleChannel } = require('../../configurations/config.json');
const getUsers = require('../features/getUsers');

async function suggest(client, message, content) {
    const logsChannel = client.channels.cache.get(logs);
    if (!suggestBlocked.includes(message.author.id)) {
        let suggestion = content.split('`');
        suggestion = suggestion.join('');
        if (suggestion.length <= 20) {return message.reply('Please add enough detail and make the description of your suggestion at least 20 characters!');}
        if (suggestion.length >= 1000) {return message.reply('Please be a bit more concise in your description and use less than 1000 characters!');}
        const channel = await client.channels.cache.get(botServerChannels[0]);
        if (channel === undefined) {message.reply('The message couldn\'t be sent.');}
        channel.send(` --- ${message.author.tag} sent the following suggestion from channel ${message.channel.name}:\n` + '`' + suggestion + '`')
        .then(botMessage => {
            botMessage.react('👍');
            botMessage.react('🤷');
            botMessage.react('👎');
        });
        console.log(`${message.author.tag} made a bot suggestion in ${message.channel.name} with text: ${suggestion}.`);
        logsChannel.send(`${message.author.tag} made a bot suggestion in ${message.channel.name} with text: ${suggestion}.`);
        return message.reply('Thank you for your suggestion! You can view it here: https://discord.gg/dFC4sWv');
    } else {
        console.log(`${message.author.tag} tried to make a bot suggestion in ${message.channel.name}, but they're blocked from doing so.`);
        logsChannel.send(`${message.author.tag} tried to make a bot suggestion in ${message.channel.name}, but they're blocked from doing so.`);
        return message.reply('You are not allowed to use that command.');
    }
}

// detect a message in the suggestion/log server
function onMessage(message, client, Discord, userData) {
    if (message.channel.id === botServerChannels[0]) {
        if (owner.includes(message.author.id)) {
            if (message.content.toLowerCase().startsWith('accept')) {
                return accept(message, client, Discord, userData);
            }
            if (message.content.toLowerCase().startsWith('reject')) {
                return reject(message, client, Discord);
            }
        }
    }
}

async function accept(message, client, Discord, userData) {
    message.delete(); // always delete the accept/reject command
    if (args > 1000) {
        message.reply('Please use 1000 characters at most.')
            .then(msg => { setTimeout(() => { msg.delete(); }, 10000); });
        return; // give error if no ID was provided
    }

    let args = message.content.slice(7).trim().split(' ');
    let ID = 0;
    if (!args[0] || !args[0].length || isNaN(args[0])) {
        message.reply('After the accept/reject command, you should specify the ID of the to be handled suggestion.')
            .then(msg => { setTimeout(() => { msg.delete(); }, 10000); });
        return; // give error if no ID was provided
    } else {
        ID = args[0];
        args.shift(); // remove ID from args
    }

    // get suggestion message contents, and get user(name)
    const old_channel = await client.channels.cache.get(botServerChannels[0]);
    const old_msg = await old_channel.messages.fetch(ID);
    const contents = old_msg.content;
    let suggestion = contents.slice(contents.indexOf('\n'));
    let username = /--- (.*?#[0-9]*?) /.exec(contents)[1];
    const user = getUsers.One(username, client);
    const userFound = user != undefined;
    if (userFound) username = `<@${user.id}>`;

    // get reward level and accept/reject comments
    if (!args[0] || !args[0].length || !(args[0] == 1 || args[0] == 2 || args[0] == 3)) {
        message.reply('After the ID of the message, you need to provide a reward level of either 1 (small), 2 (normal) or 3 (big).')
            .then(msg => { setTimeout(() => { msg.delete(); }, 10000); });
        return; // give error if no reward level was provided
    }
    const rewardLevel = parseInt(args[0]);
    args.shift(); // removes rewardLevel from args
    args = args.join(' '); // and then recombines args into a normal string
    if (args && args.length) {
        suggestion += `\n\n${args}`; // add arguments to suggestion if provided
    }
    const author = message.author.tag; // person who accepted/rejected the suggestion

    // get gold amount earned and modify gold (if user was found)
    let goldEarned;
    let goldEarnedMsg;
    switch (rewardLevel) {
        case 1:
        default:
            goldEarned = 50;
            goldEarnedMsg = `You earned ${goldEarned} gold for making a small suggestion for the bot!`;
            break;
        case 2:
            goldEarned = 150;
            goldEarnedMsg = `You earned ${goldEarned} gold for making a suggestion for the bot!`;
            break;
        case 3:
            goldEarned = 500;
            goldEarnedMsg = `You earned ${goldEarned} gold for making a big suggestion for the bot!`;
            break;
    }
    if (userFound) {
        const userDoc = await userData.get();
        const User = {};
        if(userDoc.data()[message.author.id] === undefined) {
            User[message.author.id] = {
                godpower: 0,
                gold: 0,
                total_godpower: 0,
                level: 0,
            }; // last_username is set later, but is also part of a User object
        } else {
            User[message.author.id] = userDoc.data()[message.author.id];
        }
        User[message.author.id].gold += goldEarned;
        User[message.author.id].last_username = message.author.tag;
        userData.set(User, { merge: true });
    } else {
        goldEarnedMsg = `I couldn't find a user with username ${username}, so they missed out on ${goldEarned} gold :(`;
    }

    const acceptedEmbed = new Discord.MessageEmbed()
    .setTitle('<:i_accepted:700766526713888849> Suggestion content:')
    .setColor(0x00ffff) // light blue
    .setDescription(suggestion)
    .addField('Gold earned <:stat_gold:401414686651711498>', goldEarnedMsg, true)
    .setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/joypixels/291/check-mark-button_2705.png')
    .setFooter({ text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() })
    .setTimestamp();

    old_msg.delete();
    const new_channel = await client.channels.cache.get(botServerChannels[1]);
    const botChannel = client.channels.cache.get(botvilleChannel);
    new_channel.send({ text: `${author} accepted :white_check_mark: a suggestion by ${username}:`, embeds: [acceptedEmbed] });
    botChannel.send({ text: `${author} accepted :white_check_mark: a suggestion by ${username}:`, embeds: [acceptedEmbed] });
}

async function reject(message, client, Discord) {
    message.delete(); // always delete the accept/reject command

    let args = message.content.slice(7).trim().split(' ');
    let ID = 0;
    if (!args[0] || !args[0].length || isNaN(args[0])) {
        message.reply('After the accept/reject command, you should specify the ID of the to be handled suggestion.')
            .then(msg => { setTimeout(() => { msg.delete(); }, 10000); });
        return; // give error if no ID was provided
    } else {
        ID = args[0];
        args.shift(); // remove ID from args
    }

    // get suggestion message contents, and get user(name)
    const old_channel = await client.channels.cache.get(botServerChannels[0]);
    const old_msg = await old_channel.messages.fetch(ID);
    const contents = old_msg.content;
    let suggestion = contents.slice(contents.indexOf('\n'));
    let username = /--- (.*?#[0-9]*?) /.exec(contents)[1];
    const user = getUsers.One(username, client);
    const userFound = user != undefined;
    if (userFound) username = `<@${user.id}>`;

    args = args.join(' '); // recombine args into a normal string
    if (args && args.length) {
        suggestion += `\n\n${args}`; // add arguments to suggestion if provided
    }
    const author = message.author.tag; // person who accepted/rejected the suggestion

    const acceptedEmbed = new Discord.MessageEmbed()
    .setTitle('<:i_rejected:700766050345549884> Suggestion content:')
    .setColor(0xce4321) // dark orange
    .setDescription(suggestion)
    .addField('Thank you! <:stat_gold:401414686651711498>', 'Although your suggestion was rejected, thank you for coming up with new ideas for the bot!', true)
    .setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/whatsapp/302/cross-mark_274c.png')
    .setFooter({ text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() })
    .setTimestamp();

    old_msg.delete();
    const new_channel = await client.channels.cache.get(botServerChannels[2]);
    const botChannel = client.channels.cache.get(botvilleChannel);
    new_channel.send({ text: `${author} rejected :x: a suggestion by ${username}:`, embeds: [acceptedEmbed] });
    botChannel.send({ text: `${author} rejected :x: a suggestion by ${username}:`, embeds: [acceptedEmbed] });
}

exports.suggestion = suggest;
exports.handleMessage = onMessage;