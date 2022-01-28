const { newspaperUpdates } = require('../../configurations/config.json');
const newspaper = require('./newspaperManager.js');
const logger = require('../features/logging');
const timers = require('../features/timers');

function dailyNewspaperUpdate(client, Discord) {
    const channel = client.channels.cache.get(newspaperUpdates);
    newspaper.renewAuto(channel, Discord);
    logger.log(`News: Automatically tried to renew the newspaper and send it to the ${channel.name} channel. Random number check: ${Math.floor(Math.random() * 1000)}.`);
    let delay = getNewspaperUpdateDelay();
    if (delay < 1000 * 60 * 25) { // set delay to a full day if less than 25 minutes
        delay = 1000 * 60 * 60 * 24;
    }
    setTimeout(dailyNewspaperUpdate, delay, client, Discord);
}

function newsPing(client) {
    const channel = client.channels.cache.get(newspaperUpdates);
    channel.send('<@&677288625301356556>, don\'t forget about the bingo, crossword and accumulator! Daily coupon: <https://godvillegame.com/news#cpn_name>');
    logger.log(`Sent a newspaper reminder to the ${channel.name} channel. Random number check: ${Math.floor(Math.random() * 1000)}.`);
    let delay = getNewsPingDelay();
    if (delay < 1000 * 60 * 25) { // set delay to a full day if less than 25 minutes
        delay = 1000 * 60 * 60 * 24;
    }
    setTimeout(newsPing, delay, client);
}

function requestNewspaperUpdateTime(message) {
    const output = timers.getDelay(22, 20);
    const then = output.goalDate;
    const delayHours = output.hoursFromNow;
    const delayMins = output.minutesFromNow;

    message.reply(`The bot's next newspaper update is scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.`
        + ' The actual newspaper usually updates 15 minutes before that.');
}

function getNewspaperUpdateDelay() {
    const output = timers.getDelay(22, 20);
    const delay = output.delay;
    const then = output.goalDate;
    const delayHours = output.hoursFromNow;
    const delayMins = output.minutesFromNow;

    logger.toConsole(`--------------------------------------------------------\nNext newspaper update scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.\n--------------------------------------------------------`);
    logger.toChannel(`\`\`\`Next newspaper update scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.\`\`\``);
    return delay;
}

function getNewsPingDelay() {
    const output = timers.getDelay(21, 5);
    const delay = output.delay;
    const then = output.goalDate;
    const delayHours = output.hoursFromNow;
    const delayMins = output.minutesFromNow;

    logger.toConsole(`--------------------------------------------------------\nNext newsping update scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.\n--------------------------------------------------------`);
    logger.toChannel(`\`\`\`\nNext newsping update scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.\`\`\``);
    return delay;
}

exports.newsPing = newsPing;
exports.dailyUpdate = dailyNewspaperUpdate;
exports.getNewsDelay = getNewsPingDelay;
exports.getUpdateDelay = getNewspaperUpdateDelay;
exports.askUpdate = requestNewspaperUpdateTime;