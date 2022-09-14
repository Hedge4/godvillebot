/* eslint-disable no-constant-condition */
const { prefix, botvilleChannel, botDmLogs } = require('../../configurations/config.json');
const logger = require('./logging');

// basic setup for contests through the bot's DMs
let contestAuthors = '', contestTotal = 0;
const contestRunning = false, contestMaxSubmissions = 5, contestMaxL = 25, contestMinL = 1;
const contestSubmissions = '824031930562773046', contestTracking = '824031951911649330';

// function to handle any received DMs
function handleDMs(message, client) {
    if (contestRunning && message.content.startsWith('+')) {
        return enterDMContest(message, client);
    }
    let msg = `I don't currently respond to DMs. If you want such a feature to be added, contact the bot owner (Wawajabba) or use \`${prefix}suggest\` in <#${botvilleChannel}>.`;
    if (contestRunning) msg += '\n\nDid you want to enter the current contest? Then make sure you type \'+\' before your entry.';
    message.reply(msg);

    // only log to console because logs are public
    logger.toConsole(`A DM with ID ${message.id} was sent to the bot by '` + message.author.tag + '\' / ' + message.author.id + '\'. The content was: \'' + message.content + '\'');
    client.channels.cache.get(botDmLogs).send(`**'${message.author.tag}' / ${message.author.id} sent this message with id ${message.id} in my DMs:**`);
    const attachments = [];
    message.attachments.forEach(element => {
        attachments.push(element.url);
    });
    client.channels.cache.get(botDmLogs).send({ content: message.content, files: attachments })
        .catch(err => client.channels.cache.get(botDmLogs).send(`Failed to forward: ${err}`));
}

// in case there's a bot DM contest running, check how many submissions were submitted already
async function checkDMContest(client) {
    if (!contestRunning) return;
    const channel = client.channels.cache.get(contestTracking);
    let last_id;

    while (true) {
        const options = { limit: 100 };
        if (last_id) {
            options.before = last_id;
        }

        const messages = await channel.messages.fetch(options);
        if (messages.size < 1) break;
        messages.forEach(e => {
            contestAuthors += e.content;
            contestTotal++;
        });
        last_id = messages.last().id;

        if (messages.size != 100) {
            break;
        }
    }
}

// logic to determine if someone's submission is valid and add it to the previous submissions
function enterDMContest(message, client) {
    const msg = message.content.slice(1).trim();
    if (msg.length > contestMaxL) return message.reply(`Contest entries can be ${contestMaxL} characters at most. Your entry was ${msg.length} characters long.`);
    if (msg.length < contestMinL) return message.reply(`Your entry for this contest must be at least ${contestMinL} characters long.`);
    const id = message.author.id.toString();
    let count = 0, pos = 0;
    while (true) {
        pos = contestAuthors.indexOf(id, pos);
        if (pos >= 0) {
            count++;
            pos += id.length;
        } else { break; }
    }
    if (count >= 5) return message.reply(`You can only have ${contestMaxSubmissions} entries in this contest.`);
    contestAuthors += message.author.id;
    message.reply(`Your entry was accepted. You have ${contestMaxSubmissions - 1 - count} entries left.`);
    client.channels.cache.get(contestSubmissions).send(`${contestTotal} => ${msg}`);
    client.channels.cache.get(contestTracking).send(`${contestTotal}, ${message.author.tag}, ${message.author.id}`);
    contestTotal++;
}

exports.handleDMs = handleDMs;
exports.checkDMContest = checkDMContest;