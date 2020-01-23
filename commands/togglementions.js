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
        message.reply('succesfully disabled mentioning for level-ups!');
    // eslint-disable-next-line brace-style
    } else {
        User[message.author.id] = userDoc.data()[message.author.id];
        if (User[message.author.id].mention === false) {
            User[message.author.id].mention = true;
            await userData.set(User, { merge: true });
            message.reply('succesfully enabled mentioning for level-ups!');
        } else {
            User[message.author.id].mention = false;
            await userData.set(User, { merge: true });
            message.reply('succesfully disabled mentioning for level-ups!');
        }
    }
}

exports.toggleMentions = toggleMentions;