/* eslint-disable no-prototype-builtins */
const { botOwners, botName } = require('../../configurations/config.json');
const main = require('../../index');
const logger = require('../features/logging');

const Discord = require('discord.js'); // TODO: remove, import only the specifically needed part
const https = require('https');
const fs = require('fs');

let backupLastUpdated;
let lastUpdated;
let nextUpdateTimer;
let backup = [];
let omnibus;
const refreshBreak = 15;
const autoUpdateDelay = 60 * 24;
const expectedAmount = 6000; // right now, the omnibus list has 7357 items.


async function backupStartup() {
    // try to load the backup file
    try {
        // read backup file
        backup = [];
        fs.readFileSync('./commands/crosswordgod/omniBackup.txt', 'utf-8').split(/\r?\n/).forEach(function(line) {
            backup.push(line);
        });

        // error if the file is empty
        if (!backup.length || backup.every(function(e) {
            return !e.length ? true : false; // check if every item in backup has no length
        })) {
            throw ('Loaded file was empty.');
        }

        backupLastUpdated = parseInt(backup.shift()); // first line is the timestamp
        if (isNaN(backupLastUpdated)) backupLastUpdated = 0; // just set to 1970 if something goes wrong lol
        while (!backup[backup.length - 1].trim().length) backup.pop(); // remove last item(s) if it's just a newline.

        const howLongAgo = Date.now() - backupLastUpdated;
        const days = ~~(howLongAgo / (24 * 60 * 60 * 1000));
        const hours = ~~((howLongAgo % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        logger.log(`OmniBackup: Successfully loaded omnibus backup file with ${backup.length} entries, `
            + `from ${days} ${quantiseWords(days, 'day')} and ${hours} ${quantiseWords(hours, 'hour')} ago.`);

    } catch (error) {
        logger.log('OmniBackup: Failed to load in omnibus backup file. ' + error);
        backup = undefined;
    }
}

async function omnibusStartup(auto = false) {
    if (auto) logger.log('Omnibus: Automatically trying to download and parse a newer Omnibus list...');

    // load the online list and compare it to the backup
    if (!await loadOmnibus()) {
        logger.log('Omnibus: Something went wrong loading the online omnibus list.');
        return;
    }

    // send statistics about how far ahead the omnibus list is.
    let updateMessage = `Omnibus: Successfully loaded online Omnibus list with ${omnibus.length} entries.`;
    // get difference between previous backup and new one
    if (!backup || backup.length < expectedAmount) {
        updateMessage += ' The Omnibus backup file was not loaded in (correctly), so I can\'t give information about the differences between the backup and current list.';
    } else {
        const notInOmnibus = backup.filter(x => !omnibus.includes(x));
        const notInBackup = omnibus.filter(x => !backup.includes(x));

        let addedText = notInBackup.join(', ');
        let removedText = notInOmnibus.join(', ');
        // there is a 2000 characters limit so cap the added/removed parts to 906 chars to be safe
        if (addedText.length > 900) addedText = addedText.substring(0, 900) + ' (...)';
        if (removedText.length > 900) removedText = removedText.substring(0, 900) + ' (...)';

        updateMessage += `\nOmnibus: Compared to the backup, ${notInBackup.length} ${quantiseWords(notInBackup.length, 'word was', 'words were')} added, and ${notInOmnibus.length} ${quantiseWords(notInOmnibus.length, 'was', 'were')} removed.`;
        if (notInBackup.length !== 0) updateMessage += `\n - Added: ${addedText}`;
        if (notInOmnibus.length !== 0) updateMessage += `\n - Removed: ${removedText}`;
        updateMessage += '\n';
    }
    logger.log(updateMessage);
}

// loading the omnibus is always logged, just not always here
async function loadOmnibus() {
    // any attempt counts, so we don't access the wiki too often
    lastUpdated = Date.now();

    // cancel next update attempt
    if (nextUpdateTimer && !nextUpdateTimer._destroyed) {
        clearTimeout(nextUpdateTimer);
    }
    // schedule new automatic update
    nextUpdateTimer = setTimeout(function() {
        omnibusStartup(true);
    }, autoUpdateDelay * 60 * 1000);
    logger.log(`Omnibus: Scheduled next automatic update ${autoUpdateDelay} minutes from now.`);

    const html = await downloadOmnibus();
    if (!html) {
        // we don't log anything because downloadOmnibus() already does it
        return false;
    }

    // now we get the individual omnibus entries
    const list = parseOmnibusEntries(html);
    if (!list || list.length < expectedAmount) {
        logger.log('Omnibus: Something went wrong parsing omnibus entries from the html.');
        if (list) logger.log(`Omnibus: There were only ${list.length} items, expected at least ${expectedAmount}.`);
        return false;
    }

    // actually update the list and the timestamp
    omnibus = Array.from(list);

    return true;
}


async function refreshOmnibus(message) {
    const howLongAgo = Date.now() - lastUpdated;
    if (!Object.values(botOwners).includes(message.author.id) && howLongAgo < refreshBreak * 60 * 1000) {
        const minutes = ~~(howLongAgo / (60 * 1000));
        const minutesLeft = refreshBreak - minutes;
        logger.log(`${message.author.tag} requested the Omnibus list to be refreshed, but the command was on cooldown: ${minutesLeft} ${quantiseWords(minutesLeft, 'minute')} left.`);
        message.reply(`The last attempt at updating the Omnibus list was ${minutes} ${quantiseWords(minutes, 'minute')} ago.` + ` To make sure the devs don't get mad at me, please wait ${minutesLeft} more ${quantiseWords(minutesLeft, 'minute')}.`);
        return;
    }

    logger.log(`Omnibus: ${message.author.tag} requested the stored Omnibus list to be refreshed.`);
    const reply = await message.reply('I\'m working on it...'); // we edit this reply when we're done.

    // try to refresh the omnibus list
    if (!await loadOmnibus()) {
        logger.log('Omnibus: Something went wrong loading the online omnibus list. Try again later or contact the bot owner.');
        reply.edit('Something went wrong loading the online omnibus list. Try again later or contact the bot owner.');
        return;
    }

    // actually update the list and the timestamp
    const oldOmnibus = Array.from(omnibus);

    // create nice embed for the update message, which we can add to
    const client = main.getClient();
    const updateEmbed = new Discord.EmbedBuilder()
        .setTitle(`⏫ Successfully refreshed online Omnibus list with ${omnibus.length} total entries!`)
        .setColor(0x0092db) // noice blue
        .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: client.user.avatarURL() })
        .setTimestamp();
    // we also update a message for the logs
    let updateMessage = `Omnibus: Successfully refreshed online Omnibus list with ${omnibus.length} total entries!`;

    // get difference between previous list and refreshed one
    if (!oldOmnibus || oldOmnibus.length < expectedAmount) {
        updateEmbed.setDescription('The now replaced Omnibus list was not loaded in (correctly), so I can\'t give information about the differences between the previous and this list.');
        updateMessage += 'The now replaced Omnibus list was not loaded in (correctly), so I can\'t give information about the differences between the previous and this list.';
    } else {
        const notInOmnibus = oldOmnibus.filter(x => !omnibus.includes(x));
        const notInOld = omnibus.filter(x => !oldOmnibus.includes(x));

        updateEmbed.setDescription(`\nCompared to the previous list, ${notInOld.length} ${quantiseWords(notInOld.length, 'word was', 'words were')} added, and ${notInOmnibus.length} ${quantiseWords(notInOmnibus.length, 'was', 'were')} removed.`);
        updateMessage += `\nOmnibus: Compared to the previous list, ${notInOld.length} ${quantiseWords(notInOld.length, 'word was', 'words were')} added, and ${notInOmnibus.length} ${quantiseWords(notInOmnibus.length, 'was', 'were')} removed.`;


        if (notInOld.length !== 0) {
            let addedText = notInOld.join(', ');
            // there is a 1024 character limit so limit the text to 906 chars to be safe
            if (addedText.length > 900) addedText = addedText.substring(0, 900) + ' (...)';
            updateEmbed.addFields([{ name: 'Added:', value: `${addedText}` }]);
            updateMessage += '\n - Added: ' + `${addedText}`;
        }
        if (notInOmnibus.length !== 0) {
            let removedText = notInOmnibus.join(', ');
            // there is a 1024 character limit so limit the text to 906 chars to be safe
            if (removedText.length > 900) removedText = removedText.substring(0, 900) + ' (...)';
            updateEmbed.addFields([{ name: 'Removed:', value: `${removedText}` }]);
            updateMessage += '\n - Removed: ' + `${removedText}`;
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
    if (!Object.values(botOwners).includes(message.author.id)) {
        message.reply('Only the bot owner can create new backups.'); // hehe nope
        return;
    }
    logger.log(`Omnibus: ${message.author.tag} is trying to create a new omnibus backup file...`);
    const reply = await message.reply('Trying to create a new omnibus backup file...');
    const result = await createBackupFile();

    // if there was no error then Error property will be undefined
    if (result.Error) {
        reply.edit(result.Error);
        return;
    }

    // create nice embed for the backup update message
    const client = main.getClient();
    const backupUpdateEmbed = new Discord.EmbedBuilder()
        .setTitle(result.Title)
        .setDescription(result.Description)
        .setColor(0x0092db) // noice blue
        .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: client.user.avatarURL() })
        .setTimestamp();

    // lastly, add fields based on if the object has them, then send
    if (result.Added) backupUpdateEmbed.addFields([{ name: 'Added:', value: result.Added }]);
    if (result.Removed) backupUpdateEmbed.addFields([{ name: 'Removed:', value: result.Removed }]);
    reply.edit({ embeds: [backupUpdateEmbed] }).catch(error => logger.log(error));
    return;
}

async function createBackupFile() {
    if (!await loadOmnibus()) {
        logger.log('Omnibus: Something went wrong loading the online omnibus list.');
        return { Error: 'Something went wrong loading the online omnibus list. No new backup file could be made.' };
    }

    // get difference between previous backup and new one
    const embedContent = {};
    embedContent.Title = `⏫ Successfully created a new Omnibus list backup with ${omnibus.length} total entries!`;
    let successMessage = `Omnibus: The list was successfully downloaded and a new backup was made with ${omnibus.length} entries.`;
    if (!backup || backup.length < expectedAmount) {
        embedContent.Description = 'The backup file was not loaded in correctly - I can\'t compare the new and old backup.';
        successMessage += '\nOmnibus: The backup file was not loaded in correctly - I can\'t compare the new and old backup.';
    } else {
        const notInOmnibus = backup.filter(x => !omnibus.includes(x));
        const notInBackup = omnibus.filter(x => !backup.includes(x));
        embedContent.Description = `${notInBackup.length} ${quantiseWords(notInBackup.length, 'word was', 'words were')} added, and ${notInOmnibus.length} ${quantiseWords(notInOmnibus.length, 'was', 'were')} removed.`;
        successMessage += `\nOmnibus: ${embedContent.Description}`;

        if (notInBackup.length !== 0) {
            let addedText = notInBackup.join(', ');
            // there is a 1024 character limit so limit the text to 906 chars to be safe
            if (addedText.length > 900) addedText = addedText.substring(0, 900) + ' (...)';
            embedContent.Added = addedText;
            successMessage += `\n - Added: ${addedText}`;
        }
        if (notInOmnibus.length !== 0) {
            let removedText = notInOmnibus.join(', ');
            // there is a 1024 character limit so limit the text to 906 chars to be safe
            if (removedText.length > 900) removedText = removedText.substring(0, 900) + ' (...)';
            embedContent.Removed = removedText;
            successMessage += `\n - Removed: ${removedText}`;
        }
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
        return embedContent;

    } catch (error) {
        logger.log('Omnibus: Something went wrong while creating the new omnibus backup file. Try to repair it manually. ' + error);
        return { Error: 'Something went wrong while creating the new omnibus backup file. Try to repair it manually.\n' + error };
    }
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;


exports.loadBackup = backupStartup;
exports.loadOmnibus = omnibusStartup;
exports.refresh = refreshOmnibus;
exports.get = getOmnibus;
exports.createBackup = createBackup;