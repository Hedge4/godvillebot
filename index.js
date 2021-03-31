/* eslint-disable no-constant-condition */
const Discord = require('discord.js');
const client = new Discord.Client();
const { version, updateMsg } = require('./package.json');
const { logs, suggestion_server, bot_server_channels, prefix, token, server, owner, no_xp_channels, levelup_channel,
    command_channels, newspaper_channels, admin_role, bot_dms, mutedRole } = require('./configurations/config.json');
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
    'I\'m busy right now, can I ignore you some other time?',
    'initiating **DISCNAME** extermination process...',
    'your inability to talk with an actual human is concerning :no_mouth:',
    'wow, is that the sound of nothing interesting?',
    'stand still while I tie your shoelaces together!'];


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
    client.channels.cache.get(levelup_channel).send(startEmbed);
    //const delay1 = crosswordgod.getCrosswordDelay(client);
    const delay2 = limitedCommands.resetDelay(client, true)[0];
    const delay3 = crosswordgod.getNewsDelay(client);
    global.newsSent = false;

    //setTimeout(crosswordgod.dailyCrosswordRenew, delay1, client);
    setTimeout(limitedCommands.reset, delay2, client, limitedCommandsData);
    setTimeout(crosswordgod.newsping, delay3, client);
    checkDMContest(contestTracking);
});


// done whenever the bot detects a new message in any channel it has access to
client.on('message', async (message) => {
    // ignore any messages from bots or people blocked from interacting with the bot
    if (message.author.bot) {return;}
    if (botBlocked.includes(message.author.id)) {return;}

    // handle DMs
    if (message.channel.type === 'dm') {
        if (contestRunning && message.content.startsWith('+')) {
            enterDMContest(message);
        } else {
            handleDMs(message);
        }

    // handle messages in the Godville community server
    } else if (message.guild.id === server) {
        if (imageBlocked.includes(message.author.id) && message.attachments.size > 0 && block.hasImage(message.attachments)) {
            return block.blockImage(client, message);
        }

        // people without Admin or Deities role need to activate their access to the server first
        if (message.content.toLowerCase().startsWith('?rank')) {
            if (!message.member.roles.cache.has('313453649315495946') && !message.member.roles.cache.has(admin_role)) {
                return message.reply('use the `?ireadtherules` command to unlock core server functionality before adding any extra channels!');
            }
        }

        // give a user xp/godpower if they're talking in the right channel
        if (!no_xp_channels.includes(message.channel.id)) {
            giveXP.giveGodpower(message, userData, Discord, client);
        }

        // enter the user into the chat contest if they're talking in general chat
        if (message.channel.id == '313398424911347712') {
            chatContest(message);
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

            // detect commands that work only in bot and newspaper related channels
            if (newspaper_channels.includes(message.channel.id)) {
                // command detection changes pending until crosswordgod functions are rewritten
                crosswordgod.crosswordgod(message);
            }
        }

    // handle accepting or rejecting suggestions in the bot's log server
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

    // respond when the bot is in a server it shouldn't be in
    } else {
        return message.reply('this bot is not created for this server. Please kick me from this server.');
    }

    // respond with a randomly selected reaction when the bot is pinged
    if (/<@666851479444783125>|<@!666851479444783125>/.test(message.content)) {
        return mentionReact(message);
    }
});


// setup for reacting to bot mentions in the godville server
const botMentionCooldown = new Set();

// react when someoene mentions the bot
async function mentionReact(message) {
    if (botMentionCooldown.has(message.author.id)) {
        botMentionCooldown.delete(message.author.id);
        const logsChannel = client.channels.cache.get(logs);
        message.member.roles.add(mutedRole);
        //const reply = await message.reply('don\'t spam mention me.'); // use after new message.reply functionality releases
        message.reply('don\'t spam mention me.');
        setTimeout(() => {
            message.member.roles.remove(mutedRole);
            message.channel.send(`Unmuted ${message.author}.`);
            console.log(`Unmuted ${message.author.tag}.`);
            logsChannel.send(`Unmuted ${message.author.tag}.`);
        }, 60 * 1000);
        console.log(`Muted ${message.author.tag} for one minute for spam mentioning the bot.`);
        logsChannel.send(`Muted ${message.author.tag} for one minute for spam mentioning the bot.`);
    } else {
        botMentionCooldown.add(message.author.id);
        setTimeout(() => {
            botMentionCooldown.delete(message.author.id);
        }, 20 * 1000);
        message.reply(mentionReactions[Math.floor(Math.random() * mentionReactions.length)].replace('DISCNAME', `${message.author.tag}`));
    }
}

// function to handle any received DMs
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

// basic setup for contests through the bot's DMs
let contestAuthors = '', contestTotal = 0;
const contestRunning = true, contestMaxSubmissions = 5, contestMaxL = 25, contestMinL = 1;
const contestSubmissions = '824031930562773046', contestTracking = '824031951911649330';

// in case there's a bot DM contest running, check how many submissions were submitted already
async function checkDMContest(channelID) {
    if (!contestRunning) return;
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

// logic to determine if someone's submission is valid and add it to the previous submissions
function enterDMContest(message) {
    const msg = message.content.slice(1).trim();
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


// basic setup for chat contests
let lastMessage = null, lastWinner = '';
const chatContestTime = 10;

// run contest for the last message in general chat
function chatContest(message) {
    if (lastMessage == null || lastMessage.author.id !== message.author.id) {
        lastMessage = message;
        setTimeout(() => {
            checkChatContest(message);
        }, chatContestTime * 60 * 1000);
    }
}

// check if this message is still the last message in general chat, and reward the author if it is
async function checkChatContest(message) {
    if (message.id == lastMessage.id) {
        lastMessage = null;
        if (message.author.id == lastWinner) {
            message.reply(`you were the last person to talk for ${chatContestTime} minutes, but you already won the last chat-killing contest! :skull:`);
        } else {
            lastWinner = message.author.id;
            let gold;
            switch (Math.floor(Math.random() * 3)) {
                case 0:
                    gold = Math.floor(Math.random() * 14) + 6;
                    message.reply(`you were the last person to talk for ${chatContestTime} minutes, and you won a small amount of gold <:t_gold:668200334933622794> for succesfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
                    break;
                case 1:
                    gold = Math.floor(Math.random() * 21) + 22;
                    message.reply(`you were the last person to talk for ${chatContestTime} minutes, and you won a moderate bag of gold <:t_goldbag:668202265777274890> for succesfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
                    break;
                case 2:
                    gold = Math.floor(Math.random() * 39) + 50;
                    message.reply(`you were the last person to talk for ${chatContestTime} minutes, and you won a big crate of gold <:t_treasure:668203286330998787> for succesfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
                    break;
            }
            console.log(`${message.author.tag} / ${message.author.id} won ${gold} for being the last to talk in general chat for ${chatContestTime} minutes.`);
            client.channels.cache.get(logs).send(`${message.author.tag} / ${message.author.id} won ${gold} for being the last to talk in general chat for ${chatContestTime} minutes.`);

            const userDoc = await userData.get();
            const User = {};
            if(userDoc.data()[message.author.id] === undefined) {
                User[message.author.id] = {
                    godpower: 0,
                    gold: 0,
                    total_godpower: 0,
                    level: 0,
                };
                User[message.author.id].last_username = message.author.tag;
                await userData.set(User, { merge: true });
            } else {
                User[message.author.id] = userDoc.data()[message.author.id];
            }
            User[message.author.id].gold += gold;
            User[message.author.id].last_username = message.author.tag;
            userData.set(User, { merge: true });
        }
    }
}

// log in to Discord after any setup is done
client.login(token);