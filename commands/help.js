const { prefix } = require('./config.json');

const commands_list = [
    [`${prefix}command`,
    'command_description',
    'much longer command description'],
    [`${prefix}help`,
    'Displays this help message.'],
];

function constructHelp(message, Discord) {
    let text = '';
    for (let i = 1; i < commands_list.length; i++) {
        text += `${commands_list[i][0]} ${commands_list[i][1]}\n`;
    }
    const helpEmbed = new Discord.RichEmbed()
        .setTitle('CrosswordGod commands')
        .setColor(0x63CCBE) // Soft blue
        .setDescription('GodBot gives server members XP, or \'godpower\' for talking in channels that aren\'t <#431305701021974539> or <#315874239779569666>. After reaching a specific amount of godpower, you\'ll level up.\n\u200b')
        .addField(text)
        .setThumbnail('https://c.pxhere.com/images/a3/f5/82424b67ff26ed3c691aa7e606ac-1444795.jpg!d')
        .setTimestamp()
        .setFooter('GodBot is brought to you by Wawajabba', 'https://i.imgur.com/TyGn2ch.jpg');
    message.channel.send(helpEmbed);
}

exports.helpMessage = constructHelp;