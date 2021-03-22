const guide = require('./guides');
const godWiki = require('./godWiki');
const profile = require('./profile');

function redirect(cmd, content, message, client, Discord, godData) {
    switch (cmd) {
        case 'profile':
            return profile.show(message, client, Discord, godData);
        case 'guides':
            return guide(message, client, Discord);
        case 'godwiki':
            return godWiki(client, message);
        case 'link':
            return profile.link(message, godData, client);
        default:
            return message.reply(`${cmd} command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;