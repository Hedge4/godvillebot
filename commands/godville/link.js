const { prefix, logs, commandChannels, botvilleChannel } = require('../../configurations/config.json');

function link_profile(message, link, godData, client) {
    if (!commandChannels.includes(message.channel.id)) {
        return message.reply(`please only use this command in <#${botvilleChannel}> to avoid spam.`);
    }

    link = link.replace(/%20/g, ' ');
    const logsChannel = client.channels.cache.get(logs);
    console.log(`${message.author.tag} tried to link their account to '${link}'.`);
    logsChannel.send(`${message.author.tag} tried to link their account to '${link}'.`);
    if (link.startsWith('https://godvillegame.com/gods/')) {
        if (/^[A-Z][a-zA-Z0-9- ]{2,29}$/.test(link.slice(30))) {
            link = link.replace(/ /g, '%20');
            const user = {};
            user[message.author.id] = link;
            godData.set(user, { merge: true });
            return message.reply(`I have set or updated the link to your Godville account. Check it out with \`${prefix}profile\`!`);
        } else {
            message.reply(`The start of your link seems correct, but '${link.slice(30)}' doesn't look like a correct god name.`);
            return message.channel.send('God names start with a capital letter, and can only contain letters, numbers, hyphens and spaces. Using %20 to encode spaces is okay too.');
        }
    } else if (/^[A-Z][a-zA-Z0-9- ]{2,29}$/.test(link)) {
        message.reply(`'${link}' looks like a god name. I have set or updated the link to your Godville account. Check it out with \`${prefix}profile\`!`);
        link = 'https://godvillegame.com/gods/' + link.replace(/ /g, '%20');
        const user = {};
        user[message.author.id] = link;
        godData.set(user, { merge: true });
        return;
    } else {
        message.reply(`your link doesn't start with '<https://godvillegame.com/gods/>' or you made a typo in your god name: "${link}".`);
        message.channel.send('Please format the link exactly like this:\n\'<https://godvillegame.com/gods/YOUR-GOD-NAME>\'');
        return message.channel.send('God names start with a capital letter, and can only contain letters, numbers, hyphens and spaces. Using %20 to encode spaces is okay too.');
    }
}

module.exports = link_profile;