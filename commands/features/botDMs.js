/* eslint-disable no-constant-condition */
const { prefix, channels } = require('../../configurations/config.json');
const logger = require('./logging');

// basic setup for contests through the bot's DMs
let contestTotal = 0, contestSetupDone = false;
const contestRunning = false, contestMaxSubmissions = 15, contestMaxL = 200, contestMinL = 5;
const contestAuthors = {}, eventName = 'Christmas images event', eventPrefix = '+';
const contestSubmissions = '824031930562773046', contestTracking = '824031951911649330';
// emojis to react with to contest submissions
const reactList = ['1040369648551612487', '1040369978311987310'];

// function to handle any received DMs
function handleDMs(message, client) {
    if (contestRunning && message.content.startsWith(eventPrefix)) {
        return enterDMContest(message, client);
    }
    let msg = `I don't currently respond to DMs. If you want such a feature to be added, contact the bot owner (Wawajabba) or use \`${prefix}suggest\` in <#${channels.botville}>.`;
    if (contestRunning) msg += `\nDid you want to make a submission for the ${eventName}? Then make sure you type '${eventPrefix}' before your entry.`;
    message.reply(msg);

    // only log to console because logs are public
    logger.toConsole(`A DM with ID ${message.id} was sent to the bot by '${message.author.tag}'/${message.author.id}. The content was: '${message.content}'`);
    client.channels.cache.get(channels.dmLogs).send(`**'${message.author.tag}' / ${message.author.id} sent this message with id ${message.id} in my DMs:**`);
    const attachments = [];
    message.attachments.forEach(element => {
        attachments.push(element.url);
    });
    client.channels.cache.get(channels.dmLogs).send({ content: message.content, files: attachments })
        .catch(err => client.channels.cache.get(channels.dmLogs).send(`Failed to forward: ${err}`));
}

// in case there's a bot DM contest running, check how many submissions were submitted already
async function checkDMContest(client) {
    if (!contestRunning) return;
    const channel = client.channels.cache.get(contestTracking);
    let lastId;

    // keep fetching messages until there are no more, or we find a 'RESET' message
    while (true) {
        const options = { limit: 100 };
        if (lastId) {
            // for any loops after the first one
            options.before = lastId;
        }

        const messages = await channel.messages.fetch(options);
        // if there are no messages, our contestTotal stays at 0
        if (messages.size < 1) {
            break;
        }

        for (let i = 0; i < messages.size; i++) {
            const e = messages.at(i);
            // if we find the reset message, older messages would've been part of a different contest
            if (e.content.trim().toLowerCase() == 'reset') break;

            // get id from the contest submission log
            let authorId = /(\d+)\s*$/.exec(e.content);
            if (!authorId) {
                logger.log(`ERROR loading DM contest: couldn't find author ID for log '${e.content}', aborting setup.`);
                return;
            } else {
                // this would be an error if there wasn't a match
                authorId = authorId[1];
            }

            // store how often this author made a submission - regex assumes ID is all digits before end of string
            if (contestAuthors[authorId]) {
                contestAuthors[authorId] += 1;
            } else {
                contestAuthors[authorId] = 1;
            }
            contestTotal++;
        }
        lastId = messages.last().id;

        if (messages.size != 100) {
            // this means these are no older messages and we can stop fetching
            break;
        }
    }

    // when previous replies have been counted, we can start to accept submissions
    contestSetupDone = true;
    logger.log(`DM contest '${eventName}' is active, loaded ${contestTotal} entries.`);
}

// logic to determine if someone's submission is valid and add it to the previous submissions
async function enterDMContest(message, client) {
    if (!contestSetupDone) {
        message.reply('I haven\'t finished starting up yet, try again later. If this error remains, contact the bot owner.');
        return;
    }

    // check submission length constraints
    const msg = message.content.slice(eventPrefix.length).trim();
    if (msg.length > contestMaxL) {
        message.reply(`Entries can be ${contestMaxL} characters at most. Your entry was ${msg.length} characters long.`);
        return;
    }
    if (msg.length < contestMinL) {
        message.reply(`Your entry for the ${eventName} must be at least ${contestMinL} characters long. Did you try to send an image? Make sure to send it as a link, not as a file.`);
        return;
    }

    const authorId = message.author.id;
    const newCount = (contestAuthors[authorId] ? contestAuthors[authorId] : 0) + 1;

    // check an author's value in the contestAuthors object (how many submissions they already have)
    if (newCount > contestMaxSubmissions) {
        message.reply(`You can only have ${contestMaxSubmissions} entries in the ${eventName}.`);
        return;
    }

    // increment amount of saved submissions by author by 1
    if (contestAuthors[message.author.id]) {
        contestAuthors[message.author.id] += 1;
    } else {
        contestAuthors[message.author.id] = 1;
    }

    message.reply(`Your entry was accepted. You have ${contestMaxSubmissions - newCount} entries left.`);
    contestTotal++; // increment total first so code is zero-based, but logs in channel are one-based
    logger.toConsole(`Someone made a submission for ${eventName}, which now has ${contestTotal} entries in total.`);
    const submission = await client.channels.cache.get(contestSubmissions).send(`${contestTotal} => ${msg}`);
    client.channels.cache.get(contestTracking).send(`${contestTotal}, ${message.author.tag}, ${message.author.id}`);

    // add reactions if any are defined
    for (let i = 0; i < reactList.length; i++) {
        submission.react(reactList[i])
            .catch(() => { /*Do nothing, this error is common and it clogs up the console. Me is lazy*/ });
    }
}

exports.handleDMs = handleDMs;
exports.checkDMContest = checkDMContest;