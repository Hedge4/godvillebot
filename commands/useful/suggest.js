const { channels, botOwners } = require('../../configurations/config.json');
const logger = require('../features/logging');
const getUsers = require('../features/getUsers');

async function suggest(client, message, content) {
    if (!suggestBlocked.includes(message.author.id)) {
        let suggestion = content.split('`');
        suggestion = suggestion.join('');
        if (suggestion.length <= 20) { return message.reply('Please add enough detail and make the description of your suggestion at least 20 characters!'); }
        if (suggestion.length >= 1000) { return message.reply('Please be a bit more concise in your description and use less than 1000 characters!'); }
        const channel = await client.channels.cache.get(channels.botServer.suggestions);
        if (channel === undefined) { message.reply('The message couldn\'t be sent.'); }
        channel.send(` --- ${message.author.tag} / ${message.author.id} sent the following suggestion from channel ${message.channel.name}:`
            + '```\n' + suggestion + '```' + message.url)
            .then(botMessage => {
                botMessage.react('👍');
                botMessage.react('🤷');
                botMessage.react('👎');
            });
        logger.log(`${message.author.tag} / ${message.author.id} made a bot suggestion in ${message.channel.name} with text: ${suggestion}.`);
        return message.reply('Thank you for your suggestion! You can view it here: https://discord.gg/dFC4sWv');
    } else {
        logger.log(`${message.author.tag} / ${message.author.id} tried to make a bot suggestion in ${message.channel.name}, but they're blocked from doing so.`);
        return message.reply('You are not allowed to use that command.');
    }
}

// detect a message in the suggestion/log server. index.js already checks for the right channel
function onMessage(message, client, Discord, userData) {
    if (Object.values(botOwners).includes(message.author.id)) {
        if (message.content.toLowerCase().startsWith('accept')) {
            return accept(message, client, Discord, userData);
        }
        if (message.content.toLowerCase().startsWith('reject')) {
            return reject(message, client, Discord);
        }
    }
}

async function accept(message, client, Discord, userData) {
    message.delete(); // always delete the accept/reject command

    if (message.content.length > 1000) {
        message.channel.send('Please use 1000 characters at most.')
            .then(msg => { setTimeout(() => { msg.delete(); }, 10000); });
        return;
    }

    let args = message.content.slice(7).trim().split(' ');
    let ID = 0;
    if (!args[0] || !args[0].length || isNaN(args[0])) {
        message.channel.send('After the accept/reject command, you should specify the ID of the to be handled suggestion.')
            .then(msg => { setTimeout(() => { msg.delete(); }, 10000); });
        return; // give error if no ID was provided
    } else {
        ID = args[0];
        args.shift(); // remove ID from args
    }

    // get suggestion message contents, and get user(name)
    const old_channel = await client.channels.cache.get(channels.botServer.suggestions);
    const old_msg = await old_channel.messages.fetch(ID);
    const contents = old_msg.content;
    let suggestion = contents.slice(contents.indexOf('`'));
    if (suggestion.indexOf('```', 20) > 0) { // only for new suggestion format
        suggestion = suggestion.slice(0, suggestion.indexOf('```', 20) + 3); // exclude the url at the end of the message
    } else {
        suggestion = '``' + suggestion + '``'; // update to new format
    }
    const contextSection = contents.slice(0, contents.indexOf('`'));
    const usernameID = / \/ ([0-9]*) /.exec(contextSection);
    let username = /--- (.*?#[0-9]*?) /.exec(contextSection)[1]; // this errors if suggestion in invalid format!
    let user;
    if (usernameID) user = getUsers.One(usernameID[1], client);
    else user = getUsers.One(username, client);
    const userFound = user != undefined;
    if (userFound) username = `<@${user.id}>`;

    // get reward level and accept/reject comments
    if (!args[0] || !args[0].length || !(args[0] == 1 || args[0] == 2 || args[0] == 3)) {
        message.channel.send('After the ID of the message, you need to provide a reward level of either 1 (small), 2 (normal) or 3 (big).')
            .then(msg => { setTimeout(() => { msg.delete(); }, 10000); });
        return; // give error if no reward level was provided
    }
    const rewardLevel = parseInt(args[0]);
    args.shift(); // removes rewardLevel from args
    args = args.join(' '); // and then recombines args into a normal string
    if (args && args.length) {
        suggestion += `\n${args}`; // add arguments to suggestion if provided
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
        if (userDoc.data()[user.id] === undefined) {
            User[user.id] = {
                godpower: 0,
                gold: 0,
                total_godpower: 0,
                level: 0,
            }; // last_username is set later, but is also part of a User object
        } else {
            User[user.id] = userDoc.data()[user.id];
        }
        User[user.id].gold += goldEarned;
        User[user.id].last_username = user.tag;
        userData.set(User, { merge: true });
    } else {
        goldEarnedMsg = `I couldn't find a user with username ${username}, so they missed out on ${goldEarned} gold :(`;
    }

    const acceptedEmbed = new Discord.MessageEmbed()
        .setTitle('<:i_accepted:700766526713888849> Suggestion content:')
        .setColor(0xaafb1a) // light blue
        .setDescription(suggestion)
        .addField('Gold earned <:stat_gold:401414686651711498>', goldEarnedMsg, true)
        .setThumbnail('https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/joypixels/291/check-mark-button_2705.png')
        .setFooter({ text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() })
        .setTimestamp();

    old_msg.delete();
    const new_channel = await client.channels.cache.get(channels.botServer.accepted);
    const botChannel = client.channels.cache.get(channels.botville);
    new_channel.send({ content: `${author} accepted :white_check_mark: a suggestion by ${username}:`, embeds: [acceptedEmbed] });
    botChannel.send({ content: `${author} accepted :white_check_mark: a suggestion by ${username}:`, embeds: [acceptedEmbed] });
}

async function reject(message, client, Discord) {
    message.delete(); // always delete the accept/reject command

    if (message.content.length > 1000) {
        message.channel.send('Please use 1000 characters at most.')
            .then(msg => { setTimeout(() => { msg.delete(); }, 10000); });
        return;
    }

    let args = message.content.slice(7).trim().split(' ');
    let ID = 0;
    if (!args[0] || !args[0].length || isNaN(args[0])) {
        message.channel.send('After the accept/reject command, you should specify the ID of the to be handled suggestion.')
            .then(msg => { setTimeout(() => { msg.delete(); }, 10000); });
        return; // give error if no ID was provided
    } else {
        ID = args[0];
        args.shift(); // remove ID from args
    }

    // get suggestion message contents, and get user(name)
    const old_channel = await client.channels.cache.get(channels.botServer.suggestions);
    const old_msg = await old_channel.messages.fetch(ID);
    const contents = old_msg.content;
    let suggestion = contents.slice(contents.indexOf('`'));
    if (suggestion.indexOf('```', 20) > 0) { // only for new suggestion format
        suggestion = suggestion.slice(0, suggestion.indexOf('```', 20) + 3); // exclude the url at the end of the message
    } else {
        suggestion = '``' + suggestion + '``'; // update to new format
    }
    const contextSection = contents.slice(0, contents.indexOf('`'));
    const usernameID = / \/ ([0-9]*) /.exec(contextSection);
    let username = /--- (.*?#[0-9]*?) /.exec(contextSection)[1]; // this errors if suggestion in invalid format!
    let user;
    if (usernameID) user = getUsers.One(usernameID[1], client);
    else user = getUsers.One(username, client);
    const userFound = user != undefined;
    if (userFound) username = `<@${user.id}>`;

    args = args.join(' '); // recombine args into a normal string
    if (args && args.length) {
        suggestion += `\n${args}`; // add arguments to suggestion if provided
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
    const new_channel = await client.channels.cache.get(channels.botServer.rejected);
    const botChannel = client.channels.cache.get(channels.botville);
    new_channel.send({ content: `${author} rejected :x: a suggestion by ${username}:`, embeds: [acceptedEmbed] });
    botChannel.send({ content: `${author} rejected :x: a suggestion by ${username}:`, embeds: [acceptedEmbed] });
}

exports.suggestion = suggest;
exports.handleMessage = onMessage;