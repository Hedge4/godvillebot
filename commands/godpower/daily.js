const logger = require('../features/logging');
const timers = require('../features/timers');
const scheduler = require('../features/scheduler');

let limitedCommandsDataRef;
let usedDaily = [];

async function checkDaily(message, userData) {
    if (!usedDaily.includes(message.author.id)) {
        const goldAdd = Math.floor(Math.random() * 21) + 22;
        usedDaily.push(message.author.id);
        limitedCommandsDataRef.set({ daily: usedDaily });

        const userDoc = await userData.get();
        const User = {};
        if (userDoc.data()[message.author.id] === undefined) {
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

        message.reply(`<:stat_gold:401414686651711498> You received **${goldAdd}** daily gold. You now have **${newGold}** gold.`);
        logger.log(`${message.author.tag} used their daily in ${message.channel.name}. Gold: ${oldGold} -> ${newGold}.`);
    } else {
        const { delayHours, delayMins, delaySecs } = getResetTimer();
        logger.log(`${message.author.tag} tried to use their daily in ${message.channel.name}, but had already used it.`);
        message.reply(`You already used your daily! Dailies reset in ${delayHours} ${quantiseWords(delayHours, 'hour')}, ${delayMins} ${quantiseWords(delayMins, 'minute')} and ${delaySecs} ${quantiseWords(delaySecs, 'second')}.`);
    }
}

function getResetTimer() {
    const output = timers.getDelay(0, 0);
    const delay = output.delay;
    const then = output.goalDate;
    const delayHours = output.hoursFromNow;
    const delayMins = output.minutesFromNow;
    const delaySecs = output.secondsFromNow;

    const logText = `Next daily reset scheduled for ${then.toUTCString()}, in ${delayHours} ${quantiseWords(delayHours, 'hour')} and ${delayMins} ${quantiseWords(delayMins, 'minute')}.`;
    return { delay, delayHours, delayMins, delaySecs, logText };
}

// limitedCommandsData is the Firestore document reference that stores who has used their daily
function startup(limitedCommandsData, usedDailyParam, delay) {
    limitedCommandsDataRef = limitedCommandsData;
    usedDaily = usedDailyParam;
    scheduleNextReset(delay);
}

function scheduleNextReset(delay) {
    const timestamp = Date.now() + delay;

    // This event will be ignored if another daily reset is already scheduled
    scheduler.create({
        type: 'daily',
        timestamp: timestamp,
    }).catch(error => {
        logger.log(`Error scheduling next daily reset: ${error}`);
    });
}

async function executeReset() {
    const dailiesUsed = usedDaily.length;
    usedDaily = [];
    limitedCommandsDataRef.set({ daily: usedDaily });
    const { delay, logText } = getResetTimer();
    logger.toConsole(`--------------------------------------------------------\nSuccessfully reset use of the >daily command! ${dailiesUsed} ${quantiseWords(dailiesUsed, 'daily was', 'dailies were')} used yesterday.\n${logText}\n--------------------------------------------------------`);
    logger.toChannel(`**Successfully reset use of the >daily command! ${dailiesUsed} ${quantiseWords(dailiesUsed, 'daily was', 'dailies were')} used yesterday.**\`\`\`\n${logText}\`\`\``);

    // Schedule the next daily reset
    scheduleNextReset(delay);
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;

exports.daily = checkDaily;
exports.getResetDelay = getResetTimer;
exports.startup = startup;
exports.executeReset = executeReset;
