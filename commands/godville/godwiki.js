const { logs } = require('../../configurations/config.json');

function searchWiki(client, message) {
    let search = message.content.slice(8).trim();
    if (!search.length) { return message.reply('you have to input a search term to search the godwiki for.'); }
    search = encodeURI(search);
    const logsChannel = client.channels.cache.get(logs);
    console.log(`${message.author.tag} searched the godwiki for '${search}'.`);
    logsChannel.send(`${message.author.tag} searched the godwiki for '${search}'.`);
    return message.channel.send(`<https://wiki.godvillegame.com/index.php?search=${search}>`);
}

module.exports = searchWiki;