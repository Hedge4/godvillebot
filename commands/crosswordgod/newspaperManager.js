const { prefix, botOwners, roles, botName } = require('../../configurations/config.json');
const Discord = require('discord.js'); // TODO: remove, import only the specifically needed part
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
function sendNewspaperRequest(message) {
    message.reply('Here is today\'s Godville Times summary!');
    logger.log(`News: ${message.author.tag} requested the Godville Times summary in ${message.channel.name}.`);
    sendNewspaper(message.channel);
}

// sends newspaper to specified channel using upper scope variable + formats it nicely as multiple embeds
function sendNewspaper(channel, mentionGods = false) {
    const embedsList = [];
    const missingEmbedsList = [];

    // create introduction and add it to sendList
    const introductionEmbed = new Discord.EmbedBuilder()
        .setTitle(`Godville Times issue ${news.edition} on day ${news.date} g.e.`)
        .setDescription('[Claim your free daily coupon...](https://godvillegame.com/news#cpn_name)'
            + '\n\nDid you know I can solve the newspaper\'s crossword for you? You just have to send me the words! '
            + `You can do so with \`${prefix}solve\` for separate words (type a . for unknown letters), or just upload the raw html page with \`${prefix}solvehtml\`!`)
        .setURL('https://godvillegame.com/news')
        .setColor(0x78de79) // noice green
        .setThumbnail('https://i.imgur.com/t5udHzR.jpeg')
        .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: 'https://i.imgur.com/t5udHzR.jpeg' })
        .setTimestamp();
    embedsList.push(introductionEmbed);

    if (news.forecast) {
        const forecastEmbed = new Discord.EmbedBuilder()
            .setTitle('Daily Forecast')
            .setDescription('[Click here for an explanation about forecast effects.](https://wiki.godvillegame.com/Daily_Forecast#List_of_possible_forecasts)\n\n' + news.forecast)
            .setURL('https://godvillegame.com/news')
            .setColor(0x78de79) // noice green
            .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: 'https://i.imgur.com/t5udHzR.jpeg' })
            .setTimestamp();
        embedsList.push(forecastEmbed);
    } else { missingEmbedsList.push('The Daily Forecast couldn\'t be loaded today.'); }

    if (news.famousHeroes) {
        const famousEmbed = new Discord.EmbedBuilder()
            .setTitle('Famous Heroes')
            .setDescription(news.famousHeroes)
            .setURL('https://godvillegame.com/news')
            .setColor(0x78de79) // noice green
            .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: 'https://i.imgur.com/t5udHzR.jpeg' })
            .setTimestamp();
        embedsList.push(famousEmbed);
    } else { missingEmbedsList.push('The Famous Heroes couldn\'t be loaded today.'); }

    if (news.guildSpotlight) {
        const guildEmbed = new Discord.EmbedBuilder()
            .setTitle('Guild Spotlight')
            .setDescription(news.guildSpotlight)
            .setURL('https://godvillegame.com/news')
            .setColor(0x78de79) // noice green
            .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: 'https://i.imgur.com/t5udHzR.jpeg' })
            .setTimestamp();
        embedsList.push(guildEmbed);
    } else { missingEmbedsList.push('The Guild Spotlight couldn\'t be loaded today.'); }

    // embeds are finished, now send the whole package!
    // channel.send({ embeds: embedsList }).catch((err) => {
    //     logger.log('News: Error sending newspaper embeds. ' + err);
    // });

    // In testing, Discord only displays the first embed attached to a message, so we're sending them one by one.
    embedsList.forEach(embed => {
        channel.send({ embeds: [embed] }).catch((err) => {
            logger.log('News: Error sending newspaper embeds. ' + err);
        });
    });

    // send a message with an explanation about the parts of the newspaper that couldn't be sent
    if (missingEmbedsList.length) channel.send(missingEmbedsList.join('\n'));

    if (mentionGods && news.mentionedGods) { // mention any gods who are in the news, but only if the newspaper was renewed
        const godIDs = [];
        const godNames = [];
        const godData = main.getGodData();
        godData.get().then((godDoc) => {
            const data = godDoc.data();
            news.mentionedGods.forEach(god => {
                const res = Object.keys(data).find(key => data[key].toLowerCase() === god.toLowerCase());
                if (res) {
                    godIDs.push(res);
                    godNames.push(data[res].slice(data[res].indexOf('gods/') + 5));
                }
            });

            // we got the goods now ship 'em
            for (let i = 0; i < godIDs.length; i++) {
                channel.send(`<@${godIDs[i]}> ${decodeURI(godNames[i])}, you're in the news!`);
                logger.log(`News: Sent a ping to ID ${godIDs[i]} in ${channel.name}, because their god ${godNames[i]} is in the news.`);
            }
        });
    }

    // log that the newspaper was successfully sent
    if (news.edition) {
        logger.log(`News: Edition ${news.edition} of the Godville Times was sent to ${channel.name}.`);
    } else {
        logger.log(`News: Today's Godville Times was sent to ${channel.name}.`);
    }
}


// method used when a user renews the newspaper, not the automatic timer. Doesn't send in logs
async function renewNewspaperRequest(message) {
    if (!message.member.roles.cache.has(roles.admin) && !Object.values(botOwners).includes(message.author.id)) {
        message.reply('Only moderators can forcefully renew the newspaper.');
        return;
    }
    logger.log(`News: ${message.author.tag} forcefully started the newspaper renewing process in ${message.channel}.`);
    const reply = await message.reply('I\'m working on it...');

    const success = await loadNewspaper(true);

    // on fail, just let whoever used the command know. loadNewspaper() does the logging already
    if (!success) {
        const manualRenewFail = 'Something went wrong while trying to renew the newspaper content. You can check the logs to find out what happened, or check the newspaper yourself.\nhttps://godvillegame.com/news';
        reply.edit(manualRenewFail).catch(() => {
            message.channel.send(manualRenewFail);
        });
        return;
    }

    // we end by sending the newspaper to the channel
    const manualRenewSuccess = `<@${message.author.id}>, done! Here is the renewed Godville Times:`;
    reply.edit(manualRenewSuccess).catch(() => {
        message.channel.send(manualRenewSuccess);
    });
    sendNewspaper(message.channel, true);
}

// method used for timed renewing. Returns true/false for success, and pushes news to the logs
async function renewNewspaperAutomatic(channel) {
    const reply = await channel.send('♻️ Renewing my Godville Times summary... ♻️');
    // upper method allready logged that this process is starting

    const success = await loadNewspaper(true);

    if (!success) {
        const autoRenewFail = `⚠️ Oops! ⚠️ Something went wrong, and I couldn't load the new newspaper edition... You can ask a moderator to force another update with \`${prefix}refreshnews\`, or check the newspaper yourself.\nhttps://godvillegame.com/news'`;
        reply.edit(autoRenewFail).catch(() => {
            channel.send(autoRenewFail);
        });
        return;
    }

    // we end by sending the newspaper to the channel
    const autoRenewSuccess = 'Successfully renewed my Godville Times summary! Here is the new edition: 🗞️';
    reply.edit(autoRenewSuccess).catch(() => {
        channel.send(autoRenewSuccess);
    });
    sendNewspaper(channel, true);
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

    // if (sendLogs) { // send the news to the logs for timed renews
    //     logger.log('---===-----===-----===-----===-----===-----===-----===-----===-----===-----===---'
    //         + `\n\nUpdated the Godville Times summary to issue ${news.edition} on day ${news.date} g.e.`);
    //     if (news.forecast) logger.log('\n • **Daily Forecast**\n' + news.forecast);
    //     if (news.famousHeroes) logger.log('\n • **Famous Heroes**\n' + news.famousHeroes);
    //     if (news.guildSpotlight) logger.log('\n • **Guild Spotlight**\n' + news.guildSpotlight);
    //     logger.log('\n---===-----===-----===-----===-----===-----===-----===-----===-----===-----===---');
    // }

    if (sendLogs) { // true for >renewnews and daily renews
        // send newspaper to logChannel in embed format, don't send it at all in the logs
        sendNewspaper(logger.getChannel());
        logger.toConsole(`News: Updated the Godville Times summary to issue ${news.edition} on day ${news.date} g.e.`);
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
            logger.log(`News: Received html from ${URL} successfully.`);
            return result;
        }).catch((error) => {
            logger.log(`News: Oops! Something went wrong when downloading from url ${URL}!\nError: ` + error);
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
        forecast = forecast.slice(3, -4).trim(); // remove outer html
        while (pRegex.test(forecast)) {
            forecast = forecast.replace(pRegex, '*\n*'); // remove inner html + add inside italics formatting
        }

        //forecast.replace(/&#0149;/g, '-'); // would be better but doesn't work somehow
        forecast = '•' + forecast.slice(7);

        const splitIndex = forecast.indexOf('\n');
        if (splitIndex >= 0) { // only do this for multiline forecasts
            forecast = forecast.slice(0, splitIndex + 2) + '•' + forecast.slice(splitIndex + 9);
        }

        forecast = parseHtmlEntities(forecast); // catch remaining funky stuff (also doesn't work for bullet points)
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

            // replace bold html for bold Discord formatting
            let match = boldRegex.exec(hero);
            while (match) {
                hero = hero.replace(boldRegex, `**${match[1]}**`);
                match = boldRegex.exec(hero);
            }

            // replace hyperlink formatting + detect mentions
            match = hyperlinkRegex.exec(hero);
            while (match) {
                let link = (match[1].startsWith('/') ? 'https://godvillegame.com' : '') + match[1];
                link = encodeURI(link);
                link = link.replace(/%25/g, '%'); // prevent double encoding (decode %25 into %)
                if (!mentions.includes(link)) mentions.push(link);
                hero = hero.replace(hyperlinkRegex, `[${match[2]}](${link})`);
                match = hyperlinkRegex.exec(hero);
            }

            // replace italics formatting
            match = spanRegex.exec(hero);
            while (match) {
                hero = hero.replace(spanRegex, `*${match[1]}*`);
                match = spanRegex.exec(hero);
            }

            // replace other formatting with italics as well
            match = emRegex.exec(hero);
            while (match) {
                hero = hero.replace(emRegex, `*${match[1]}*`);
                match = emRegex.exec(hero);
            }
            return hero.trim();
        });
        heroes = heroes.join('\n\n'); // join the two famous heroes together into one string
        heroes = parseHtmlEntities(heroes);
        heroesSuccess = true;
    } catch (error) {
        logger.log('News: Couldn\'t parse newspaper famous heroes correctly. Error: ' + error);
    }

    let guilds;
    try {
        const guildRegex = /<h2>Guild Spotlight<\/h2>.*?<p>(.*?)<\/p>.*?<p>(.*?)<\/p>/s;
        guilds = guildRegex.exec(html).slice(1, 3); // gives array with two guilds, but with lots of html
        guilds = guilds.map((guild) => {

            // replace bold html for bold Discord formatting
            let match = boldRegex.exec(guild);
            while (match) {
                guild = guild.replace(boldRegex, `**${match[1]}**`);
                match = boldRegex.exec(guild);
            }

            // replace hyperlink formatting
            match = hyperlinkRegex.exec(guild);
            while (match) {
                let link = (match[1].startsWith('/') ? 'https://godvillegame.com' : '') + match[1];
                link = encodeURI(link);
                guild = guild.replace(hyperlinkRegex, `[${match[2]}](${link})`);
                match = hyperlinkRegex.exec(guild);
            }

            return guild.trim();
        });

        guilds = guilds.join('\n\n'); // join the two guilds together into one string
        guilds = parseHtmlEntities(guilds);
        guildSuccess = true;
    } catch (error) {
        logger.log(`News: Couldn't parse newspaper guild spotlight correctly. Error: ${error}`);
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
        logger.log('News: All parts of the daily newspaper were loaded correctly.');
        return true;
    } else if (forecastSuccess || heroesSuccess || guildSuccess) {
        logger.log('News: Some parts of the daily newspaper failed to load correctly.');
        return true;
    } else {
        logger.log('News: No parts of the daily newspaper loaded correctly, so no daily update will be sent.');
        return false;
    }
}

// used to resolve some funky characters from stuff like hero mottos
function parseHtmlEntities(str) {
    return str.replace(/&#([0-9]{1,3});/gi, function(match, numStr) {
        const num = parseInt(numStr, 10); // read num as normal number
        return String.fromCharCode(num);
    });
}

exports.send = sendNewspaperRequest;
exports.renewAuto = renewNewspaperAutomatic;
exports.renewRequest = renewNewspaperRequest;
exports.load = loadNewspaper;