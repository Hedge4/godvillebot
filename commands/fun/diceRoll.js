const { botName } = require('../../configurations/config.json');
const { EmbedBuilder } = require('discord.js');
const getters = require('../../index');
const logger = require('../features/logging');

const defaultType = 'd6';
const defaultAmount = '1';
const maxDiceAmount = 10000 - 1;
const maxSidesAmount = 1000000000000000 - 1;

// each key corresponds to an array of possible rolls for that 'die'
const diceDict = {
    dfuck: ['fuck'],
    dletter: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
    dalphabet: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
};

async function main(message, content) {
    content = content.toLowerCase();

    // matches everything. Optional number first, then optional die type starting with 'd'
    const optionsRegex = /^([0-9]+)?\s*(d\w+)?/;
    const options = optionsRegex.exec(content);

    if (!options[1] && !options[2] && content.length > 0) {
        message.reply('I can\'t parse your input, the correct syntax is `>roll [amount] [die type]`. Example: `>roll 5d10`');
        return;
    }

    const dAmount = Number(!options[1] ? defaultAmount : options[1]);
    const dType = !options[2] ? defaultType : options[2];

    // filters out too large amounts
    if (dAmount > maxDiceAmount) {
        message.reply(`You can roll at most ${maxDiceAmount} dice!`);
        return;
    }
    // filters out 0 or 1 dice (negative isn't parsed anyway)
    if (dAmount === 0) {
        message.reply('You can probably figure this one out yourself, dummy');
        return;
    }

    let rollResults;
    const typeRegex = /^d([0-9]+)$/;
    const numberType = typeRegex.exec(dType);
    let commandInfo;

    // numberType is for all dice rolls that output regular numbers
    if (numberType) {
        const maxRoll = Number(numberType[1]);
        // filters out too large amounts
        if (maxRoll > maxSidesAmount) {
            message.reply(`I only allow die sizes 2–${maxSidesAmount}!`);
            return;
        }

        // filter out 0 and comment about 1, negative numbers aren't parsed in the first place
        if (maxRoll === 0) {
            message.reply('Uhh... Are you doing okay? Need some math tutoring?');
            return;
        }
        if (maxRoll === 1) {
            message.reply('Interesting request... But alright, I\'ll play along.');
        }

        // get random number 1-x n times
        rollResults = Array.from({ length: dAmount }, () => Math.floor(Math.random() * maxRoll) + 1);
        commandInfo = `Rolling a ${maxRoll}-sided die ${dAmount} ${quantiseWords(dAmount, 'time')}...`;
    } else {
        // for custom die types, with custom roll possibilities
        const possibleRolls = diceDict[dType];
        if (!possibleRolls) {
            message.reply(`I don't know this die type: ${dType}`);
            return;
        }

        // get random value from array n times
        rollResults = Array.from({ length: dAmount }, () => {
            const index = Math.floor(Math.random() * possibleRolls.length);
            return possibleRolls[index];
        });
        commandInfo = `Rolling a ${dType} die ${dAmount} ${quantiseWords(dAmount, 'time')}...`;
    }

    // logs are yummy
    logger.log(`Rolling ${dAmount} dice of type ${dType} for ${message.author.tag} in ${message.channel.name}.`);

    // all rolls, separated by spaces
    const rollContent = rollResults.join(' · ');

    ///////////////////////
    // GET SUMMARY STATS //
    ///////////////////////

    // summary is for how many times each result was rolled and some stats
    let total, lowest, highest;
    // const most = { amount: 0 };
    const countedRolls = {};
    const countedAmounts = {};

    // get 'roll: amount' dictionary for each unique roll
    rollResults.forEach(e => {
        if (countedRolls[e]) countedRolls[e] += 1;
        else countedRolls[e] = 1;
    });
    // array of unique rolls instead of dict
    const uniqueRolls = Object.keys(countedRolls);

    // now make a dictionary of roll arrays for each amount
    Object.entries(countedRolls).forEach(([key, val]) => {
        if (countedAmounts[val]) countedAmounts[val].push(key);
        else countedAmounts[val] = [key];
    });

    // find which values were rolled most
    const rolledMostKey = Math.max(...Object.keys(countedAmounts));
    const rolledMostArray = countedAmounts[rolledMostKey];

    // array of unique numeric rolls
    const uniqueNumericRolls = uniqueRolls.filter(isPositiveInteger);

    // if more than one numeric result, calculate total, highest and lowest
    if (uniqueNumericRolls.length > 0) {
        highest = Math.max(...uniqueNumericRolls);
        lowest = Math.min(...uniqueNumericRolls);
        total = 0;
        uniqueNumericRolls.forEach(roll => {
            total += countedRolls[roll] * roll;
        });
    }

    // actually start making the summary string
    let rollSummary = '';
    const rollSummaryStats = [];
    let rolledMostText = '';

    // write how often everything was rolled to the summary
    if (rolledMostKey > 1) {
        const amounts = Object.keys(countedAmounts);
        amounts.sort((a, b) => b - a); // sort descending

        amounts.forEach(x => {
            rollSummary = rollSummary + `${fancyJoin(countedAmounts[x])} ${quantiseWords(countedAmounts[x].length, 'was', 'were')} rolled ${x} ${quantiseWords(Number(x), 'time')}`;
            rollSummary = rollSummary + ' · ';
        });
    }

    // remove last separator
    if (rollSummary.length) {
        rollSummary = rollSummary.slice(0, -3);
        rollSummary = rollSummary + '.';
    } else {
        rollSummary = 'No result was rolled more than once.';
    }

    // total/lowest/highest stats, if applicable (undefined if there are no numeric values)
    if (total && total > lowest) rollSummaryStats.push(`Sum of all rolls: ${total}. `);
    if (lowest !== highest) {
        if (lowest) rollSummaryStats.push(`Lowest number: ${lowest}. `);
        if (highest) rollSummaryStats.push(`Highest number: ${highest}. `);
    }

    // finish stats with which roll was rolled most
    if (rolledMostKey > 1) {
        rolledMostText = `Rolled most: ${fancyJoin(rolledMostArray)} (${rolledMostKey} times). `;
    }

    //////////////////
    // CREATE EMBED //
    //////////////////

    // embed description limit is 2048, field limit 1024
    // limit is a bit lower than actual limit, so adding newlines is okay
    const maxDescSize = 2000;
    const maxFieldSize = 1000;

    let description = `${commandInfo}\n\n`;
    const summaryStatsText = rollSummaryStats.join('');
    // three variations of summary text based on how big rollSummary and rolledMostText are
    const summaryTextOne = (rollSummary + '\n\n' + summaryStatsText).trim(); // trim in case rollSummary is empty
    const summaryTextTwo = rolledMostText + '\n\n' + summaryStatsText;
    const summaryTextThree = summaryStatsText;
    let addField;

    // figure out which information goes where based if everything fits
    if (rollContent.length + description.length < maxDescSize) {
        description = description + rollContent;

        if (summaryTextOne.length < maxFieldSize && rollSummary.length) {
            addField = summaryTextOne;
        } else if (summaryTextTwo.length < maxFieldSize) {
            addField = summaryTextTwo;
        } else {
            addField = summaryTextThree;
        }
    } else if (description.length + summaryTextOne.length < maxDescSize && rollSummary.length) {
        description = description + summaryTextOne;
    } else if (description.length + summaryTextTwo.length < maxFieldSize) {
        description = description + summaryTextTwo;
    } else {
        description = description + summaryTextThree;
    }

    const embed = new EmbedBuilder()
        .setTitle(`:game_die: **Dice roll results for ${message.author.tag}**`)
        .setColor('c766bb')
        .setDescription(`${description}`)
        .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: getters.getClient().user.avatarURL() })
        .setTimestamp();

    if (addField && addField.length) {
        embed.addFields([{ name: 'Results summary', value: addField }]);
    }

    message.reply({ embeds: [embed] }).catch(e => logger.log(e));
}


function isPositiveInteger(str) {
    const num = Number(str);

    if (Number.isInteger(num) && num > 0) {
        return true;
    }

    return false;
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;

function fancyJoin(array, divider = ', ', lastDivider = ' and ') {
    if (!array || !array.length) return undefined;
    if (array.length > 1) {
        const lastItem = array.pop();
        return array.join(divider) + lastDivider + lastItem;
    } else {
        return array[0];
    }
}


module.exports = main;