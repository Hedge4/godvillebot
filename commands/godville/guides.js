const { channels, prefix } = require('../../configurations/config.json');

const guides_list = [
    ['Extensive sailing guide by Blue Feather',
    'This is a very extensive sailing guide that covers pretty much everything a beginning (or experienced) sailor would like to know. If you haven\'t unlocked sailing yet, this guide may be a bit tough to start with.',
    'https://wiki.godvillegame.com/Feather_Mail#Sailing_Guide',
    'Blue Feather, contributors at bottom of page'],
    ['Arena tips by Hairplug4men',
    'Arena basics and strategies.',
    'http://wiki.godvillegame.com/hairplug4men',
    'Hairplug4men'],
    ['Avolyt\'s arena advice',
    'A well-outlined and organized strategy guide.',
    'https://wiki.godvillegame.com/Avolyt#Avolyt\'s_Arena_Guide',
    'Avolyt'],
    ['Advice for new players and a plethora of useful references',
    'A basic guide for new players and a reference to many useful pages in the wiki.',
    'https://godvillegame.com/gods/Hairplug4men#chronicle',
    'Hairplug4men'],
    ['Ursina’s very basic dungeon guide for the true beginner',
    'A short but very complete dungeon guide which should contain all the information a beginning dungeoneer should know.',
    'https://godvillegame.com/gods/Ursina#chronicle',
    'Ursina'],
    ['Help! The ideabox sucks!',
    'A very thorough and complete guide to writing content for the ideabox, as well as a FAQ.',
    'https://drive.google.com/file/d/0B1w4BOl9Za2RcElGZkdsUVNjNjQ/view',
    'Brinjal'],
];

function show_guides_list(client, message) {
    const logsChannel = client.channels.cache.get(channels.logs);
    console.log(`${message.author.tag} requested the list of guides in channel ${message.channel.name}`);
    logsChannel.send(`${message.author.tag} requested the list of guides in channel ${message.channel.name}`);
    let text = '```diff\n';
    for (let i = 0; i < guides_list.length; i++) {
        text += `+ {${i + 1}}  ${guides_list[i][0]}\n`;
    }
    text += `\nUse "${prefix}guides [number]" to get the URL to a specific guide. Contact Wawajabba to include your guide here, or use ${prefix}suggest. Be sure to include the URL, a short and an extended description and the guide authors.\n\`\`\``;
    message.reply(`Here are all ${guides_list.length} currently available guides:\n${text}`);
}

function show_guide(message, guide_number, client, Discord) {
    const index_number = guide_number - 1;
    const guide_embed = new Discord.MessageEmbed()
        .setTitle(guides_list[index_number][0])
        .setURL(guides_list[index_number][2])
        .setColor(0xFFD300) // Dark yellow
        .setDescription(guides_list[index_number][1])
        .setFooter(`Guide by ${guides_list[index_number][3]}`);
    message.channel.send({ embeds: [guide_embed] });
    const logsChannel = client.channels.cache.get(channels.logs);
    console.log(`${message.author.tag} requested the guide "${guides_list[index_number][0]}" in channel ${message.channel.name}.`);
    logsChannel.send(`${message.author.tag} requested the guide "${guides_list[index_number][0]}" in channel ${message.channel.name}.`);
}

function list_or_guide(message, number, client, Discord) {
    if (!number.length) {
        show_guides_list(client, message);
    } else {
        const logsChannel = client.channels.cache.get(channels.logs);
        console.log(`${message.author.tag} requested guide ${number} in channel ${message.channel.name}.`);
        logsChannel.send(`${message.author.tag} requested guide ${number} in channel ${message.channel.name}.`);

        if (isNaN(number)) {
            return message.reply('You need to enter the number of the guide you want to view.');
        }
        if (number < 1 || number > guides_list.length) {
            return message.reply('That guide number doesn\'t exist.');
        }
        number = Math.floor(number);
        show_guide(message, number, client, Discord);
    }
}

module.exports = list_or_guide;