const { serversServed, roles, channels } = require('../../configurations/config.json');
const getters = require('../../index');
const logger = require('../features/logging');
const maxMuteHours = 8;

async function main(message, duration) {
    if (!duration || !duration.length) {
        // default mute time is 1 hour
        duration = '1h';
    }

    // separate the delay and reminder itself
    const delayRegex = /([0-9]+)\s*([a-z]+)/i;
    const regexRes = delayRegex.exec(duration);
    if (!regexRes) {
        message.reply('That\'s not the correct syntax, use an integer and a regular unit of time.');
        return;
    }

    const amount = parseInt(regexRes[1]);
    const unit = regexRes[2].toLowerCase();
    let delay;
    let unitText;

    if (['ms', 'millisecond', 'milliseconds'].includes(unit)) {
        delay = amount;
        unitText = 'millisecond';
    } else if (['s', 'sec', 'secs', 'second', 'seconds'].includes(unit)) {
        delay = amount * 1000;
        unitText = 'second';
    } else if (['m', 'min', 'mins', 'minute', 'minutes'].includes(unit)) {
        delay = amount * 60 * 1000;
        unitText = 'minute';
    } else if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(unit)) {
        delay = amount * 60 * 60 * 1000;
        unitText = 'hour';
    }

    if (!delay) {
        message.reply(`I don't recognise ${unit} as a unit of time.`);
        return;
    }
    if (isNaN(delay)) {
        message.reply(`${amount} evaluates to NaN, please use a whole number.`);
        return;
    }
    if (delay > maxMuteHours * 60 * 60 * 1000) {
        message.reply(`You can't mute yourself for longer than ${maxMuteHours} hours.`);
        return;
    }
    unitText = quantiseWords(amount, unitText);

    const client = getters.getClient();

    // here's the muting part
    // no fetch for the servers, they should be cached upon client initialisation
    const gvServer = client.guilds.cache.get(serversServed.godvilleServer);
    const testServer = client.guilds.cache.get(serversServed.botServer);

    // members are undefined if the try clause fails
    let gvMember, botMember;
    const mutee = message.author.tag;
    try { gvMember = await gvServer.members.fetch(message.author.id); } catch (_) { /*do nothing*/ }
    try { botMember = await testServer.members.fetch(message.author.id); } catch (_) { /*do nothing*/ }
    const botville = client.channels.cache.get(channels.botville);

    try {
        if (gvMember) gvMember.roles.add(roles.mutedMainServer);
        if (botMember) botMember.roles.add(roles.mutedBotServer);
        setTimeout(() => {
            try {
                if (gvMember) gvMember.roles.remove(roles.mutedMainServer);
                if (botMember) botMember.roles.remove(roles.mutedBotServer);
                // I don't think this needs to be announced in #botville?
                logger.log(`Unmuted ${mutee}. (Mute reason: Self mute)`);
            } catch (error) {
                botville.send(`I couldn't unmute ${mutee}, someone fix please.`);
                logger.log(`Couldn't unmute ${mutee}, someone fix please.`);
            }
        }, delay);
        message.reply(`Got it, you were muted for ${amount} ${unitText}.`);
        logger.log(`Muted ${mutee} for ${amount} ${unitText}, per their own request.`);
    } catch (error) {
        message.reply('Something went wrong, and I couldn\'t mute you.');
        logger.log(`${mutee} wanted to mute themselves, but something went wrong: ` + error);
    }
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;


module.exports = main;