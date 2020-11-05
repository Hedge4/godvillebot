const { logs } = require('../configurations/config.json');

async function displayGold(message, userData, Discord, client) {

    let user = message.mentions.users.first();
    if (!user) {
        if (message.content.length >= 7) {
            let username = message.content.slice(6).trim();
            if (message.content.includes('#')) {
                const args = username.split('#');
                username = args[0];
                const discriminator = args[1].slice(0, 4);
                user = client.users.find(foundUser => foundUser.tag == (username + '#' + discriminator));
            } else {
                user = client.users.find(foundUser => foundUser.username == username);
            }
            if (!user) {
                message.reply('mention a valid user or use a valid username!');
                return;
            }
        } else {
            user = message.author;
        }
    }

    let author = user.tag;
    const userDoc = await userData.get();
    const User = {};
    if(userDoc.data()[user.id] === undefined) {
        User[user.id] = {
            godpower: 0,
            total_godpower: 0,
            level: 0,
            gold: 0,
        };
        User[user.id].last_username = author;
        await userData.set(User, { merge: true });
    } else {
        User[user.id] = userDoc.data()[user.id];
    }

    const nickname = message.guild.member(user) ? message.guild.member(user).displayName : null;
    if (nickname !== user.username) {
        author = author + ' / ' + nickname;
    }

    const goldEmbed = new Discord.MessageEmbed()
    .setAuthor(author)
    .setColor('ffd700')
    .addField('Gold <:stat_gold:401414686651711498>', User[user.id].gold, true)
    .setThumbnail(user.displayAvatarURL());

    const logsChannel = client.channels.cache.get(logs);
    console.log(`${message.author.tag} requested the gold amount for ${user.tag}.`);
    logsChannel.send(`${message.author.tag} requested the gold amount for ${user.tag}.`);
    message.channel.send(goldEmbed);
}

exports.displayGold = displayGold;