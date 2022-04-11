const { botvilleChannel } = require('../../configurations/config.json');
const { MessageEmbed } = require('discord.js');
const getters = require('../../index');
const logger = require('../features/logging');
const scheduler = require('../features/scheduler');


function create(message, content) {
    // separate the delay and reminder itself
    const delayRegex = /([0-9]+)\s*(\S+)/;
    const regexRes = delayRegex.exec(content);
    if (!regexRes) return message.reply('That\'s not the correct syntax you dumdum! Use a digit and a regular unit of time.');

    content = content.slice(regexRes.index + regexRes[0].length);
    if (!content.length) content = 'Empty reminder.';
    if (content.length > 500) return message.reply('Just because I\'m mean, I only accept reminders of up to 500 characters. Try again you marshmallow.');
    const amount = regexRes[1];
    const unit = regexRes[2].toLowerCase();

    const convertedAmount = getDelay(amount, unit);
    if (isNaN(convertedAmount)) return message.reply('Your delay evaluated to NaN, which means there was probably something wrong with your input.');
    if (convertedAmount > getDelay(2, 'y')) return message.reply('You can\'t schedule a reminder past 2 years in the future.');
    const thenTimestamp = new Date().getTime() + convertedAmount;
    const thenDate = new Date(thenTimestamp);

    scheduler.create({
        type: 'reminder',
        timestamp: thenTimestamp,
        authorId: message.author.id,
        authorName: message.author.tag,
        messageUrl: message.url,
        content: content,
    }).then((reminderId) => {
        logger.log(`Created a reminder with id ${reminderId} for ${message.author.tag} in ${message.channel.name}, scheduled for ${thenDate.toUTCString()}.`);
        const client = getters.getClient();
        message.channel.send({
            embeds: [new MessageEmbed({
                title: 'Succesfully scheduled reminder :white_check_mark:',
                description: `I will remind you ${thenDate.toUTCString()}.`,
                color: 'AQUA',
                footer: { text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() },
            }).setTimestamp()],
        });
    }).catch(error => {
        logger.log(`Error creating reminder for ${message.author.tag} in ${message.channel.name}: ${error}`);
        message.reply('Something went wrong while scheduling your reminder...\n' + error);
    });
}

async function sendReminder(reminder) {
    const client = getters.getClient();
    const embed = new MessageEmbed({
        title: 'Reminder',
        url: reminder.messageUrl,
        description: reminder.content,
        color: 'AQUA',
        footer: { text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() },
    }).setTimestamp();

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

    // apparently we failed, so we now try to send the reminder to the botvilleChannel
    const channel = await client.channels.fetch(botvilleChannel);
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

    if (['y', 'year', 'years'].includes(unit)) {
        y += amount;
    } else if (['month', 'months'].includes(unit)) {
        m += amount;
    } else if (['w', 'week', 'weeks'].includes(unit)) {
        d += amount * 7;
    } else if (['d', 'day', 'days'].includes(unit)) {
        d += amount;
    }

    // fuck timezones
    const then = new Date(Date.UTC(y, m, d, h, min, s));

    return then - now;
}


exports.create = create;
exports.send = sendReminder;