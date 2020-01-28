function searchWiki(message) {
    let search = message.content.slice(8).trim();
    if (!search.length) { return message.reply('you have to input something to search the godwiki for.'); }
    search = encodeURI(search);
    return message.channel.send(`<https://wiki.godvillegame.com/index.php?search=${search}>`);
}

exports.search = searchWiki;