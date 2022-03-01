// space for getters, need to be defined before require() is used
// this will crash if they are called before code is executed where the variable they return is declared and defined
exports.getClient = function() { return client; };
exports.getDiscord = function() { return Discord; };
exports.getGodData = function() { return godData; };


// discord connection setup, bot login is at bottom of file
const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        'GUILD_MESSAGES',
        'DIRECT_MESSAGES',
        'GUILDS',
        'GUILD_MEMBERS',
        'GUILD_MESSAGE_REACTIONS',
    ], partials: ['CHANNEL'], // CHANNEL needed to receive DMs
});

// certain variables used in this file
const { version, updateMsg1, updateMsg2, updateMsg3 } = require('./package.json');
const { logs, botServer, prefix, token, serversServed, owner, noXpChannels, botvilleChannel, commandChannels, newspaperChannel,
    adminRole, ignoredChannels, botServerChannels, sendViaBotChannel } = require('./configurations/config.json');
const { godville, godpower, fun, useful, moderator, crossword } = require('./configurations/commands.json');

// firebase database setup and login
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

// create important based on data in the database
userData.get()
    .then (doc => {
        global.totalGodpower = doc.data()[1];
    });
limitedCommandsData.get()
    .then (doc => {
        global.usedDaily = doc.data()['daily'];
    });
blockedData.get().then (doc => {
    global.imageBlocked = doc.data()['image'];
    global.botBlocked = doc.data()['bot'];
    global.suggestBlocked = doc.data()['suggest'];
    global.xpBlocked = doc.data()['xp'];
});


// the different command modules
const godvilleModule = require('./commands/godville/godville.js');
const godpowerModule = require('./commands/godpower/godpower.js');
const funModule = require('./commands/fun/fun.js');
const usefulModule = require('./commands/useful/useful.js');
const moderatorModule = require('./commands/moderator/moderator.js');
const crosswordModule = require('./commands/crosswordgod/crosswordgod.js');

// functions/commands (partly) separate from the main modules
const logger = require('./commands/features/logging');
const giveXP = require('./commands/features/givexp');
const onMention = require('./commands/features/botMentions');
const messageReactions = require('./commands/features/messageReactions');
const botDMs = require('./commands/features/botDMs');
const chatContest = require('./commands/features/chatContest');
const daily = require('./commands/godpower/daily');
const suggest = require('./commands/useful/suggest');
const block = require('./commands/moderator/block.js');
const help = require('./commands/help');
const newspaper = require('./commands/crosswordgod/newspaperManager.js');
const omnibus = require('./commands/crosswordgod/omnibusManager.js');
const crosswordTimers = require('./commands/crosswordgod/newsUpdates.js');
const sendViaBot = require('./commands/features/sendViaBot');


// setup done as soon as the bot has a connection with the Discord API
client.on('ready', () => {
    // do some caching and stuff for each guild I guess
    serversServed.forEach(guildID => {
        const guild = client.guilds.cache.get(guildID);
        guild.me.setNickname('GoddessBot');
        guild.members.fetch();
    });

    // send log messages that bot is online I guess
    const currentDate = new Date();
    const logsChannel = client.channels.cache.get(logs);
    const loggedInGuilds = client.guilds.cache.map(e => { return e.name; }).sort().join(', ');
    logger.start(logsChannel);
    logger.toConsole(`\n${currentDate} - Logged in as ${client.user.tag}, version ${version}!`);
    logger.toConsole(`Logged in to the following guilds: ${loggedInGuilds}`);
    logger.toConsole(`\nNewly added:\n• ${updateMsg1}\n• ${updateMsg2}\n• ${updateMsg3}`);
    logger.toChannel(`\`\`\`fix\n${currentDate} - Logged in as ${client.user.tag}, version ${version}!
        \nLogged in to the following guilds: ${loggedInGuilds}
        \nNewly added:\n • ${updateMsg1}\n • ${updateMsg2}\n • ${updateMsg3}\`\`\``);
    client.user.setActivity(`${prefix}help | By Wawajabba`);

    // idk why I have this if this is undefined this isn't even a fix lol
    if (!totalGodpower) {
        totalGodpower = 0;
    }

    // oh right now we actually say the bot is online in the main bot channel
    const startEmbed = new Discord.MessageEmbed()
        .setTitle('**Successfully restarted!**')
        .setColor('ffffff')
        .setDescription(`GodBot version ${version} is now running again.\nTo see a list of commands, use '${prefix}help'.
            \n**Newly added:**\n• ${updateMsg1}\n• ${updateMsg2}\n• ${updateMsg3}`)
        .setFooter({ text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() })
        .setTimestamp();
    client.channels.cache.get(botvilleChannel).send({ embeds: [startEmbed] });
    const delay1 = crosswordTimers.getUpdateDelay(); // delay before news automatically updates
    const delay2 = daily.resetDelay(true)[0];
    const delay3 = crosswordTimers.getNewsDelay(); // delay before the next newsping

    // set timeouts and get data such as the last chat kill / ongoing DM contests
    setTimeout(crosswordTimers.dailyUpdate, delay1);
    setTimeout(daily.reset, delay2, limitedCommandsData);
    setTimeout(crosswordTimers.newsPing, delay3);
    botDMs.checkDMContest(client);
    chatContest.startupCheck(client, userData);

    // load data such as the newspaper and the omnibus list
    logger.log('\nOmniBackup: Trying to load the Omnibus backup file...'); // linebreak for all of the newspaper/omnibus parsing spam
    if (!omnibus.loadBackup()) { // returns false if failed, so try again.
        logger.log('OmniBackup, attempt 2: Trying to load the Omnibus backup file...');
        omnibus.loadBackup();
    }
    logger.log('News: Trying to load today\'s Godville Times...');
    newspaper.load(false).then((success) => {
        if (!success) { // returns false if failed, so try again.
            logger.log('News, attempt 2: Trying to load today\'s Godville Times...');
            newspaper.load(false); // these two parameters are false because we don't want newspaper logs on startup
        }
    });
    logger.log('Omnibus: Trying to download and parse the Omnibus list from online...');
    omnibus.loadOnline(true).then((success) => {
        if (!success) { // returns false if failed, so try again.
            logger.log('Omni, attempt 2: Trying to download and parse the Omnibus list from online...');
            omnibus.loadOnline(true);
        }
    });
});


// done whenever the bot detects a new message in any channel it has access to
client.on('messageCreate', (message) => {
    // ignore any messages from bots or people blocked from interacting with the bot
    if (message.author.bot) {return;}
    if (botBlocked.includes(message.author.id)) {return;}

    // handle DMs
    if (message.channel.type === 'DM') {
        return botDMs.handleDMs(message, client);

    // handle messages in servers the bot is available in
    } else if (serversServed.includes(message.guild.id)) {
        // possibly later add detection for image links that automatically turn into an embed
        if (imageBlocked.includes(message.author.id) && message.attachments.size > 0 && block.hasImage(message.attachments)) {
            return block.blockImage(client, message);
        }

        // Ignore any channels in which the bot should not react to anything
        if (ignoredChannels.includes(message.channel.id)) {return;}

        // people without Admin or Deities role need to activate their access to the server first
        if (message.content.toLowerCase().startsWith('?rank')) {
            if (!message.member.roles.cache.has('313453649315495946') && !message.member.roles.cache.has(adminRole)) {
                return message.reply('Use the `?ireadtherules` command to unlock core server functionality before adding any extra channels!');
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
            const content = message.content.slice(prefix.length + cmd.length).trim(); // remove prefix, command and whitespace

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

            // the help command
            if (cmd == 'help') {
                return help(message, Discord, client);
            }

            // redirect crossword module commands
            if (commandChannels.concat(newspaperChannel).includes(message.channel.id)) {
                for (let i = 0; i < crossword.length; i++) {
                    if (cmd == crossword[i][0]) {
                        return crosswordModule(cmd, content, message);
                    }
                    for (let j = 0; j < crossword[i][1].length; j++) {
                        if (cmd == crossword[i][1][j]) {
                            return crosswordModule(crossword[i][0], content, message);
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
        }

    // respond when the bot is in a server it shouldn't be in
    } else {
        return message.reply('This bot is not created for this server. Please kick me from this server.');
    }

    if (message.guild.id == botServer) {
        // handle accepting or rejecting suggestions in the bot's suggestion/log server
        if (message.channel.id === botServerChannels[0]) {
            return suggest.handleMessage(message, client, Discord, userData);
        }

        // handle messages that should be sent via the bot to a specific channel/user
        if (message.channel.id == sendViaBotChannel) return sendViaBot(message);
    }


    // respond with a randomly selected reaction when the bot is pinged
    if (/<@666851479444783125>|<@!666851479444783125>/.test(message.content)) {
        return onMention(message, client);
    }
});

client.on('messageDelete', deletedMessage => {
    if (deletedMessage.author.bot) {return;} // when removing this add it to chatContest.deleteMessage()

    chatContest.deleteMessage(deletedMessage, client);
});


// log in to Discord after any setup is done
client.login(token);