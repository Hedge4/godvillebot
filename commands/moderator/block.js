const { modlogs, logs } = require('../../configurations/config.json');

function hasImage(attachments) {
    const imgFormats = ['.png', '.jpeg', '.jpg', '.gif'];
    let imageFound = false;
    for (let i = 0; i < attachments.size; i++) {
        try {
            const format = /^[\s\S]+(\.[^.]+$)/.exec(attachments.array()[i].name)[1];
            if (imgFormats.includes(format)) {
                imageFound = true;
                break;
            }
        } catch (error) {
            continue;
        }
    }
    if (imageFound) return true;
    return false;
}

async function blockImage(client, message) {
    const logsChannel = client.channels.cache.get(logs);
    message.delete();
    console.log(`Blocked ${message.author.tag} from sending an image with filename "${message.attachments.first().name}" in ${message.channel.name}.`);
    logsChannel.send(`Blocked ${message.author.tag} from sending an image with filename "${message.attachments.first().name}" in ${message.channel.name}.`);
    message.reply('you are currently not allowed to post images in the server.')
        .then(msg => {
            msg.delete({ timeout: 5000 });
        })
        .catch(console.error);
}

function getUser(mentions, username, client) {
    let user = mentions.users.first();
    if (!user) {
        if (/^<@!?[0-9]+>$/.test(username)) {
            const userID = /^<@!?([0-9]+)>$/.exec(username)[1];
            user = client.users.cache.get(userID);
        } else if (username.includes('#')) {
            const args = username.split('#');
            username = args[0];
            const discriminator = args[1].slice(0, 4);
            user = client.users.find(foundUser => foundUser.tag == (username + '#' + discriminator));
        } else if (!isNaN(username) && !isNaN(parseInt(username)) && username % 1 == 0) {
            user = {
                tag: username,
                id: username,
            };
        }
    }
    return user;
}

const blockLists = ['bot', 'xp', 'image', 'suggest'];
const correctFormat = `Correct format: \`>block|unblock|blocklist ${blockLists.join('|')} (@user|user#0000|userID)\``;

function blockList(message, client) {
    const args = message.content.slice(10).trim().split(' ');
    if (!args[0].length) {
        message.reply('please specify which list of blocked users you want to view!');
        return message.channel.send(correctFormat);
    }
    if (!blockLists.includes(args[0].toLowerCase())) {
        message.reply(`${args[0]} is not one of the blocked user lists.`);
        return message.channel.send(correctFormat);
    }

    const logsChannel = client.channels.cache.get(logs);
    args[0] = args[0].toLowerCase();
    let msg = `here is the list of users blocked from "${args[0]}":\n\`\`\``;
    if (args[0] == 'bot') {
        if (!botBlocked.length) msg += ('No users blocked.');
        for (let i = 0; i < botBlocked.length; i++) {
            let user = '';
            try {
                user = client.users.cache.get(botBlocked[i]).tag;
            } catch {
                user = botBlocked[i];
            }
            msg += (` ${i}. ${user}\n`);
        }
        logsChannel.send(`${message.author.tag} requested the list of users blocked from using the bot.`);
        console.log(`${message.author.tag} requested the list of users blocked from using the bot.`);
    }
    if (args[0] == 'xp') {
        if (!xpBlocked.length) msg += ('No users blocked.');
        for (let i = 0; i < xpBlocked.length; i++) {
            let user = '';
            try {
                user = client.users.cache.get(xpBlocked[i]).tag;
            } catch {
                user = xpBlocked[i];
            }
            msg += (` ${i}. ${user}\n`);
        }
        logsChannel.send(`${message.author.tag} requested the list of users blocked from gaining xp (godpower).`);
        console.log(`${message.author.tag} requested the list of users blocked from gaining xp (godpower).`);
    }
    if (args[0] == 'image') {
        if (!imageBlocked.length) msg += ('No users blocked.');
        for (let i = 0; i < imageBlocked.length; i++) {
            let user = '';
            try {
                user = client.users.cache.get(imageBlocked[i]).tag;
            } catch {
                user = imageBlocked[i];
            }
            msg += (` ${i}. ${user}\n`);
        }
        logsChannel.send(`${message.author.tag} requested the list of users blocked from sending images.`);
        console.log(`${message.author.tag} requested the list of users blocked from sending images.`);
    }
    if (args[0] == 'suggest') {
        if (!suggestBlocked.length) msg += ('No users blocked.');
        for (let i = 0; i < suggestBlocked.length; i++) {
            let user = '';
            try {
                user = client.users.cache.get(suggestBlocked[i]).tag;
            } catch {
                user = suggestBlocked[i];
            }
            msg += (` ${i}. ${user}\n`);
        }
        logsChannel.send(`${message.author.tag} requested the list of users blocked from making suggestions.`);
        console.log(`${message.author.tag} requested the list of users blocked from making suggestions.`);
    }
    msg += ('```');
    return message.reply(msg);
}

function block(message, client, blockedData) {
    const args = message.content.slice(6).trim().split(' ');
    if (args.length < 2) {
        message.reply('please specify what you want to block and for which user!');
        return message.channel.send(correctFormat);
    }
    if (!blockLists.includes(args[0].toLowerCase())) {
        message.reply(`${args[0]} is not one of the things users can be blocked from.`);
        return message.channel.send(correctFormat);
    }
    const user = getUser(message.mentions, args[1], client);
    if (!user) {
        message.reply(`User "${args[1]} could not be found."`);
        return message.channel.send(correctFormat);
    }

    args[0] = args[0].toLowerCase();
    if (args[0] == 'bot') {
        if (botBlocked.includes(user.id)) { return message.reply('this user is already blocked from this.'); }
        botBlocked.push(user.id);
        blockedData.set({ bot: botBlocked }, { merge: true });
        console.log(`${message.author.tag} blocked ${user.tag} from using the bot.`);
        console.log(`${message.author.tag} blocked ${user.tag} from using the bot.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} blocked ${user.tag} from using the bot.`);
        return message.reply(`succesfully blocked ${user.tag} from using the bot.`);
    }
    if (args[0] == 'xp') {
        if (xpBlocked.includes(user.id)) { return message.reply('this user is already blocked from this.'); }
        xpBlocked.push(user.id);
        blockedData.set({ xp: xpBlocked }, { merge: true });
        console.log(`${message.author.tag} blocked ${user.tag} from gaining xp (godpower).`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} blocked ${user.tag} from gaining xp (godpower).`);
        return message.reply(`succesfully blocked ${user.tag} from gaining xp (godpower).`);
    }
    if (args[0] == 'suggest') {
        if (suggestBlocked.includes(user.id)) { return message.reply('this user is already blocked from this.'); }
        suggestBlocked.push(user.id);
        blockedData.set({ suggest: suggestBlocked }, { merge: true });
        console.log(`${message.author.tag} blocked ${user.tag} from making suggestions for the bot.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} blocked ${user.tag} from making suggestions for the bot.`);
        return message.reply(`succesfully blocked ${user.tag} from making suggestions for the bot.`);
    }
    if (args[0] == 'image') {
        if (imageBlocked.includes(user.id)) { return message.reply('this user is already blocked from this.'); }
        imageBlocked.push(user.id);
        blockedData.set({ image: imageBlocked }, { merge: true });
        console.log(`${message.author.tag} blocked ${user.tag} from sending images in the server.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} blocked ${user.tag} from sending images in the server.`);
        return message.reply(`succesfully blocked ${user.tag} from sending images in the server.`);
    }
}

function unblock(message, client, blockedData) {
    const args = message.content.slice(8).trim().split(' ');
    if (args.length < 2) {
        message.reply('please specify what you want to unblock and for which user!');
        return message.channel.send(correctFormat);
    }
    if (!blockLists.includes(args[0].toLowerCase())) {
        message.reply(`${args[0]} is not one of the things users can be blocked from.`);
        return message.channel.send(correctFormat);
    }
    const user = getUser(message.mentions, args[1], client);
    if (!user) {
        message.reply(`User "${args[1]} could not be found."`);
        return message.channel.send(correctFormat);
    }

    args[0] = args[0].toLowerCase();
    if (args[0] == 'bot') {
        if (!botBlocked.includes(user.id)) { return message.reply('this user isn\'t blocked from this.'); }
        botBlocked.splice(botBlocked.indexOf(user.id), 1);
        blockedData.set({ bot: botBlocked }, { merge: true });
        console.log(`${message.author.tag} unblocked ${user.tag} from using the bot.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} unblocked ${user.tag} from using the bot.`);
        return message.reply(`succesfully unblocked ${user.tag} from using the bot.`);
    }
    if (args[0] == 'xp') {
        if (!xpBlocked.includes(user.id)) { return message.reply('this user isn\'t blocked from this.'); }
        xpBlocked.splice(xpBlocked.indexOf(user.id), 1);
        blockedData.set({ xp: xpBlocked }, { merge: true });
        console.log(`${message.author.tag} unblocked ${user.tag} from gaining xp (godpower).`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} unblocked ${user.tag} from gaining xp (godpower).`);
        return message.reply(`succesfully unblocked ${user.tag} from gaining xp (godpower).`);
    }
    if (args[0] == 'suggest') {
        if (!suggestBlocked.includes(user.id)) { return message.reply('this user isn\'t blocked from this.'); }
        suggestBlocked.splice(suggestBlocked.indexOf(user.id), 1);
        blockedData.set({ suggest: suggestBlocked }, { merge: true });
        console.log(`${message.author.tag} unblocked ${user.tag} from making suggestions for the bot.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} unblocked ${user.tag} from making suggestions for the bot.`);
        return message.reply(`succesfully unblocked ${user.tag} from making suggestions for the bot.`);
    }
    if (args[0] == 'image') {
        if (!imageBlocked.includes(user.id)) { return message.reply('this user isn\'t blocked from this.'); }
        imageBlocked.splice(imageBlocked.indexOf(user.id), 1);
        blockedData.set({ image: imageBlocked }, { merge: true });
        console.log(`${message.author.tag} unblocked ${user.tag} from sending images in the server.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} unblocked ${user.tag} from sending images in the server.`);
        return message.reply(`succesfully unblocked ${user.tag} from sending images in the server.`);
    }
}

exports.hasImage = hasImage;
exports.blockImage = blockImage;
exports.blockList = blockList;
exports.block = block;
exports.unblock = unblock;