const { prefix, botName } = require('../../configurations/config.json');
const Discord = require('discord.js'); // TODO: remove, import only the specifically needed part
const main = require('../../index');
const logger = require('../features/logging');
const timers = require('../features/timers');
const omnibusManager = require('./omnibusManager');
const extractWords = require('./wordFinder');

const maxWords = 25, maxContent = 400, maxWordSize = 75;
const disabledAfterReset = 5; // in minutes
const maxHtmlSize = 200; // in kB

async function solveWordsRequest(message, content) {
    // test whether the solver is enabled
    if (!solverEnabled(message)) return;

    // first we check if the provided content is at least somewhat valid
    if (!content.length) {
        // bitch boi why u do dis
        message.reply('You need to provide at least one word you want me to solve.');
        return;
    } else if (content.length > 400) {
        // that's a lot of letters my man
        message.reply(`You can provide at most ${maxContent} characters for this command, but you used ${content.length}`);
        return;
    }

    // provided content becomes an array here, and we check for too many words
    content = content.split(',');
    if (content.length > 25) {
        // yooo dude you like spamming commas or what
        message.reply(`This command can solve ${maxWords} at most, but you provided ${content.length}.`);
        return;
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
        if (!word.includes('.') && !word.includes('*')) { // dots and asterisks are both wildcards
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
    if (!omnibus) {
        message.reply(`I couldn't download the Omnibus list or find a backup of it. Try refreshing it with \`${prefix}refreshomnibus\`.`);
        return;
    }

    const lastUpdateTexts = lastOmnibusUpdateTexts(omnibus, message, words);
    const waitMessage = await message.reply(lastUpdateTexts.startText);
    logger.log(lastUpdateTexts.logText);
    // we'll add the solved words to this string
    let solution = lastUpdateTexts.finishText + '```\n';

    // after sending startText we actually solve the words and send them to the channel along with another monster string
    const solvedWords = [];
    words.forEach(word => {
        // solveWord() returns an object with an answer property with either the answer or an explanation
        solvedWords.push(solveWord({ searchString: word }, omnibus.omnibusEntries).answer);
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
        waitMessage.edit('I found your words, but in total there were too many results for one message.'
            + ' If you solve less words or give more information, the results will probably fit in one message.');
        return;
    }
    waitMessage.edit(solution);
}

async function solveHtmlRequest(message) {
    // test whether the solver is enabled
    if (!solverEnabled(message)) return;

    // check whether the message has exactly one attachment / swear at user if not
    if (!message.attachments.size) {
        message.reply('Your message didn\'t have an attachment! You need to send me the HTML of <https://godvillegame.com/news>,'
            + ' or I won\'t have any data about the crossword. You can download the HTML by visiting the page on a computer,'
            + ' and holding Control+S or Command+S. Download the file, and use the command in a message with that attachment.');
        return;
    }
    if (message.attachments.size > 1) { // nuh uh I just want one
        message.reply('You sent multiple attachments, but I only need the HTML of one page!'
            + ' Please only attach the HTML of <https://godvillegame.com/news> to the command.');
        return;
    }

    // fetch the omnibus list from our manager thingy that isn't actually a manager
    const omnibus = omnibusManager.get();
    if (!omnibus) { // previous line returns null if there is no omnibus list to use
        logger.log(`Crossword: ${message.author.tag} tried to solve the crossword using an HTML file, but the Omnibus list was missing.`);
        message.reply(`I couldn't download the Omnibus list or find a backup of it. Try refreshing it with \`${prefix}refreshomnibus\`.`);
        return;
    }

    const lastUpdateTexts = lastOmnibusUpdateTexts(omnibus, message);
    const waitMessage = await message.reply(lastUpdateTexts.startText);
    logger.log(lastUpdateTexts.logText);
    const solutionText = lastUpdateTexts.finishText;

    // get words from that attachment
    let extractedWords;
    try {
        // extractWords() downloads the attachment, extracts words, and throws an error if something goes wrong
        extractedWords = await extractWords(message.attachments.first(), maxHtmlSize * 1000);
    } catch (error) {
        // we don't do any logging in wordFinder.js and just throw errors (finally doing logging in a way that makes sense lol)
        waitMessage.edit(`Something went wrong, and I couldn't find the crossword words in the first ${maxHtmlSize} kB of your file!\n${error}`);
        logger.toConsole(`Crossword: Something went wrong, and the crossword words couldn't be found in the attachment. ${error}`);
        logger.toChannel({
            content: `Crossword: Something went wrong, and the crossword words couldn't be found in the attachment. ${error}`,
            files: [{ attachment: message.attachments.first().url, name: message.attachments.first().name }],
        });
        return;
    }

    // BOOM solved
    const solvedHorizontals = [], solvedVerticals = [];
    extractedWords.horizontal.forEach(wordObj => { solvedHorizontals.push(solveWord(wordObj, omnibus.omnibusEntries)); });
    extractedWords.vertical.forEach(wordObj => { solvedVerticals.push(solveWord(wordObj, omnibus.omnibusEntries)); });
    const textGrid = createSolutionGrid(solvedHorizontals, solvedVerticals);

    const client = main.getClient();
    const crosswordEmbed = new Discord.EmbedBuilder()
        .setTitle('Godville Times crossword solution')
        .setDescription(solutionText)
        .addFields([
            { name: 'Horizontal solutions', value: `||${solvedHorizontals.map(h => `${h.num}D. ${h.answer}`).join('\n')}||` },
            { name: 'Vertical solutions', value: `||${solvedVerticals.map(v => `${v.num}A. ${v.answer}`).join('\n')}||` },
            { name: 'Grid solution', value: textGrid },
        ])
        .setColor(0x78de79) // noice green
        .setURL('https://godvillegame.com/news')
        .setThumbnail('https://i.imgur.com/t5udHzR.jpeg')
        .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: client.user.avatarURL() })
        .setTimestamp();

    logger.log(`Crossword: Finished solving the crossword in ${message.channel.name}.`);
    waitMessage.edit({ content: 'Here you go!', embeds: [crosswordEmbed] });
}


/**
 * Solves a single word using the omnibus list.
 * @param {object} wordObj An object containing the word to solve and other information
 * @param {string[]} omnibus The omnibus list to use to search for solutions
 * @returns The wordObj with the answer and solved properties set
 */
function solveWord(wordObj, omnibus) {
    const regExp = createRegExp(wordObj.searchString);
    const foundWords = [];
    // omnibus list won't have duplicates, so we can just loop through it
    omnibus.forEach(entry => {
        if (regExp.test(entry)) {
            // add to possible solutions on match
            foundWords.push(entry);
        }
    });

    if (!foundWords.length) {
        wordObj.answer = 'No results found.';
    } else if (foundWords.length === 1) {
        wordObj.answer = foundWords[0];
        wordObj.solved = true;
    } else if (foundWords.length <= 20) {
        wordObj.answer = `[${foundWords.join(', ')}]`;
        wordObj.potentialSolution = foundWords[0];
    } else {
        // Any more than this definitely shouldn't be necessary
        wordObj.answer = '20+ results.';
        wordObj.potentialSolution = foundWords[0];
    }

    return wordObj;
}

/**
 * Creates a regular expression matching the provided word following these rules:
 * - . still counts as a wildcard character,
 * - all other special characters are escaped,
 * - hypens and spaces also match each other,
 * - case insensitive.
 *
 * @param {string} text The text to convert into a regular expression
 * @returns A regular expression
 */
function createRegExp(text) {
    // escapes all special characters beside the . (we use that as a wildcard)
    let regExpString = text.replace(/…/g, '...'); // three dots might have been autocorrected to an ellipsis
    regExpString = regExpString.replace(/[-[\]{}()*+?,\\^$|#\s]/g, '\\$&');
    regExpString = '^' + regExpString + '$'; // ^ and $ match the beginning and end of a line
    regExpString = regExpString.replace(/\\[ -]/g, '[ -]'); // we don't differentiate between hyphens and spaces
    regExpString = regExpString.replace(/\\\*/g, '.+'); // asterisks should match any amount of wildcards
    const regExp = new RegExp(regExpString, 'i'); // i = case insensitive flag

    return regExp;
}

function createSolutionGrid(solvedHorizontals, solvedVerticals) {
    const grid = [];
    const comments = [];

    solvedVerticals.forEach(wordObj => {
        for (let i = 0; i < wordObj.searchString.length; i++) {
            // add empty row if it doesn't exist yet
            if (!grid[wordObj.startY + i]) grid[wordObj.startY + i] = [];

            // add word to grid, or potential solution/unsolved word if it's not solved
            if (wordObj.solved) {
                grid[wordObj.startY + i][wordObj.startX] = wordObj.answer[i];
            } else if (wordObj.potentialSolution) {
                grid[wordObj.startY + i][wordObj.startX] = wordObj.potentialSolution[i];
            } else {
                grid[wordObj.startY + i][wordObj.startX] = wordObj.searchString[i];
            }
        }
        if (!wordObj.solved) comments.push(`${wordObj.num}D: ${wordObj.answer}`);
    });

    solvedHorizontals.forEach(wordObj => {
        if (!wordObj.num) wordObj.num = '?';
        // no need to add empty row, verticals should have added all rows already
        for (let i = 0; i < wordObj.searchString.length; i++) {
            // add word to grid, or potential solution/unsolved word if it's not solved
            if (wordObj.solved) {
                grid[wordObj.startY][wordObj.startX + i] = wordObj.answer[i];
            } else if (wordObj.potentialSolution) {
                grid[wordObj.startY][wordObj.startX + i] = wordObj.potentialSolution[i];
            } else {
                grid[wordObj.startY][wordObj.startX + i] = wordObj.searchString[i];
            }
        }
        if (!wordObj.solved) comments.push(`${wordObj.num}A: ${wordObj.answer}`);
    });

    // convert grid into text message
    // TODO create image instead, so it can be sent spoilered
    let gridText = '```fix\n';
    // add > to top left corner if it's empty, so the first spaces don't get truncated by Discord on mobile
    if (!grid[0][0]) grid[0][0] = '>';

    // concatenate all cells for each row, then concatenate all rows
    grid.forEach(row => {
        for (let i = 0; i < row.length; i++) {
            // if cell is undefined (whitespace), replace with space
            gridText += (row[i] || ' ') + ' ';
        }
        gridText += '\n';
    });
    gridText += '```';
    if (comments.length) gridText += `\n||${comments.join('\n')}||\n`;
    gridText += '\nDo you prefer the list of answers, or grid? Let me know!';

    return gridText;
}

/**
 * Check whether the solver is disabled because the crossword was just reset.
 * @param {Discord.Message} message The message to reply to, if disabled
 * @returns True or false
 */
function solverEnabled(message) {
    const enableTime = timers.getDelay(22, 5 + disabledAfterReset);
    const disabled = enableTime.hoursFromNow === 0 && enableTime.minutesFromNow <= disabledAfterReset;

    if (!disabled) return true;

    const timestamp = Math.floor(enableTime.goalDate.valueOf() / 1000);
    message.reply(`This feature will be enabled again <t:${timestamp}:R>.`);
    return false;
}

function lastOmnibusUpdateTexts(omnibus, message, words) {
    let startText;
    let logText;
    let finishText;
    const timeSinceUpdate = Date.now() - omnibus.timestamp;
    const daysAgo = ~~(timeSinceUpdate / (24 * 3600 * 1000));
    const hoursAgo = ~~(timeSinceUpdate % (24 * 3600 * 1000) / (3600 * 1000));
    const minsAgo = ~~(timeSinceUpdate % (3600 * 1000) / (60 * 1000));

    // if words are not defined, this is a HTML solve request
    if (words) {
        const multiple = words.length > 1 ? true : false; // used later for singular/plural forms
        startText = `Using my ${omnibus.version} version of the Omnibus list from`
            + ` ${daysAgo} ${quantiseWords(daysAgo, 'day')}, ${hoursAgo} ${quantiseWords(hoursAgo, 'hour')} and`
            + ` ${minsAgo} ${quantiseWords(minsAgo, 'minute')} ago to get your ${words.length} solution${multiple ? 's' : ''}... 🤔`;
        logText = `Crossword: ${message.author.tag} asked for ${words.length} ${quantiseWords(words.length, 'word')} to be solved in`
            + ` ${message.channel.name}. Omnibus version used: ${omnibus.version} from ${daysAgo} ${quantiseWords(daysAgo, 'day')},`
            + ` ${hoursAgo} ${quantiseWords(hoursAgo, 'hour')} and ${minsAgo} ${quantiseWords(minsAgo, 'minute')} ago.`;
        finishText = `Done! I tried to solve ${words.length} ${quantiseWords(words.length, 'word')}`
            + ` using a ${omnibus.version} version of the Omnibus list from ${daysAgo} ${quantiseWords(daysAgo, 'day')},`
            + ` ${hoursAgo} ${quantiseWords(hoursAgo, 'hour')} and ${minsAgo} ${quantiseWords(minsAgo, 'minute')} ago.`;
    } else {
        startText = 'I\'m working on it...';
        logText = `Crossword: ${message.author.tag} used the command to solve the crossword from an HTML file in #${message.channel.name}.`
            + ` Using a ${omnibus.version} version of the Omnibus list from ${daysAgo} ${quantiseWords(daysAgo, 'day')},`
            + ` ${hoursAgo} ${quantiseWords(hoursAgo, 'hour')} and ${minsAgo} ${quantiseWords(minsAgo, 'minute')} ago.`;
        finishText = `Solved using a ${omnibus.version} version of the Omnibus list from ${daysAgo} ${quantiseWords(daysAgo, 'day')},`
            + ` ${hoursAgo} ${quantiseWords(hoursAgo, 'hour')} and ${minsAgo} ${quantiseWords(minsAgo, 'minute')} ago. If not all words are`
            + ` solved, add them to the [Omnibus List](https://wiki.godvillegame.com/Omnibus_List) and use command \`${prefix}refreshomnibus\`.\n`;
    }

    // lmao these strings are nightmares
    return { startText, logText, finishText };
}

/**
 * Dynamically returns the singular or plural version of a noun
 *
 * @param {number} count The amount of items (1 is singular, otherwise plural)
 * @param {string} singular The singular form of this noun, singular + s by default
 * @param {string} plural The plural form of this noun
 * @returns proper noun form based on quantity
 */
const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;


exports.solveWords = solveWordsRequest;
exports.solveHtml = solveHtmlRequest;