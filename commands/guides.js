const guides_list = [
    ['Extensive sailing guide by Blue Feather', 'This is a very extensive sailing guide that covers pretty much everything a beginning (or experienced) sailor would like to know. If you haven\'t unlocked sailing yet, this guide may be a bit tough to start with.', 'https://wiki.godvillegame.com/Feather_Mail#Sailing_Guide', 'Blue Feather, contributors at bottom of page'],
];

function show_guides_list(message) {
    let text = '```\n';
    for (let i = 0; i < guides_list.length; i++) {
        text += ` {${i + 1}}   ${guides_list[i][0]}\n`;
    }
    text += '\nUse ">guides [number]" to get the URL to a specific guide.\nContact Wawajabba to include your guide here.\n```';
    message.reply(`here are all ${guides_list.length} currently available guides:\n${text}`);
}

function show_guide(message, guide_number, Discord) {
    const index_number = guide_number - 1;
    const guide_embed = new Discord.RichEmbed()
        .setTitle(guides_list[index_number][0])
        .setURL(guides_list[index_number][2])
        .setColor(0xFFD300) // Dark yellow
        .setDescription(guides_list[index_number][1])
        .setFooter(`Guide by ${guides_list[index_number][3]}`);
    message.channel.send(guide_embed);
}

function list_or_guide(message, Discord) {
    let number = message.content.slice(7).trim();
    if (!number.length) {
        show_guides_list(message);
    } else {
        if (isNaN(number)) {
            return message.reply('you need to enter the number of the guide you want to view.');
        }
        if (number < 1 || number > guides_list.length) {
            return message.reply('that guide number doesn\'t exist.');
        }
        number = Math.floor(number);
        show_guide(message, number, Discord);
    }
}

exports.guides = list_or_guide;