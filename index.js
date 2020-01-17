const Discord = require('discord.js');
const { prefix, token, owner, server, bot_id, no_xp_channels, levelup_channel, command_channels, no_xp_prefixes, cdSeconds } = require('./config.json');
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

/*db.collection('data').get()
  .then((snapshot) => {
    snapshot.forEach((doc) => {
      console.log(doc.id, '=>', doc.data());
    });
  })
  .catch((err) => {
    console.log('Error getting documents', err);
  });

async function test() {
    let a = await userData.get();
    let b = a.data();
    console.log(b);
}
test()*/

client.on('ready', () => {
    const currentDate = new Date();
    console.log('\n' + currentDate + ` - Logged in as ${client.user.tag}!`);
    console.log('Logged in to the following guilds: ' + client.guilds.array().sort() + '\n');
    client.user.setActivity(`${prefix}level` + ' | Still testing! - by Wawajabba');
    if (totalGodpower === undefined) {
        totalGodpower = 0;
    }
    client.channels.get(levelup_channel).send('<@346301339548123136>, succesfully restarted!');
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
                if (message.content.toLowerCase().startsWith(`${prefix}gold`)) {
                    displayGold(message);
                }
            }
        }
    }
});

async function giveGodpower(message) {
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

    let userDoc = await userData.get();
    let User = {};
    let godpowerAdd = Math.floor(Math.random() * 5) + 3;
    if(userDoc.data()[message.author.id] === undefined) {
        User[message.author.id] = {
            godpower: 0,
            total_godpower: 0,
            level: 0
        }
        User[message.author.id].last_username = message.author.username+'#'+message.author.discriminator;
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
            .setFooter(`You'll need ${newNextLevel} godpower for level ${newLevel}.`, message.author.displayAvatarURL);
        client.channels.get(levelup_channel).send("Congratulations on reaching level "+User[message.author.id].level+', '+message.author+"!");
        client.channels.get(levelup_channel).send(lvlUpEmbed);
    }

    User[message.author.id].last_username = message.author.username+'#'+message.author.discriminator;
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

    let author = user.username+'#'+user.discriminator
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
    .addField("Total godpower", User[user.id].total_godpower, false)
    .addField("Rank", 'This hasn\'t been added yet.', true)
    .setFooter(`${difference} godpower needed for level ${nextLevel}.`, user.displayAvatarURL);

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

    let author = user.username+'#'+user.discriminator
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

    message.channel.send(goldEmbed);
}

client.login(token)