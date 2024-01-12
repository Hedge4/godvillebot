const { channels } = require('../../configurations/config.json');
const main = require('../../index');
const logger = require('../features/logging');
const timers = require('../features/timers');
const newspaper = require('./newspaperManager.js');

function dailyNewspaperUpdate() {
    const client = main.getClient();
    const channel = client.channels.cache.get(channels.newspaper);
    newspaper.renewAuto(channel);
    logger.log(`News: Automatically tried to renew the newspaper and send it to the ${channel.name} channel. Random number check: ${Math.floor(Math.random() * 1000)}.`);
    const delayObj = getNewspaperUpdateDelay();
    let delay = delayObj.delay;
    const logText = delayObj.logText;
    logger.toConsole(`--------------------------------------------------------\n${logText}\n--------------------------------------------------------`);
    logger.toChannel(`\`\`\`${logText}\`\`\``);
    if (delay < 1000 * 60 * 25) { // set delay to a full day if less than 25 minutes
        delay = 1000 * 60 * 60 * 24;
    }
    setTimeout(dailyNewspaperUpdate, delay);
}

function newsPing() {
    const client = main.getClient();
    const channel = client.channels.cache.get(channels.newspaper);
    channel.send('<@&677288625301356556>, don\'t forget about the bingo, crossword and accumulator!');
    logger.log(`Sent a newspaper reminder to the ${channel.name} channel. Random number check: ${Math.floor(Math.random() * 1000)}.`);
    const delayObj = getNewsPingDelay();
    let delay = delayObj.delay;
    const logText = delayObj.logText;
    logger.toConsole(`--------------------------------------------------------\n${logText}\n--------------------------------------------------------`);
    logger.toChannel(`\`\`\`\n${logText}\`\`\``);
    if (delay < 1000 * 60 * 25) { // set delay to a full day if less than 25 minutes
        delay = 1000 * 60 * 60 * 24;
    }
    setTimeout(newsPing, delay);
}

function requestNewspaperUpdateTime(message) {
    const output = timers.getDelay(22, 10);
    const then = output.goalDate;
    const delayHours = output.hoursFromNow;
    const delayMins = output.minutesFromNow;

    logger.log(`${message.author.tag} wanted to know when the newspaper will next update, which is in ${delayHours} ${quantiseWords(delayHours, 'hour')} and ${delayMins} ${quantiseWords(delayMins, 'minute')}.`);
    message.reply(`The bot's next newspaper update is scheduled for ${then.toUTCString()}, in ${delayHours} ${quantiseWords(delayHours, 'hour')} and ${delayMins} ${quantiseWords(delayMins, 'minute')}. The actual newspaper usually updates 5 minutes before that.`);
}

function getNewspaperUpdateDelay() {
    const output = timers.getDelay(22, 10);
    const delay = output.delay;
    const then = output.goalDate;
    const delayHours = output.hoursFromNow;
    const delayMins = output.minutesFromNow;

    const logText = `Next newspaper update scheduled for ${then.toUTCString()}, in ${delayHours} ${quantiseWords(delayHours, 'hour')} and ${delayMins} ${quantiseWords(delayMins, 'minute')}.`;
    return { delay, logText };
}

function getNewsPingDelay() {
    const output = timers.getDelay(21, 5);
    const delay = output.delay;
    const then = output.goalDate;
    const delayHours = output.hoursFromNow;
    const delayMins = output.minutesFromNow;

    const logText = `Next newsping update scheduled for ${then.toUTCString()}, in ${delayHours} ${quantiseWords(delayHours, 'hour')} and ${delayMins} ${quantiseWords(delayMins, 'minute')}.`;
    return { delay, logText };
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;

exports.newsPing = newsPing;
exports.dailyUpdate = dailyNewspaperUpdate;
exports.getNewsDelay = getNewsPingDelay;
exports.getUpdateDelay = getNewspaperUpdateDelay;
exports.askUpdate = requestNewspaperUpdateTime;