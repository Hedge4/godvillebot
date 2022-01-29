const logger = require('../features/logging');
const timers = require('../features/timers');

async function checkDaily(message, limitedCommandsData, userData) {
    if (!usedDaily.includes(message.author.id)) {
        const goldAdd = Math.floor(Math.random() * 21) + 22;
        usedDaily.push(message.author.id);
        limitedCommandsData.set({ daily: usedDaily });

        const userDoc = await userData.get();
        const User = {};
        if(userDoc.data()[message.author.id] === undefined) {
            User[message.author.id] = {
                godpower: 0,
                gold: 0,
                total_godpower: 0,
                level: 0,
            }; // last_username is set later, but is also part of a User object
        } else {
            User[message.author.id] = userDoc.data()[message.author.id];
        }
        const oldGold = User[message.author.id].gold;
        const newGold = Math.floor(oldGold + goldAdd);
        User[message.author.id].gold = newGold;
        User[message.author.id].last_username = message.author.tag;
        userData.set(User, { merge: true });

        message.reply(`you received **${goldAdd}** daily gold. You now have **${newGold}** gold total. <:stat_gold:401414686651711498>`);
        logger.log(`${message.author.tag} used their daily in ${message.channel.name}. Gold: ${oldGold} -> ${newGold}.`);
    } else {
        const delay = getResetTimer(false);
        logger.log(`${message.author.tag} tried to use their daily in ${message.channel.name}, but had already used it.`);
        message.reply(`you already used your daily! Dailies reset in ${delay[1]} ${quantiseWords(delay[1], 'hour')}, ${delay[2]} ${quantiseWords(delay[2], 'minute')} and ${delay[4]} ${quantiseWords(delay[4], 'second')}.`);
    }
}

function getResetTimer(show) {
    const output = timers.getDelay(0, 0);
    const delay = output.delay;
    const then = output.goalDate;
    const delayHours = output.hoursFromNow;
    const delayMins = output.minutesFromNow;
    const delaySecs = output.secondsFromNow;

    if (show === true) {
        logger.toConsole(`--------------------------------------------------------\nNext daily reset scheduled for ${then}, in ${delayHours} ${quantiseWords(delayHours, 'hour')} and ${delayMins} ${quantiseWords(delayMins, 'minute')}.\n--------------------------------------------------------`);
        logger.toChannel(`\`\`\`\nNext daily reset scheduled for ${then}, in ${delayHours} ${quantiseWords(delayHours, 'hour')} and ${delayMins} ${quantiseWords(delayMins, 'minute')}.\`\`\``);
    }
    return [delay, delayHours, delayMins, then, delaySecs];
}

function dailyReset(limitedCommandsData) {
    const delay = getResetTimer(true);
    const dailiesUsed = usedDaily.length;
    usedDaily = [];
    limitedCommandsData.set({ daily: usedDaily });
    logger.toConsole(`Successfully reset use of the >daily command! ${dailiesUsed} ${quantiseWords(dailiesUsed, 'daily was', 'dailies were')} used yesterday.`);
    logger.toChannel(`**Successfully reset use of the >daily command! ${dailiesUsed} ${quantiseWords(dailiesUsed, 'daily was', 'dailies were')} used yesterday.**`);
    setTimeout(dailyReset, delay[0], limitedCommandsData);
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;

exports.daily = checkDaily;
exports.resetDelay = getResetTimer;
exports.reset = dailyReset;