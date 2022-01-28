const { adminRole, prefix } = require('../../configurations/config.json');
const logger = require('../features/logging');
const https = require('https');
const news = {
    edition: undefined,
    forecast: undefined,
    famous: undefined,
    spotlight: undefined,
};


// used when a user requests the newspaper to send a reply before sending the newspaper
function sendNewspaperRequest(message, Discord) {
    message.reply('here is today\'s Godville Times summary!');
    sendNewspaper(message.channel, Discord);
    logger.log(`${message.author.tag} requested the Godville Times summary in ${message.channel.name}.`);
}

// sends newspaper to specified channel using upper scope variable + formats it nicely as multiple embeds
function sendNewspaper(channel, Discord) {
    // send introduction thingy with crosswordgod logo and edition no.
    // send daily forecast embed
    // send famous heroes
    // send guild spotlight

    // send all in the same message (.send({ embed: [] });)
    // optional: mention any users who are in the news

    // log saying it was successfully sent with edition no. in it
}


// method used when a user renews the newspaper, not the automatic timer. Doesn't send in logs
async function renewNewspaperRequest(message, Discord) {
    if (!message.member.roles.cache.has(adminRole)) return message.reply('only moderators can forcefully renew the newspaper.');
    logger.log(`${message.author.tag} forcefully started the newspaper renewing process in ${message.channel}.`);
    const reply = await message.reply('I\'m working on it...');

    await loadNewspaper().then((succes) => {
        if (!succes) { // on fail, just let whoever used the command know. loadNewspaper() does the logging already
            reply.delete();
            return message.reply('something went wrong while trying to renew the newspaper content. You can check the logs to find out what happened.');
        }
    });

    // we end by sending the newspaper to the channel
    message.reply('done! Here is the renewed Godville Times:');
    sendNewspaper(message.channel, Discord);
}

// method used for timed renewing. Returns true/false for success, and pushes news to the logs
async function renewNewspaperAutomatic(channel, Discord) {
    channel.send('♻️ Renewing my Godville Times summary... ♻️');
    // upper method allready logged that this process is starting

    await loadNewspaper(true).then((succes) => {
        if (!succes) {
            channel.send('⚠️ Oops! ⚠️ Something went wrong, and I couldn\'t load the new newspaper...'
                + `You can ask a moderator to force another update with \`${prefix}renew\`.`);
            return;
        }
    });

    // we end by sending the newspaper to the channel
    channel.send('Succesfully renewed! Here is the new Godville Times edition: 🗞️');
    sendNewspaper(channel, Discord);
}


// main function, loads the newspaper and stores it in upper scope variable. Called on startup, returns true/false for success
async function loadNewspaper(sendLogs = false) {
    // start with getting the HTML of the newspaper
    const html = await downloadNewspaper();
    if (!html) {
        return false; // only return false, this is already logged in downloadNewspaper()
    }

    await parseNewspaper(html).then((success) => {
        if (!success) {
            return false; // no need to log anything, this is done in parseNewspaper()
        }
    });

    if (sendLogs) { // send the news to the logs for timed renews
        //logger.toConsole();
        //logger.toChannel();
    }
    return true;
}

// downloads the HTML
async function downloadNewspaper() {
    const URL = 'https://godvillegame.com/News';
    const timeout = 10;

    const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
            resolve(`News: Timed out after ${timeout} seconds while getting data from ${URL}.`);
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
        logger.log(`News: Received html from ${URL} succesfully.`);
        return result;
    }).catch((error) => {
        logger.log(`News: Oops! Something went wrong when downloading from url ${URL}! Error: ` + error);
        return null;
    });

    return res;
}

// parses different newspaper components and returns them as an object, or returns null on error
async function parseNewspaper(html) {
    // parse edition
    // parse forecast
    // parse famous heroes
    // parse guild spotlight

    // check for errors + log them

    // store in upper scope after finding

    // return true/false for success
}

exports.send = sendNewspaperRequest;
exports.renewAuto = renewNewspaperAutomatic;
exports.renewRequest = renewNewspaperRequest;
exports.load = loadNewspaper;