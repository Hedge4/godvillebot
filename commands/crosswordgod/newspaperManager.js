const { adminRole } = require('../../configurations/config.json');
const logger = require('../features/logging');
const https = require('https');


// used when a user requests the newspaper to send a reply before sending the newspaper
async function sendNewspaperRequest(message, Discord) {
    //
}

// sends newspaper to specified channel using upper scope variable + formats it nicely as multiple embeds
async function sendNewspaper(channel, Discord) {
    //
}


// method used when a user renews the newspaper, not the automatic timer
async function renewNewspaperRequest(message, Discord) {
    if (!message.member.roles.cache.has(adminRole)) return message.reply('only moderators can forcefully renew the newspaper.');
    logger.log(`${message.author.tag} forcefully started the newspaper renewing process in ${message.channel}.`);
    const reply = await message.reply('I\'m working on it...');
    const requester = `<@${message.author.id}>`;

    renewNewspaper(message.channel, Discord).then((success) => {
        if(success) {
            reply.edit(requester + ', done!'); // we don't need to send the newspaper because renewNewspaper() does that already
        } else {
            reply.delete();
            message.reply('something went wrong while trying to renew the newspaper content. You can check the logs to find out what happened.');
        }
    });
}

// method used both when a user or when a timer renews the newspaper. Returns true/false for success + sends in channel
async function renewNewspaper(channel, Discord) {
    //

    // we end by sending the newspaper to the channel
    sendNewspaper(channel, Discord);
}


// main function, loads the newspaper and stores it in upper scope variable. Called on startup, returns true/false for success
async function loadNewspaper() {
    // start with getting the HTML of the newspaper
    const html = await downloadNewspaper();
    if (!html) {
        //
        return false;
    }

    const news = parseNewspaper(html);
    // check for errors here

    // store in upper scope here
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
    //
}

exports.send = sendNewspaperRequest;
exports.renew = renewNewspaper;
exports.renewRequest = renewNewspaperRequest;
exports.load = loadNewspaper;