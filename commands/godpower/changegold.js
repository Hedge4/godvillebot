const { botOwners } = require('../../configurations/config.json');
const logger = require('../features/logging');
const getUsers = require('../features/getUsers');


async function main(message, content, userData) {
    if (!Object.values(botOwners).includes(message.author.id)) {
        message.reply('This command is for bot owners only.');
        return;
    }

    let mode = Modes.Undefined;
    const cmd = message.content.split(' ')[0];
    if (cmd.includes('add') || cmd.includes('ag')) mode = Modes.Adding;
    if (cmd.includes('remove') || cmd.includes('rg')) mode = Modes.Removing;

    // this overrides modes set based on the command used
    if (content.startsWith('+')) {
        mode = Modes.Adding;
        content = content.slice(1);
    }
    if (content.startsWith('-')) {
        mode = Modes.Removing;
        content = content.slice(1);
    }
    // if no mode is set yet the default is adding
    if (mode === Modes.Undefined) {
        mode = Modes.Adding;
    }

    content = content.split(' ');

    if (!content[1] || !content[0].length || !content[1].length) {
        message.reply('You need to specify an amount of gold to add/remove and a target user.');
        return;
    }

    let goldAdd;
    try {
        goldAdd = parseInt(content[0]);
        if (isNaN(goldAdd)) throw(content[0] + ' isn\'t a number.');
    } catch (error) {
        message.reply('Error in the number you gave: ' + error);
        return;
    }

    const user = getUsers.One(content[1]);
    if (!user) {
        message.reply('Mention a valid user or use a valid username/ID!');
        return;
    }

    const userDoc = await userData.get();
    const User = {};
    if (userDoc.data()[user.id] === undefined) {
        User[user.id] = {
            godpower: 0,
            gold: 0,
            total_godpower: 0,
            level: 0,
        }; // last_username is set later, but is also part of a User object
    } else {
        User[user.id] = userDoc.data()[user.id];
    }
    const oldGold = User[user.id].gold;
    // mode is -1 for removing so multiplying makes the number negative (and does nothing for adding)
    const newGold = Math.floor(oldGold + goldAdd * mode);
    User[user.id].gold = newGold;
    User[user.id].last_username = user.tag;
    userData.set(User, { merge: true });

    if (mode === Modes.Adding) {
        message.channel.send(`<:stat_gold:401414686651711498> <@${user.id}> Your gold was increased by **${goldAdd}** gold. You now have **${newGold}** gold.`);
        logger.log(`${message.author.tag} increased the gold of ${user.tag} with ${goldAdd}. Gold: ${oldGold} -> ${newGold}.`);
    } else {
        message.channel.send(`<:stat_gold:401414686651711498> <@${user.id}> Your gold was decreased by **${goldAdd}** gold. You now have **${newGold}** gold.`);
        logger.log(`${message.author.tag} decreased the gold of ${user.tag} with ${goldAdd}. Gold: ${oldGold} -> ${newGold}.`);
    }
}

// we use this as an enum
const Modes = Object.freeze({
    Undefined: 0,
    Adding: 1,
    Removing: -1,
});

module.exports = main;
