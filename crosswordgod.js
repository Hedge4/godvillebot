const Discord = require('discord.js');
const { newspaper_channels, newspaper_updates, prefix, owner } = require('./config.json');
const fs = require('fs');
const find = require('find');
const { PythonShell } = require('python-shell');

function runPython() {
    PythonShell.run('./crosswordgod_functions/interpreter.py', null, function(err) {
        if (err) throw err;
        console.log('interpreter.py finished running.');
    });
}

runPython();

function crosswordgod(message) {
    if (owner.includes(message.author.id) === true) {
        if (message.content.toLowerCase().startsWith(`${prefix}renew`)) {
            renew(message.channel, message.guild.name);
        }
        if (message.content.toLowerCase().includes(`${prefix}update`)) {
            console.log(`User ${message.author.tag} requested current delay for automatic update.`);
            getUpdate(message);
        }
        if (message.content.toLowerCase().includes(`${prefix}both`)) {
            sendAll(message.channel);
            console.log('Crossword and forecast sent to "' + message.channel.name + '" channel in "' + message.guild.name + '" guild.');
        } else if (message.content.toLowerCase().includes(`${prefix}crossword`)) {
            if (message.content.toLowerCase().includes(`${prefix}forecast`)) {
                sendAll(message.channel);
                console.log('Crossword and forecast sent to "' + message.channel.name + '" channel in "' + message.guild.name + '" guild.');
            } else {
                crosswordSend(message.channel);
                console.log('Crossword sent to "' + message.channel.name + '" channel in "' + message.guild.name + '" guild.');
            }
        } else if (message.content.toLowerCase().includes(`${prefix}forecast`)) {
            forecastSend(message.channel);
        }
    } else if (newspaper_channels.includes(message.channel.id) === true) {
        if (message.content.toLowerCase().includes(`${prefix}update`)) {
            console.log(`User ${message.author.tag} requested current delay for automatic update.`);
            getUpdate(message);
        }
        if (message.content.toLowerCase().includes(`${prefix}both`)) {
            sendAll(message.channel);
            console.log('Crossword and forecast sent to "' + message.channel.name + '" channel in "' + message.guild.name + '" guild.');
        } else if (message.content.toLowerCase().includes(`${prefix}crossword`)) {
            if (message.content.toLowerCase().includes(`${prefix}forecast`)) {
                sendAll(message.channel);
                console.log('Crossword and forecast sent to "' + message.channel.name + '" channel in "' + message.guild.name + '" guild.');
            } else {
                crosswordSend(message.channel);
                console.log('Crossword sent to "' + message.channel.name + '" channel in "' + message.guild.name + '" guild.');
            }
        } else if (message.content.toLowerCase().includes(`${prefix}forecast`)) {
            forecastSend(message.channel);
        }
    }
}

async function findSolution() {
    // eslint-disable-next-line no-unused-vars
    return new Promise(function(ok, fail) {
      find.file(/solution[0-9]*\.json/, __dirname, function(files) {
          // eslint-disable-next-line no-unused-vars
          ok(files.find(_ => true)); // resolve promise and return the first element
      });
    });
  }

async function getSolution() {
    const path = await findSolution();
    const n = await path.search('solution[0-9]*.json');
    let filename = '';
    for (let i = n; i < path.length; i++) {
        filename += path[i];
    }
//    console.log(filename + ' was found.');
    const load = await require('./' + filename);
    const rand = new Date().getTime();
    const filename_new = ('solution' + rand + '.json');
    fs.rename(filename, filename_new, function(err) {
        if (err) console.log('ERROR:' + err);
    });
//    console.log('It was changed to ' + filename_new);
    return load;
}

function getDelay() {
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
    console.log('--------------------------------------------------------\nAUTOBOT: Next automatic crossword update scheduled for ' + then + ', which is in ' + delayHours + ' hours and ' + delayMins + ' minutes.\n--------------------------------------------------------');
    return delay;
}

function getUpdate(message) {
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
    message.reply('next automatic update scheduled for ' + then + ', which is in ' + delayHours + ' hours and ' + delayMins + ' minutes.');
    console.log('Next automatic update scheduled for ' + then + ', which is in ' + delayHours + ' hours and ' + delayMins + ' minutes.'); return delayHours, delayMins;
}

function dailyRenew(client) {
    for (let i = 0; i < newspaper_updates.length; i++) {
        const channel = client.channels.get(newspaper_updates[i]);
        const GuildName = channel.guild.name;
        renew(channel, GuildName);
    const delay = getDelay();
    setTimeout(dailyRenew, delay, client);
    }
}

async function renew(channel, guildName) {
    channel.send('Renewing crossword solution and forecast... This will take at least ten seconds.');
    runPython();
    setTimeout(sendAll, 10000, channel);
    setTimeout(renewMessageDelay.bind(null, channel, guildName), 10000);
}

function renewMessageDelay(channel, guildName) {
    console.log('Renewed newspaper and sent to "' + channel.name + '" channel in "' + guildName + '" guild.');
    channel.send('Succesfully renewed. New solution and forecast:');
}

async function crosswordSend(channel) {
    const { embedTitle1, embedBody1 } = await getSolution();
    channel.send(embedCrossword(embedTitle1, embedBody1));
}

async function forecastSend(channel) {
    const { embedTitle2, embedBody2 } = await getSolution();
    channel.send(embedForecast(embedTitle2, embedBody2));
}

async function sendAll(channel) {
    const { embedTitle1, embedBody1, embedTitle2, embedBody2 } = await getSolution();
    channel.send(embedCrossword(embedTitle1, embedBody1));
    channel.send(embedForecast(embedTitle2, embedBody2));
}

function embedCrossword(embedTitle1, embedBody1) {
    const embed = new Discord.RichEmbed()
        .setTitle(embedTitle1)
        .setColor(0x1405BD) // Blue
        .setDescription(embedBody1)
        .setThumbnail('https://i.imgur.com/TyGn2ch.jpg')
        .setURL('https://godvillegame.com/news')
        .setTimestamp()
        .setFooter('This crossword solution is brought to you by Wawajabba', 'https://i.imgur.com/TyGn2ch.jpg');
    return embed;
}

function embedForecast(embedTitle2, embedBody2) {
    const embed = new Discord.RichEmbed()
        .setTitle(embedTitle2)
        .setColor(0xFF0000) // Red
        .setDescription(embedBody2)
        .setURL('https://godvillegame.com/news')
        .setTimestamp()
        .setFooter('Brought to you by Wawajabba', 'https://i.imgur.com/TyGn2ch.jpg');
    return embed;
}

/*function embedHelp() {
    const embed = new Discord.RichEmbed()
        .setTitle('CrosswordGod commands')
        .setColor(0xFFD300) // Dark yellow
        .setDescription('The CrosswordGod bot will solve the crossword from the newspaper every day, and automatically send it to <#431305701021974539> 15 minutes after the crossword updates, at 22:20 UTC.\n\u200b')
        .addField('**Regular commands**', '*These commands only work in <#431305701021974539>.*\n`' + `${prefix}crossword` + '` Displays today\'s crossword solution.\n`' + `${prefix}forecast` + '` Displays today\'s daily forecast.\n`' + `${prefix}both` + '` Displays both crossword solution and forecast.\n`' + `${prefix}update` + '` Displays time remaining before automatic crossword update.\n\u200b`' + `${prefix}help` + '` Displays this message.\n\u200b')
        .addField('**Spam commands**', '*These commands only work in <#668141457474846786>.*\n`pling` Triggers \'plong\' reaction.\n`plong` Triggers \'pling\' reaction.\n`stop` Stops ongoing bot spam.\n`' + `${prefix}spam` + '` Displays how large the current PlingPlong streak is.\n`' + `${prefix}help` + '` Displays this message.\n\u200b')
        .addField('**Owner-only commands**', '`' + `${prefix}renew` + '` Solves the crossword again and sends the solution and forecast in the current channel.\n`' + `${prefix}restart` + '` Forces the bot to log out and then restart.\n`' + `${prefix}logout` + '` Forces the bot to log out.\n\u200b')
        .setAuthor('Wawajabba', 'https://cdn.discordapp.com/avatars/346301339548123136/52bb2b12c03b5c4d099ff0971916afd1.png')
        .setThumbnail('https://www.healthyyoungmindsinherts.org.uk/sites/default/files/content/help%20button_large.jpg')
        .setTimestamp()
        .setFooter('The CrosswordGod bot is brought to you by Wawajabba', 'https://i.imgur.com/TyGn2ch.jpg');
    return embed;
}*/

exports.crosswordgod = crosswordgod;
exports.getCrosswordDelay = getDelay;
exports.dailyCrosswordRenew = dailyRenew;