const { prefix, channels } = require('../../configurations/config.json');
const logger = require('../../features/logging.js');

function linkProfile(message, link, godData) {
    if (!Object.values(channels.commandsAllowed).includes(message.channel.id)) {
        return message.reply(`Please only use this command in <#${channels.botville}> to avoid spam.`);
    }

    // we keep/make the link encoded if the user gave us a link to their page, and not the name
    if (link.startsWith('https://godvillegame.com/gods/')) {
        const godName = link.slice(30).replace(/%20/g, ' '); // the name part can have spaces instead of %20, also for counting characters
        link = 'https://godvillegame.com/gods/' + godName.replace(/ /g, '%20'); // we want %20 instead of spaces in the actual link
        logger.toConsole(`${message.author.tag} tried to link their account to '${link}'.`);
        logger.toChannel(`${message.author.tag} tried to link their account to '<${link}>'.`);

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
        link = link.replace(/%20/g, ' ');
        logger.log(`${message.author.tag} tried to link their account to '${link}'.`);

        // test if god name meets Godville naming requirements
        if (/^[A-Z][a-zA-Z0-9- ]{2,29}$/.test(link)) {
            message.reply(`'${link}' looks like a god name. I have set or updated the link to your Godville account. Check it out with \`${prefix}profile\`!`);
            link = 'https://godvillegame.com/gods/' + link.replace(/ /g, '%20'); // if valid name we encode spaces again into %20
            const user = {};
            user[message.author.id] = link;
            godData.set(user, { merge: true });
            return;
        } else {
            return message.reply(`Your link doesn't start with '<https://godvillegame.com/gods/>' or you made a typo in your god name: "${link}".`
            + ' Please format the link exactly like this: <https://godvillegame.com/gods/YOUR%20GODNAME>'
            + '\n\nGod names start with a capital letter and contain only letters, numbers, hyphens and spaces. Using %20 to encode spaces is fine.');
        }
    }
}

module.exports = linkProfile;