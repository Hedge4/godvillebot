const { prefix } = require('../../configurations/config.json');
const logger = require('../features/logging');

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

function showGuidesList(message) {
    logger.log(`${message.author.tag} requested the list of guides in channel ${message.channel.name}`);
    let text = '```diff\n';
    for (let i = 0; i < guides_list.length; i++) {
        text += `+ {${i + 1}}  ${guides_list[i][0]}\n`; // two spaces on purpose for better outlining, + so line is green in diff format
    }
    text += `\nUse "${prefix}guides [number]" to get the URL to a specific guide. Contact Wawajabba to include your guide here, or use ${prefix}suggest. Be sure to include the URL, a short and an extended description and the guide authors.\n\`\`\``;
    message.reply(`Here are all ${guides_list.length} currently available guides:\n${text}`);
}

function showGuide(message, guide_number, Discord) {
    const index_number = guide_number - 1;
    const guide_embed = new Discord.EmbedBuilder()
        .setTitle(guides_list[index_number][0])
        .setURL(guides_list[index_number][2])
        .setColor(0xFFD300) // Dark yellow
        .setDescription(guides_list[index_number][1])
        .setFooter({ text: `Guide by ${guides_list[index_number][3]}` });
    message.channel.send({ embeds: [guide_embed] });
    logger.log(`${message.author.tag} requested the guide "${guides_list[index_number][0]}" in channel ${message.channel.name}.`);
}

function listOrGuide(message, number, Discord) {
    if (!number.length) {
        showGuidesList(message);
    } else {
        logger.log(`${message.author.tag} requested guide ${number} in channel ${message.channel.name}.`);

        if (isNaN(number)) {
            return message.reply('You need to enter the number of the guide you want to view.');
        }
        if (number < 1 || number > guides_list.length) {
            return message.reply('That guide number doesn\'t exist.');
        }
        number = Math.floor(number);
        showGuide(message, number, Discord);
    }
}

module.exports = listOrGuide;