const { modlogs, logs, owner } = require('../../configurations/config.json');
const getUsers = require('../features/getUsers');

function hasImage(attachments) {
    const imgFormats = ['.png', '.jpeg', '.jpg', '.gif']; // maybe add more formats later
    let imageFound = false;
    for (let i = 0; i < attachments.size; i++) {
        try {
            const format = /^[\s\S]+(\.[^.]+$)/.exec(attachments.at(i).name)[1];
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
    setTimeout(() => { message.delete(); }, 100);
    console.log(`Blocked ${message.author.tag} from sending an image with filename "${message.attachments.first().name}" in ${message.channel.name}.`);
    logsChannel.send(`Blocked ${message.author.tag} from sending an image with filename "${message.attachments.first().name}" in ${message.channel.name}.`);
    message.channel.send(`<@${message.author.id}>, you are currently not allowed to post images in the server.`)
        .then(msg => { setTimeout(() => { msg.delete(); }, 10 * 1000); })
        .catch(console.error);
}

const blockLists = ['bot', 'xp', 'image', 'suggest', 'reactionroles'];
const correctFormat = `Correct format: \`>block|unblock|blocklist ${blockLists.join('|')} (@user|user#0000|userID)\``;

function blockList(message, client) {
    const args = message.content.slice(10).trim().split(' ');
    if (!args[0].length) {
        return message.reply('Please specify which list of blocked users you want to view!\n' + correctFormat);
    }
    if (!blockLists.includes(args[0].toLowerCase())) {
        return message.reply(`${args[0]} is not one of the blocked user lists.\n${correctFormat}`);
    }

    const logsChannel = client.channels.cache.get(logs);
    args[0] = args[0].toLowerCase();
    let msg = `Here is the list of users blocked from "${args[0]}":\n\`\`\``;
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
    if (args[0] == 'reactionroles') {
        if (!reactionRolesBlocked.length) msg += ('No users blocked.');
        for (let i = 0; i < reactionRolesBlocked.length; i++) {
            let user = '';
            try {
                user = client.users.cache.get(reactionRolesBlocked[i]).tag;
            } catch {
                user = reactionRolesBlocked[i];
            }
            msg += (` ${i}. ${user}\n`);
        }
        logsChannel.send(`${message.author.tag} requested the list of users blocked from using reaction roles.`);
        console.log(`${message.author.tag} requested the list of users blocked from using reaction roles.`);
    }
    msg += ('```');
    return message.reply(msg);
}

function block(message, client, blockedData) {
    const args = message.content.slice(6).trim().split(' ');
    if (args.length > 2) {
        args[1] = args.slice(1).join(' ');
    } else if (args.length < 2) {
        return message.reply('Please specify what you want to block and for which user!\n' + correctFormat);
    }
    if (!blockLists.includes(args[0].toLowerCase())) {
        return message.reply(`${args[0]} is not one of the things users can be blocked from.\n${correctFormat}`);
    }

    const user = getUsers.One(args[1], client);
    if (!user) {
        return message.reply(`User "${args[1]}" could not be found. Mention a valid user or use a valid username/ID!\n+${correctFormat}`);
    }
    if (owner.includes(user.id)) {
        return message.reply(`Nuh uh I'm not blocking ${user.username} you dummy!`);
    }

    args[0] = args[0].toLowerCase();
    if (args[0] == 'bot') {
        if (botBlocked.includes(user.id)) { return message.reply('This user is already blocked from this.'); }
        botBlocked.push(user.id);
        blockedData.set({ bot: botBlocked }, { merge: true });
        console.log(`${message.author.tag} blocked ${user.tag} from using the bot.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} blocked ${user.tag} from using the bot.`);
        return message.reply(`Successfully blocked ${user.tag} from using the bot.`);
    }
    if (args[0] == 'xp') {
        if (xpBlocked.includes(user.id)) { return message.reply('This user is already blocked from this.'); }
        xpBlocked.push(user.id);
        blockedData.set({ xp: xpBlocked }, { merge: true });
        console.log(`${message.author.tag} blocked ${user.tag} from gaining xp (godpower).`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} blocked ${user.tag} from gaining xp (godpower).`);
        return message.reply(`Successfully blocked ${user.tag} from gaining xp (godpower).`);
    }
    if (args[0] == 'suggest') {
        if (suggestBlocked.includes(user.id)) { return message.reply('This user is already blocked from this.'); }
        suggestBlocked.push(user.id);
        blockedData.set({ suggest: suggestBlocked }, { merge: true });
        console.log(`${message.author.tag} blocked ${user.tag} from making suggestions for the bot.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} blocked ${user.tag} from making suggestions for the bot.`);
        return message.reply(`Successfully blocked ${user.tag} from making suggestions for the bot.`);
    }
    if (args[0] == 'image') {
        if (imageBlocked.includes(user.id)) { return message.reply('This user is already blocked from this.'); }
        imageBlocked.push(user.id);
        blockedData.set({ image: imageBlocked }, { merge: true });
        console.log(`${message.author.tag} blocked ${user.tag} from sending images in the server.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} blocked ${user.tag} from sending images in the server.`);
        return message.reply(`Successfully blocked ${user.tag} from sending images in the server.`);
    }
    if (args[0] == 'reactionroles') {
        if (reactionRolesBlocked.includes(user.id)) { return message.reply('This user is already blocked from this.'); }
        reactionRolesBlocked.push(user.id);
        blockedData.set({ reactionRoles: reactionRolesBlocked }, { merge: true });
        console.log(`${message.author.tag} blocked ${user.tag} from using reaction roles.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} blocked ${user.tag} from using reaction roles.`);
        return message.reply(`Successfully blocked ${user.tag} from using reaction roles.`);
    }
}

function unblock(message, client, blockedData) {
    const args = message.content.slice(8).trim().split(' ');
    if (args.length > 2) {
        args[1] = args.slice(1).join(' ');
    } else if (args.length < 2) {
        return message.reply('Please specify what you want to unblock and for which user!\n' + correctFormat);
    }
    if (!blockLists.includes(args[0].toLowerCase())) {
        return message.reply(`${args[0]} is not one of the things users can be blocked from.\n${correctFormat}`);
    }
    const user = getUsers.One(args[1], client);
    if (!user) {
        return message.reply(`User "${args[1]}" could not be found. Mention a valid user or use a valid username/ID!\n${correctFormat}`);
    }
    if (user.id === message.author.id && !owner.includes(message.author.id)) {
        return message.reply('You can\'t unblock yourself you big dumdum 🤦');
    }

    args[0] = args[0].toLowerCase();
    if (args[0] == 'bot') {
        if (!botBlocked.includes(user.id)) { return message.reply('This user isn\'t blocked from this.'); }
        botBlocked.splice(botBlocked.indexOf(user.id), 1);
        blockedData.set({ bot: botBlocked }, { merge: true });
        console.log(`${message.author.tag} unblocked ${user.tag} from using the bot.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} unblocked ${user.tag} from using the bot.`);
        return message.reply(`Successfully unblocked ${user.tag} from using the bot.`);
    }
    if (args[0] == 'xp') {
        if (!xpBlocked.includes(user.id)) { return message.reply('This user isn\'t blocked from this.'); }
        xpBlocked.splice(xpBlocked.indexOf(user.id), 1);
        blockedData.set({ xp: xpBlocked }, { merge: true });
        console.log(`${message.author.tag} unblocked ${user.tag} from gaining xp (godpower).`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} unblocked ${user.tag} from gaining xp (godpower).`);
        return message.reply(`Successfully unblocked ${user.tag} from gaining xp (godpower).`);
    }
    if (args[0] == 'suggest') {
        if (!suggestBlocked.includes(user.id)) { return message.reply('This user isn\'t blocked from this.'); }
        suggestBlocked.splice(suggestBlocked.indexOf(user.id), 1);
        blockedData.set({ suggest: suggestBlocked }, { merge: true });
        console.log(`${message.author.tag} unblocked ${user.tag} from making suggestions for the bot.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} unblocked ${user.tag} from making suggestions for the bot.`);
        return message.reply(`Successfully unblocked ${user.tag} from making suggestions for the bot.`);
    }
    if (args[0] == 'image') {
        if (!imageBlocked.includes(user.id)) { return message.reply('This user isn\'t blocked from this.'); }
        imageBlocked.splice(imageBlocked.indexOf(user.id), 1);
        blockedData.set({ image: imageBlocked }, { merge: true });
        console.log(`${message.author.tag} unblocked ${user.tag} from sending images in the server.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} unblocked ${user.tag} from sending images in the server.`);
        return message.reply(`Successfully unblocked ${user.tag} from sending images in the server.`);
    }
    if (args[0] == 'reactionroles') {
        if (!reactionRolesBlocked.includes(user.id)) { return message.reply('This user isn\'t blocked from this.'); }
        reactionRolesBlocked.splice(reactionRolesBlocked.indexOf(user.id), 1);
        blockedData.set({ reactionRoles: reactionRolesBlocked }, { merge: true });
        console.log(`${message.author.tag} unblocked ${user.tag} from using reaction roles.`);
        client.channels.cache.get(modlogs).send(`${message.author.tag} unblocked ${user.tag} from using reaction roles.`);
        return message.reply(`Successfully unblocked ${user.tag} from using reaction roles.`);
    }
}

exports.hasImage = hasImage;
exports.blockImage = blockImage;
exports.blockList = blockList;
exports.block = block;
exports.unblock = unblock;