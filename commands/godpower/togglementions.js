const { logs } = require('../../configurations/config.json');

async function toggleMentions(message, userData, client) {
    const userDoc = await userData.get();
    const User = {};
    const logsChannel = client.channels.cache.get(logs);
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
        console.log(`${message.author.tag} disabled mentions for level-ups.`);
        logsChannel.send(`${message.author.tag} disabled mentions for level-ups.`);
        return message.reply('succesfully disabled mentioning for level-ups!');
    } else {
        User[message.author.id] = userDoc.data()[message.author.id];
        if (User[message.author.id].mention === false) {
            User[message.author.id].mention = true;
            await userData.set(User, { merge: true });
            console.log(`${message.author.tag} enabled mentions for level-ups.`);
            logsChannel.send(`${message.author.tag} enabled mentions for level-ups.`);
            return message.reply('succesfully enabled mentioning for level-ups!');
        } else {
            User[message.author.id].mention = false;
            await userData.set(User, { merge: true });
            console.log(`${message.author.tag} disabled mentions for level-ups.`);
            logsChannel.send(`${message.author.tag} disabled mentions for level-ups.`);
            return message.reply('succesfully disabled mentioning for level-ups!');
        }
    }
}

module.exports = toggleMentions;