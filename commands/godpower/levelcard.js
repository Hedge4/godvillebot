const { logs } = require('../../configurations/config.json');
const getUsers = require('../features/getUsers');

async function displayLevel(message, userData, Discord, client) {

    let user;
    if (message.content.length > 7) {
        const username = message.content.slice(7).trim();
        user = getUsers.One(username, client);
        if (!user) {
            return message.reply('mention a valid user or use a valid username/ID!');
        }
    } else {
        user = message.author;
    }

    let rank = '';
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

    if (User[user.id].total_godpower <= 0) {rank = 'Unranked';}
    if (rank !== 'Unranked') {rank = await getOwnRanking(user.id, userDoc.data());}
    const curGodpower = User[user.id].godpower;
    const curLevel = User[user.id].level;
    let reqGodpower = Math.floor(100 * 1.2 ** (curLevel ** (4 / 5)));
    if (curLevel >= 50) reqGodpower = 6666;
    const nextLevel = curLevel + 1;
    const difference = reqGodpower - curGodpower;
    const nickname = message.guild.member(user) ? message.guild.member(user).displayName : null;
    if (nickname !== user.username) {
        author = author + ' / ' + nickname;
    }

    const lvlEmbed = new Discord.MessageEmbed()
    .setAuthor(author)
    .setColor('32cd32')
    .addField('Level', curLevel, true)
    .addField('Godpower <:stat_godpower:401412765232660492>', curGodpower, true)
    .addField('Total godpower', User[user.id].total_godpower, true)
    .addField('Rank', rank, true)
    .setFooter({ text: `${difference} godpower needed for level ${nextLevel}.`, iconURL: user.displayAvatarURL() });

    const logsChannel = client.channels.cache.get(logs);
    console.log(`${message.author.tag} requested the level card for ${user.tag}.`);
    logsChannel.send(`${message.author.tag} requested the level card for ${user.tag}.`);
    message.channel.send(lvlEmbed);
}

async function getOwnRanking(userID, userDocData) {
    const sortable = [];
    for (const ID in userDocData) {
        sortable.push([ID, userDocData[ID].total_godpower]);
    }
    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });
    const rank = sortable.findIndex((element) => element[0] === userID);
    if (rank === -1) {return 'Not found';}
    return rank;
}

module.exports = displayLevel;