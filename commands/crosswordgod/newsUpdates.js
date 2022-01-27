const { newspaperUpdates } = require('./configurations/config.json');
const logger = require('../features/logging');
const timers = require('../features/timers');

function dailyCrosswordUpdate(client) {
    const channel = client.channels.cache.get(newspaperUpdates);
    //
}

function newsPing(client) {
    const channel = client.channels.cache.get(newspaperUpdates);
    const guildName = channel.guild.name;
    channel.send('<@&677288625301356556>, don\'t forget about the bingo, crossword and accumulator! Daily coupon: <https://godvillegame.com/news#cpn_name>');
    logger.log(`Sent newspaper reminder to ${channel.name} in ${guildName} guild. Random number check: ${Math.floor(Math.random() * 1000)}.`);
    let delay = getNewsPingDelay();
    if (delay < 1000 * 60 * 25) { // set delay to a full day if less than 25 minutes
        delay = 1000 * 60 * 60 * 24;
    }
    setTimeout(newsPing, delay, client);
}

function getNewspaperUpdateDelay() {
    const output = timers.getDelay(22, 20);
    const delay = output.delay;
    const then = output.goalDate;
    const delayHours = output.hoursFromNow;
    const delayMins = output.minutesFromNow;

    logger.toConsole(`--------------------------------------------------------\nNext crossword update scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.\n--------------------------------------------------------`);
    logger.toChannel(`\`\`\`Next crossword update scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.\`\`\``);
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
exports.dailyUpdate = dailyCrosswordUpdate;
exports.getNewsDelay = getNewsPingDelay;
exports.getUpdateDelay = getNewspaperUpdateDelay;