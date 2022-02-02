/* eslint-disable no-prototype-builtins */
const { owner } = require('../../configurations/config.json');
const main = require('../../index');
const logger = require('../features/logging');
const https = require('https');
const fs = require('fs');
let backupLastUpdated;
let lastUpdated;
let backup = [];
let omnibus;
const refreshBreak = 30;
const expectedAmount = 6000; // right now, the omnibus list has 7357 items.


function loadBackup() {
    try {
        // read backup file
        backup = [];
        fs.readFileSync('./commands/crosswordgod/omniBackup.txt', 'utf-8').split(/\r?\n/).forEach(function(line) {
            backup.push(line);
        });

        backupLastUpdated = parseInt(backup.shift()); // first line is the timestamp
        if (isNaN(backupLastUpdated)) backupLastUpdated = 0; // just set to 1970 if something goes wrong lol
        while (!backup[backup.length - 1].trim().length) backup.pop(); // remove last item(s) if it's just a newline.

        const howLongAgo = Date.now() - backupLastUpdated;
        const days = ~~(howLongAgo / (24 * 60 * 60 * 1000));
        const hours = ~~((howLongAgo % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        logger.log(`OmniBackup: Successfully loaded omnibus backup file with ${backup.length} entries, `
            + `from ${days} ${quantiseWords(days, 'day')} and ${hours} ${quantiseWords(hours, 'hour')} ago.`);

        return true; // true means loaded successfully
    } catch (error) {
        logger.log('OmniBackup: Failed to load in omnibus backup file. ' + error);
        backup = undefined;

        return false; // this means the backup failed to load
    }
}

async function loadOmnibus(startup = false) {
    const html = await downloadOmnibus();
    if (!html) return false; // we don't log jackshit because downloadOmnibus() already does it

    // now we get the individual omnibus entries
    const list = parseOmnibusEntries(html);
    if (!list || list.length < expectedAmount) {
        logger.log('Omnibus: Something went wrong parsing omnibus entries from the html.');
        if (list) logger.log(`Omnibus: There were only ${list.length} items, expected at least ${expectedAmount}.`);
        return false;
    }

    // actually update the list and the timestamp
    omnibus = Array.from(list);
    lastUpdated = Date.now();
    let updateMessage = `Omnibus: Successfully loaded online Omnibus list with ${list.length} entries.`;

    // on startup, also send statistics about how far ahead the omnibus list is.
    if (startup) {
        // get difference between previous backup and new one
        if (!backup || backup.length < expectedAmount) {
            updateMessage += ' The Omnibus backup file was not loaded in (correctly), so I can\'t give statistics about the differences between the backup and current list.';
        } else {
            const notInOmnibus = backup.filter(x => !omnibus.includes(x));
            const notInBackup = omnibus.filter(x => !backup.includes(x));
            updateMessage += `\nOmnibus: Compared to the backup, ${notInBackup.length} ${quantiseWords(notInBackup.length, 'word was', 'words were')} added, and ${notInOmnibus.length} ${quantiseWords(notInOmnibus.length, 'was', 'were')} removed.`;
            if (notInBackup.length !== 0 && notInBackup.length < 50) updateMessage += `\n - Added: ${notInBackup.join(', ')}`;
            if (notInOmnibus.length !== 0 && notInOmnibus.length < 50) updateMessage += `\n - Removed: ${notInOmnibus.join(', ')}`;
            updateMessage += '\n';
        }
    }

    logger.log(updateMessage);
    return true;
}


async function refreshOmnibus(message) {
    const howLongAgo = Date.now() - lastUpdated;
    if (howLongAgo < refreshBreak * 60 * 1000) {
        const minutes = ~~(howLongAgo / (60 * 1000));
        const minutesLeft = refreshBreak - minutes;
        logger.log(`${message.author.tag} requested the Omnibus list to be refreshed, but the command was on cooldown: ${minutesLeft} ${quantiseWords(minutesLeft, 'minute')} left.`);
        return message.reply(`The last attempt at updating the Omnibus list was ${minutes} ${quantiseWords(minutes, 'minute')} ago.`
            + ` To make sure the devs don't get mad at me, please wait ${minutesLeft} more ${quantiseWords(minutesLeft, 'minute')}.`);
    }

    logger.log(message.author.tag + ' requested the stored Omnibus list to be refreshed.');
    const reply = await message.reply('I\'m working on it...'); // we edit this reply when we're done.

    // get html
    lastUpdated = Date.now(); // attempts count as well
    const html = await downloadOmnibus();
    if (!html) {
        return reply.edit('Something went wrong while trying to get the Omnibus list\'s HTML. Try again later or contact the bot owner.');
    }

    // now we get the individual omnibus entries
    const list = parseOmnibusEntries(html);
    if (!list || list.length < expectedAmount) {
        logger.log('Something went wrong parsing omnibus entries from the html.');
        if (list) logger.log(`There were only ${list.length} items, expected at least ${expectedAmount}.`);
        return reply.edit('Something went wrong while parsing the HTML. Try again later or contact the bot owner.');
    }

    // actually update the list and the timestamp
    const oldOmnibus = Array.from(omnibus);
    omnibus = Array.from(list);

    // create nice embed for the update message, which we can add to
    const Discord = main.getDiscord();
    const client = main.getClient();
    const updateEmbed = new Discord.MessageEmbed()
    .setTitle(`⏫ Successfully refreshed online Omnibus list with ${list.length} total entries!`)
    .setColor(0x0092db) // noice blue
    .setFooter({ text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() })
    .setTimestamp();
    // we also update a message for the logs
    let updateMessage = `Omnibus: Successfully refreshed online Omnibus list with ${list.length} total entries!`;

    // get difference between previous list and refreshed one
    if (!oldOmnibus || oldOmnibus.length < expectedAmount) {
        updateEmbed.setDescription('The now replaced Omnibus list was not loaded in (correctly), so I can\'t give statistics about the differences between the previous and this list.');
        updateMessage += 'The now replaced Omnibus list was not loaded in (correctly), so I can\'t give statistics about the differences between the previous and this list.';
    } else {
        const notInOmnibus = oldOmnibus.filter(x => !omnibus.includes(x));
        const notInOld = omnibus.filter(x => !oldOmnibus.includes(x));

        updateEmbed.setDescription(`\nCompared to the previous list, ${notInOld.length} ${quantiseWords(notInOld.length, 'word was', 'words were')} added, and ${notInOmnibus.length} ${quantiseWords(notInOmnibus.length, 'was', 'were')} removed.`);
        updateMessage += `\nOmnibus: Compared to the previous list, ${notInOld.length} ${quantiseWords(notInOld.length, 'word was', 'words were')} added, and ${notInOmnibus.length} ${quantiseWords(notInOmnibus.length, 'was', 'were')} removed.`;


        if (notInOld.length !== 0 && notInOld.length < 50) {
            updateEmbed.addField('Added:', `${notInOld.join(', ')}`);
            updateMessage += '\n - Added: ' + `${notInOld.join(', ')}`;
        }
        if (notInOmnibus.length !== 0 && notInOmnibus.length < 50) {
            updateEmbed.addField('Removed:', `${notInOmnibus.join(', ')}`);
            updateMessage += '\n - Removed: ' + `${notInOmnibus.join(', ')}`;
        }
    }

    logger.log(updateMessage);
    reply.edit({ content: 'Done!', embeds: [updateEmbed] });
}

function getOmnibus() {
    if (!omnibus || omnibus.length < expectedAmount) {
        if (!backup || backup.length < expectedAmount) {
            return null;
        } else {
            return { version: 'backup', omnibusEntries: backup, timestamp: backupLastUpdated };
        }
    } else {
        return { version: 'recent', omnibusEntries: omnibus, timestamp: lastUpdated };
    }
}


async function downloadOmnibus() {
    const URL = 'https://wiki.godvillegame.com/Omnibus_List';
    const timeout = 10;

    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => { // this only needs to reject because if it returns in time that means there is an error
            reject(`Omnibus: Timed out after ${timeout} seconds while getting data from ${URL}.`);
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
            logger.log(`Omnibus: Oops! Something went wrong when downloading from url ${URL}! No data was received.`);
            return null;
        }
        logger.toChannel(`Omnibus: Successfully received html from <${URL}>`); // need separate log to prevent an embed
        logger.toConsole(`Omnibus: Successfully received html from ${URL}`);
        return result;
    }).catch((error) => {
        logger.log(`Omnibus: Oops! Something went wrong when downloading from url ${URL}! Error: ` + error);
        return null;
    });

    return res;
}


function parseOmnibusEntries(omnibusHtml) {
    const artifactRegex = /id="GV-Artifacts".*?<ul>(.*?)<\/ul>/s;
    const monsterRegex = /id="GV-Monsters".*?<ul>(.*?)<\/ul>/s;
    const equipmentRegex = /id="GV-Equipment".*?<ul>(.*?)<\/ul>/s;
    const skillRegex = /id="GV-Skills".*?<ul>(.*?)<\/ul>/s;
    let artifactEntries = artifactRegex.exec(omnibusHtml)[1];
    let monsterEntries = monsterRegex.exec(omnibusHtml)[1];
    let equipmentEntries = equipmentRegex.exec(omnibusHtml)[1];
    let skillEntries = skillRegex.exec(omnibusHtml)[1];

    if (!artifactEntries || !monsterEntries || !equipmentEntries || !skillEntries) return null;
    artifactEntries = artifactEntries.split(/\r?\n/);
    monsterEntries = monsterEntries.split(/\r?\n/);
    equipmentEntries = equipmentEntries.split(/\r?\n/);
    skillEntries = skillEntries.split(/\r?\n/);
    const allListEntries = artifactEntries.concat(monsterEntries, equipmentEntries, skillEntries);
    const allEntries = allListEntries.map(function(e) {
        return e.slice(4, -5).trim();
    });

    // towns are hardcoded because they're not on the same page
    const townEntries = ['Anville', 'Bad Gateway', 'Beerburgh', 'Bosswell', 'Bumchester', 'Dessertown', 'Deville',
        'Dogville', 'Egopolis', 'El Herado', 'Ghost Town', 'Godville', 'Godvillewood', 'Healiopolis', 'Heisenburg',
        'Herolympus', 'Herostan', 'Herowin', 'Laplandville', 'Last Resort', 'Los Adminos', 'Los Demonos', 'Lostway',
        'Monsterdam', 'Monstro City', 'Newland', 'Next Station', 'Nothingham', 'Quirkytown', 'Roflopolis', 'San Satanos',
        'Simpletown', 'Tradeburg', 'Trollbridge', 'Unsettlement', 'Unspecifiedistan'];

    // add towns and remove duplicates before returning
    const seen = {};
    return allEntries.concat(townEntries).filter(function(item) {
        return seen.hasOwnProperty(item.toLowerCase()) ? false : (seen[item.toLowerCase()] = true);
    });
}


async function createBackup(message) {
    if (!owner.includes(message.author.id)) return message.reply('Only the bot owner can create new backups.'); // hehe nope
    logger.log(`${message.author.tag} is trying to create a new omnibus backup file...`);
    const reply = await message.reply('Trying to create a new omnibus backup file...');
    const result = await createBackupFile();
    return reply.edit(result);
}

async function createBackupFile() {
    if (!await loadOmnibus()) {
        logger.log('Omnibus: Something went wrong loading the online omnibus list.');
        return 'Something went wrong loading the online omnibus list. No new backup file could be made.';
    }

    // get difference between previous backup and new one
    let successMessage = `Omnibus: The list was successfully downloaded and a new backup was made with ${omnibus.length} entries.`;
    if (!backup || backup.length < expectedAmount) {
        successMessage += ' The backup file was not loaded in correctly - I can\'t compare the new and old backup.';
        logger.log('Omnibus: Omnibus backup file was not loaded in correctly - I can\'t compare the new and old backup.');
    } else {
        const notInOmnibus = backup.filter(x => !omnibus.includes(x));
        const notInBackup = omnibus.filter(x => !backup.includes(x));
        successMessage += `\nOmnibus: ${notInBackup.length} ${quantiseWords(notInBackup.length, 'word was', 'words were')} added, and ${notInOmnibus.length} ${quantiseWords(notInOmnibus.length, 'was', 'were')} removed.`;
        if (notInBackup.length !== 0 && notInBackup.length < 50) successMessage += `\n - Added: ${notInBackup.join(', ')}`;
        if (notInOmnibus.length !== 0 && notInOmnibus.length < 50) successMessage += `\n - Removed: ${notInOmnibus.join(', ')}`;
    }

    // now we can create a new omniBackup.txt
    try {
        const updateTime = Date.now();
        const backupFile = fs.createWriteStream('./commands/crosswordgod/omniBackup.txt', {
            flags: 'w',
        });
        backupFile.write(`${updateTime}\n`); // record the time backup was last updated on the first line
        omnibus.forEach(element => {
            backupFile.write(`${element}\n`);
        });
        backupFile.close();

        backup = Array.from(omnibus);
        backupLastUpdated = updateTime; // set last update time only when old backup variable is replaced
        logger.log(successMessage);
        return successMessage;

    } catch (error) {
        logger.log('Omnibus: Something went wrong while creating the new omnibus backup file. Try to repair it manually. ' + error);
        return 'Something went wrong while creating the new omnibus backup file. Try to repair it manually.\n' + error;
    }

}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;


exports.loadOnline = loadOmnibus;
exports.loadBackup = loadBackup;
exports.refresh = refreshOmnibus;
exports.get = getOmnibus;
exports.createBackup = createBackup;
exports.createBackupFile = createBackupFile;