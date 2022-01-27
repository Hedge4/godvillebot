const { newspaperUpdates } = require('./configurations/config.json');
const logger = require('../features/logging');

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
    if (delay < 1000 * 60 * 30) { // set delay to a full day if less than half an hour
        delay = 1000 * 60 * 60 * 24;
    }
    setTimeout(newsPing, delay, client);
}

function getNewspaperUpdateDelay() {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset();
    let yrs = now.getFullYear();
    let mos = now.getMonth();
    let days = now.getDate();
    let hrs = now.getHours();
    let mins = now.getMinutes();
    let secs = now.getSeconds();
    mins = mins + timezoneOffset;
    const now_UTC = new Date(yrs, mos, days, hrs, mins, secs);
    yrs = now_UTC.getFullYear();
    mos = now_UTC.getMonth();
    days = now_UTC.getDate();
    hrs = now_UTC.getHours();
    mins = now_UTC.getMinutes();
    secs = now_UTC.getSeconds();
    if (hrs === 22) {
        if (mins >= 20) {
            days += 1;
        }
    }
    if (hrs > 22) {
        days += 1;
    }
    hrs = 22;
    mins = 20;
    const now_milsec = now_UTC.getTime();
    const then_UTC = new Date(yrs, mos, days, hrs, mins);
    mins = mins - timezoneOffset;
    const then = new Date(yrs, mos, days, hrs, mins);
    const then_UTC_milsec = then_UTC.getTime();
    const delay = then_UTC_milsec - now_milsec;
    const delayHours = Math.floor(delay / 1000 / 3600);
    const delayMins = Math.ceil((delay % (1000 * 3600)) / (60 * 1000));
    logger.toConsole(`--------------------------------------------------------\nNext crossword update scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.\n--------------------------------------------------------`);
    logger.toChannel(`\`\`\`Next crossword update scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.\`\`\``);
    return delay;
}

function getNewsPingDelay() {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset();
    let yrs = now.getFullYear();
    let mos = now.getMonth();
    let days = now.getDate();
    let hrs = now.getHours();
    let mins = now.getMinutes();
    let secs = now.getSeconds();
    mins = mins + timezoneOffset;
    const now_UTC = new Date(yrs, mos, days, hrs, mins, secs);
    yrs = now_UTC.getFullYear();
    mos = now_UTC.getMonth();
    days = now_UTC.getDate();
    hrs = now_UTC.getHours();
    mins = now_UTC.getMinutes();
    secs = now_UTC.getSeconds();
    if (hrs === 21) {
        if (mins >= 5) {
            days += 1;
        }
    }
    if (hrs > 21) {
        days += 1;
    }
    hrs = 21;
    mins = 5;
    const now_milsec = now_UTC.getTime();
    const then_UTC = new Date(yrs, mos, days, hrs, mins);
    mins = mins - timezoneOffset;
    const then = new Date(yrs, mos, days, hrs, mins);
    const then_UTC_milsec = then_UTC.getTime();
    const delay = then_UTC_milsec - now_milsec;
    const delayHours = Math.floor(delay / 1000 / 3600);
    const delayMins = Math.ceil((delay % (1000 * 3600)) / (60 * 1000));
    logger.toConsole(`--------------------------------------------------------\nNext newsping update scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.\n--------------------------------------------------------`);
    logger.toChannel(`\`\`\`\nNext newsping update scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.\`\`\``);
    return delay;
}

exports.newsPing = newsPing;
exports.dailyUpdate = dailyCrosswordUpdate;
exports.getNewsDelay = getNewsPingDelay;
exports.getUpdateDelay = getNewspaperUpdateDelay;