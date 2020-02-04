const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix, token, server, owner, bot_id, no_xp_channels, levelup_channel, command_channels, bot_blocked, suggestion_channel, newspaper_channels } = require('./config.json');
const version = (require('./package.json')).version;
const fs = require('../fs');
const find = require('../find');
const { PythonShell } = require('../python-shell');

const mentions = require('./commands/togglementions');
const giveXP = require('./commands/givexp');
const displayLevel = require('./commands/levelcard');
const displayGold = require('./commands/goldcard');
const getRanking = require('./commands/ranking');
const suggest = require('./commands/suggest');
const guide = require('./commands/guides');
const help = require('./commands/help');
const purge = require('./commands/purge');
const profile = require('./commands/profile');
const godville = require('./commands/godville_interaction');
const crosswordgod = require('./crosswordgod_functions/crosswordgod');
const limitedCommands = require('./commands/limited_commands');

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
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
    const currentDate = new Date();
    console.log('\n' + currentDate + ` - Logged in as ${client.user.tag}!`);
    console.log('Logged in to the following guilds: ' + client.guilds.array().sort());
    client.channels.forEach((channel) => {
//        console.log(` -- "${channel.name}" (${channel.type}) - ${channel.id}`)
        if (channel.id === '313450639583739904') {
            console.log(`Logged in to ${channel.name} as well *smirk* - Channel ID: ${channel.id}\n`);
//            channel.send('something');
        }
    });
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
    const delay = crosswordgod.getCrosswordDelay();
    const delay2 = limitedCommands.resetDelay()[0];
    setTimeout(crosswordgod.dailyCrosswordRenew, delay, client);
    setTimeout(limitedCommands.reset, delay2, limitedCommandsData);
});

client.on('message', message => {
    if (message.author.bot) {return;}
    if (bot_blocked.includes(message.author.id)) {return;}

    if (message.channel.type === 'dm') {
        if (message.author.id !== bot_id) {
            console.log('A DM was sent to the bot by \'' + message.author.tag + '/' + message.author.id + '\'. The content was: \'' + message.content + '\'');
        }
    } else if (message.guild.id === server) {
        if (message.author.id != bot_id) {
            /*if (message.channel.id === '313450639583739904') {
                console.log(message.content);
            }*/
            if (!no_xp_channels.includes(message.channel.id)) {
                giveXP.giveGodpower(message, userData, Discord, client);
            }
            if (message.content.toLowerCase().startsWith(prefix)) {
                if (command_channels.includes(message.channel.id)) {
                    if (message.content.toLowerCase().startsWith(`${prefix}level`)) {
                        displayLevel.displayLevel(message, userData, Discord, client);
                    }
                    if (message.content.toLowerCase().startsWith(`${prefix}gold`)) {
                        displayGold.displayGold(message, userData, Discord, client);
                    }
                    if (message.content.toLowerCase().startsWith(`${prefix}toggle-mentions`)) {
                        mentions.toggleMentions(message, userData);
                    }
                    if (message.content.toLowerCase().startsWith(`${prefix}ranking`)) {
                        getRanking.getRanking(message, userData);
                    }
                    if (message.content.toLowerCase().startsWith(`${prefix}help`)) {
                        help.helpMessage(message, Discord, client);
                    }
                    if (message.content.toLowerCase().startsWith(`${prefix}link`)) {
                        profile.link(message, godData);
                    }
                    if (message.content.toLowerCase().startsWith(`${prefix}daily`)) {
                        limitedCommands.daily(message, limitedCommandsData, userData);
                    }
                }
                if (newspaper_channels.includes(message.channel.id)) {
                    crosswordgod.crosswordgod(message);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}profile`)) {
                    profile.show(message, client, Discord, godData);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}godwiki`)) {
                    godville.search(message);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}guides`)) {
                    guide.guides(message, Discord);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}suggest`)) {
                    suggest.suggestion(client, message);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}purge`)) {
                    purge.purge(message);
                }
            }
        }
    } else if (message.channel.id === suggestion_channel[0]) {
        if (owner.includes(message.author.id)) {
            if (message.content.toLowerCase().startsWith('accept')) {
                suggest.accept(message, client);
            }
            if (message.content.toLowerCase().startsWith('reject')) {
                suggest.reject(message, client);
            }
        }
    }
});

client.login(token);