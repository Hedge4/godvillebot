const Discord = require('discord.js');
const client = new Discord.Client();
const { logs, suggestion_server, bot_server_channels, prefix, token, server, owner, no_xp_channels, levelup_channel, command_channels, newspaper_channels, admin_role, fun_commands, useful_commands, bot_dms } = require('./configurations/config.json');
const { version, updateMsg } = require('./package.json');

const mentions = require('./commands/togglementions');
const giveXP = require('./commands/givexp');
const displayLevel = require('./commands/levelcard');
const displayGold = require('./commands/goldcard');
const getRanking = require('./commands/ranking');
const suggest = require('./commands/suggest');
const guide = require('./commands/guides');
const help = require('./commands/help');
const admin_only = require('./commands/admin_commands');
const profile = require('./commands/profile');
const godville = require('./commands/godville_interaction');
const crosswordgod = require('./crosswordgod');
const limitedCommands = require('./commands/limited_commands');
const fun = require('./commands/fun/fun.js');
const useful = require('./commands/useful/useful.js');
const block = require('./commands/block.js');

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
//global.totalGodpower = 0;
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
    console.log(`Last update: ${updateMsg}`);
    logsChannel.send(`\`\`\`${currentDate} - Logged in as ${client.user.tag}, version ${version}!
        \nLogged in to the following guilds: ${client.guilds.cache.array().sort()}
        Last update: ${updateMsg}\`\`\``);
/*    client.channels.cache.forEach((channel) => {
        console.log(` -- "${channel.name}" (${channel.type}) - ${channel.id}`)
        logsChannel.send(` -- "${channel.name}" (${channel.type}) - ${channel.id}`)
    });*/
    client.user.setActivity(`${prefix}help | By Wawajabba`);
    if (totalGodpower === undefined) {
        totalGodpower = 0;
    }
    const startEmbed = new Discord.MessageEmbed()
        .setTitle('**Successfully restarted!**')
        .setColor('ffffff')
        .setDescription(`GodBot version ${version} is now running again.\nTo see a list of commands, use '${prefix}help'.\n
            Last update: ${updateMsg}`)
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
});

client.on('message', async (message) => {
    if (message.author.bot) {return;}
    if (botBlocked.includes(message.author.id)) {return;}
    if (message.channel.type === 'dm') {
        message.reply(`I don't currently respond to DMs. If you want such a feature to be added, contact the bot owner (Wawajabba) or use \`${prefix}suggest\` in <#${levelup_channel}>.`);
        console.log('A DM was sent to the bot by \'' + message.author.tag + '/' + message.author.id + '\'. The content was: \'' + message.content + '\'');
        client.channels.cache.get(bot_dms).send(`*${message.author.tag} sent the following message in my DMs:*`);
        const attachments = [];
        message.attachments.forEach(element => {
            attachments.push(element.url);
        });
        client.channels.cache.get(bot_dms).send(message.content, { files: attachments })
            .catch(client.channels.cache.get(bot_dms).send('Failed to forward.'));
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
        if (message.content.toLowerCase().startsWith(prefix)) {
            if (command_channels.includes(message.channel.id)) {
                if (message.content.toLowerCase().startsWith(`${prefix}level`)) {
                    return displayLevel.displayLevel(message, userData, Discord, client);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}gold`)) {
                    return displayGold.displayGold(message, userData, Discord, client);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}toggle-mentions`)) {
                    return mentions.toggleMentions(message, userData, client);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}ranking`)) {
                    return getRanking.getRanking(message, userData, client);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}help`)) {
                    return help.getHelp(message, Discord, client, true);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}link`)) {
                    return profile.link(message, godData, client);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}daily`)) {
                    return limitedCommands.daily(client, message, limitedCommandsData, userData);
                }
                fun_commands.forEach(cmd => {
                    if (message.content.toLowerCase().startsWith(`${prefix}${cmd}`)) {
                        return fun(message, Discord, client, cmd);
                    }
                });
            }
            if (message.content.toLowerCase().startsWith(`${prefix}profile`)) {
                return profile.show(message, client, Discord, godData);
            }
            if (message.content.toLowerCase().startsWith(`${prefix}godwiki`)) {
                return godville.search(client, message);
            }
            if (message.content.toLowerCase().startsWith(`${prefix}guides`)) {
                return guide.guides(message, client, Discord);
            }
            if (message.content.toLowerCase().startsWith(`${prefix}suggest`)) {
                return suggest.suggestion(client, message);
            }
            if (message.content.toLowerCase().startsWith(`${prefix}help`)) {
                return help.getHelp(message, Discord, client, false);
            }
            useful_commands.forEach(cmd => {
                if (message.content.toLowerCase().startsWith(`${prefix}${cmd}`)) {
                    return useful(message, Discord, client, cmd);
                }
            });
            if (message.member.roles.cache.has(admin_role) || owner.includes(message.author.id)) {
                if (message.content.toLowerCase().startsWith(`${prefix}purge`)) {
                    return admin_only.purge(client, message);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}break`)) {
                    return admin_only.break(message, client);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}blocklist`)) {
                    return block.blockList(message, client);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}block`)) {
                    return block.block(message, client, blockedData);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}unblock`)) {
                    return block.unblock(message, client, blockedData);
                }
            }
            if (newspaper_channels.includes(message.channel.id)) {
                crosswordgod.crosswordgod(message);
            }
        }
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
    } else {
        return message.reply('this bot is not created for this server. Please remove me from this server.');
    }
    if (/<@666851479444783125>|<@!666851479444783125>/.test(message.content)) {
        return message.reply(mentionReactions[Math.floor(Math.random() * mentionReactions.length)]);
    }
});

client.login(token);