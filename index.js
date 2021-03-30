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

// basic setup
let contestAuthors = '', contestTotal = 0;
const contestRunning = true, contestMaxSubmissions = 5, contestMaxL = 25, contestMinL = 1;
const contestSubmissions = '824031930562773046', contestTracking = '824031951911649330';
const botMentionCooldown = new Set();

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

    // handle messages in the Godville community server
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
        aprilFools(message);
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
        return mentionReact(message);
    }
});

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

client.login(token);


let lastMessage = null, lastWinner = '';
const chatContestTime = 10;
const aprilFoolsCooldown = new Set();

function aprilFools(message) {
    // april fools functions only work in #general
    if (message.channel.id == '313398424911347712') {

        // run contest for the last message in general chat
        if (lastMessage == null || lastMessage.author.id !== message.author.id) {
            lastMessage = message;
            setTimeout(() => {
                chatContest(message);
            }, chatContestTime * 60 * 1000);
        }

        // set nickname to something random
        if (message.member.manageable) {
            if (!aprilFoolsCooldown.has(message.author.id)) {
                aprilFoolsCooldown.add(message.author.id);

                const oldNick = message.member.nickname;
                let newNick = oldNick;
                while (newNick == oldNick) {
                    newNick = randomNick();
                }
                message.member.setNickname(newNick, 'April fools event');

                setTimeout(() => {
                    aprilFoolsCooldown.delete(message.author.id);
                }, 30 * 1000);

                console.log(`${message.author.tag} / ${message.author.id}: Changed nickname from ${oldNick} to ${newNick}.`);
                client.channels.cache.get(logs).send(`**${message.author.tag} / ${message.author.id}**: Changed nickname from **${oldNick}** to **${newNick}**.`);
            }
        }
    }
}

async function chatContest(message) {
    if (message.id == lastMessage.id) {
        lastMessage = null;
        if (message.author.id == lastWinner) {
            message.reply(`you were the last person to talk for ${chatContestTime} minutes, but you already won the last chat-killing contest! :skull:`);
        } else {
            lastWinner = message.author.id;
            const gold = Math.floor(Math.random() * 14) + 6;
            message.reply(`you were the last person to talk for ${chatContestTime} minutes, and you won ${gold} gold <:r_gold:401414686651711498> for succesfully killing chat! Hooray :tada:`);
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

function randomNick() {
    switch (Math.floor(Math.random() * 3)) {
        case 0:
            return nicknames[Math.floor(Math.random() * nicknames.length)] + ' ' + nicknames[Math.floor(Math.random() * nicknames.length)];
        case 1:
            return nicknames[Math.floor(Math.random() * nicknames.length)] + ' the ' + adjectives[Math.floor(Math.random() * adjectives.length)];
        case 2:
            return adjectives[Math.floor(Math.random() * adjectives.length)] + ' ' + nicknames[Math.floor(Math.random() * nicknames.length)];
    }
}

const nicknames = ['Dolphin', 'Squirrel', 'Quokka', 'Watermelon', 'Goose', 'Bruiser', 'Princess', 'Flyby', 'Spicy', 'Stitch', 'Butternut', 'Chip', 'Biscuit', 'Psycho', 'Rabbit', 'Inchworm', 'Amethyst', 'Monkey', 'Chump', 'Bubble Butt', 'Lefty', 'Silly Gilly', 'Baby', 'Goblin', 'Big Mac', 'Hot Pepper', 'Bebe', 'Bub', 'Tyke', 'Buzz', 'Pork Chop', 'Snow White', 'Beauty', 'Smarty', 'Gizmo', 'Peppermint', 'Hulk', 'Skinny Minny', 'Lil Mama', 'Speedy', 'Big Guy', 'Figgy', 'Brutus', 'Cold Front', 'Papito', 'Cupcake', 'Bello', 'Amour', 'Chico', 'Itchy', 'Oompa Loompa', 'Doll', 'Lion', 'Boo Bug', 'Grease', 'Hammer', 'Fifi', 'Kid', 'Butterfinger', 'Apple', 'Joker', 'Ghoulie', 'Donut', 'Thumper', 'Betty Boop', 'Red Velvet', 'Honey Locks', 'Butterbuns', 'Dum Dum', 'Admiral', 'Tarzan', 'Slick', 'Tickles', 'Cindy Lou Who', 'Ace', 'Colonel', 'Prego', 'Candycane', 'Mustache', 'Fatty', 'Tata', 'Bandit', 'Amigo', 'Apple Jack', 'Fun Dip', 'Gingersnap', 'Snuggles', 'Dirt', 'Frauline', 'Kirby', 'Big Nasty', 'Miss Piggy', 'Kitty', 'Chubs', '4-Wheel', 'Buck', 'Matey', 'Twix', 'Einstein', 'Mountain', 'Elf', 'Gummy Pop', 'Dork', 'Backbone', 'Cookie', 'Chiquita', 'Little Bear', 'Big Bird', 'Bessie', 'Cumulus', 'Honeybun', 'Baby Bird', 'Rosie', 'Bubbles', 'Cheddar', 'Mouse', 'Halfmast', 'Focker', 'Pickles', 'Dulce', 'Shnookie', 'Grumpy', 'Amorcita', 'Raisin', 'Romeo', 'Doobie', 'Guapo', 'Moose', 'Winnie', 'Sunshine', 'Lulu', 'Numbers', 'Stud', 'Dummy', 'Double Double', 'Janitor', 'Bumblebee', 'Amore', 'Rubber', 'Bambi', 'Gummi Bear', 'Turtle', 'Dinosaur', 'Senorita', 'Heisenberg', 'Dino', 'Hawk', 'Lovey', 'Creedence', 'Rumplestiltskin', 'Juicy', 'Piggy', 'Homer', 'Sweety', 'Mistress', 'Chuckles', 'Kitten', 'Knucklebutt', 'Ticklebutt', 'Cheese', 'Twinkie', 'Rapunzel', 'Dracula', 'Amor', 'Golden Graham', 'Chicken Wing', 'Buds', 'Mini Skirt', 'DJ', 'Luna', 'Boo', 'Righty', 'Squirt', 'Honey Pie', 'MomBod', 'Smoochie', 'Toots', 'Marshmallow', 'Rufio', 'Dorito', 'Mad Max', 'Turkey', 'Ducky', 'Red Hot', 'Braveheart', 'Autumn', 'Dearey', 'Weiner', 'Dragonfly', 'Silly Sally', 'Cold Brew', 'Jet', 'Captain Crunch', 'Bossy', 'Chain', 'Beef', 'Candy', 'Foxy Lady', 'Chance', 'Butter', 'Swiss Miss', 'Weirdo', 'Cheeky', 'Cinnamon', 'Shuttershy', 'Pintsize', 'Bunny Rabbit', 'Halfling', 'Dirty Harry', 'Cowboy', 'Jackrabbit', 'Goonie', 'Amiga', 'Terminator', 'Toodles', 'Amazon', 'Crumbles', 'Cookie Dough', 'Pearl', 'Cutie', 'Fido', 'Thor', 'Sleeping Beauty', 'Dilly Dally', 'Cricket', 'Ice Queen', 'Pookie', 'Chickie', 'Queen Bee', 'Harry Potter', 'Maestro', 'Birdy', 'Teeny', 'Pansy', 'Boo Boo', 'Rockette', 'Popeye', 'Rambo', 'Babs', 'Doc', 'Cello', 'Pickle', 'Mr. Clean', 'Ladybug', 'Schnookums', 'Champ', 'Sport', 'Red', 'Beanpole', 'Dottie', 'Highbeam', 'Angel', 'Pecan', 'Manatee', 'Taco', 'Short Shorts', 'Chewbacca', 'Twig', 'Sassy', 'Doofus', 'Cheesestick', 'Coach', 'Goon', 'Mini Mini', 'Captain', 'Dud', 'Senior', 'Redbull', 'Sweet Tea', 'Sherlock', 'Tiny', 'Button', 'Fattykins', 'Lobster', 'Anvil', 'Hulk', 'Friendo', 'Braniac', 'Giggles', 'Sweet \'n Sour', 'Cheerio', 'Starbuck', 'Buttercup', 'Rainbow', 'Rosebud', 'Pyscho', 'Conductor', 'Guy', 'Bellbottoms', 'Dimples', 'Snake', 'Freckles', 'Chicken Legs', 'Freak', 'Bug', 'Goldilocks', 'Twiggy', 'Ms. Congeniality', 'Snickerdoodle', 'Foxy', 'Buddy', 'Huggie', 'PB&J', 'Snickers', 'Frodo', 'Donuts', 'Marge', 'LaLa', 'Coke Zero', 'Dimpling', 'Frankfurter', 'Baldie', 'Wilma', 'Lovely', 'Doctor', 'Tater Tot', 'Catwoman', 'Queenie', 'Kit-Kat', 'Cat', 'Brown Sugar', 'Skipper', 'Peep', 'Nerd', 'Bubblegum', 'Tater', 'Loosetooth', 'Cherry', 'Darling', 'Hermione', 'Duckling', 'Babe', 'Cannoli', 'Slim', 'Pop Tart', 'Baby Boo', 'Beautiful', 'Gumdrop', 'Fun Size', 'Thunder Thighs', 'Blondie', 'Eagle', 'Peppa Pig', 'Shrinkwrap', 'Rocketfuel', 'Bumpkin', 'Diet Coke', 'Sweetums', 'Tank', 'Dragon', 'Buffalo', 'Baby Carrot', 'Buckeye', 'Gator', 'Dear', 'Junior', 'Sunny', 'Gordo', 'Punk', 'Lady', 'Bridge', 'Diesel', 'Dolly', 'Ginger', 'Ash', 'Scout', 'Flower', 'Music Man', 'Baby Cakes', 'Mimi', 'Pixie', 'Twinkly', 'Raindrop', 'Chica', 'Smudge', 'Cotton', 'Filly Fally', 'Beetle', 'Cruella', 'Bud', 'Belch', 'Snoopy', 'Pixie Stick', 'Gams', 'Piglet', 'Sassafras', 'Bootsie', 'Cheeto', 'Dot', 'Creep', 'Shorty', 'Frogger', 'Herp Derp', 'Baby Maker', 'Carrot', 'Cuddles', 'Blimpie', 'Chum', 'Half Pint', 'Azkaban', 'Cutie Pie', 'Loser', 'Master', 'String Bean', 'Genius', 'Smirk', 'Ringo', 'Boomhauer', 'Con', 'Bacon', 'Fury', 'Dearest', 'Sugar', 'Fox', 'Ami', 'Biffle', 'Bunny', 'Chili', 'Spud', 'Robin', 'Muffin', 'Twizzler', 'Bambino', 'Pinata', 'Beast', 'Skinny Jeans', 'Hot Sauce', 'Dropout', 'Daffodil', 'Chef', 'Foxy Mama', 'Buster', 'Tootsie', 'Belle', 'Wifey', 'Headlights', 'Smiley', 'Fiesta', 'Dunce', 'Barbie', 'Boo Bear', 'Bubba', 'Munchkin', 'Chief', 'Mini Me', 'Pinkie', 'Cloud', 'Pretty Lady', 'Muscles', 'Bean', 'Double Bubble', 'Drake', 'Lover', 'Dumbledore', 'Dots', 'Dreamey', 'Pig', 'Fly', 'Cottonball', 'Dingo', 'Tomcat', 'French Fry', 'Lil Girl', 'General', 'Green Giant', 'Tough Guy', 'Boomer', 'Salt', 'Frau Frau', 'Superman', 'Fellow', 'Scarlet', 'T-Dawg', 'Skunk', 'Cuddle Pig', 'Daria', 'C-Dawg', 'Sourdough', 'Pebbles', 'First Mate', 'Hubby', 'Happy', 'Midge'];
const adjectives = ['Unique', 'Nippy', 'Frequent', 'Unable', 'Abject', 'Rabid', 'Thoughtful', 'Overt', 'Obedient', 'Cluttered', 'Glistening', 'Tenuous', 'Tired', 'Sturdy', 'Technical', 'Jaded', 'Handsome', 'Dazzling', 'Wet', 'Zany', 'Shiny', 'Subsequent', 'Precious', 'Tiresome', 'Sulky', 'Overrated', 'Thin', 'Knowledgeable', 'Reminiscent', 'Gleaming', 'Simple', 'Wacky', 'Opposite', 'Absent', 'Willing', 'Redundant', 'Magical', 'Shocking', 'Goofy', 'Mad', 'Craven', 'Succinct', 'Questionable', 'Brainy', 'Second-Hand', 'Sloppy', 'Every', 'Decisive', 'High', 'Fanatical', 'Vigorous', 'Futuristic', 'Exuberant', 'Threatening', 'Wakeful', 'Cut', 'Obviously', 'Keen', 'Great', 'Unbecoming', 'Supreme', 'Secretive', 'Closed', 'Outstanding', 'Brash', 'Shut', 'Even', 'Powerful', 'Spiritual', 'Tremendous', 'Graceful', 'Envious', 'Classy', 'Protective', 'Uppity', 'Fortunate', 'Cloistered', 'Steady', 'Big', 'Absorbed', 'Unfair', 'Unaccountable', 'Thick', 'Fluttering', 'Unequaled', 'Organic', 'Useless', 'Utter', 'Elite', 'Silly', 'Rambunctious', 'Descriptive', 'Elegant', 'Quixotic', 'Attractive', 'Shaggy', 'Watery', 'Same', 'Piquant', 'Wretched', 'Competitive', 'Poor', 'Nappy', 'Real', 'Wide', 'Immense', 'Logical', 'Womanly', 'Clear', 'Jolly', 'Two', 'Bizarre', 'Sad', 'Delirious', 'Stupid', 'Sweet', 'Concerned', 'Dark', 'Fragile', 'Strong', 'Teeny', 'Internal', 'Creepy', 'Scintillating', 'Possessive', 'Hanging', 'Next', 'Fat', 'Beautiful', 'Efficacious', 'Uptight', 'Enthusiastic', 'Mean', 'Delightful', 'Third', 'Smiling', 'Narrow', 'Untidy', 'Inconclusive', 'Useful', 'Irate', 'Panoramic', 'Rainy', 'Warlike', 'Daffy', 'Humdrum', 'Various', 'Combative', 'Consistent', 'Lean', 'Valuable', 'Unadvised', 'Parsimonious', 'Likeable', 'Groovy', 'Clumsy', 'Abounding', 'Nasty', 'Ugly', 'Enthusiastic', 'Thoughtless', 'Fast', 'Honorable', 'Willing', 'Second-Hand', 'Anxious', 'Needless', 'Threatening', 'Makeshift', 'Discreet', 'Terrific', 'Exciting', 'Snotty', 'Necessary', 'Knowledgeable', 'Imported', 'Easy', 'Steadfast', 'Hypnotic', 'Fortunate', 'Disagreeable', 'Pastoral', 'Null', 'Similar', 'Sable', 'Mean', 'Quick', 'Voiceless', 'Flippant', 'Good', 'Sweet', 'Offbeat', 'Sneaky', 'Special', 'Distinct', 'Measly', 'Fanatical', 'Upbeat', 'Macabre', 'Faithful', 'Silly', 'Relieved', 'Aspiring', 'Tightfisted', 'Idiotic', 'Sordid', 'Lovely', 'Additional', 'Faulty', 'Sassy', 'Frequent', 'Tender', 'Whispering', 'Big', 'Upbeat', 'Unnatural', 'Uncovered', 'Tasteless', 'Hissing', 'Crabby', 'Clear', 'Ashamed', 'Medical', 'Hungry', 'Heavenly', 'Loving', 'Secret', 'Damaged', 'Recondite', 'Waiting', 'Well-To-Do', 'Sudden', 'Juvenile', 'Eager', 'Gentle', 'Half', 'Tense', 'Sleepy', 'Classy', 'Secretive', 'Ceaseless', 'Consistent', 'Unaccountable', 'Honorable', 'Scattered', 'Tacit', 'Literate', 'Whole', 'Stupid', 'Craven', 'Thoughtful', 'Uneven', 'Excellent', 'Callous', 'Hapless', 'Painful', 'Murky', 'Grubby', 'Mammoth', 'Holistic', 'One', 'Towering', 'Clumsy', 'Yellow', 'Mere', 'Obvious', 'Guttural', 'Obsequious', 'Idiotic', 'Trite', 'Dazzling', 'Fabulous', 'Blue', 'Zonked', 'Accidental', 'Gray', 'Sufficient', 'Decent', 'Groovy', 'Thick', 'Careless', 'Befitting', 'Kaput', 'Secretive', 'Limping', 'Domineering', 'Colorful', 'Disagreeable', 'Curved', 'Superb', 'Nine', 'Calm', 'Brash', 'Dusty', 'Yummy', 'Quizzical', 'Unsuitable', 'Square', 'Weak', 'Fast', 'Capricious', 'Married', 'Mammoth', 'Traditional', 'Magnificent', 'Imaginary', 'Detailed', 'Determined', 'Spiky', 'Ethereal', 'Hurt', 'Pleasant', 'Financial', 'Foreign', 'Delicious', 'Wretched', 'Dry', 'Venomous', 'Tiresome', 'Paltry', 'Learned', 'Lackadaisical', 'Neighborly', 'Drunk', 'Dreary', 'Outstanding', 'Nippy', 'Lovely', 'Successfully', 'Tested', 'Easy', 'Shrill', 'Craven', 'Next', 'Logical', 'Boiling', 'Cut', 'Flawless', 'Pathetic', 'Tranquil', 'Well-Groomed', 'Oceanic', 'Cynical', 'Halting', 'Exciting', 'Educated', 'Purple', 'Obnoxious', 'Instinctive', 'Eatable', 'Foreign', 'Agonizing', 'Level', 'Wandering', 'Divergent', 'Selfish', 'Crazy', 'Obvious', 'Combative', 'Narrow', 'Slippery', 'Cultural', 'Dull', 'Deep', 'Creepy', 'Threatening', 'Penitent', 'Obsequious', 'Secret', 'Smoggy', 'Recondite', 'Rural', 'Noxious', 'Sloppy', 'Normal', 'Shaky', 'Juvenile', 'Disillusioned', 'Marked', 'Pale', 'Ablaze', 'Jaded', 'Jobless', 'Vast', 'Melodic', 'Brainy', 'Wild', 'Proud', 'Misty', 'Frightened', 'Stale', 'Pushy', 'Lamentable', 'Elated', 'General', 'Physical', 'Past', 'Unlikely', 'Reasonable', 'Far', 'Ahead', 'Overjoyed', 'Grandiose', 'Premium', 'Ill-Informed', 'Aberrant', 'Sturdy', 'Superb', 'Uppity', 'Disturbed', 'Pastoral', 'Spiteful', 'Fretful', 'Huge', 'Quirky', 'Unhappy', 'Bawdy', 'Electrical', 'Didactic', 'Well-To-Do', 'Outstanding', 'Quack', 'Deadpan', 'Habitual', 'Gigantic', 'Puny', 'Guarded', 'Thick', 'Frantic', 'Tender', 'Demonic', 'Attractive', 'Maniacal', 'Purring', 'Possessive', 'Tasteless', 'Imaginary', 'Vague', 'Impressive', 'Ruddy', 'Warlike', 'Blushing', 'Nostalgic', 'Simple', 'Adaptable', 'Trashy', 'Friendly', 'Trite', 'Tranquil', 'Brave'];