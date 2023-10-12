const logger = require('../features/logging');

function searchWiki(search, message) {
    if (!search.length) {
        message.reply('You have to input a search term to search the godwiki for.');
        return;
    }
    search = encodeURI(search);
    logger.log(`${message.author.tag} searched the godwiki for '${search}'.`);
    message.channel.send(`<https://wiki.godvillegame.com/index.php?search=${search}>`);
    return;
}

module.exports = searchWiki;