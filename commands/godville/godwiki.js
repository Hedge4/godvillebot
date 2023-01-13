const logger = require('../features/logging.js');

function searchWiki(search, message) {
    if (!search.length) { return message.reply('You have to input a search term to search the godwiki for.'); }
    search = encodeURI(search);
    logger.log(`${message.author.tag} searched the godwiki for '${search}'.`);
    return message.channel.send(`<https://wiki.godvillegame.com/index.php?search=${search}>`);
}

module.exports = searchWiki;