const { logs } = require('../configurations/config.json');

async function checkDaily(client, message, limitedCommandsData, userData) {
    const logsChannel = client.channels.cache.get(logs);
    if (!usedDaily.includes(message.author.id)) {
        const goldAdd = Math.floor(Math.random() * 21) + 22;
        console.log(`${message.author.tag} used their daily in ${message.channel.name}.`);
        logsChannel.send(`${message.author.tag} used their daily in ${message.channel.name}.`);
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
            };
            User[message.author.id].last_username = message.author.tag;
            await userData.set(User, { merge: true });
        } else {
            User[message.author.id] = userDoc.data()[message.author.id];
        }
        const gold = User[message.author.id].gold + goldAdd;
        User[message.author.id].gold = gold;
        User[message.author.id].last_username = message.author.tag;
        userData.set(User, { merge: true });

        message.reply(`you received **${goldAdd}** daily gold. You now have **${gold}** gold total. <:stat_gold:401414686651711498>`);
    } else {
        const delay = getResetTimer(client, false);
        console.log(`${message.author.tag} tried to use their daily in ${message.channel.name}, but had already used it.`);
        logsChannel.send(`${message.author.tag} tried to use their daily in ${message.channel.name}, but had already used it.`);
        message.reply(`you already used your daily! Dailies reset in ${delay[1]} hours, ${delay[2]} minutes and ${delay[4]} seconds.`);
    }
}

function getResetTimer(client, show) {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset();
    let yrs = now.getFullYear();
    let mos = now.getMonth();
    let days = now.getDate();
    const hrs = now.getHours();
    let mins = now.getMinutes();
    const secs = now.getSeconds();
    mins = mins + timezoneOffset;
    const now_UTC = new Date(yrs, mos, days, hrs, mins, secs);
    yrs = now_UTC.getFullYear();
    mos = now_UTC.getMonth();
    days = now_UTC.getDate();
    days += 1;
    const now_milsec = now_UTC.getTime();
    const then_UTC = new Date(yrs, mos, days);
    mins = mins - timezoneOffset;
    const then = new Date(yrs, mos, days);
    const then_UTC_milsec = then_UTC.getTime();
    const delay = then_UTC_milsec - now_milsec;
    const delayHours = Math.floor(delay / 1000 / 3600);
    const delayMins = Math.floor((delay % (1000 * 3600)) / (60 * 1000));
    const delaySecs = Math.ceil((delay % (60 * 1000) / 1000));
    const logsChannel = client.channels.cache.get(logs);
    if (show === true) {
        console.log(`--------------------------------------------------------\nNext daily reset scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.\n--------------------------------------------------------`);
        logsChannel.send(`\`\`\`\nNext daily reset scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.\`\`\``);
    }
    return [delay, delayHours, delayMins, then, delaySecs];
}

function dailyReset(client, limitedCommandsData) {
    const delay = getResetTimer(client, true);
    const dailiesUsed = usedDaily.length;
    usedDaily = [];
    limitedCommandsData.set({ daily: usedDaily });
    newsSent = false;
    const logsChannel = client.channels.cache.get(logs);
    console.log(`Succesfully reset use of the >daily command! ${dailiesUsed} dailies were used yesterday.`);
    logsChannel.send(`Succesfully reset use of the >daily command! ${dailiesUsed} dailies were used yesterday.`);
    setTimeout(dailyReset, delay[0], client, limitedCommandsData);
}

exports.daily = checkDaily;
exports.resetDelay = getResetTimer;
exports.reset = dailyReset;