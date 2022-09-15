const { channels } = require('../../configurations/config.json');

function searchWiki(client, search, message) {
    if (!search.length) { return message.reply('You have to input a search term to search the godwiki for.'); }
    search = encodeURI(search);
    const logsChannel = client.channels.cache.get(channels.logs);
    console.log(`${message.author.tag} searched the godwiki for '${search}'.`);
    logsChannel.send(`${message.author.tag} searched the godwiki for '${search}'.`);
    return message.channel.send(`<https://wiki.godvillegame.com/index.php?search=${search}>`);
}

module.exports = searchWiki;