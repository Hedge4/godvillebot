const { prefix } = require('../../configurations/config.json');
const main = require('../../index');
const logger = require('../features/logging');
const omnibusManager = require('./omnibusManager');
const parseWords = require('./wordFinder');
const maxWords = 25, maxContent = 400, maxWordSize = 75;

async function solveWordsRequest(message, content) {
    // first we check if the provided content is at least somewhat valid
    if (!content.length) {
        // bitch boi why u do dis
        return message.reply('You need to provide at least one word you want me to solve.');
    } else if (content.length > 400) {
        // that's a lot of letters my man
        return message.reply(`You can provide at most ${maxContent} characters for this command, but you used ${content.length}`);
    }

    // provided content becomes an array here, and we check for too many words
    content = content.split(',');
    if (content.length > 25) {
        // yooo dude you like spamming commas or what
        return message.reply(`This command can solve ${maxWords} at most, but you provided ${content.length}.`);
    }

    // check for various mistakes people can make in a word
    let emptyWords = 0, tooLong = 0;
    const noWildcards = [], words = [], lineBreakRegex = /[\r\n]/g;

    for (let i = 0; i < content.length; i++) {
        const word = content[i].trim();
        if (word.length < 1) {
            emptyWords++;
            continue;
        }
        if (word.length > maxWordSize) {
            tooLong++;
            continue;
        }
        if (!word.includes('.')) {
            noWildcards.push(word);
            continue;
        }

        // we don't want any line breaks and dirty stuff in our words
        words.push(word.replace(lineBreakRegex, '').trim());
    }

    // send error message based on the mistakes someone made, and return if there were no valid words at all
    let errorMessage = '';
    if (emptyWords) { errorMessage += `Error: ${emptyWords} ${quantiseWords(emptyWords, 'word')} had no length.\n`; }
    if (tooLong) {
        errorMessage += `Error: ${tooLong} ${quantiseWords(tooLong, 'word was', 'words were')} too long`
            + ' - make sure to separate words with commas! Words can be 75 characters at most.\n';
    }
    if (noWildcards.length) {
        errorMessage += `Error: ${noWildcards.length} ${quantiseWords(noWildcards.length, 'word')} had no wildcards.`
        + ' Remember to put a dot for any unknown characters so I know what letters I need to solve for.'
        + ` Problematic words: ${noWildcards.join(', ')}.\n`;
    }
    if (errorMessage.length) message.reply(errorMessage);
    if (!words.length) return; // return if there are no valid words left

    // fetch the omnibus list from our manager thingy that isn't actually a manager
    const omnibus = omnibusManager.get();
    if (!omnibus) { // previous line returns null if there is no omnibus list to use
        return message.reply(`I couldn't download the Omnibus list or find a backup of it. Try refreshing it with \`${prefix}refreshomnibus\`.`);
    }

    // checks are done, now we update the channel + log that we're getting to work
    const multiple = words.length > 1 ? true : false; // used later for singular/plural forms
    const timeSinceUpdate = Date.now() - omnibus.timestamp;
    const daysAgo = ~~(timeSinceUpdate / (24 * 3600 * 1000));
    const hoursAgo = ~~(timeSinceUpdate % (24 * 3600 * 1000) / (3600 * 1000));
    const minsAgo = ~~(timeSinceUpdate % (3600 * 1000) / (60 * 1000));
    // lmao this string below is a nightmare
    const reply = await message.reply(`Using my ${omnibus.version} version of the Omnibus list from`
        + ` ${daysAgo} ${quantiseWords(daysAgo, 'day')}, ${hoursAgo} ${quantiseWords(hoursAgo, 'hour')} and`
        + ` ${minsAgo} ${quantiseWords(minsAgo, 'minute')} ago to get your ${words.length} solution${multiple ? 's' : ''}... 🤔`);
    logger.log(`${message.author.tag} asked for ${words.length} ${quantiseWords(words.length, 'word')}`
        + ` to be solved in ${message.channel.name}. Omnibus version used: ${omnibus.version}`);

    // after sending that monster we actually solve the words and send them to the channel along with another monster string
    let solution = `Done! I tried to solve ${words.length} ${quantiseWords(words.length, 'word')}`
    + ` using a ${omnibus.version} version of the Omnibus list from ${daysAgo} ${quantiseWords(daysAgo, 'day')},`
    + ` ${hoursAgo} ${quantiseWords(hoursAgo, 'hour')} and ${minsAgo} ${quantiseWords(minsAgo, 'minute')} ago.` + '```\n';

    const solvedWords = [];
    words.forEach(word => {
        solvedWords.push(solveWord(word, omnibus.omnibusEntries));
    });

    // get the longest word that is equal to or shorter than 21 characters, then use it to create the message
    const longest = words.reduce(function(old, nw) { return nw.length > old && nw.length <= 20 ? nw.length : old; }, 0);
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        if (word.length < longest) word += ' '.repeat(longest - word.length);
        const solvedWord = solvedWords[i];
        solution += word + ' --> ' + solvedWord + '\n';
    }
    solution += '```';

    if (solution.length > 1800) {
        return reply.edit('I found your words, but in total there were too many results for one message.'
            + ' If you try solving for less words, the results will probably fit in one message.');
    }
    reply.edit(solution);
}

async function solveHtmlRequest(message) {
    // check whether the message has exactly one attachment / swear at user if not
    if (!message.attachments.size) {
        return message.reply('Your message didn\'t have an attachment! You need to send me the HTML of <https://godvillegame.com/news>,'
            + ' or I won\'t have any data about the crossword. You can download the HTML by visiting the page on a computer,'
            + ' and holding Control+S or Command+S. Download the file, and use the command in a message with that attachment.');
    }
    if (message.attachments.size > 1) { // nuh uh I just want one
        return message.reply('You sent multiple attachments, but I only need the HTML of one page!'
        + ' Please only attach the HTML of <https://godvillegame.com/news> to the command.');
    }
    if (message.attachments.first().size > 250000) { // people will definitely try to send weird stuff
        return message.reply(`This file is surprisingly large for the <https://godvillegame.com/news> page ${message.attachments.first().size},`
            + ' so please make sure you send the HTML of the right page. If this is an error, contact the bot owner.');
    }

    // fetch the omnibus list from our manager thingy that isn't actually a manager
    const omnibus = omnibusManager.get();
    if (!omnibus) { // previous line returns null if there is no omnibus list to use
        logger.log(`${message.author.tag} tried to solve the crossword using an HTML file, but the Omnibus list was missing.`);
        return message.reply(`I couldn't download the Omnibus list or find a backup of it. Try refreshing it with \`${prefix}refreshomnibus\`.`);
    }

    const timeSinceUpdate = Date.now() - omnibus.timestamp;
    const daysAgo = ~~(timeSinceUpdate / (24 * 3600 * 1000));
    const hoursAgo = ~~(timeSinceUpdate % (24 * 3600 * 1000) / (3600 * 1000));
    const minsAgo = ~~(timeSinceUpdate % (3600 * 1000) / (60 * 1000));
    const reply = await message.reply('I\'m working on it...');
    logger.log(`${message.author.tag} used the command to solve the crossword from an HTML file in #${message.channel.name}.`
        + ` Using a ${omnibus.version} version of the Omnibus list from ${daysAgo} ${quantiseWords(daysAgo, 'day')},`
        + ` ${hoursAgo} ${quantiseWords(hoursAgo, 'hour')} and ${minsAgo} ${quantiseWords(minsAgo, 'minute')} ago.`);

    // get words from that attachment
    let wordsObject;
    try {
        wordsObject = await parseWords(message.attachments.first()); // need to send the attached file to this function somehow
    } catch (error) {
        // we don't do any logging in wordFinder.js and just throw errors (finally doing logging in a way that makes sense lol)
        reply.edit(`Something went wrong, and I couldn't find the crossword words in your file!\n${error}`);
        logger.toConsole(`Something went wrong, and the crossword words couldn't be found in the attachment. ${error}`);
        return logger.toChannel({ content: `Something went wrong, and the crossword words couldn't be found in the attachment. ${error}`,
            files: [{ attachment: message.attachments.first().url, name: message.attachments.first().name }] });
    }

    // BOOM solved
    const solvedHorizontals = [], solvedVerticals = [];
    wordsObject.Horizontal.forEach(word => { solvedHorizontals.push(solveWord(word, omnibus.omnibusEntries)); });
    wordsObject.Vertical.forEach(word => { solvedVerticals.push(solveWord(word, omnibus.omnibusEntries)); });


    const Discord = main.getDiscord();
    const client = main.getClient();

    const crosswordEmbed = new Discord.MessageEmbed()
    .setTitle('Godville Times crossword solution')
    .setDescription(`Solved using a ${omnibus.version} version of the Omnibus list from ${daysAgo} ${quantiseWords(daysAgo, 'day')},`
    + ` ${hoursAgo} ${quantiseWords(hoursAgo, 'hour')} and ${minsAgo} ${quantiseWords(minsAgo, 'minute')} ago. If not all words are`
    + ` solved, add them to the [Omnibus List](https://wiki.godvillegame.com/Omnibus_List) and use command \`${prefix}refreshomnibus\`.\n`)
    .addField('Horizontal solutions', `||${solvedHorizontals.join('\n')}||`)
    .addField('Vertical solutions', `||${solvedVerticals.join('\n')}||`)
    .setColor(0x78de79) // noice green
    .setURL('https://godvillegame.com/news')
    .setThumbnail('https://i.imgur.com/t5udHzR.jpeg')
    .setFooter({ text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() })
    .setTimestamp();

    logger.log(`Finished solving the crossword in ${message.channel.name}.`);
    reply.edit({ content: 'Here you go!', embeds: [crosswordEmbed] });
}

function solveWord(word, omnibus) {
    const regExString = '^' + escapeRegExp(word) + '$'; // ^ and $ match the beginning and end of a line
    const regExp = new RegExp(regExString, 'i'); // i = case insensitive flag
    const foundWords = [];
    // we don't have to watch for duplicates here, because the way the omnibus list gets loaded removes all duplicates
    omnibus.forEach(entry => {
        if (regExp.test(entry)) { // returns true if we get a match
            foundWords.push(entry);
        }
    });
    if (!foundWords.length) return 'No results found.';
    if (foundWords.length === 1) return foundWords[0];
    if (foundWords.length > 20) return '20+ results.'; // Any more than this definitely shouldn't be necessary
    return `[${foundWords.join(', ')}]`;
}


// escapes all special characters beside the . (we use that as a wildcard)
function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?,\\^$|#\s]/g, '\\$&');
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;


exports.solveWords = solveWordsRequest;
exports.solveHtml = solveHtmlRequest;