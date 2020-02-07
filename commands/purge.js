const { owner, purge_channels, admin_role } = require('../configurations/config.json');


async function purge(message) {
    if (message.member.roles.has(admin_role) || owner.includes(message.author.id)) {
        if (purge_channels.includes(message.channel.id)) {
            message.delete();
            message.channel.bulkDelete(100)
            .then(messages => {
                console.log(`Purged ${messages.size} messages in ${message.channel.name}. Command used by ${message.author.tag}.`);
                message.reply(`purged ${messages.size} messages.`);
            })
            .catch(console.error);
        } else { message.reply('that command can not be used in this channel.'); }
    } else { message.reply('you do not have access to this command.'); }
}

exports.purge = purge;