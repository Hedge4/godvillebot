const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix, token, owner, server, bot_id, no_xp_channels, levelup_channel, command_channels, bot_blocked } = require('./config.json');

const mentions = require('./commands/togglementions');
const giveXP = require('./commands/givexp');
const displayLevel = require('./commands/levelcard');
const displayGold = require('./commands/goldcard');
const getRanking = require('./commands/ranking');

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const userData = db.collection('data').doc('users');
global.totalGodpower = 0;
userData.get()
    .then (doc => {
        totalGodpower = doc.data()[1];
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
    client.user.setActivity(`${prefix}level` + ' | Still testing! - by Wawajabba');
    if (totalGodpower === undefined) {
        totalGodpower = 0;
    }
    client.channels.get(levelup_channel).send('**Succesfully restarted!**');
});

client.on('message', message => {
    if (message.author.bot) {return;}
    if (bot_blocked.includes(message.author.id)) {return;}

/*    if (message.channel.id === '313450639583739904') {
        console.log(message.content);
    }*/

    if (message.channel.type === 'dm') {
        if (message.author.id !== bot_id) {
            console.log('A DM was sent to the bot by \'' + message.author.tag + '/' + message.author.id + '\'. The content was: \'' + message.content + '\'');
        }
    } else if (message.guild.id === server) {
        if (message.author.id != bot_id) {
            if (!no_xp_channels.includes(message.channel.id)) {
                giveXP.giveGodpower(message, userData, Discord, client);
            }
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
            }
            if (message.content.toLowerCase().startsWith(`${prefix}suggest`)) {
                suggest(message);
            }
        }
    }
});

function suggest(message) {
    const suggestion = message.content.slice(8).trim();
    const suggestion_user = client.users.get(owner);
    suggestion_user.send(`${message.author.tag} sent the following suggestion from ${message.channel.name}:\n` + '`' + suggestion + '`');
}

client.login(token);