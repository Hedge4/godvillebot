const logger = require('../../features/logging.js');

async function toggleMentions(message, userData) {
    const userDoc = await userData.get();
    const User = {};
    if(userDoc.data()[message.author.id] === undefined) {
        User[message.author.id] = {
            godpower: 0,
            gold: 0,
            total_godpower: 0,
            level: 0,
            mention: false,
        };
        User[message.author.id].last_username = message.author.tag;
        await userData.set(User, { merge: true });
        logger.log(`${message.author.tag} disabled mentions for level-ups.`);
        return message.reply('Successfully disabled mentioning for level-ups!');
    } else {
        User[message.author.id] = userDoc.data()[message.author.id];
        if (User[message.author.id].mention === false) {
            User[message.author.id].mention = true;
            await userData.set(User, { merge: true });
            logger.log(`${message.author.tag} enabled mentions for level-ups.`);
            return message.reply('Successfully enabled mentioning for level-ups!');
        } else {
            User[message.author.id].mention = false;
            await userData.set(User, { merge: true });
            logger.log(`${message.author.tag} disabled mentions for level-ups.`);
            return message.reply('Successfully disabled mentioning for level-ups!');
        }
    }
}

module.exports = toggleMentions;