const Discord = require('discord.js');
const client = new Discord.Client();
const { version, updateMsg } = require('./package.json');
const { logs, botServer, prefix, token, server, owner, noXpChannels, botvilleChannel, commandChannels,
    newspaperChannels, adminRole, ignoredChannels } = require('./configurations/config.json');
const { godville, godpower, fun, useful, moderator } = require('./configurations/commands.json');

// the different command modules
const godvilleModule = require('./commands/godville/godville.js');
const godpowerModule = require('./commands/godpower/godpower.js');
const funModule = require('./commands/fun/fun.js');
const usefulModule = require('./commands/useful/useful.js');
const moderatorModule = require('./commands/moderator/moderator.js');
const crosswordgod = require('./crosswordgod');

// functions/commands (partly) separate from the main modules
const giveXP = require('./commands/features/givexp');
const onMention = require('./commands/features/botMentions');
const messageReactions = require('./commands/features/messageReactions');
const botDMs = require('./commands/features/botDMs');
const chatContest = require('./commands/features/chatContest');
const daily = require('./commands/godpower/daily');
const suggest = require('./commands/useful/suggest');
const block = require('./commands/moderator/block.js');
const help = require('./commands/help');

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


// setup done as soon as the bot has a connection with Discord
client.on('ready', () => {
    const guild = client.guilds.cache.get(server);
    guild.me.setNickname('GodBot');
    guild.members.fetch();
    const currentDate = new Date();
    const logsChannel = client.channels.cache.get(logs);
    console.log(`\n${currentDate} - Logged in as ${client.user.tag}, version ${version}!`);
    console.log(`Logged in to the following guilds: ${client.guilds.cache.array().sort()}`);
    console.log(`New: ${updateMsg}`);
    logsChannel.send(`\`\`\`fix\n${currentDate} - Logged in as ${client.user.tag}, version ${version}!
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
    client.channels.cache.get(botvilleChannel).send(startEmbed);
    //const delay1 = crosswordgod.getCrosswordDelay(client);
    const delay2 = daily.resetDelay(client, true)[0];
    const delay3 = crosswordgod.getNewsDelay(client);
    global.newsSent = false;

    //setTimeout(crosswordgod.dailyCrosswordRenew, delay1, client);
    setTimeout(daily.reset, delay2, client, limitedCommandsData);
    setTimeout(crosswordgod.newsping, delay3, client);
    botDMs.checkDMContest(client);
    chatContest.check(client, userData);
});


// done whenever the bot detects a new message in any channel it has access to
client.on('message', async (message) => {
    // ignore any messages from bots or people blocked from interacting with the bot
    if (message.author.bot) {return;}
    if (botBlocked.includes(message.author.id)) {return;}

    // handle DMs
    if (message.channel.type === 'dm') {
        return botDMs.handleDMs(message, client);

    // handle messages in the Godville community server
    } else if (message.guild.id === server) {
        if (imageBlocked.includes(message.author.id) && message.attachments.size > 0 && block.hasImage(message.attachments)) {
            return block.blockImage(client, message);
        }

        // Ignore any channels in which the bot should not react to anything
        if (ignoredChannels.includes(message.channel.id)) {return;}

        // people without Admin or Deities role need to activate their access to the server first
        if (message.content.toLowerCase().startsWith('?rank')) {
            if (!message.member.roles.cache.has('313453649315495946') && !message.member.roles.cache.has(adminRole)) {
                return message.reply('use the `?ireadtherules` command to unlock core server functionality before adding any extra channels!');
            }
        }

        // give a user xp/godpower if they're talking in the right channel
        if (!noXpChannels.includes(message.channel.id)) {
            giveXP(message, userData, Discord, client);
        }

        // see if a message applies for the chat contest
        chatContest.newMessage(message, client, userData);

        // react to a message if it contains a certain (active) trigger
        messageReactions(message);

        // handle commands
        if (message.content.toLowerCase().startsWith(prefix)) {
            if (message.content.trim().length <= prefix.length) return; // only prefix (and whitespace)
            const cmd = message.content.toLowerCase().slice(prefix.length).split(/\s+/)[0]; // remove prefix and take first word
            const content = message.content.toLowerCase().slice(prefix.length + cmd.length).trim(); // remove prefix, command and whitespace

            if (commandChannels.includes(message.channel.id)) {
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
            if (message.member.roles.cache.has(adminRole) || owner.includes(message.author.id)) {
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

            // detect commands that work only in bot and newspaper related channels
            if (newspaperChannels.includes(message.channel.id)) {
                // command detection changes pending until crosswordgod functions are rewritten
                crosswordgod.crosswordgod(message);
            }
        }

    // handle accepting or rejecting suggestions in the bot's suggestion/log server
    } else if (message.guild.id == botServer) {
        return suggest.handleMessage(message, client);

    // respond when the bot is in a server it shouldn't be in
    } else {
        return message.reply('this bot is not created for this server. Please kick me from this server.');
    }

    // respond with a randomly selected reaction when the bot is pinged
    if (/<@666851479444783125>|<@!666851479444783125>/.test(message.content)) {
        return onMention(message, client);
    }
});


// log in to Discord after any setup is done
client.login(token);