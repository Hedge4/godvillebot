const { channels } = require('../../configurations/config.json');

async function getRanking(message, content, userData, client) {
    const args = content.split(' ');
    let page = 1;
    if (args.length > 1) {
        return message.reply('The correct syntax is >ranking [page].');
    }
    if (!args[0].length) {
        page = 1;
    } else if (isNaN(args[0])) {
            return message.reply('The correct syntax is >ranking [page].');
    } else {
        page = Math.floor(args[0]);
        if (page <= 0) {return message.reply('The lowest page number you can request is 1, dumdum.');}
    }
    const userDoc = await userData.get();
    let own_ranking = false;
    if(userDoc.data()[message.author.id] !== undefined) {own_ranking = true;}
    const grand_total = userDoc.data()[1];
    const sortable = [];
    for (const ID in userDoc.data()) {
        sortable.push([ID, userDoc.data()[ID].total_godpower, userDoc.data()[ID].last_username, userDoc.data()[ID].level]);
    }
    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });

    let own_rank = undefined;
    if (own_ranking === true) {
        own_rank = sortable.findIndex((element) => element[0] === message.author.id);
        if (own_rank === -1) {own_rank = 'Not found';}
    }

    const index = 0;
    sortable.splice(index, 1);
    const total_users = sortable.length;
    const max_page = Math.floor((total_users / 10) + 1);
    if (page > max_page) {return message.reply(`That page doesn't exist, the highest page number is ${max_page}.`);}
    const end_index = page * 10;
    const start_index = end_index - 10;
    const usersOnPage = sortable.slice(start_index, end_index);

    let ranking = `Total users registered: ${total_users} - Total godpower collected: ${grand_total}\n------------------------------------------\n`;
    for (let i = 0; i < usersOnPage.length; i++) {
        ranking += ` {${i + 1 + (page - 1) * 10}}    - "${usersOnPage[i][2]}", level ${usersOnPage[i][3]}.\n              Total godpower: ${usersOnPage[i][1]}\n`;
    }
    ranking += `------------------------------------------\nYour rank: {${own_rank}} - Level ${userDoc.data()[message.author.id].level}, total godpower: ${userDoc.data()[message.author.id].total_godpower}`;
    const logsChannel = client.channels.cache.get(channels.logs);
    console.log(`${message.author.tag} requested page ${page} of the godpower rankings.`);
    logsChannel.send(`${message.author.tag} requested page ${page} of the godpower rankings.`);
    return message.reply('Here is page ' + page + ' of the godpower rankings:\n```\n' + ranking + '\n```');
}

module.exports = getRanking;