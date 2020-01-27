const { prefix } = require('../config.json');

const commands_list = [
    [`${prefix}help`,
    'Displays this help message.'],
    [`${prefix}suggest <suggestion>`,
    'Makes you an absolutely wonderful human being and sends a feature request to the mods/me. I need ideas!'],
    [`${prefix}level [user]`,
    ''],
    [`${prefix}gold [user]`,
    ''],
    [`${prefix}ranking [page]`,
    ''],
    [`${prefix}link <URL>`,
    ''],
    [`${prefix}profile`,
    ''],
    [`${prefix}guides [number]`,
    ''],
];

function constructHelp(message, Discord) {
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
        .setFooter('GodBot is brought to you by Wawajabba', 'https://images-na.ssl-images-amazon.com/images/I/71SFEHfhpxL.png');
    message.channel.send(helpEmbed);
}

exports.helpMessage = constructHelp;