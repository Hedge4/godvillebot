const { logs } = require('../../configurations/config.json');
const getUsers = require('../features/getUsers');

async function displayLevel(message, msgContent, userData, Discord, client) {

    let user;
    if (msgContent.length) {
        user = getUsers.One(msgContent, client);
        if (!user) {
            return message.reply('Mention a valid user or use a valid username/ID!');
        }
    } else {
        user = message.author;
    }

    let rank = '';
    let requestedUser = user.tag;
    const userDoc = await userData.get();
    const User = {};
    if(userDoc.data()[user.id] === undefined) {
        User[user.id] = {
            godpower: 0,
            total_godpower: 0,
            level: 0,
            gold: 0,
        };
        User[user.id].last_username = requestedUser;
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

    const member = await message.guild.members.fetch(user);
    if (member && member.displayName !== user.username) {
        requestedUser = requestedUser + ' / ' + member.displayName;
    }

    const lvlEmbed = new Discord.MessageEmbed()
    .setAuthor({ name: requestedUser })
    .setColor('32cd32')
    .addField('Level', curLevel.toString(), true)
    .addField('Godpower <:stat_godpower:401412765232660492>', curGodpower.toString(), true)
    .addField('Total godpower', User[user.id].total_godpower.toString(), true)
    .addField('Rank', rank.toString(), true)
    .setFooter({ text: `${difference} godpower needed for level ${nextLevel}.`, iconURL: user.displayAvatarURL() });

    const logsChannel = client.channels.cache.get(logs);
    console.log(`${message.author.tag} requested the level card for ${user.tag}.`);
    logsChannel.send(`${message.author.tag} requested the level card for ${user.tag}.`);
    message.channel.send({ embeds: [lvlEmbed] });
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