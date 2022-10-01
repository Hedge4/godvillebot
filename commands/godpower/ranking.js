const { prefix } = require('../../configurations/config.json');
const logger = require('../features/logging');

async function getRanking(message, content, userData) {
    const args = content.split(' ');
    let page = 1;
    if (args.length > 1) {
        return message.reply(`The correct syntax is ${prefix}ranking [page].`);
    }
    if (!args[0].length) {
        page = 1;
    } else if (isNaN(args[0])) {
        return message.reply(`The correct syntax is ${prefix}ranking [page].`);
    } else {
        page = Math.floor(args[0]);
        if (page <= 0) { return message.reply('The lowest page number you can request is 1, dumdum.'); }
    }

    const userDoc = await userData.get();
    let ownRanking = false;
    if (userDoc.data()[message.author.id] !== undefined) { ownRanking = true; }
    const serverTotal = userDoc.data()[1];
    const sortable = [];
    for (const id in userDoc.data()) {
        sortable.push([id, userDoc.data()[id].total_godpower, userDoc.data()[id].last_username, userDoc.data()[id].level]);
    }

    sortable.sort(function(a, b) {
        if (a[1] !== b[1]) {
            // if godpower is not equal, we sort on highest godpower
            return b[1] - a[1];
        } else {
            // if godpower is equal, we sort on lowest Discord id
            return a[0] - b[0];
        }
    });

    let ownRank = undefined;
    if (ownRanking === true) {
        ownRank = sortable.findIndex((element) => element[0] === message.author.id);
        if (ownRank === -1) { ownRank = 'Not found'; }
    }

    const index = 0;
    sortable.splice(index, 1);
    const totalUsers = sortable.length;
    const maxPage = Math.floor((totalUsers / 10) + 1);
    if (page > maxPage) { return message.reply(`That page doesn't exist, the highest page number is ${maxPage}.`); }
    const endIndex = page * 10;
    const startIndex = endIndex - 10;
    const usersOnPage = sortable.slice(startIndex, endIndex);

    let ranking = `Total users registered: ${totalUsers} - Total godpower collected: ${serverTotal}\n------------------------------------------\n`;
    for (let i = 0; i < usersOnPage.length; i++) {
        ranking += ` {${i + 1 + (page - 1) * 10}}    - "${usersOnPage[i][2]}", level ${usersOnPage[i][3]}.\n              Total godpower: ${usersOnPage[i][1]}\n`;
    }
    ranking += `------------------------------------------\nYour rank: {${ownRank}} - Level ${userDoc.data()[message.author.id].level}, total godpower: ${userDoc.data()[message.author.id].totalGodpower}`;

    logger.log(`${message.author.tag} requested page ${page} of the godpower rankings.`);
    return message.reply('Here is page ' + page + ' of the godpower rankings:\n```\n' + ranking + '\n```');
}

module.exports = getRanking;