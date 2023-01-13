const logger = require('../features/logging');

async function getRanking(message, content, userData) {
    const args = content.split(' ');
    let selectGold = false;
    let page = 1;
    let parsedPage;

    // check if we're ranking gold and if a page was given
    if (args[0].toLowerCase() === 'gold') {
        selectGold = true;
        if (args[1] && args[1].length) {
            parsedPage = args[1];
        }
    } else if (args[0].length) {
        parsedPage = args[0];
    }

    // default page value is already 1
    if (parsedPage) {
        if (isNaN(parsedPage)) {
            message.reply(`${parsedPage} isn't a number.`);
            return;
        } else {
            page = Math.floor(parsedPage);
            if (page <= 0) {
                message.reply('The lowest page number you can request is 1, dumdum.');
                return;
            }
        }
    }

    if (selectGold) {
        goldRanking(message, page, userData);
    } else {
        godpowerRanking(message, page, userData);
    }
}

async function godpowerRanking(message, page, userData) {
    const userDoc = await userData.get();
    // we only show a user's own ranking if they're already in the database
    const ownRanking = userDoc.data()[message.author.id] !== undefined ? true : false;
    const serverTotal = userDoc.data()[1];

    const sortable = [];
    for (const id in userDoc.data()) {
        sortable.push(
            [id, userDoc.data()[id].total_godpower, userDoc.data()[id].last_username, userDoc.data()[id].level],
        );
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

    let ownRank;
    if (ownRanking === true) {
        ownRank = sortable.findIndex((element) => element[0] === message.author.id);
        if (ownRank === -1) { ownRank = 'ERR'; }
    }

    const usersPerPage = 10;
    const index = 0;
    sortable.splice(index, 1); // remove total godpower
    const totalUsers = sortable.length;

    const maxPage = Math.floor((totalUsers / usersPerPage) + 1);
    if (page > maxPage) {
        message.reply(`That page doesn't exist, the highest page number is ${maxPage}.`);
        return;
    }

    const endIndex = page * usersPerPage;
    const startIndex = endIndex - usersPerPage;
    const usersOnPage = sortable.slice(startIndex, endIndex);

    let ranking = `Total users registered: ${totalUsers} — Total godpower collected: ${serverTotal}\n---------------------------------------\n`;
    for (let i = 0; i < usersOnPage.length; i++) {
        const rank = i + 1 + (page - 1) * usersPerPage;
        // 1 to 4 spaces after rank based on # of digits, for outlining
        const spacing = rank > 9 ? rank > 99 ? rank > 999 ? ' ' : '  ' : '   ' : '    ';
        ranking += ` {${rank}}${spacing}— "${usersOnPage[i][2]}", level ${usersOnPage[i][3]}.\n              Total godpower: ${usersOnPage[i][1]}\n`; // 4 spaces on purpose for better outlining
    }

    ranking += '---------------------------------------\n';
    if (ownRanking) {
        ranking += `Your rank: {${ownRank}} — Level ${userDoc.data()[message.author.id].level}, total godpower: ${userDoc.data()[message.author.id].total_godpower}`;
    } else {
        ranking += 'You don\'t have any godpower yet, so you are unranked.';
    }

    logger.log(`${message.author.tag} requested page ${page} of the godpower rankings.`);
    message.reply(`Here is page ${page} of the godpower rankings:\n\`\`\`\n${ranking}\n\`\`\``);
    return;
}

async function goldRanking(message, page, userData) {
    const userDoc = await userData.get();
    // we only show a user's own ranking if they're already in the database
    const ownRanking = userDoc.data()[message.author.id] !== undefined ? true : false;

    const sortable = [];
    for (const id in userDoc.data()) {
        sortable.push(
            [id, userDoc.data()[id].gold, userDoc.data()[id].last_username, userDoc.data()[id].level],
        );
    }

    sortable.sort(function(a, b) {
        if (a[1] !== b[1]) {
            // if gold is not equal, we sort on highest gold
            return b[1] - a[1];
        } else {
            // if gold is equal, we sort on lowest Discord id
            return a[0] - b[0];
        }
    });

    let ownRank;
    if (ownRanking) {
        ownRank = sortable.findIndex((element) => element[0] === message.author.id);
        if (ownRank === -1) { ownRank = 'ERR'; }
    }

    const usersPerPage = 15;
    const index = 0;
    sortable.splice(index, 1); // remove total godpower
    const totalUsers = sortable.length;

    const maxPage = Math.floor((totalUsers / usersPerPage) + 1);
    if (page > maxPage) {
        message.reply(`That page doesn't exist, the highest page number is ${maxPage}.`);
        return;
    }

    const endIndex = page * usersPerPage;
    const startIndex = endIndex - usersPerPage;
    const usersOnPage = sortable.slice(startIndex, endIndex);

    let ranking = `Total users registered: ${totalUsers}\n---------------------------------------\n`;
    for (let i = 0; i < usersOnPage.length; i++) {
        const rank = i + 1 + (page - 1) * usersPerPage;
        // 1 to 4 spaces after rank based on # of digits, for outlining
        const spacing = rank > 9 ? rank > 99 ? rank > 999 ? ' ' : '  ' : '   ' : '    ';
        ranking += ` {${rank}}${spacing}— "${usersOnPage[i][2]}", ${usersOnPage[i][1]} gold\n`;
    }

    ranking += '---------------------------------------\n';
    if (ownRanking) {
        ranking += `Your rank: {${ownRank}} — ${userDoc.data()[message.author.id].gold} gold`;
    } else {
        ranking += 'You don\'t have any gold yet, so you are unranked.';
    }

    logger.log(`${message.author.tag} requested page ${page} of the gold rankings.`);
    message.reply(`Here is page ${page} of the gold rankings:\n\`\`\`\n${ranking}\n\`\`\``);
    return;
}

module.exports = getRanking;