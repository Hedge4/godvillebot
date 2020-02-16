const Discord = require('discord.js');
const { newspaper_channels, newspaper_updates, prefix, owner, admin_role } = require('./configurations/config.json');
const fs = require('fs');
const find = require('find');
const { PythonShell } = require('python-shell');

function runPython() {
    PythonShell.run('./python/interpreter.py', null, function(err) {
        if (err) throw err;
        console.log('interpreter.py finished running.');
    });
}

runPython();

function crosswordgod(message) {
    if (message.content.toLowerCase().startsWith(`${prefix}renew`)) {
        if (message.member.roles.has(admin_role) || owner.includes(message.author.id)) {
            renew(message.channel, message.guild.name);
        } else { return message.reply('you do not have access to this command.'); }
    }
    if (newspaper_channels.includes(message.channel.id) === true || owner.includes(message.author.id) === true) {
        if (message.content.toLowerCase().startsWith(`${prefix}update`)) {
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
      find.file(/solution[0-9]*\.json/, __dirname + '/python', function(files) {
          // eslint-disable-next-line no-unused-vars
          ok(files.find(_ => true)); // resolve promise and return the first element
      });
    });
  }

async function getSolution() {
    const path = await findSolution();
    const n = await path.search('solution[0-9]*.json');
    let filename = './python/';
    for (let i = n; i < path.length; i++) {
        filename += path[i];
    }
//    console.log(filename + ' was found.');
    const load = await require('' + filename);
    const rand = new Date().getTime();
    const filename_new = ('./python/solution' + rand + '.json');
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
    console.log(`--------------------------------------------------------\nNext crossword update scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.\n--------------------------------------------------------`);
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
    message.reply(`the next automatic update is scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes.`);
    console.log(`Next automatic update scheduled for ${then}, in ${delayHours} hours and ${delayMins} minutes. Info requested by ${message.author.tag}.`); return delayHours, delayMins;
}

function dailyRenew(client) {
    for (let i = 0; i < newspaper_updates.length; i++) {
        const channel = client.channels.get(newspaper_updates[i]);
        const GuildName = channel.guild.name;
        renew(channel, GuildName);
        setTimeout(sendMK, 15000, client);
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

async function sendMK(client) {
    const { embedTitle2, embedBody2 } = await getSolution();
    client.users.get('534068471156178974').send(embedForecast(embedTitle2, embedBody2)); // MK's ID
    //client.users.get('346301339548123136').send(embedForecast(embedTitle2, embedBody2)); // Wawa's ID
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

function newsPing(client) {
    const channel = client.channels.get(newspaper_updates[0]);
    const guildName = channel.guild.name;
    channel.send('<@&677288625301356556>, don\'t forget about the bingo, crossword and accumulator! <https://godvillegame.com/news>');
    console.log(`Sent newspaper reminder to ${channel.name} in ${guildName} guild.`);
    let delay = getDelay();
    delay = delay - 4500000;
    if (delay <= 5000) {
        delay = delay + 86400000;
    }
    setTimeout(newsPing, delay, client);
}

exports.crosswordgod = crosswordgod;
exports.getCrosswordDelay = getDelay;
exports.dailyCrosswordRenew = dailyRenew;
exports.newsping = newsPing;