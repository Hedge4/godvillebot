const { owner } = require('../config.json');


async function purge(message) {
    if (message.member.roles.has('313448657540349962') || owner.has(message.author.id)) {
        if (message.channel.id === '671046033291345943') {
            message.delete();
            message.channel.fetchMessages().then(messages => {
                message.channel.bulkDelete(messages);
                const messagesDeleted = messages.array().length; // number of messages deleted
                // Logging the number of messages deleted on both the channel and console.
                message.reply('deletion of messages successful. Total messages deleted: ' + messagesDeleted);
                console.log('Deletion of messages successful. Total messages deleted: ' + messagesDeleted);
                console.log(`Command used by ${message.author.tag}.`);
            }).catch(err => {
                console.log('Error while doing Bulk Delete');
                console.log(err);
            });
        } else { message.reply('that command can not be used in this channel.'); }
    } else { message.reply('you do not have access to this command.'); }
}

exports.purge = purge;