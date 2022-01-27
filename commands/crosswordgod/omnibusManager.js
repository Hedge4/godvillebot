const https = require('https');
const logger = require('../features/logging');
let lastUpdated;
let backup; // probably don't store this upper scope. Free up ram
let omnibus;

async function loadOmnibus() {
    const html = await downloadOmnibus();

    // now we get the individual omnibus entries
    const list = parseOmnibusEntries(html);
    if (!list) {
        logger.log('Something went wrong parsing omnibus entries from the html.');
        return false;
    }

    lastUpdated = Date.now();
    return true;
}

async function refreshOmnibus(message) {
    //
}

function getOmnibus() {
    //
}

async function downloadOmnibus() {
    const URL = 'https://wiki.godvillegame.com/Omnibus_List';
    const timeout = 10;

    const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
            resolve(`Timed out after ${timeout} seconds while getting data from ${URL}.`);
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
            logger.log(`Oops! Something went wrong when downloading from url ${URL}! No data was received.`);
            return null;
        }
        logger.log(`Received html from ${URL} succesfully.`);
        return result;
    }).catch((error) => {
        logger.log(`Oops! Something went wrong when downloading from url ${URL}! Error: ` + error);
        return null;
    });

    return res;
}

function parseOmnibusEntries(omnibusHtml) {
    const artifactRegex = /id="GV-Monsters".*?<ul>(.*?)<\/ul>/gs;
    const monsterRegex = /id="GV-Monsters".*?<ul>(.*?)<\/ul>/gs;
    const equipmentRegex = /id="GV-Monsters".*?<ul>(.*?)<\/ul>/gs;
    const artifactEntries = artifactRegex.exec(omnibusHtml)[1];
    const monsterEntries = monsterRegex.exec(omnibusHtml)[1];
    const equipmentEntries = equipmentRegex.exec(omnibusHtml)[1];

    if (!artifactEntries || !monsterEntries || !equipmentEntries) return null;
    const allListEntries = artifactEntries.concat(monsterEntries + equipmentEntries).split(/\r?\n/);
    const allEntries = allListEntries.map(function(e) {
        return e.slice(4, -5);
    });

    return allEntries;
}

exports.load = loadOmnibus;
exports.refresh = refreshOmnibus;
exports.get = getOmnibus;