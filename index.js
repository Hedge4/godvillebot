const Discord = require('discord.js');
const client = new Discord.Client();
const { suggestion_server, bot_server_channels, prefix, token, server, owner, bot_id, no_xp_channels, levelup_channel, command_channels, bot_blocked, newspaper_channels, admin_role, fun_commands, useful_commands } = require('./configurations/config.json');
const version = (require('./package.json')).version;

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

const admin = require('firebase-admin');
const serviceAccount = require('./configurations/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const userData = db.collection('data').doc('users');
const godData = db.collection('data').doc('gods');
const limitedCommandsData = db.collection('data').doc('limited uses');
global.totalGodpower = 0;
userData.get()
    .then (doc => {
        totalGodpower = doc.data()[1];
    });
limitedCommandsData.get()
    .then (doc => {
        global.usedDaily = doc.data()['daily'];
    });


client.on('ready', () => {
    client.guilds.get(server).me.setNickname('GodBot');
    const currentDate = new Date();
    console.log('\n' + currentDate + ` - Logged in as ${client.user.tag}!`);
    console.log('Logged in to the following guilds: ' + client.guilds.array().sort());
/*    client.channels.forEach((channel) => {
        console.log(` -- "${channel.name}" (${channel.type}) - ${channel.id}`)
    });*/
    client.user.setActivity(`${prefix}help | Crossword solution updates 22:20 UTC | By Wawajabba`);
    if (totalGodpower === undefined) {
        totalGodpower = 0;
    }
    const startEmbed = new Discord.RichEmbed()
        .setTitle('**Succesfully restarted!**')
        .setColor('ffffff')
        .setDescription(`GodBot version ${version} is now running again.\nTo see a list of commands, use '>help'.`)
        .setFooter('GodBot is brought to you by Wawajabba', client.user.avatarURL)
        .setTimestamp();
    client.channels.get(levelup_channel).send(startEmbed);
    client.channels.get(bot_server_channels[3]).send(startEmbed);
    const delay = crosswordgod.getCrosswordDelay();
    const delay2 = limitedCommands.resetDelay(true)[0];
    let delay3 = delay - 4500000;
    if (delay3 < 0) {
        delay3 = delay3 + 86400000;
    }

    //setTimeout(crosswordgod.dailyCrosswordRenew, delay, client);
    setTimeout(limitedCommands.reset, delay2, limitedCommandsData);
    setTimeout(crosswordgod.newsping, delay3, client);
});

client.on('message', message => {
    if (message.author.bot) {return;}
    if (bot_blocked.includes(message.author.id)) {return;}
    if (message.channel.type === 'dm') {
        return console.log('A DM was sent to the bot by \'' + message.author.tag + '/' + message.author.id + '\'. The content was: \'' + message.content + '\'');
    }

    if (message.guild.id === server) {
        if (message.author.id != bot_id) {
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
                        return mentions.toggleMentions(message, userData);
                    }
                    if (message.content.toLowerCase().startsWith(`${prefix}ranking`)) {
                        return getRanking.getRanking(message, userData);
                    }
                    if (message.content.toLowerCase().startsWith(`${prefix}help`)) {
                        return help.getHelp(message, Discord, client);
                    }
                    if (message.content.toLowerCase().startsWith(`${prefix}link`)) {
                        return profile.link(message, godData);
                    }
                    if (message.content.toLowerCase().startsWith(`${prefix}daily`)) {
                        return limitedCommands.daily(message, limitedCommandsData, userData);
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
                    return godville.search(message);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}guides`)) {
                    return guide.guides(message, Discord);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}suggest`)) {
                    return suggest.suggestion(client, message);
                }
                useful_commands.forEach(cmd => {
                    if (message.content.toLowerCase().startsWith(`${prefix}${cmd}`)) {
                        return useful(message, Discord, client, cmd);
                    }
                });
                if (message.member.roles.has(admin_role) || owner.includes(message.author.id)) {
                    if (message.content.toLowerCase().startsWith(`${prefix}purge`)) {
                        return admin_only.purge(message);
                    }
                    if (message.content.toLowerCase().startsWith(`${prefix}break`)) {
                        return admin_only.break(message, client);
                    }
                }
                if (newspaper_channels.includes(message.channel.id)) {
                    crosswordgod.crosswordgod(message);
                }
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
        message.reply('this bot is not created for this server. Please remove me from this server.');
    }
});

client.login(token);