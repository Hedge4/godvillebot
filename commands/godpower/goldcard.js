const logger = require('../features/logging.js');
const getUsers = require('../features/getUsers.js');

async function displayGold(message, msgContent, userData, Discord, client) {

    let user;
    if (msgContent.length) {
        user = getUsers.One(msgContent, client);
        if (!user) {
            return message.reply('Mention a valid user or use a valid username/ID!');
        }
    } else {
        user = message.author;
    }

    let userName = user.tag;
    const userDoc = await userData.get();
    const User = {};
    if (userDoc.data()[user.id] === undefined) {
        User[user.id] = {
            godpower: 0,
            total_godpower: 0,
            level: 0,
            gold: 0,
        };
        User[user.id].last_username = userName;
        await userData.set(User, { merge: true });
    } else {
        User[user.id] = userDoc.data()[user.id];
    }

    const member = await message.guild.members.fetch(user);
    if (member && member.displayName !== user.username) {
        userName = userName + ' / ' + member.displayName;
    }

    const goldEmbed = new Discord.EmbedBuilder()
        .setAuthor({ name: userName })
        .setColor('ffd700')
        .addFields([{ name: 'Gold <:stat_gold:401414686651711498>', value: User[user.id].gold.toString(), inline: true }])
        .setThumbnail(user.displayAvatarURL());

    logger.log(`${message.author.tag} requested the gold amount for ${user.tag}.`);
    message.channel.send({ embeds: [goldEmbed] });
}

module.exports = displayGold;