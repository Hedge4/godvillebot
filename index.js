const Discord = require('discord.js');
const { prefix, token, owner, server, bot_id, no_xp_channels, levelup_channel, command_channels, no_xp_prefixes, cdSeconds, xp_blocked, bot_blocked } = require('./config.json');
const client = new Discord.Client();
let godpowerCooldown = new Set();

const admin = require('firebase-admin')
let serviceAccount = require('./serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
let db = admin.firestore();
const userData = db.collection('data').doc('users');
let totalGodpower = 0;
let getDoc = userData.get()
    .then (doc => {
        totalGodpower = doc.data()[1]}
    );

client.on('ready', () => {
    const currentDate = new Date();
    console.log('\n' + currentDate + ` - Logged in as ${client.user.tag}!`);
    console.log('Logged in to the following guilds: ' + client.guilds.array().sort());
    client.channels.forEach((channel) => {
//        console.log(` -- "${channel.name}" (${channel.type}) - ${channel.id}`)
        if (channel.id === "313450639583739904") {
            console.log(`Logged in to ${channel.name} as well *smirk* - Channel ID: ${channel.id}\n`)
//            channel.send('something');
        }
    })
    client.user.setActivity(`${prefix}level` + ' | Still testing! - by Wawajabba');
    if (totalGodpower === undefined) {
        totalGodpower = 0;
    }
    client.channels.get(levelup_channel).send('<@346301339548123136>, succesfully restarted!');
});

client.on('message', message => {
    if (message.author.bot) {return}
    if (bot_blocked.includes(message.author.id)) {return}

    if (message.channel.id === "313450639583739904") {
        console.log(message.content);
    }

    if (message.channel.type === 'dm') {
        if (message.author.id !== bot_id) {
            console.log('A DM was sent to the bot by \'' + message.author.tag + '/' + message.author.id + '\'. The content was: \'' + message.content + '\'');
        }
    } else if (message.guild.id === server) {
        if (message.author.id != bot_id) {
            if (!no_xp_channels.includes(message.channel.id)) {
                giveGodpower(message);
            }
            if (command_channels.includes(message.channel.id)) {
                if (message.content.toLowerCase().startsWith(`${prefix}level`)) {
                    displayLevel(message);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}gold`)) {
                    displayGold(message);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}toggle-mentions`)) {
                    switchMentionSetting(message);
                }
                if (message.content.toLowerCase().startsWith(`${prefix}ranking`)) {
                    getRanking(message);
                }
            }
        }
    }
});

async function switchMentionSetting(message) {
    let userDoc = await userData.get();
    let User = {};
    if(userDoc.data()[message.author.id] === undefined) {
        User[message.author.id] = {
            godpower: 0,
            gold: 0,
            total_godpower: 0,
            level: 0,
            mention: false
        }
        User[message.author.id].last_username = message.author.tag;
        await userData.set(User, {merge: true});
        message.reply('succesfully disabled mentioning for level-ups!')
    } else {
        User[message.author.id] = userDoc.data()[message.author.id];
        if (User[message.author.id].mention === false) {
            User[message.author.id].mention = true;
            await userData.set(User, {merge: true});
            message.reply('succesfully enabled mentioning for level-ups!')
        } else {
            User[message.author.id].mention = false;
            await userData.set(User, {merge: true});
            message.reply('succesfully disabled mentioning for level-ups!')
        }
    }
}

async function giveGodpower(message) {
    let spam = 0;

    if (xp_blocked.includes(message.author.id)) {return}

    no_xp_prefixes.forEach(element => {
        if (message.content.startsWith(element)) {spam = 1}
    });

    if (message.content.length < 7) {spam = 1}

    if (message.content.trim().match(/(<:([^:]+):([0-9]{18})>([ ]*))+/)) {spam = 1}
    
    if (godpowerCooldown.has(message.author.id)) {spam = 1}

    if (spam === 1) {
        return;
    }

    let userDoc = await userData.get();
    let User = {};
    let godpowerAdd = Math.floor(Math.random() * 5) + 3;
    if(userDoc.data()[message.author.id] === undefined) {
        User[message.author.id] = {
            godpower: 0,
            gold: 0,
            total_godpower: 0,
            level: 0
        }
        User[message.author.id].last_username = message.author.tag;
        await userData.set(User, {merge: true});
    } else {
        User[message.author.id] = userDoc.data()[message.author.id];
    }

    console.log(godpowerAdd+' godpower added for user '+message.author.tag+' in channel '+message.channel.name);
    godpowerCooldown.add(message.author.id);

    let curGodpower = User[message.author.id].godpower;
    let curLevel = User[message.author.id].level;
    let nextLevel = Math.floor(100*1.2**(curLevel**(4/5)));
    let newGodpower = curGodpower + godpowerAdd;
    User[message.author.id].godpower = newGodpower;
    User[message.author.id].total_godpower = User[message.author.id].total_godpower + godpowerAdd;
    totalGodpower = totalGodpower + godpowerAdd;

    if (nextLevel <= newGodpower) {
        console.log('User '+message.author.tag+' levelled up from level '+curLevel+' to level '+eval(curLevel + 1));
        let goldAdd = Math.floor(100*(Math.sqrt(curLevel + 1)))
        User[message.author.id].godpower = newGodpower - nextLevel;
        User[message.author.id].level = curLevel + 1;
        User[message.author.id].gold = User[message.author.id].gold + goldAdd;
        let newLevel = curLevel + 2;
        let newNextLevel = Math.floor(100*1.2**((curLevel+1)**(4/5)));
        let nickname = message.guild.member(message.author) ? message.guild.member(message.author).displayName : null;

        let lvlUpEmbed = new Discord.RichEmbed()
            .setColor('d604cf')
            .setTitle(nickname+' levelled UP! <:screen_pantheonup:441043802325778442>')
            .setDescription('You gathered '+nextLevel+' godpower <:stat_godpower:401412765232660492> and levelled up to level '+User[message.author.id].level+'! :tada: - You now have '+User[message.author.id].total_godpower+' godpower total.')
            .addField("Gold rewarded", `You earned ${goldAdd} <:stat_gold:401414686651711498> for reaching level `+User[message.author.id].level+'. You now have '+User[message.author.id].gold+' gold total.')
            .setFooter(`You'll need ${newNextLevel} godpower for level ${newLevel}. Use ${prefix}toggle-mentions to enable/disable being mentioned on level-up.`, message.author.displayAvatarURL);
        if (User[message.author.id].mention !== false) { client.channels.get(levelup_channel).send("Congratulations on reaching level "+User[message.author.id].level+', '+message.author+"!")}
        client.channels.get(levelup_channel).send(lvlUpEmbed);
    }

    User[message.author.id].last_username = message.author.tag;
    userData.set(User, {merge: true});
    userData.update({1:totalGodpower});

    setTimeout(() => {
        godpowerCooldown.delete(message.author.id);
    }, cdSeconds * 1000);
}

async function displayLevel(message) {

    let user = message.mentions.users.first();
    if (!user) {
        if (message.content.length >= 7) {
            let username = message.content.slice(6).trim();
            if (message.content.includes('#')) {
                let args = username.split('#');
                username = args[0];
                let discriminator = args[1].slice(0, 4);
                user = client.users.find(user => user.tag == (username + '#' + discriminator));
            } else {
                user = client.users.find(user => user.username == username);
            }
            if (!user) {
                message.reply('mention a valid user or use a valid username!')
                return;
            }
        } else {
            user = message.author;
        }
    }

    let rank = "";
    let author = user.tag;
    let userDoc = await userData.get();
    let User = {};
    if(userDoc.data()[user.id] === undefined) {
        User[user.id] = {
            godpower: 0,
            total_godpower: 0,
            level: 0,
            gold: 0
        }
        User[user.id].last_username = author;
        await userData.set(User, {merge: true});
    } else {
        User[user.id] = userDoc.data()[user.id];
    }

    if (User[user.id].total_godpower <= 0) {rank = "Unranked"};
    if (rank !== "Unranked") {rank = await getOwnRanking(user.id, userDoc.data())};
    let curGodpower = User[user.id].godpower;
    let curLevel = User[user.id].level;
    let reqGodpower = Math.floor(100*1.2**(curLevel**(4/5)));
    let nextLevel = curLevel+1;
    let difference = reqGodpower - curGodpower;
    let nickname = message.guild.member(user) ? message.guild.member(user).displayName : null;
    if (nickname !== user.username) {
        author = author+' / '+ nickname;
    }

    let lvlEmbed = new Discord.RichEmbed()
    .setAuthor(author)
    .setColor('32cd32')
    .addField("Level", curLevel, true)
    .addField("Godpower <:stat_godpower:401412765232660492>", curGodpower, true)
    .addField("Total godpower", User[user.id].total_godpower, true)
    .addField("Rank", rank, true)
    .setFooter(`${difference} godpower needed for level ${nextLevel}.`, user.displayAvatarURL);

    console.log(`${message.author.tag} requested the level card for ${user.tag}.`)
    message.channel.send(lvlEmbed);
}

async function displayGold(message) {

    let user = message.mentions.users.first();
    if (!user) {
        if (message.content.length >= 7) {
            let username = message.content.slice(6).trim();
            if (message.content.includes('#')) {
                let args = username.split('#');
                username = args[0];
                let discriminator = args[1].slice(0, 4);
                user = client.users.find(user => user.tag == (username + '#' + discriminator));
            } else {
                user = client.users.find(user => user.username == username);
            }
            if (!user) {
                message.reply('mention a valid user or use a valid username!')
                return;
            }
        } else {
            user = message.author;
        }
    }

    let author = user.tag;
    let userDoc = await userData.get();
    let User = {};
    if(userDoc.data()[user.id] === undefined) {
        User[user.id] = {
            godpower: 0,
            total_godpower: 0,
            level: 0,
            gold: 0
        }
        User[user.id].last_username = author;
        await userData.set(User, {merge: true});
    } else {
        User[user.id] = userDoc.data()[user.id];
    }

    let nickname = message.guild.member(user) ? message.guild.member(user).displayName : null;
    if (nickname !== user.username) {
        author = author+' / '+ nickname;
    }

    let goldEmbed = new Discord.RichEmbed()
    .setAuthor(author)
    .setColor('ffd700')
    .addField("Gold <:stat_gold:401414686651711498>", User[user.id].gold, true)
    .setThumbnail(user.displayAvatarURL)

    console.log(`${message.author.tag} requested the gold amount for ${user.tag}.`)
    message.channel.send(goldEmbed);
}

async function getOwnRanking(userID, userDocData) {
    var sortable = [];
    for (var ID in userDocData) {
        sortable.push([ID, userDocData[ID].total_godpower]);
    }
    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });
    rank = sortable.findIndex((element) => element[0] === userID);
    if (rank === -1) {return "Not found"};
    return rank;
}

async function getRanking(message) {
    const args = message.content.slice(8).trim().split(' ');
    let page = 1;
    if (args.length > 1) {
        return message.reply('the correct syntax is >ranking [page].');
    }
    if (!args[0].length) {
        page = 1;
    } else {
        if (isNaN(args[0])) {
            return message.reply('the correct syntax is >ranking [page].');
        } else {
            page = Math.floor(args[0])
            if (page <= 0) {return message.reply('the lowest page number you can request is 1, dumdum.')}
        }
    }
    let userDoc = await userData.get();
    let own_ranking = false;
    if(userDoc.data()[message.author.id] !== undefined) {own_ranking = true};
    const grand_total = userDoc.data()[1];
    var sortable = [];
    for (var ID in userDoc.data()) {
        sortable.push([ID, userDoc.data()[ID].total_godpower, userDoc.data()[ID].last_username, userDoc.data()[ID].level]);
    }
    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });

    let own_rank = undefined;
    if (own_ranking === true) {
        own_rank = sortable.findIndex((element) => element[0] === message.author.id);
        if (own_rank === -1) {own_rank = "Not found"};
    }

    let index = 0;
    sortable.splice(index, 1);
    const total_users = sortable.length;
    const max_page = Math.floor((total_users / 10) + 1);
    if (page > max_page) {return message.reply(`that page doesn't exist, the highest page number is ${max_page}.`)}
    const end_index = page * 10; 
    const start_index = end_index - 10;
    const usersOnPage = sortable.slice(start_index, end_index);

    let ranking = `Total users registered: ${total_users} - Total godpower collected: ${grand_total}\n-------------------------------------------------------------\n`;
    for (let i = 0; i<usersOnPage.length; i++) {
        ranking += `Rank {${i+1+(page-1)*10}}    - "${usersOnPage[i][2]}", level ${usersOnPage[i][3]}.\n              Total godpower: ${usersOnPage[i][1]}\n`;
    }
    ranking += `------------------------------------------------\nYour rank: {${own_rank}} - Level ${userDoc.data()[message.author.id].level}, total godpower: ${userDoc.data()[message.author.id].total_godpower}`;

    message.reply("here is page "+page+" of the godpower rankings:\n```\n"+ranking+"\n```")
}

client.login(token)