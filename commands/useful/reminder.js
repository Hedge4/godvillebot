const { channels, botName } = require('../../configurations/config.json');
const { EmbedBuilder } = require('discord.js');
const getters = require('../../index');
const logger = require('../features/logging');
const scheduler = require('../features/scheduler');


function create(message, content) {
    // const delayRegex = /([0-9]+)\s*([a-z]+)/i;
    // matches at least one, but possibly two integers with a unit of time
    const delayRegex = /^([0-9]+)\s*([a-z]+)\s*(?:([0-9]+)\s*([a-z]+))?/i;
    const regexRes = delayRegex.exec(content);
    if (!regexRes) {
        message.reply('That\'s not the correct syntax you dumdum! Use a whole number and a regular unit of time.'
            + ' Also, fractions suck so don\'t expect me to deal with them.');
        return;
    }

    content = content.slice(regexRes.index + regexRes[0].length).trim();
    if (!content.length) content = 'Empty reminder.';
    if (content.length > 500) {
        message.reply('I only accept reminders of up to 500 characters, try again you marshmallow.');
        return;
    }

    let amount = regexRes[1];
    let unit = regexRes[2].toLowerCase();
    let convertedAmount = getDelay(amount, unit);

    // check if the result is valid
    if (convertedAmount !== 0 && !convertedAmount) {
        message.reply('The unit you specified wasn\'t recognised, use a normal unit of time.');
        return;
    }
    if (isNaN(convertedAmount)) {
        message.reply('Your delay evaluated to NaN, which means that you probably gave some insane or funky input.');
        return;
    }

    // if another time and unit were specified, evaluate those as well
    let extraDelay;
    if (regexRes[3] && regexRes[4]) {
        amount = regexRes[3];
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
    if (extraDelay) convertedAmount += extraDelay;

    const maxDelay = getDelay(2, 'y');
    if (convertedAmount > maxDelay) {
        message.reply('You can\'t schedule a reminder past 2 years in the future.');
        return;
    }

    const thenTimestamp = Date.now() + convertedAmount;
    const secondTimestamp = ~~(thenTimestamp / 1000);
    const thenDate = new Date(thenTimestamp);

    scheduler.create({
        type: 'reminder',
        timestamp: thenTimestamp,
        authorId: message.author.id,
        authorName: message.author.tag,
        messageUrl: message.url,
        content: content,
    }).then((reminderId) => {
        logger.toConsole(`Created a reminder with id ${reminderId} for ${message.author.tag} in ${message.channel.name}, scheduled for ${thenDate.toUTCString()}.`);
        logger.toChannel(`Created a reminder with id ${reminderId} for ${message.author.tag} in ${message.channel.name}, scheduled <t:${secondTimestamp}:R>, at <t:${secondTimestamp}:F>.`);
        const client = getters.getClient();
        message.channel.send({
            embeds: [new EmbedBuilder({
                title: 'Succesfully scheduled reminder :white_check_mark:',
                description: `I will remind you <t:${secondTimestamp}:R>, at <t:${secondTimestamp}:F>.`,
                footer: { text: `${botName} is brought to you by Wawajabba`, iconURL: client.user.avatarURL() },
            }).setColor('Aqua').setTimestamp()],
        });
    }).catch(error => {
        logger.log(`Error creating reminder for ${message.author.tag} in ${message.channel.name}: ${error}`);
        message.reply('Something went wrong while scheduling your reminder...\n' + error);
    });
}

async function sendReminder(reminder) {
    const client = getters.getClient();
    const embed = new EmbedBuilder({
        title: 'Reminder',
        url: reminder.messageUrl,
        description: reminder.content,
        footer: { text: `${botName} is brought to you by Wawajabba`, iconURL: client.user.avatarURL() },
    }).setColor('Aqua').setTimestamp();

    const user = await client.users.fetch(reminder.authorId);
    let failMessage;
    if (!user) {
        failMessage = `Couldn't find user ${reminder.authorName}!`;
    } else {
        const dmChannel = await user.createDM(true);
        if (!dmChannel) {
            failMessage = `Couldn't create DM channel with user ${reminder.authorName}!`;
        } else {
            try {
                await dmChannel.send({ embeds: [embed] });
                return logger.log(`Sent a reminder to ${user.tag}.`); // return on success
            } catch (error) {
                failMessage = `Couldn't send DM to ${reminder.authorName}: ` + error.toString();
            }
        }
    }

    // apparently we failed, so we now try to send the reminder to the botville channel
    const channel = await client.channels.fetch(channels.botville);
    if (!channel) {
        failMessage += ' Also failed to send reminder to botville, channel couldn\'t be fetched.';
    } else {
        try {
            await channel.send({ content: failMessage, embeds: [embed] });
            return logger.log(`Sent reminder in botville instead of DMs, because: ${failMessage}`); // return on success
        } catch (error) {
            failMessage += ' Also: ' + error.toString();
        }
    }
    return logger.log(`Failed to send reminder in DM or botville, reason: ${failMessage}\nOriginal URL: ${reminder.messageUrl}`);
}

function getDelay(amount, unit) {
    amount = parseInt(amount); // no need to use isNaN() since the regex only picks up numbers

    if (['ms', 'millisecond', 'milliseconds'].includes(unit)) {
        return amount;
    } else if (['s', 'sec', 'secs', 'second', 'seconds'].includes(unit)) {
        return amount * 1000;
    } else if (['m', 'min', 'mins', 'minute', 'minutes'].includes(unit)) {
        return amount * 60 * 1000;
    } else if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(unit)) {
        return amount * 60 * 60 * 1000;
    }

    // this is basically one big else statement because ms/s/m/h returns
    // this extra code is because years/months don't always have the same amount of days

    const now = new Date();
    let y = now.getUTCFullYear();
    let m = now.getUTCMonth();
    let d = now.getUTCDate();
    const h = now.getUTCHours();
    const min = now.getUTCMinutes();
    const s = now.getUTCSeconds();

    let validUnit = false;
    if (['y', 'year', 'years'].includes(unit)) {
        y += amount; validUnit = true;
    } else if (['month', 'months'].includes(unit)) {
        m += amount; validUnit = true;
    } else if (['w', 'week', 'weeks'].includes(unit)) {
        d += amount * 7; validUnit = true;
    } else if (['d', 'day', 'days'].includes(unit)) {
        d += amount; validUnit = true;
    }

    if (!validUnit) {
        return false;
    }

    // fuck timezones
    const then = new Date(Date.UTC(y, m, d, h, min, s));

    return then - now;
}


exports.create = create;
exports.send = sendReminder;