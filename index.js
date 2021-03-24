/* eslint-disable no-constant-condition */
const Discord = require('discord.js');
const client = new Discord.Client();
const { version, updateMsg } = require('./package.json');
const { logs, suggestion_server, bot_server_channels, prefix, token, server, owner, no_xp_channels, levelup_channel,
    command_channels, newspaper_channels, admin_role, bot_dms } = require('./configurations/config.json');
const { godville, godpower, fun, useful, moderator } = require('./configurations/commands.json');

// the different command modules
const godvilleModule = require('./commands/godville/godville.js');
const godpowerModule = require('./commands/godpower/godpower.js');
const funModule = require('./commands/fun/fun.js');
const usefulModule = require('./commands/useful/useful.js');
const moderatorModule = require('./commands/moderator/moderator.js');
const crosswordgod = require('./crosswordgod');

// functions/commands (partly) separate from the main modules
const help = require('./commands/help');
const giveXP = require('./commands/givexp');
const suggest = require('./commands/suggest');
const limitedCommands = require('./commands/limited_commands');
const block = require('./commands/moderator/block.js');

// basic setup
let contestAuthors = '', contestTotal = 0;
const contestRunning = true, contestMaxSubmissions = 5, contestMaxL = 25, contestMinL = 1;
const contestSubmissions = '824031930562773046', contestTracking = '824031951911649330';

// database login and current data retrieval
const admin = require('firebase-admin');
const serviceAccount = require('./configurations/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const userData = db.collection('data').doc('users');
const godData = db.collection('data').doc('gods');
const limitedCommandsData = db.collection('data').doc('limited uses');
const blockedData = db.collection('data').doc('blocked');
userData.get()
    .then (doc => {
        global.totalGodpower = doc.data()[1];
    });
limitedCommandsData.get()
    .then (doc => {
        global.usedDaily = doc.data()['daily'];
    });
blockedData.get()
    .then (doc => {
        global.imageBlocked = doc.data()['image'];
        global.botBlocked = doc.data()['bot'];
        global.suggestBlocked = doc.data()['suggest'];
        global.xpBlocked = doc.data()['xp'];
    });

// how the bot can react when you ping it
const mentionReactions = ['YOU FOOL, YOU DARE MENTION ME???',
    'I\'ll pretend I didn\'t see that :eyes:',
    'https://media.tenor.com/images/10c1188bf1df85272a39c17ce863081c/tenor.gif',
    'oh boy you\'ve done it now, coming over to break your kneecaps rn',
    'don\'t ping me or I *will* pee your pants!',
    'hang on I\'m unfriending you on Facebook.',
    'I\'m busy right now, can I ignore you some other time?'];


client.on('ready', () => {
    const guild = client.guilds.cache.get(server);
    guild.me.setNickname('GodBot');
    guild.members.fetch();
    const currentDate = new Date();
    const logsChannel = client.channels.cache.get(logs);
    console.log(`\n${currentDate} - Logged in as ${client.user.tag}, version ${version}!`);
    console.log(`Logged in to the following guilds: ${client.guilds.cache.array().sort()}`);
    console.log(`New: ${updateMsg}`);
    logsChannel.send(`\`\`\`${currentDate} - Logged in as ${client.user.tag}, version ${version}!
        \nLogged in to the following guilds: ${client.guilds.cache.array().sort()}\nNew: ${updateMsg}\`\`\``);
    client.user.setActivity(`${prefix}help | By Wawajabba`);
    if (totalGodpower === undefined) {
        totalGodpower = 0;
    }
    const startEmbed = new Discord.MessageEmbed()
        .setTitle('**Successfully restarted!**')
        .setColor('ffffff')
        .setDescription(`GodBot version ${version} is now running again.\nTo see a list of commands, use '${prefix}help'.\n\nNew: ${updateMsg}`)
        .setFooter('GodBot is brought to you by Wawajabba', client.user.avatarURL())
        .setTimestamp();
    client.channels.cache.get(levelup_channel).send(startEmbed);
    //const delay1 = crosswordgod.getCrosswordDelay(client);
    const delay2 = limitedCommands.resetDelay(client, true)[0];
    const delay3 = crosswordgod.getNewsDelay(client);
    global.newsSent = false;

    //setTimeout(crosswordgod.dailyCrosswordRenew, delay1, client);
    setTimeout(limitedCommands.reset, delay2, client, limitedCommandsData);
    setTimeout(crosswordgod.newsping, delay3, client);
    if (contestRunning) checkContest(contestTracking);
});


client.on('message', async (message) => {
    if (message.author.bot) {return;}
    if (botBlocked.includes(message.author.id)) {return;}

    // handle DMs
    if (message.channel.type === 'dm') {
        if (contestRunning && message.content.startsWith('+')) {
            enterContest(message);
        } else {
            handleDMs(message);
        }

    // handle messages in GodBot's intended server
    } else if (message.guild.id === server) {
        if (imageBlocked.includes(message.author.id) && message.attachments.size > 0 && block.hasImage(message.attachments)) {
            return block.blockImage(client, message);
        }
        if (message.content.toLowerCase().startsWith('?rank')) {
            if (!message.member.roles.cache.has('313453649315495946') && !message.member.roles.cache.has(admin_role)) {
                return message.reply('use the `?ireadtherules` command to unlock core server functionality before adding any extra channels!');
            }
        }
        if (!no_xp_channels.includes(message.channel.id)) {
            giveXP.giveGodpower(message, userData, Discord, client);
        }

        // handle commands
        if (message.content.toLowerCase().startsWith(prefix)) {
            if (message.content.trim().length <= prefix.length) return; // only prefix (and whitespace)
            const cmd = message.content.toLowerCase().slice(prefix.length).split(/\s+/)[0]; // remove prefix and take first word
            const content = message.content.toLowerCase().slice(prefix.length + cmd.length).trim(); // remove prefix, command and whitespace

            if (command_channels.includes(message.channel.id)) {
                // redirect godpower module commands
                for (let i = 0; i < godpower.length; i++) {
                    if (cmd == godpower[i][0]) {
                        return godpowerModule(cmd, content, message, Discord, client, userData, limitedCommandsData);
                    }
                    for (let j = 0; j < godpower[i][1].length; j++) {
                        if (cmd == godpower[i][1][j]) {
                            return godpowerModule(godpower[i][0], content, message, Discord, client, userData, limitedCommandsData);
                        }
                    }
                }
                // redirect fun module commands
                for (let i = 0; i < fun.length; i++) {
                    if (cmd == fun[i][0]) {
                        return funModule(cmd, content, message, Discord, client);
                    }
                    for (let j = 0; j < fun[i][1].length; j++) {
                        if (cmd == fun[i][1][j]) {
                            return funModule(fun[i][0], content, message, Discord, client);
                        }
                    }
                }
            }
            // redirect godville module commands
            for (let i = 0; i < godville.length; i++) {
                if (cmd == godville[i][0]) {
                    return godvilleModule(cmd, content, message, client, Discord, godData);
                }
                for (let j = 0; j < godville[i][1].length; j++) {
                    if (cmd == godville[i][1][j]) {
                        return godvilleModule(godville[i][0], content, message, client, Discord, godData);
                    }
                }
            }
            // redirect useful module commands
            for (let i = 0; i < useful.length; i++) {
                if (cmd == useful[i][0]) {
                    return usefulModule(cmd, content, message, Discord, client);
                }
                for (let j = 0; j < useful[i][1].length; j++) {
                    if (cmd == useful[i][1][j]) {
                        return usefulModule(useful[i][0], content, message, Discord, client);
                    }
                }
            }
            // the help command
            if (cmd == 'help') {
                return help(message, Discord, client);
            }
            // only for admins or bot owners
            if (message.member.roles.cache.has(admin_role) || owner.includes(message.author.id)) {
                // redirect moderator module commands
                for (let i = 0; i < moderator.length; i++) {
                    if (cmd == moderator[i][0]) {
                        return moderatorModule(cmd, content, message, client, blockedData);
                    }
                    for (let j = 0; j < moderator[i][1].length; j++) {
                        if (cmd == moderator[i][1][j]) {
                            return moderatorModule(moderator[i][0], content, message, client, blockedData);
                        }
                    }
                }
            }
            if (newspaper_channels.includes(message.channel.id)) {
                // command detection changes pending until crosswordgod functions are rewritten
                crosswordgod.crosswordgod(message);
            }
        }
    // handle accepting or rejecting suggestions
    } else if (message.guild.id == suggestion_server) {
        if (message.channel.id === bot_server_channels[0]) {
            if (owner.includes(message.author.id)) {
                if (message.content.toLowerCase().startsWith('accept')) {
                    return suggest.accept(message, client);
                }
                if (message.content.toLowerCase().startsWith('reject')) {
                    return suggest.reject(message, client);
                }
            }
        }
        return;
    } else {
        // response when the bot is in a server it shouldn't be in
        return message.reply('this bot is not created for this server. Please kick me from this server.');
    }
    // respond with a randomly selected reaction when the bot is pinged
    if (/<@666851479444783125>|<@!666851479444783125>/.test(message.content)) {
        return message.reply(mentionReactions[Math.floor(Math.random() * mentionReactions.length)]);
    }
});

function handleDMs(message) {
    let msg = `I don't currently respond to DMs. If you want such a feature to be added, contact the bot owner (Wawajabba) or use \`${prefix}suggest\` in <#${levelup_channel}>.`;
    if (contestRunning) msg += '\n\nDid you want to enter the current contest? Then make sure you type \'+\' before your entry.';
    message.reply(msg);
    console.log('A DM was sent to the bot by \'' + message.author.tag + '/' + message.author.id + '\'. The content was: \'' + message.content + '\'');
    client.channels.cache.get(bot_dms).send(`*${message.author.tag} / ${message.author.id} sent the following message in my DMs:*`);
    const attachments = [];
    message.attachments.forEach(element => {
        attachments.push(element.url);
    });
    client.channels.cache.get(bot_dms).send(message.content, { files: attachments })
        .catch(err => client.channels.cache.get(bot_dms).send(`Failed to forward: ${err}`));
}

async function checkContest(channelID) {
    const channel = client.channels.cache.get(channelID);
    let last_id;

    while (true) {
        const options = { limit: 100 };
        if (last_id) {
            options.before = last_id;
        }

        const messages = await channel.messages.fetch(options);
        if (messages.size < 1) break;
        messages.array().forEach(e => {
            contestAuthors += e.content;
            contestTotal++;
        });
        last_id = messages.last().id;

        if (messages.size != 100) {
            break;
        }
    }
}

function enterContest(message) {
    const msg = message.slice(1).trim();
    if (msg.length > contestMaxL) return message.reply(`Contest entries can be ${contestMaxL} characters at most. Your entry was ${msg.length} characters long.`);
    if (msg.length < contestMinL) return message.reply(`Your entry for this contest must be at least ${contestMinL} characters long.`);
    const id = message.author.id.toString();
    let count = 0, pos = 0;
    while (true) {
        pos = contestAuthors.indexOf(id, pos);
        if (pos >= 0) {
            count++;
            pos += id.length;
        } else { break; }
    }
    if (count >= 5) return message.reply(`You can only have ${contestMaxSubmissions} entries in this contest.`);
    contestAuthors += message.author.id;
    message.reply(`Your entry was accepted. You have ${contestMaxSubmissions - 1 - count} entries left.`);
    client.channels.cache.get(contestSubmissions).send(`${contestTotal} => ${msg}`);
    client.channels.cache.get(contestTracking).send(`${contestTotal}, ${message.author.tag}, ${message.author.id}`);
    contestTotal++;
}

client.login(token);