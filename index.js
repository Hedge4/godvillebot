// canvas crashes the code if not imported before some other packages (sharp in particular)
require('canvas');

// space for getters, need to be defined before require() is used
// this will crash if they are called before code is executed where the variable they return is declared and defined
exports.getClient = function() { return client; };
exports.getGodData = function() { return godData; };
exports.getUserData = function() { return userData; };

// discord connection setup, bot login is at bottom of file
const { Client, GatewayIntentBits, Partials, ChannelType, EmbedBuilder } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ], partials: [
        Partials.Channel, // CHANNEL needed to receive DMs
        Partials.Message, // Needed to listen for reactions on uncached messages
        Partials.Reaction, // Needed to listen for reactions on uncached messages
        Partials.User, // Apparently need this too (?) to listen for reactions on uncached messages
    ],
});

// ==========================================================
// ========= NORMAL SETUP AFTER GETTERS ARE DEFINED =========
// ==========================================================

// certain variables used in this file
const { version } = require('./package.json');
const { channels, prefix, serversServed, botOwners, roles, botName, clientId, updateMsgs } = require('./configurations/config.json');
const { godville, godpower, fun, useful, moderator, crossword } = require('./configurations/commands.json');
const { DISCORD: { token }, FIREBASE: serviceAccount } = require('./configurations/secret.json');

// load any dependencies here

// the different command modules
const godvilleModule = require('./commands/godville/godville.js');
const godpowerModule = require('./commands/godpower/godpower.js');
const funModule = require('./commands/fun/fun.js');
const usefulModule = require('./commands/useful/useful.js');
const moderatorModule = require('./commands/moderator/moderator.js');
const crosswordModule = require('./commands/crosswordgod/crosswordgod.js');
const customCommands = require('./commands/customs');

// functions/commands (partly) separate from the main modules
const logger = require('./commands/features/logging');
const scheduler = require('./commands/features/scheduler');
const giveXP = require('./commands/features/givexp');
const onMention = require('./commands/features/botMentions');
const messageReactions = require('./commands/features/messageReactions');
const randomMessages = require('./commands/features/randomMessages');
const botDMs = require('./commands/features/botDMs');
const chatContest = require('./commands/features/chatContest');
const autoPurge = require('./commands/features/autoPurge');
const blogUpdates = require('./commands/features/blogUpdates');
const daily = require('./commands/godpower/daily');
const suggest = require('./commands/useful/suggest');
const block = require('./commands/moderator/block.js');
const reactionRoles = require('./commands/features/reactionRoles.js');
const getRoles = require('./commands/useful/getRoles.js');
const help = require('./commands/help');
const newspaper = require('./commands/crosswordgod/newspaperManager.js');
const omnibus = require('./commands/crosswordgod/omnibusManager.js');
const crosswordTimers = require('./commands/crosswordgod/newsUpdates.js');
const sendViaBot = require('./commands/features/sendViaBot');
const hugCommand = require('./commands/fun/hugCommand.js');

// ==========================================================
// ================ FIREBASE AND SETUP LOGIC ================
// ==========================================================

// firebase database setup and login
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const customCommandsCollection = db.collection('customCommands');
const otherDataCollection = db.collection('data');
const userData = otherDataCollection.doc('users');
const godData = otherDataCollection.doc('gods');
const limitedCommandsData = otherDataCollection.doc('limited uses');
const blockedData = otherDataCollection.doc('blocked');
const plannedEvents = otherDataCollection.doc('schedule');
const blogData = otherDataCollection.doc('blog');

// set up our globals because stuff being undefined sucks
global.totalGodpower = 0;
global.usedDaily = [];
global.imageBlocked = [];
global.botBlocked = [];
global.reactionRolesBlocked = [];
global.suggestBlocked = [];
global.xpBlocked = [];

// create important based on data in the database
userData.get()
    .then(doc => {
        totalGodpower = doc.data()[1];
    });
limitedCommandsData.get()
    .then(doc => {
        usedDaily = doc.data()['daily'];
    });
blockedData.get().then(doc => {
    imageBlocked = doc.data()['image'];
    botBlocked = doc.data()['bot'];
    reactionRolesBlocked = doc.data()['reactionRoles'];
    suggestBlocked = doc.data()['suggest'];
    xpBlocked = doc.data()['xp'];
});

// =========================================================
// ===================== CRASH HANDLER =====================
// =========================================================

const fs = require('fs');
const path = require('path');
const crashFile = path.join(__dirname, 'crashes.json');
global.isShuttingDown = false;

const crashObject = (err) => {
    const id = Math.random().toString(36).slice(2, 10);
    const timestamp = Date.now();
    const time = new Date(timestamp).toISOString();
    return { id, time, timestamp, message: err?.stack || String(err), logged: 'Before full shutdown' };
};

function recordCrash(crashObj) {
    let crashes = [];
    if (fs.existsSync(crashFile)) {
        try {
            crashes = JSON.parse(fs.readFileSync(crashFile));
        } catch (_) {
            console.log('Failed to read or parse crash log file, starting fresh.');
        }
    }
    crashes.push(crashObj);
    fs.writeFileSync(crashFile, JSON.stringify(crashes, null, 2));
}

async function sendCrashLog(crashObj) {
    const channel = await client.channels.fetch(channels.crashLogs);
    // crashMessage should have each property on a new line, n spaces so total is 10 characters, a colon, space, and the value
    await channel.send('<@346301339548123136> Fatal error occurred, crash log:\n```'
        + Object.entries(crashObj).map(([key, value]) => `${key.padEnd(9)} : ${value}`).join('\n')
        + '```');
}

process.on('unhandledRejection', async (reason) => {
    fatalErrorHandler(reason);
});
process.on('uncaughtException', async (err) => {
    fatalErrorHandler(err);
});
async function fatalErrorHandler(err) {
    console.error('Fatal error occurred, logging crash and shutting down.', err);
    global.isShuttingDown = true; // stop normal behaviour and reactions

    // Disconnect from Firebase to prevent any further writes
    try {
        await admin.app().delete();
        console.log('Successfully disconnected from Firebase.');
    } catch (dbErr) {
        console.error('Failed to disconnect from Firebase during shutdown:', dbErr);
    }

    const crashObj = crashObject(err);

    // attempt to log to Discord so we know if this succeeded when logging to crashes.json
    await Promise.race([
        sendCrashLog(crashObj),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout sending crash log')), 10000)),
    ]).catch((sendErr) => {
        console.error('Failed to send crash log to Discord, writing only to file.', sendErr);
        crashObj.logged = false;
        crashObj.sendErr = sendErr.message || String(sendErr);
    });

    // then write crash to file
    recordCrash(crashObj);
    console.log('Finished logging crash, exiting process.');
    process.exit(1);
}

// =========================================================
// ============ LOG UNLOGGED CRASHES TO DISCORD ============
// =========================================================

async function logUnloggedCrashes() {
    if (!fs.existsSync(crashFile)) return;

    let crashes;
    try {
        crashes = JSON.parse(fs.readFileSync(crashFile));
    } catch (err) {
        logger.log(`ErrHandler: Failed to read or parse crash log file: ${err}`);
        return;
    }
    if (crashes.length === 0) return;

    const channel = await client.channels.fetch(channels.crashLogs);

    // log crashes that weren't logged to Discord before shutdown and update their 'logged' property
    logger.log(`ErrHandler: Found ${crashes.length} unlogged crashes, logging to Discord...`);
    for (const crash of crashes) {
        if (crash.logged) continue; // will be truthy if defined
        const restartTime = new Date().toISOString();
        crash.logged = `After restart at ${restartTime}`;
        await channel.send('<@346301339548123136> Missed crash report:\n```'
            + Object.entries(crash).map(([key, value]) => `${key.padEnd(9)} : ${value}`).join('\n')
            + '```');
    }

    // write updated crashes back to file
    fs.writeFileSync(crashFile, JSON.stringify(crashes, null, 2));
}

// =========================================================
// ============ AFTER CONNECTION TO DISCORD API ============
// =========================================================

client.on('ready', () => {
    // do some caching and stuff for each guild in advance I guess
    Object.values(serversServed).forEach(guildID => {
        const guild = client.guilds.cache.get(guildID);
        guild.members.me.setNickname(`${botName}`);
        guild.members.fetch();
    });

    // only if our client is ready we can do these stuffs
    scheduler.start(plannedEvents);

    // send log messages that bot is online I guess
    const currentDate = new Date();
    const logsChannel = client.channels.cache.get(channels.logs);
    const loggedInGuilds = client.guilds.cache.map(e => { return e.name; }).sort().join(', ');
    const updateMsgsV1 = updateMsgs.length ? updateMsgs.join('\n• ') : 'No updates available.';
    const updateMsgsV2 = updateMsgs.length ? updateMsgs.join('\n- ') : 'No updates available.';
    logger.start(logsChannel);
    logger.toConsole(`\n${currentDate} - Logged in as ${client.user.tag}, version ${version}!`);
    logger.toConsole(`Logged in to the following guilds: ${loggedInGuilds}`);
    logger.toConsole(`\nNewly added:\n• ${updateMsgsV1}`);
    logger.toChannel(`\`\`\`fix\n${currentDate} - Logged in as ${client.user.tag}, version ${version}!
        \nLogged in to the following guilds: ${loggedInGuilds}
        \nNewly added:\n• ${updateMsgsV1}\`\`\``);
    client.user.setActivity(`${prefix}help | By Wawajabba`);

    // log unlogged crashes to #crash-logs channel
    logUnloggedCrashes().catch(err => {
        logger.log('ErrHandler: Failed to log unlogged crashes:', err);
    });

    // this isn't even necessary anymore as I define it as zero by default now so it's never undefined
    // but I'm keeping it here because it's hilarious that my solution to this would be to make it worse and reset it
    if (!totalGodpower || totalGodpower === 0) {
        totalGodpower = 0;
    }

    // oh right now we actually say the bot is online in the main bot channel
    const startEmbed = new EmbedBuilder()
        .setTitle('**Successfully restarted!**')
        .setColor('ffffff')
        .setDescription(`${botName} version ${version} is now running again.\nTo see a list of commands, use '${prefix}help'.
            \n**Newly added:**\n- ${updateMsgsV2}`)
        .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: client.user.avatarURL() })
        .setTimestamp();
    client.channels.cache.get(channels.botville).send({ embeds: [startEmbed] });
    const { delay: delay1, logText: logText1 } = crosswordTimers.getUpdateDelay(); // delay before news automatically updates
    const { delay: delay2, logText: logText2 } = daily.getResetDelay();
    const { delay: delay3, logText: logText3 } = crosswordTimers.getNewsDelay(); // delay before the next newsping
    logger.toConsole(`--------------------------------------------------------\n${logText1}\n${logText2}\n${logText3}\n--------------------------------------------------------`);
    logger.toChannel(`\`\`\`\n${logText1}\n${logText2}\n${logText3}\`\`\``);

    // set timeouts and get data such as the last chat kill / ongoing DM contests
    setTimeout(crosswordTimers.dailyUpdate, delay1);
    setTimeout(daily.reset, delay2, limitedCommandsData);
    setTimeout(crosswordTimers.newsPing, delay3);
    customCommands.setup(customCommandsCollection);
    botDMs.checkDMContest(client);
    chatContest.startupCheck();
    reactionRoles.load(client);
    getRoles.setup(client);
    autoPurge.setup();
    blogUpdates.setup(blogData);
    randomMessages(client);

    // load data such as the newspaper and the omnibus list
    logger.log('OmniBackup: Trying to load the Omnibus backup file...'); // newline for separation
    omnibus.loadBackup(); // load the omnibus list's backup .txt file
    logger.log('News: Trying to load today\'s Godville Times...');
    newspaper.load(false); // 'false' disables logging
    logger.log('Omnibus: Trying to download and parse the Omnibus list from online...');
    omnibus.loadOmnibus(); // downloads the current omnibus list from online
});


// ==========================================================
// ========== FOR EACH NEW MESSAGE SEEN BY THE BOT ==========
// ==========================================================

client.on('messageCreate', (message) => {
    if (global.isShuttingDown) return;
    // ignore any messages from bots or people blocked from interacting with the bot
    if (message.author.bot) { return; }
    if (botBlocked.includes(message.author.id)) { return; }

    // handle DMs
    if (message.channel.type === ChannelType.DM) {
        return botDMs.handleDMs(message, client);

        // handle messages in servers the bot is available in
    } else if (Object.values(serversServed).includes(message.guild.id)) {
        // possibly later add detection for image links that automatically turn into an embed
        if (imageBlocked.includes(message.author.id) && message.attachments.size > 0 && block.hasImage(message.attachments)) {
            return block.blockImage(message);
        }

        // ignore any channels in which the bot should not react to anything
        const ignoredChannels = [channels.venting, channels.appeals];
        if (ignoredChannels.includes(message.channel.id)) {
            const cmd = message.content.toLowerCase().slice(prefix.length).split(/\s+/)[0];
            if (message.channel.id === channels.venting && (cmd === fun[0][0] || fun[0][1].includes(cmd))) {
                return hugCommand(message); // >hug is the only command that works in venting
            }
            return;
        }

        // people without Admin or Deities role need to activate their access to the server first
        if (message.content.toLowerCase().startsWith('?rank')) {
            if (!message.member.roles.cache.has(roles.deities) && !message.member.roles.cache.has(roles.admin) && message.guild.id === serversServed.godvilleServer) {
                return message.reply(`Use the \`${prefix}ireadtherules\` command to unlock core server functionality before adding any extra channels!`);
            }
        }

        // check if a user should be given godpower for this message
        giveXP(message, userData, client);

        // see if a message applies for the chat contest
        chatContest.newMessage(message);

        // react to a message if it contains a certain (active) trigger
        messageReactions(message);

        // handle commands
        if (message.content.toLowerCase().startsWith(prefix)) {
            if (message.content.trim().length <= prefix.length) return; // only prefix (and whitespace)
            const cmd = message.content.toLowerCase().slice(prefix.length).split(/\s+/)[0]; // remove prefix and take first word
            const content = message.content.slice(prefix.length + cmd.length).trim(); // remove prefix, command and whitespace

            // redirect godpower module commands (only command channels)
            if (Object.values(channels.commandsAllowed).includes(message.channel.id)) {
                for (let i = 0; i < godpower.length; i++) {
                    if (cmd == godpower[i][0]) {
                        return godpowerModule(cmd, content, message, client, userData, limitedCommandsData);
                    }
                    for (let j = 0; j < godpower[i][1].length; j++) {
                        if (cmd == godpower[i][1][j]) {
                            return godpowerModule(godpower[i][0], content, message, client, userData, limitedCommandsData);
                        }
                    }
                }
            }

            // the help command
            if (cmd == 'help') {
                return help(message, client);
            }

            // redirect crossword module commands (only command/news channels)
            if (Object.values(channels.commandsAllowed).concat(channels.newspaper).includes(message.channel.id)) {
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
                    return godvilleModule(cmd, content, message, client, godData);
                }
                for (let j = 0; j < godville[i][1].length; j++) {
                    if (cmd == godville[i][1][j]) {
                        return godvilleModule(godville[i][0], content, message, client, godData);
                    }
                }
            }

            // redirect useful module commands
            for (let i = 0; i < useful.length; i++) {
                if (cmd == useful[i][0]) {
                    return usefulModule(cmd, content, message, client);
                }
                for (let j = 0; j < useful[i][1].length; j++) {
                    if (cmd == useful[i][1][j]) {
                        return usefulModule(useful[i][0], content, message, client);
                    }
                }
            }

            // redirect fun module commands
            for (let i = 0; i < fun.length; i++) {
                if (cmd == fun[i][0]) {
                    return funModule(cmd, content, message, client);
                }
                for (let j = 0; j < fun[i][1].length; j++) {
                    if (cmd == fun[i][1][j]) {
                        return funModule(fun[i][0], content, message, client);
                    }
                }
            }

            // only for admins or bot owners
            if (message.member.roles.cache.has(roles.admin) || Object.values(botOwners).includes(message.author.id)) {
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

            // check for custom commands
            customCommands.run(message, cmd, content);
        }

        // respond when the bot is in a server it shouldn't be in
    } else {
        return message.reply('This bot was not created for this server. Please kick me from this server.');
    }

    if (message.guild.id == serversServed.botServer) {
        // handle accepting or rejecting suggestions in the bot's suggestion/log server
        if (message.channel.id === channels.botServer.suggestions) {
            return suggest.handleMessage(message, client);
        }

        // handle messages that should be sent via the bot to a specific channel/user
        if (message.channel.id == channels.sendViaBot) return sendViaBot(message);
    }


    // respond with a randomly selected reaction when the bot is pinged
    if (RegExp(`<@!?${clientId}>`).test(message.content)) {
        return onMention(message, client);
    }
});

client.on('messageDelete', deletedMessage => {
    if (global.isShuttingDown) return;
    if (deletedMessage.partial) return; // we don't do anything with this and it'll crash the next line
    if (deletedMessage.author.bot) { return; } // when removing this add it to chatContest.deleteMessage()

    chatContest.deleteMessage(deletedMessage);
});

// handle reactions added to (cached) messages
client.on('messageReactionAdd', async (reaction, user) => {
    if (global.isShuttingDown) return;
    // ignore any reactions from bots
    if (user.bot) { return; }

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (_) {
            return;
        }
    }

    const message = reaction.message;
    if (message.partial) {
        try {
            await message.fetch();
        } catch (_) {
            return;
        }
    }

    // check if reaction roles were updated
    reactionRoles.reaction('add', reaction, user, message);

    // remove votes from blocked users in suggestions
    if (message.channel.id === channels.botServer.suggestions) {
        // I wanted to bully HP by preventing him from voting and added myself too so it wasn't too mean,
        // but he wanted his removed and now I'm the only one who can't vote :(
        // nvm I could add Paz :)
        if (!['346301339548123136', '255906086781976576'].includes(user.id)) return;
        reaction.users.remove(user.id);
    }
});

// handle reactions removed from (cached) messages
client.on('messageReactionRemove', async (reaction, user) => {
    if (global.isShuttingDown) return;
    // ignore any reactions from bots
    if (user.bot) { return; }

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (_) {
            return;
        }
    }

    const message = reaction.message;
    if (message.partial) {
        try {
            await message.fetch();
        } catch (_) {
            return;
        }
    }

    // check if reaction roles were updated
    reactionRoles.reaction('remove', reaction, user, message);
});

// handle new threads being created
client.on('threadCreate', async (threadChannel, newlyCreated) => {
    if (global.isShuttingDown) return;
    if (!newlyCreated) { return; } // for now we don't do anything with older threads (this shouldn't happen anyway since bot is admin)
    if (!threadChannel.guildId || !Object.values(serversServed).includes(threadChannel.guildId)) { return; } // eww DM or wrong guild

    // log thread creation
    const adminChannel = await client.channels.fetch(channels.losAdminos);
    const threadCreator = await client.users.fetch(threadChannel.ownerId);
    adminChannel.send(`New thread ${threadChannel.name}/<#${threadChannel.id}> created by ${threadCreator.tag}/<@${threadChannel.ownerId}> in channel ${threadChannel.parent.name}/<#${threadChannel.parentId}>.`);
    logger.log(`New thread ${threadChannel.name}/${threadChannel.id} created by ${threadCreator.tag}/${threadChannel.ownerId} in channel ${threadChannel.parent.name}/${threadChannel.parentId}.`);

    threadChannel.join().then(joinedChannel => {
        // make Dyno join the channel too, for moderation
        // timeout because Discord API has a bug where it might throw a permissions error if you message too quickly
        setTimeout(() => {
            joinedChannel.send('<@155149108183695360> quick, bot takeover!').catch(err => {
                // log error sending first message (likely API error, or lack of permissions)
                adminChannel.log(`Error! Couldn't message ${threadChannel.name}/<#${threadChannel.id}> to add Dyno: ${err}`);
                logger.log(`ERROR: Couldn't message ${threadChannel.name}/${threadChannel.id} to add Dyno: ${err}`);
            });
        }, 2000);
    }).catch(err => {
        // log errors joining channel (shouldn't happen, but just in case)
        adminChannel.log(`Error! Couldn't join thread ${threadChannel.name}/<#${threadChannel.id}>: ${err}`);
        logger.log(`ERROR: Couldn't join thread ${threadChannel.name}/${threadChannel.id}: ${err}`);
    });
});

// handle new members joining and send them a welcome message
client.on('guildMemberAdd', (member) => {
    if (global.isShuttingDown) return;
    // make sure this is the main Godville server
    if (member.guild.id !== serversServed.godvilleServer) return;

    const channel = member.guild.channels.cache.get(channels.botville);
    channel.send(
        `Welcome to the unofficial Godville Discord server, <@${member.id}>! To get started, please read the <#${channels.rules}> to learn how to access the rest of the server. If you have any issues just let the moderators know and we'll help you as soon as possible.`,
    );
});


// log in to Discord after any setup is done
client.login(token);