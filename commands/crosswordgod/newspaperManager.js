const { adminRole, prefix, owner } = require('../../configurations/config.json');
const main = require('../../index');
const logger = require('../features/logging');
const https = require('https');
const news = {
    edition: undefined,
    date: undefined,
    forecast: undefined,
    famousHeroes: undefined,
    mentionedGods: undefined,
    guildSpotlight: undefined,
};

// used when a user requests the newspaper to send a reply before sending the newspaper
function sendNewspaperRequest(message, Discord) {
    message.reply('here is today\'s Godville Times summary!');
    logger.log(`${message.author.tag} requested the Godville Times summary in ${message.channel.name}.`);
    sendNewspaper(message.channel, Discord);
}

// sends newspaper to specified channel using upper scope variable + formats it nicely as multiple embeds
function sendNewspaper(channel, Discord, renewed = false) {
    const embedsList = [];
    const missingEmbedsList = [];

    // create introduction and add it to sendList
    const introductionEmbed = new Discord.MessageEmbed()
    .setTitle(`Godville Times issue ${news.edition} on day ${news.date} g.e.`)
    .setDescription('[Click for a link to the free coupon.](https://godvillegame.com/news#cpn_name)'
        + '\n\nDid you know I can automatically solve the newspaper\'s crossword for you? You just have to send me the words!'
        + `you can do so with \`${prefix}solve\` for separate words (type . for unknowns), or just upload the raw html page with \`${prefix}solvehtml\`!`)
    .setURL('https://godvillegame.com/news')
    .setColor(0x78de79) // noice green
    //.setThumbnail('https://i.imgur.com/t5udHzR.jpeg')
    .setFooter('GodBot is brought to you by Wawajabba', 'https://i.imgur.com/t5udHzR.jpeg')
    .setTimestamp();
    embedsList.push(introductionEmbed);

    if (news.forecast) {
        const forecastEmbed = new Discord.MessageEmbed()
        .setTitle('Daily Forecast')
        .setDescription(news.forecast)
        .setURL('https://godvillegame.com/news')
        .setColor(0x78de79) // noice green
        .setFooter('GodBot is brought to you by Wawajabba', 'https://i.imgur.com/t5udHzR.jpeg')
        .setTimestamp();
        embedsList.push(forecastEmbed);
    } else { missingEmbedsList.push('The Daily Forecast couldn\'t be loaded today.'); }

    if (news.famousHeroes) {
        const famousEmbed = new Discord.MessageEmbed()
        .setTitle('Famous Heroes')
        .setDescription(news.famousHeroes)
        .setURL('https://godvillegame.com/news')
        .setColor(0x78de79) // noice green
        .setFooter('GodBot is brought to you by Wawajabba', 'https://i.imgur.com/t5udHzR.jpeg')
        .setTimestamp();
        embedsList.push(famousEmbed);
    } else { missingEmbedsList.push('The Famous Heroes couldn\'t be loaded today.'); }

    if (news.guildSpotlight) {
        const guildEmbed = new Discord.MessageEmbed()
        .setTitle('Famous Heroes')
        .setDescription(news.famousHeroes)
        .setURL('https://godvillegame.com/news')
        .setColor(0x78de79) // noice green
        .setFooter('GodBot is brought to you by Wawajabba', 'https://i.imgur.com/t5udHzR.jpeg')
        .setTimestamp();
        embedsList.push(guildEmbed);
    } else { missingEmbedsList.push('The Guild Spotlight couldn\'t be loaded today.'); }

    // embeds are finished, now send the whole package!
    channel.send({ embeds: embedsList }).catch((err) => {
        logger.log('News: Error sending newspaper embeds. ' + err);
    });
    if (missingEmbedsList.length) channel.send(missingEmbedsList.join('\n'));

    if (renewed && news.mentionedGods) { // mention any gods who are in the news, but only if the newspaper was renewed
        const godIDs = [];
        const godNames = [];
        const godData = main.getGodData();
        godData.get().then((godDoc) => {
            const data = godDoc.data();
            news.mentionedGods.forEach(god => {
                const res = Object.keys(data).find(key => data[key] === god);
                if (res) {
                    godIDs.push(res);
                    godNames.push(data[res].slice(data[res].indexOf('gods/') + 5));
                }
            });

            for (let i = 0; i < godIDs.length; i++) {
                channel.send(`<@${godIDs[i]}> ${godNames[i]}, you're in the news!`);
                logger.log(`News: Sent a ping to ID ${godIDs[i]} in ${channel.name}, because their god ${godNames[i]} is in the news.`);
            }
        });
    }

    // log that the newspaper was successfully sent
    if (news.edition) {
        logger.log(`News: Edition ${news.edition} of the Godville Times was sent to ${channel.name}.`);
    } else {
        logger.log(`News: The daily newspaper was sent to ${channel.name}.`);
    }
}


// method used when a user renews the newspaper, not the automatic timer. Doesn't send in logs
async function renewNewspaperRequest(message, Discord) {
    if (!message.member.roles.cache.has(adminRole) && !owner.includes(message.author.id)) return message.reply('only moderators can forcefully renew the newspaper.');
    logger.log(`${message.author.tag} forcefully started the newspaper renewing process in ${message.channel}.`);
    const reply = await message.reply('I\'m working on it...');

    await loadNewspaper().then((success) => {
        if (!success) { // on fail, just let whoever used the command know. loadNewspaper() does the logging already
            reply.delete();
            return message.reply('something went wrong while trying to renew the newspaper content. You can check the logs to find out what happened.');
        }
    });

    // we end by sending the newspaper to the channel
    reply.edit(`<@${message.author.id}>, done! Here is the renewed Godville Times:`);
    sendNewspaper(message.channel, Discord, true);
}

// method used for timed renewing. Returns true/false for success, and pushes news to the logs
async function renewNewspaperAutomatic(channel, Discord) {
    channel.send('♻️ Renewing my Godville Times summary... ♻️');
    // upper method allready logged that this process is starting

    await loadNewspaper(true).then((success) => {
        if (!success) {
            channel.send('⚠️ Oops! ⚠️ Something went wrong, and I couldn\'t load the new newspaper...'
                + `You can ask a moderator to force another update with \`${prefix}renew\`.`);
            return;
        }
    });

    // we end by sending the newspaper to the channel
    channel.send('Successfully renewed! Here is the new Godville Times edition: 🗞️');
    sendNewspaper(channel, Discord, true);
}


// main function, loads the newspaper and stores it in upper scope variable. Called on startup, returns true/false for success
async function loadNewspaper(sendLogs = false) {
    // start with getting the HTML of the newspaper
    const html = await downloadNewspaper();
    if (!html) {
        return false; // only return false, this is already logged in downloadNewspaper()
    }

    const success = parseNewspaper(html);
    if (!success) {
        return false; // no need to log anything, this is done in parseNewspaper()
    }

    if (sendLogs) { // send the news to the logs for timed renews
        logger.log('---===-----===-----===-----===-----===-----===-----===-----===-----===-----===---'
            + `\n\nUpdated the Godville Times summary to issue ${news.edition} on day ${news.date} g.e.`);
        if (news.forecast) logger.log('\n • **Daily Forecast**\n' + news.forecast);
        if (news.famousHeroes) logger.log('\n • **Famous Heroes**\n' + news.famousHeroes);
        if (news.guildSpotlight) logger.log('\n • **Guild Spotlight**\n' + news.guildSpotlight);
        logger.log('\n---===-----===-----===-----===-----===-----===-----===-----===-----===-----===---');
    }

    return true;
}

// downloads the HTML
async function downloadNewspaper() {
    const URL = 'https://godvillegame.com/News';
    const timeout = 10;

    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => { // this only needs to reject because if it returns in time that means there is an error
            reject(`News: Timed out after ${timeout} seconds while getting data from ${URL}.`);
        }, timeout * 1000);
    });

    const dataPromise = new Promise((resolve, reject) => {
        https.get(URL, (res) => {
            let data;
            res.on('data', (d) => {
                data += d;
            });
            res.on('end', () => {
                resolve(String(data));
            });
        }).on('error', (e) => {
            reject(e);
        });
    });

    const res = await Promise.race([dataPromise, timeoutPromise])
    .then((result) => {
        if (!result) {
            logger.log(`News: Oops! Something went wrong when downloading from url ${URL}! No data was received.`);
            return null;
        }
        logger.toChannel(`News: Received html from <${URL}> successfully.`); // need separate log to prevent an embed
        logger.toConsole(`News: Received html from ${URL} successfully.`);
        return result;
    }).catch((error) => {
        logger.log(`News: Oops! Something went wrong when downloading from url ${URL}! Error: ` + error);
        return null;
    });

    return res;
}

// parses different newspaper components and returns them as an object, or returns null on error
function parseNewspaper(html) {
    // used to track which parts of parsing succeeded
    let editionSuccess = false;
    let dateSuccess = false;
    let forecastSuccess = false;
    let heroesSuccess = false;
    let guildSuccess = false;

    // some general regexes to use for changing text
    const hyperlinkRegex = /<a.*?href=(?:"|')(.*?)(?:"|')>(.*?)<\/a>/;
    const boldRegex = /<b>(.*?)<\/b>/;
    const emRegex = /<em>(.*?)<\/em>/;
    const spanRegex = /<span.*?>(.*?)<\/span>/;

    // regexes and methods to find and modify the data I want
    let edition;
    try {
        const editionRegex = /id="issue">(.?[0-9]*?)</;
        edition = editionRegex.exec(html)[1]; // gives edition with # in front of it
        editionSuccess = true;
    } catch (error) {
        logger.log('News: Couldn\'t parse newspaper edition correctly. Error: ' + error);
    }

    let date;
    try {
        const dateRegex = /id="date".*?<span>([0-9]+?)</;
        date = dateRegex.exec(html)[1]; // gives exact date g.e.
        dateSuccess = true;
    } catch (error) {
        logger.log('News: Couldn\'t parse newspaper date correctly. Error: ' + error);
    }

    let forecast;
    try {
        const forecastRegex = /<h2>Daily Forecast<\/h2>\s*(.*?)\s*<\/div>/s;
        const pRegex = /<\/p>.*?<p>/s;
        forecast = forecastRegex.exec(html)[1]; // gives all forecasts (no matter the amount) but with html in between
        forecast = forecast.slice(4, -4).trim(); // remove outer html
        while (pRegex.test(forecast)) {
            forecast = forecast.replace(pRegex, '*\n*'); // remove inner html + add inside italics formatting
        }
        forecast = '*' + forecast + '*'; // add outside italics formatting
        forecastSuccess = true;
    } catch (error) {
        logger.log('News: Couldn\'t parse newspaper forecast correctly. Error: ' + error);
    }

    let heroes;
    const mentions = [];
    try {
        const heroRegex = /<h2>Famous Heroes<\/h2>.*?<p>(.*?)<\/p>.*?<p>(.*?)<\/p>/s;
        heroes = heroRegex.exec(html).slice(1, 3); // gives array with two famous heroes, but with lots of html
        heroes = heroes.map((hero) => {
            let match = boldRegex.exec(hero);
            while(match) { // replace bold html for bold Discord formatting
                hero = hero.replace(boldRegex, `**${match[1]}**`);
                match = boldRegex.exec(hero);
            }
            match = hyperlinkRegex.exec(hero);
            while (match) {
                const link = (match[1].startsWith('/') ? 'https://godvillegame.com' : '') + match[1];
                if (!mentions.includes(link)) mentions.push(link);
                hero = hero.replace(hyperlinkRegex, `[${match[2]}](${link})`);
                match = hyperlinkRegex.exec(hero);
            }
            match = spanRegex.exec(hero);
            while (match) {
                hero = hero.replace(spanRegex, `*${match[1]}*`);
                match = spanRegex.exec(hero);
            }
            match = emRegex.exec(hero);
            while (match) {
                hero = hero.replace(emRegex, `*${match[1]}*`);
                match = emRegex.exec(hero);
            }
            return hero.trim();
        });
        heroes = heroes.join('\n\n'); // join the two famous heroes together into one string
        heroesSuccess = true;
    } catch (error) {
        logger.log('News: Couldn\'t parse newspaper famous heroes correctly. Error: ' + error);
    }

    let guilds;
    try {
        const guildRegex = /<h2>Guild Spotlight<\/h2>.*?<p>(.*?)<\/p>.*?<p>(.*?)<\/p>/s;
        guilds = guildRegex.exec(html).slice(1, 3); // gives array with two guilds, but with lots of html
        guilds = guilds.map((guild) => {
            let match = boldRegex.exec(guild);
            while(match) { // replace bold html for bold Discord formatting
                guild = guild.replace(boldRegex, `**${match[1]}**`);
                match = boldRegex.exec(guild);
            }
            match = hyperlinkRegex.exec(guild);
            while (match) {
                const link = (match[1].startsWith('/') ? 'https://godvillegame.com' : '') + match[1];
                guild = guild.replace(hyperlinkRegex, `[${match[2]}](${link})`);
                match = hyperlinkRegex.exec(guild);
            }
            return guild.trim();
        });
        guilds = guilds.join('\n\n'); // join the two guilds together into one string
        guildSuccess = true;
    } catch (error) {
        logger.log('News: Couldn\'t parse newspaper guild spotlight correctly. Error: ' + error);
    }

    // store in upper scope after finding - make undefined if not found
    news.edition = (editionSuccess ? edition : undefined);
    news.date = (dateSuccess ? date : undefined);
    news.forecast = (forecastSuccess ? forecast : undefined);
    news.famousHeroes = (heroesSuccess ? heroes : undefined);
    news.guildSpotlight = (guildSuccess ? guilds : undefined);
    news.mentionedGods = (heroesSuccess ? mentions : undefined);

    // return true/false if at least one of the main parts succeeded
    if (editionSuccess && dateSuccess && forecastSuccess && heroesSuccess && guildSuccess) {
        logger.log('News: All parts of the daily newspaper managed to load correctly.');
        return true;
    } else if (forecastSuccess || heroesSuccess || guildSuccess) {
        logger.log('News: Some parts of the daily newspaper failed to load correctly.');
        return true;
    } else {
        logger.log('News: No parts of the daily newspaper loaded correctly, so no daily update will be sent.');
        return false;
    }
}

exports.send = sendNewspaperRequest;
exports.renewAuto = renewNewspaperAutomatic;
exports.renewRequest = renewNewspaperRequest;
exports.load = loadNewspaper;