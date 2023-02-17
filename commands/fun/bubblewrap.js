const logger = require('../../features/logging.js');

async function main(client, message) {
    logger.log(`${message.author.tag} used the bubblewrap command in ${message.channel.name}.`);
    let tobewrapped = message.content.slice(11).trim();

    tobewrapped = tobewrapped.replace(/<([^:]*):([^:]+):([0-9]+)>/g, ''); // filter out custom emojis
    tobewrapped = tobewrapped.replace(/\|\|/g, ''); // filter out spoiler marks
    while (/<(@&?|#)[0-9]+>/.test(tobewrapped)) {
        const rx_role = /<@&([0-9]+)>/.exec(tobewrapped);
        const rx_member = /<@([0-9]+)>/.exec(tobewrapped);
        const rx_channel = /<#([0-9]+)>/.exec(tobewrapped);
        if (rx_channel) {
            const channel = client.channels.cache.get(rx_channel[1]);
            if (channel) {
                tobewrapped = tobewrapped.replace(/<#[0-9]+>/, '#' + channel.name);
            } else {
                tobewrapped = tobewrapped.replace(rx_channel[0], '#invalid-channel');
            }
        }
        if (rx_member) {
            try {
                const member = await message.guild.members.fetch(rx_member[1]);
                tobewrapped = tobewrapped.replace(rx_member[0], '@' + member.displayName);
            } catch (err) { tobewrapped = tobewrapped.replace(rx_member[0], '@invalid-user'); }
        }
        if (rx_role) {
            try {
                const role = message.guild.roles.cache.get(rx_role[1]);
                tobewrapped = tobewrapped.replace(rx_role[0], '@' + role.name);
            } catch (err) { tobewrapped = tobewrapped.replace(rx_role[0], '@invalid-role'); }
        }
    }

    let wrapped = '';
    if (tobewrapped.length > 3 && tobewrapped.length <= 500) {
        const runs = Math.floor(tobewrapped.length / 3);
        for (let i = 1; i < runs; i++) {
            wrapped = wrapped + '||' + (tobewrapped.slice(0, 3)) + '||';
            tobewrapped = tobewrapped.slice(3);
        }
        if (tobewrapped.length === 5) {
            wrapped = wrapped + '||' + (tobewrapped.slice(0, 3) + '||||' + tobewrapped.slice(3)) + '||';
        } else if (tobewrapped.length === 4) {
            wrapped = wrapped + '||' + (tobewrapped.slice(0, 2) + '||||' + tobewrapped.slice(2)) + '||';
        } else {(wrapped = (wrapped + '||' + (tobewrapped)) + '||');}
        message.delete();
        message.channel.send(`<@${message.author.id}>: ${wrapped}`); // no reply, original message is deleted
    } else {message.reply('You can only bubblewrap messages longer than 3 characters and shorter than 500 characters.');}
}

module.exports = main;