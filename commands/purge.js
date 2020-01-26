const { owner } = require('../config.json');


async function purge(message) {
    if (message.member.roles.has('313448657540349962') || owner.includes(message.author.id)) {
        if (message.channel.id === '671046033291345943') {
            message.delete();
            message.channel.bulkDelete(100)
            .then(messages => {
                console.log(`Bulk deleted ${messages.size} messages. Command used by ${message.author.tag}.`);
                message.reply(`purged ${messages.size} messages.`);
            })
            .catch(console.error);
        } else { message.reply('that command can not be used in this channel.'); }
    } else { message.reply('you do not have access to this command.'); }
}

exports.purge = purge;