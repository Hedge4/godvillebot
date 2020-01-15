const Discord = require('discord.js');
const { prefix, token, owner, server, bot_id, no_xp_channels, levelup_channel, command_channels, no_xp_prefixes, cdSeconds } = require('./config.json');
const client = new Discord.Client();
const fs = require('fs');
let godpower = require('./godpower.json');
let godpowerCooldown = new Set();

client.on('ready', () => {
    const currentDate = new Date();
    console.log('\n' + currentDate + ` - Logged in as ${client.user.tag}!`);
    console.log('Logged in to the following guilds: ' + client.guilds.array().sort() + '\n');
    client.user.setActivity(`${prefix}level` + ' | Still testing! - by Wawajabba');
    if(!godpower[1]) {
        godpower[1] = {
            godpower: 0,
        };
    }
});

client.on('message', message => {
    if (message.author.bot) {return}

    if (message.channel.type === 'dm') {
        if (message.author.id !== bot_id) {
            console.log('A DM was sent to the bot by \'' + message.author.username + '#' + message.author.discriminator + '\'. The content was: \'' + message.content + '\'');
        }
    } else if (message.guild.id === server) {
        if (message.author.id != bot_id) {
//            if (message.channel.id === '666856171524587527') {
            if (!no_xp_channels.includes(message.channel.id)) {
                giveGodpower(message);
            }
//            if (message.channel.id === '666856171524587527') {
            if (command_channels.includes(message.channel.id)) {
                if (message.content.toLowerCase().startsWith(`${prefix}level`)) {
                    displayLevel(message);
                }
            }
        }
    }
});

function giveGodpower(message) {
    let spam = 0;

    no_xp_prefixes.forEach(element => {
        if (message.content.startsWith(element)) {spam = 1}
    });

    if (message.content.length < 2) {
        return;
    }

    if (godpowerCooldown.has(message.author.id)) {spam = 1}

    if (spam === 1) {
        return;
    }

    let godpowerAdd = Math.floor(Math.random() * 5) + 3;
    if(!godpower[message.author.id]) {
        godpower[message.author.id] = {
            godpower: 0,
            total_godpower: 0,
            level: 0
        };
    }

    console.log(godpowerAdd+' godpower added for user '+message.author.username+' in channel '+message.channel.name)
    godpowerCooldown.add(message.author.id);

    let curGodpower = godpower[message.author.id].godpower;
    let curLevel = godpower[message.author.id].level;
    let nextLevel = Math.floor(100*1.2**(curLevel**(4/5)));
    let newGodpower = curGodpower + godpowerAdd;
    godpower[message.author.id].godpower = newGodpower;
    godpower[message.author.id].total_godpower = godpower[message.author.id].total_godpower + godpowerAdd;
    godpower[1].godpower = godpower[1].godpower + godpowerAdd;

    if (nextLevel <= newGodpower) {
        godpower[message.author.id].godpower = newGodpower - nextLevel;
        godpower[message.author.id].level = curLevel + 1;
        let newLevel = curLevel + 2;
        let newNextLevel = Math.floor(100*1.2**((curLevel+1)**(4/5)));
        let nickname = message.guild.member(message.author) ? message.guild.member(message.author).displayName : null;

        let lvlUpEmbed = new Discord.RichEmbed()
            .setColor('d604cf')
            .setTitle(nickname+' levelled UP! <:screen_pantheonup:441043802325778442>')
            .setDescription('You gathered '+nextLevel+' godpower <:stat_godpower:401412765232660492> and levelled up to level '+godpower[message.author.id].level+'! :tada:')
            .addField("Gold rewarded", 'This isn\'t implemented yet :/')
            .setFooter(`You'll need ${newNextLevel} godpower for level ${newLevel}.`, message.author.displayAvatarURL);
        client.channels.get(levelup_channel).send("Congratulations on reaching level "+godpower[message.author.id].level+', '+message.author+"!");
        client.channels.get(levelup_channel).send(lvlUpEmbed);
    }

    fs.writeFile("./godpower.json", JSON.stringify(godpower), (err) => {
        if(err) console.log(err)
    });

    setTimeout(() => {
        godpowerCooldown.delete(message.author.id);
    }, cdSeconds * 1000);
}

function displayLevel(message) {

    let user = message.mentions.users.first();
    if (!user) {
        user = message.author;
    }

    if(!godpower[user.id]) {
        godpower[user.id] = {
            godpower: 0,
            level: 0
        };
    }

    let curGodpower = godpower[user.id].godpower;
    let curLevel = godpower[user.id].level;
    let reqGodpower = Math.floor(100*1.2**(curLevel**(4/5)));
    let nextLevel = curLevel+1;
    let difference = reqGodpower - curGodpower;
    let nickname = message.guild.member(user) ? message.guild.member(user).displayName : null;
    let author = user.username+'#'+user.discriminator
    if (nickname !== user.username) {
        author = author+' / '+ nickname;
    }

    let lvlEmbed = new Discord.RichEmbed()
    .setAuthor(author)
    .setColor('32cd32')
    .addField("Level", curLevel, true)
    .addField("Godpower", curGodpower, true)
    .addField("Rank", 'This hasn\'t been added yet.', false)
    .addField("Gold", 'This hasn\'t been added yet.', true)
    .setFooter(`${difference} godpower needed for level ${nextLevel}.`, user.displayAvatarURL);

    message.channel.send(lvlEmbed);
}

client.login(token)