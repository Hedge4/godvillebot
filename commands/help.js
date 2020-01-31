const { prefix } = require('../config.json');

const commands_list = [
    [`${prefix}help`,
    'Displays this help message.'],
    [`${prefix}suggest <suggestion>`,
    'Sends a feature request for the bot to me. I need ideas!'],
    [`${prefix}level [user]`,
    'Checks a user\'s level in the server.'],
    [`${prefix}gold [user]`,
    'Checks how many server gold someone has.'],
    [`${prefix}ranking [page]`,
    'Shows the server godpower rankings.'],
    [`${prefix}link <URL/god-name>`,
    'Links your Godville account to your Discord account.'],
    [`${prefix}profile`,
    'Shows your Godville account, if you\'ve linked it.'],
    [`${prefix}godwiki <search term>`,
    'Searches the godwiki.'],
    [`${prefix}guides [number]`,
    'Shows a list of useful Godville guides saved in the bot.'],
];

function constructHelp(message, Discord, client) {
    let text = '';
    for (let i = 0; i < commands_list.length; i++) {
        text += `\`${commands_list[i][0]}\` ${commands_list[i][1]}\n`;
    }
    const helpEmbed = new Discord.RichEmbed()
        .setTitle('GodBot commands')
        .setColor(0x63CCBE) // Soft blue
        .setDescription('GodBot gives server members XP, or \'godpower\' for talking in channels that aren\'t <#313398792588099604> or <#315874239779569666>. After reaching a specific amount of godpower, you\'ll level up.\n\n' + text)
        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/a/a4/Cute-Ball-Help-icon.png')
        .setTimestamp()
        .setFooter('GodBot is brought to you by Wawajabba', client.user.avatarURL);
    console.log(`${message.author.tag} requested the help message in ${message.channel.name}.`);
    return message.channel.send(helpEmbed);
}

exports.helpMessage = constructHelp;