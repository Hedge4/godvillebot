/* eslint-disable no-prototype-builtins */
const { owner } = require('../../configurations/config.json');
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
        logger.log(`OmniBackup: Succesfully loaded omnibus backup file with ${backup.length} entries, `
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
    if (!html) return false;

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
    let updateMessage = `Omnibus: Succesfully loaded online Omnibus list with ${list.length} entries.`;

    // on startup, also send statistics about how far ahead the omnibus list is.
    if (startup) {
        // get difference between previous backup and new one
        if (!backup || backup.length < expectedAmount) {
            updateMessage += ' The Omnibus backup file was not loaded in (correctly), so I can\'t give statistics about the differences between the backup and current list.';
        } else {
            const notInOmnibus = backup.filter(x => !omnibus.includes(x));
            const notInBackup = omnibus.filter(x => !backup.includes(x));
            updateMessage += `\nOmnibus: Compared to the backup, ${notInBackup.length} ${quantiseWords(notInBackup.length, 'word was', 'words were')} added, and ${notInOmnibus.length} ${quantiseWords(notInOmnibus.length, 'was', 'were')} removed.`;
            if (notInBackup.length !== 0 && notInBackup.length < 50) updateMessage += `\n Added: ${notInBackup.join(', ')}`;
            if (notInOmnibus.length !== 0 && notInOmnibus.length < 50) updateMessage += `\n Removed: ${notInOmnibus.join(', ')}`;
            updateMessage += '\n';
        }
    }

    logger.log(updateMessage);
    return true;
}


async function refreshOmnibus(message, Discord, client) {
    const howLongAgo = Date.now() - lastUpdated;
    if (howLongAgo < refreshBreak * 60 * 1000) {
        const minutes = ~~(howLongAgo / (60 * 1000));
        const minutesLeft = refreshBreak - minutes;
        logger.log(`${message.author.tag} requested the Omnibus list to be refreshed, but the command was on cooldown: ${minutesLeft} ${quantiseWords(minutesLeft, 'minute')} left.`);
        return message.reply(`the Omnibus list was last updated ${minutes} ${quantiseWords(minutes, 'minute')} ago.`
            + ` To make sure the devs don't get mad at me, please wait ${minutesLeft} more ${quantiseWords(minutesLeft, 'minute')}.`);
    }

    logger.log(message.author.tag + ' requested the stored Omnibus list to be refreshed.');
    const reply = await message.reply('I\'m working on it...'); // we edit this reply when we're done.
    const requester = `<@${message.author.id}>`;

    // get html
    const html = await downloadOmnibus();
    if (!html) {
        return reply.edit(requester + ', something went wrong while trying to get the Omnibus list\'s HTML. Try again later or contact the bot owner.');
    }

    // now we get the individual omnibus entries
    const list = parseOmnibusEntries(html);
    if (!list || list.length < expectedAmount) {
        logger.log('Something went wrong parsing omnibus entries from the html.');
        if (list) logger.log(`There were only ${list.length} items, expected at least ${expectedAmount}.`);
        return reply.edit(requester + ', something went wrong while parsing the HTML. Try again later or contact the bot owner.');
    }

    // actually update the list and the timestamp
    const oldOmnibus = Array.from(omnibus);
    omnibus = Array.from(list);
    lastUpdated = Date.now();

    // create nice embed for the update message, which we can add to
    const updateEmbed = new Discord.MessageEmbed()
    .setTitle(`⏫ Succesfully refreshed online Omnibus list with ${list.length} total entries!`)
    .setColor(0x0092db) // noice blue
    .setFooter({ text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() })
    .setTimestamp();
    // we also update a message for the logs
    let updateMessage = `Succesfully refreshed online Omnibus list with ${list.length} total entries!`;

    // get difference between previous list and refreshed one
    if (!oldOmnibus || oldOmnibus.length < expectedAmount) {
        updateEmbed.setDescription('The now replaced Omnibus list was not loaded in (correctly), so I can\'t give statistics about the differences between the previous and this list.');
        updateMessage += 'The now replaced Omnibus list was not loaded in (correctly), so I can\'t give statistics about the differences between the previous and this list.';
    } else {
        const notInOmnibus = oldOmnibus.filter(x => !omnibus.includes(x));
        const notInOld = omnibus.filter(x => !oldOmnibus.includes(x));

        updateEmbed.setDescription(`\nCompared to the previous list, ${notInOld.length} ${quantiseWords(notInOld.length, 'word was', 'words were')} added, and ${notInOmnibus.length} ${quantiseWords(notInOmnibus.length, 'was', 'were')} removed.`);
        updateMessage += `\nCompared to the previous list, ${notInOld.length} ${quantiseWords(notInOld.length, 'word was', 'words were')} added, and ${notInOmnibus.length} ${quantiseWords(notInOmnibus.length, 'was', 'were')} removed.`;


        if (notInOld.length !== 0 && notInOld.length < 50) {
            updateEmbed.addField('Added:', `${notInOld.join(', ')}`);
            updateMessage += '\nAdded: ' + `${notInOld.join(', ')}`;
        }
        if (notInOmnibus.length !== 0 && notInOmnibus.length < 50) {
            updateEmbed.addField('Removed:', `${notInOmnibus.join(', ')}`);
            updateMessage += '\nRemoved: ' + `${notInOmnibus.join(', ')}`;
        }
    }

    logger.log(updateMessage);
    reply.edit('done!', { embeds: [updateEmbed] });
}

function getOmnibus() {
    if (!omnibus || omnibus.length < expectedAmount) {
        if (!backup || backup.length < expectedAmount) {
            return null;
        } else {
            //return ['backup', backup, backupLastUpdated];
            return { version: 'backup', omnibusEntries: backup, timestamp: backupLastUpdated };
        }
    } else {
        return { version: 'current', omnibusEntries: omnibus, timestamp: lastUpdated };
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
        logger.toChannel(`Omnibus: Received html from <${URL}> succesfully.`); // need separate log to prevent an embed
        logger.toConsole(`Omnibus: Received html from ${URL} succesfully.`);
        return result;
    }).catch((error) => {
        logger.log(`Omnibus: Oops! Something went wrong when downloading from url ${URL}! Error: ` + error);
        return null;
    });

    return res;
}


function parseOmnibusEntries(omnibusHtml) {
    const artifactRegex = /id="GV-Artifacts".*?<ul>(.*?)<\/ul>/gs;
    const monsterRegex = /id="GV-Monsters".*?<ul>(.*?)<\/ul>/gs;
    const equipmentRegex = /id="GV-Equipment".*?<ul>(.*?)<\/ul>/gs;
    let artifactEntries = artifactRegex.exec(omnibusHtml)[1];
    let monsterEntries = monsterRegex.exec(omnibusHtml)[1];
    let equipmentEntries = equipmentRegex.exec(omnibusHtml)[1];

    if (!artifactEntries || !monsterEntries || !equipmentEntries) return null;
    artifactEntries = artifactEntries.split(/\r?\n/);
    monsterEntries = monsterEntries.split(/\r?\n/);
    equipmentEntries = equipmentEntries.split(/\r?\n/);
    const allListEntries = artifactEntries.concat(monsterEntries, equipmentEntries);
    const allEntries = allListEntries.map(function(e) {
        return e.slice(4, -5);
    });

    // remove duplicates before returning
    const seen = {};
    return allEntries.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}


async function createBackup(message) {
    if (!owner.includes(message.author.id)) return message.reply('only the bot owner can create new backups.'); // hehe nope
    logger.log(`${message.author.tag} is trying to create a new omnibus backup file...`);
    const result = await createBackupFile();
    return message.channel.send(`<@${message.author.id}>: ${result}`);
}

async function createBackupFile() {
    if (!await loadOmnibus()) {
        logger.log('Omnibus: Something went wrong loading the online omnibus list.');
        return 'Something went wrong loading the online omnibus list. No new backup file could be made.';
    }

    // get difference between previous backup and new one
    let successMessage = `Omnibus: The list was succesfully downloaded and a new backup was made with ${omnibus.length} entries.`;
    if (!backup || backup.length < expectedAmount) {
        logger.log('Omnibus: Omnibus backup file was not loaded in correctly - I can\'t compare the new and old backup.');
    } else {
        const notInOmnibus = backup.filter(x => !omnibus.includes(x));
        const notInBackup = omnibus.filter(x => !backup.includes(x));
        successMessage += `\nOmnibus: ${notInBackup.length} ${quantiseWords(notInBackup.length, 'word was', 'words were')} added, and ${notInOmnibus.length} ${quantiseWords(notInOmnibus.length, 'was', 'were')} removed.`;
        if (notInBackup.length !== 0 && notInBackup.length < 50) successMessage += `\nAdded: ${notInBackup.join(', ')}`;
        if (notInOmnibus.length !== 0 && notInOmnibus.length < 50) successMessage += `\nRemoved: ${notInOmnibus.join(', ')}`;
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