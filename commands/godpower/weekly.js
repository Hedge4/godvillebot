const { botOwners } = require('../../configurations/config.json');

const logger = require('../features/logging');
const timers = require('../features/timers');
const scheduler = require('../features/scheduler');

let limitedCommandsDataRef;
let usedWeekly = [];

async function checkWeekly(message, userData) {
    if (!message.member.premiumSince && !Object.values(botOwners).includes(message.author.id)) {
        message.reply('Weeklies are only available for server boosters.');
        return;
    }

    if (usedWeekly.includes(message.author.id)) {
        const { daysLeft, hoursLeft, minutesLeft } = timers.getWeeklyDelay();
        logger.log(`${message.author.tag} tried to use their weekly in ${message.channel.name}, but had already used it.`);
        message.reply(`You already used your weekly! Weeklies reset in ${daysLeft} ${quantiseWords(daysLeft, 'day')}, ${hoursLeft} ${quantiseWords(hoursLeft, 'hour')}, and ${minutesLeft} ${quantiseWords(minutesLeft, 'minute')}.`);
        return;
    }

    const goldAdd = Math.floor(Math.random() * 56) + 45;
    usedWeekly.push(message.author.id);
    limitedCommandsDataRef.set({ weekly: usedWeekly }, { merge: true });
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

    message.reply(`<:stat_gold:401414686651711498> You received **${goldAdd}** weekly gold. You now have **${newGold}** gold.`);
    logger.log(`${message.author.tag} used their weekly in ${message.channel.name}. Gold: ${oldGold} -> ${newGold}.`);
}

function getResetTimer() {
    const { delayMs, targetDate, daysLeft, hoursLeft, minutesLeft } = timers.getWeeklyDelay();

    const logText = `Next weekly reset scheduled for ${targetDate.toUTCString()}, in ${daysLeft} ${quantiseWords(daysLeft, 'day')}, ${hoursLeft} ${quantiseWords(hoursLeft, 'hour')} and ${minutesLeft} ${quantiseWords(minutesLeft, 'minute')}.`;
    return { delayMs, logText };
}

// limitedCommandsData is the Firestore document reference that stores who has used their weekly
function startup(limitedCommandsData, usedWeeklyParam, delay) {
    limitedCommandsDataRef = limitedCommandsData;
    usedWeekly = usedWeeklyParam;
    scheduleNextReset(delay);
}

function scheduleNextReset(delay) {
    const timestamp = Date.now() + delay;

    // This event will be ignored if another weekly reset is already scheduled
    scheduler.create({
        type: 'weekly',
        timestamp: timestamp,
    }).catch(error => {
        logger.log(`Error scheduling next weekly reset: ${error}`);
    });
}

async function executeReset() {
    const weekliesUsed = usedWeekly.length;
    usedWeekly = [];
    limitedCommandsDataRef.set({ weekly: usedWeekly }, { merge: true });

    const { logText, delayMs } = getResetTimer();
    logger.toConsole(`--------------------------------------------------------\nSuccessfully reset use of the >weekly command! ${weekliesUsed} ${quantiseWords(weekliesUsed, 'weekly was', 'weeklies were')} used yesterday.\n${logText}\n--------------------------------------------------------`);
    logger.toChannel(`**Successfully reset use of the >weekly command! ${weekliesUsed} ${quantiseWords(weekliesUsed, 'weekly was', 'weeklies were')} used yesterday.**\`\`\`\n${logText}\`\`\``);

    // Schedule the next weekly reset
    scheduleNextReset(delayMs);
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;

exports.weekly = checkWeekly;
exports.getResetDelay = getResetTimer;
exports.startup = startup;
exports.executeReset = executeReset;
