const guide = require('./guides');
const godWiki = require('./godwiki');
const link = require('./link');
const profile = require('./profile');

function redirect(cmd, content, message, client, Discord, godData) {
    switch (cmd) {
        case 'profile':
            return profile.showProfile(message, content, client, Discord, godData);
        case 'gvprofile':
            return profile.showGodvilleProfile(message, content, client, Discord);
        case 'showlink':
            return profile.showLink(message, content, client, godData);
        case 'guides':
            return guide(message, content, client, Discord);
        case 'godwiki':
            return godWiki(client, content, message);
        case 'link':
            return link(message, content, godData, client);
        default:
            return message.reply(`The '${cmd}' command does not seem to be correctly set up.`);
    }
}

module.exports = redirect;