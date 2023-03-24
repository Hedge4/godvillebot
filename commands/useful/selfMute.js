const { serversServed, roles, channels } = require('../../configurations/config.json');
const getters = require('../../index');
const logger = require('../features/logging');
const maxMuteHours = 8;

async function main(message, duration) {
    if (!duration || !duration.length) {
        // default mute time is 1 hour
        duration = '1h';
    }

    // matches at least one, but possibly two integers with a unit of time
    const delayRegex = /^([0-9]+)\s*([a-z]+)\s*(?:([0-9]+)\s*([a-z]+))?/i;
    const regexRes = delayRegex.exec(duration);
    if (!regexRes) {
        message.reply('That\'s not the correct syntax, use an integer and a regular unit of time.');
        return;
    }

    let amount = parseInt(regexRes[1]);
    let unit = regexRes[2].toLowerCase();

    // check if the result is valid
    let delay = getDelay(amount, unit);
    if (!delay) {
        message.reply(`I don't recognise ${unit} as a unit of time.`);
        return;
    }
    if (isNaN(delay)) {
        message.reply(`${amount} evaluates to NaN, please use a whole number.`);
        return;
    }

    // if another time and unit were specified, evaluate those as well
    let extraDelay;
    if (regexRes[3] && regexRes[4]) {
        amount = parseInt(regexRes[3]);
        unit = regexRes[4].toLowerCase();
        extraDelay = getDelay(amount, unit);

        // check the extra delay
        if (!extraDelay) {
            message.reply(`I don't recognise ${unit} as a unit of time.`);
            return;
        }
        if (isNaN(extraDelay)) {
            message.reply(`${amount} ${unit} evaluates to NaN, please use a whole number.`);
            return;
        }
    }

    // add extra delay (if defined), and check if total doesn't exceed limit
    if (extraDelay) delay += extraDelay;
    if (delay > maxMuteHours * 60 * 60 * 1000) {
        message.reply(`You can't mute yourself for longer than ${maxMuteHours} hours.`);
        return;
    }

    // convert the total delay amount back to text
    const delayText = delayToText(delay);

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
        message.reply(`Got it, I'll unmute you after ${delayText}.`);
        logger.log(`Muted ${mutee} for ${delayText}, per their own request.`);
    } catch (error) {
        message.reply('Something went wrong, and I couldn\'t mute you.');
        logger.log(`${mutee} wanted to mute themselves, but something went wrong: ` + error);
    }
}

const getDelay = (amount, unit) => {
    if (['ms', 'millisecond', 'milliseconds'].includes(unit)) {
        return (amount);
    } else if (['s', 'sec', 'secs', 'second', 'seconds'].includes(unit)) {
        return (amount * 1000);
    } else if (['m', 'min', 'mins', 'minute', 'minutes'].includes(unit)) {
        return (amount * 60 * 1000);
    } else if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(unit)) {
        return (amount * 60 * 60 * 1000);
    } else {
        return undefined;
    }
};

const delayToText = (delay) => {
    const days = ~~(delay / 86400000);
    const hours = ~~(delay % 86400000 / 3600000);
    const minutes = ~~(delay % 3600000 / 60000);
    const seconds = ~~(delay % 60000 / 1000);

    const textParts = [];
    if (days) textParts.push(`${days} ${quantiseWords(days, 'day')}`);
    if (hours) textParts.push(`${hours} ${quantiseWords(hours, 'hour')}`);
    if (minutes) textParts.push(`${minutes} ${quantiseWords(minutes, 'minute')}`);
    if (seconds) textParts.push(`${seconds} ${quantiseWords(seconds, 'second')}`);

    // join textParts such that the last item is added with 'and' instead of ', '
    if (textParts.length > 1) {
        const lastItem = textParts.pop();
        return textParts.join(', ') + ' and ' + lastItem;
    } else {
        return textParts[0];
    }
};

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;


module.exports = main;