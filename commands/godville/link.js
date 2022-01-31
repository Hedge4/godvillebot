const { prefix, logs, commandChannels, botvilleChannel } = require('../../configurations/config.json');

function link_profile(message, link, godData, client) {
    if (!commandChannels.includes(message.channel.id)) {
        return message.reply(`Please only use this command in <#${botvilleChannel}> to avoid spam.`);
    }
    const logsChannel = client.channels.cache.get(logs);

    // we keep/make the link encoded if the user gave us a link to their page, and not the name
    if (link.startsWith('https://godvillegame.com/gods/')) {
        const godName = decodeURI(link.slice(30)); // god name doesn't need to be encoded, also for counting characters
        // need to reset link like this in case the name part of link was already encoded, % will become %25 when encoded again
        link = 'https://godvillegame.com/gods/' + encodeURI(godName);
        console.log(`${message.author.tag} tried to link their account to '${link}'.`);
        logsChannel.send(`${message.author.tag} tried to link their account to '<${link}>'.`);

        // test if god name meets Godville naming requirements
        if (/^[A-Z][a-zA-Z0-9- ]{2,29}$/.test(godName)) {
            const user = {};
            user[message.author.id] = link;
            godData.set(user, { merge: true });
            return message.reply(`I have set or updated the link to your Godville account to <${link}>. Check it out with \`${prefix}profile\`!`);
        } else {
            return message.reply(`The start of your link seems correct, but '${godName}' doesn't look like a correct god name.`
            + ' God names start with a capital letter, and can only contain letters, numbers, hyphens and spaces. Using %20 to encode spaces is okay too.');
        }

    // if user didn't send in a valid link, we decode the link because it is the god name (and we want to count characters)
    } else {
        // this is the god name, so we don't need a separate godName variable this time
        // we also can't double encode, so because we use encodeURI() later, we need to decodeURI() now
        link = decodeURI(link);
        console.log(`${message.author.tag} tried to link their account to '${link}'.`);
        logsChannel.send(`${message.author.tag} tried to link their account to '${link}'.`);

        // test if god name meets Godville naming requirements
        if (/^[A-Z][a-zA-Z0-9- ]{2,29}$/.test(link)) {
            message.reply(`'${link}' looks like a god name. I have set or updated the link to your Godville account. Check it out with \`${prefix}profile\`!`);
            link = 'https://godvillegame.com/gods/' + encodeURI(link); // if valid name we encode spaces again into %20
            const user = {};
            user[message.author.id] = link;
            godData.set(user, { merge: true });
            return;
        } else {
            return message.reply(`Your link doesn't start with '<https://godvillegame.com/gods/>' or you made a typo in your god name: "${link}".`
            + '\nPlease format the link exactly like this:\n\'<https://godvillegame.com/gods/YOUR-GOD-NAME>\''
            + '\n\nGod names start with a capital letter, and can only contain letters, numbers, hyphens and spaces. Using %20 to encode spaces is okay too.');
        }
    }
}

module.exports = link_profile;