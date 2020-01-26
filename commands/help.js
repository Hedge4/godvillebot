const { prefix } = require('../config.json');

const commands_list = [
    [`${prefix}example-command`,
    'Example command description',
    'Much longer command description'],
    [`${prefix}help`,
    'Displays this help message.'],
];

function constructHelp(message, Discord) {
    let text = '';
    for (let i = 1; i < commands_list.length; i++) {
        text += `\`${commands_list[i][0]}\` ${commands_list[i][1]}\n`;
    }
    const helpEmbed = new Discord.RichEmbed()
        .setTitle('GodBot commands')
        .setColor(0x63CCBE) // Soft blue
        .setDescription('GodBot gives server members XP, or \'godpower\' for talking in channels that aren\'t <#431305701021974539> or <#315874239779569666>. After reaching a specific amount of godpower, you\'ll level up.')
        .addField('', text)
        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/a/a4/Cute-Ball-Help-icon.png')
        .setTimestamp()
        .setFooter('GodBot is brought to you by Wawajabba', 'https://i.imgur.com/TyGn2ch.jpg');
    message.channel.send(helpEmbed);
}

exports.helpMessage = constructHelp;