const { prefix } = require('../../configurations/config.json');

const logger = require('../features/logging');
const timers = require('../features/timers');
const scheduler = require('../features/scheduler');

let limitedCommandsDataRef;
let usedMonthly = [];

const months = ['Januarily', 'Februarily', 'Marchly', 'Aprily', 'Mayly', 'Junely', 'Julyly', 'Augustly', 'Septemberly', 'Octoberly', 'Novemberly', 'Decemberly'];
const monthsLower = ['januarily', 'februarily', 'marchly', 'aprily', 'mayly', 'junely', 'julyly', 'augustly', 'septemberly', 'octoberly', 'novemberly', 'decemberly'];

async function checkMonthly(message, userData) {
    const commandUsed = message.content.toLowerCase().slice(prefix.length).split(/\s+/)[0];
    const currentMonth = new Date().getUTCMonth();
    if (commandUsed !== monthsLower[currentMonth]) {
        // only accept the correct spelling for the current month
        return;
    }

    const monthlyName = months[currentMonth];

    if (usedMonthly.includes(message.author.id)) {
        logger.log(`${message.author.tag} tried to use their ${monthlyName} in ${message.channel.name}, but had already used it.`);
        message.reply(`You already used your ${monthlyName}!`);
        return;
    }

    const goldAdd = Math.floor(Math.random() * 124) + 99;
    usedMonthly.push(message.author.id);
    limitedCommandsDataRef.set({ monthly: usedMonthly }, { merge: true });

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

    message.reply(`<:stat_gold:401414686651711498> You received **${goldAdd}** ${monthlyName} gold. You now have **${newGold}** gold.`);
    logger.log(`${message.author.tag} used their ${monthlyName} in ${message.channel.name}. Gold: ${oldGold} -> ${newGold}.`);
}

// limitedCommandsData is the Firestore document reference that stores who has used their monthly
function startup(limitedCommandsData, usedMonthlyParam) {
    limitedCommandsDataRef = limitedCommandsData;
    usedMonthly = usedMonthlyParam;
    scheduleNextReset();
}

function scheduleNextReset() {
    const now = new Date();
    const targetDate = {
        date: 1, // 1st of the month
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
        month: now.getUTCMonth() + 1 > 11 ? 0 : now.getUTCMonth() + 1, // next month
        year: now.getUTCMonth() + 1 > 11 ? now.getUTCFullYear() + 1 : now.getUTCFullYear(), // next year if month rolls over
    };

    const timestamp = Date.now() + timers.getLongDelay(targetDate);

    // This event will be ignored if another monthly reset is already scheduled
    scheduler.create({
        type: 'monthly',
        timestamp: timestamp,
    }).catch(error => {
        logger.log(`Error scheduling next monthly reset: ${error}`);
    });
}

async function executeReset() {
    const monthliesUsed = usedMonthly.length;
    usedMonthly = [];
    limitedCommandsDataRef.set({ monthly: usedMonthly }, { merge: true });
    logger.log(`Something happened ${monthliesUsed} times...`);

    // Schedule the next monthly reset
    scheduleNextReset();
}

exports.monthly = checkMonthly;
exports.startup = startup;
exports.executeReset = executeReset;
