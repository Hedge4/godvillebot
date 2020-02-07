const { prefix } = require('../configurations/config.json');

const commands_list = [
    ['help',
    `${prefix}help [command]`,
    'Displays this help message.',
    'No description added yet.'],
    ['godpower',
    'godpower',
    `Get extra information about the godpower system using \`${prefix}help godpower\`.`,
    'By talking in channels that aren\'t mostly spam you can gain ~3-21 godpower per minute. You can check your godpower with `>level` or check the overall rankings with `>ranking`.'],
    ['newspaper',
    'newspaper',
    `Get extra information about the newspaper funcions and the commands you can use for it using \`${prefix}help newspaper\`.`,
    'Every day, at 22:20 UTC (15 minutes after it changes), GodBot automatically solves the crossword in the Godville Times and sends the solution in <#431305701021974539>, where these commands also work.',
    [[`${prefix}crossword`, 'Sends the locally stored crossword solution in the current channel.'],
    [`${prefix}forecast`, 'Send the locally stored forecast in the current channel.'],
    [`${prefix}both`, 'Sends both the locally stored crossword solution and forecast in the current channel.'],
    [`${prefix}update`, 'Shows the time remaining before GodBot automatically updates its crossword solution and forecast.'],
    [`${prefix}renew`, 'Bot-owner only. Force renews the stored crossword solution and forecast to the most up to date version.']]],
    ['suggest',
    `${prefix}suggest <suggestion>`,
    'Sends a feature request for the bot to me. I need ideas!',
    'No description added yet.'],
    ['level',
    `${prefix}level [user]`,
    'Checks a user\'s level in the server.',
    'No description added yet.'],
    ['gold',
    `${prefix}gold [user]`,
    'Checks how many server gold someone has.',
    'No description added yet.'],
    ['ranking',
    `${prefix}ranking [page]`,
    'Shows the server godpower rankings.',
    'No description added yet.'],
    ['link',
    `${prefix}link <URL/god-name>`,
    'Links your Godville account to your Discord account.',
    'No description added yet.'],
    ['profile',
    `${prefix}profile`,
    'Shows your Godville account, if you\'ve linked it.',
    'No description added yet.'],
    ['godwiki',
    `${prefix}godwiki <search term>`,
    'Searches the godwiki.',
    'No description added yet.'],
    ['guides',
    `${prefix}guides [number]`,
    'Shows a list of useful Godville guides saved in the bot.',
    'No description added yet.'],
    ['daily',
    `${prefix}daily`,
    'No description added yet.',
    'No description added yet.'],
];

function constructHelp(message, Discord, client) {
    let text = '**__List of commands and functions:__**\n';
    for (let i = 0; i < commands_list.length; i++) {
        text += `\`${commands_list[i][1]}\` ${commands_list[i][2]}\n`;
    }
    const helpEmbed = new Discord.RichEmbed()
        .setTitle('GodBot commands')
        .setColor(0x63CCBE) // Soft blue
        .setDescription('GodBot gives XP, or \'godpower\' for talking, and provides several other Godville related functions, such as linking your profile and daily crossword solutions. Use `>help [command]` for more information on a specific command/function.\n\n' + text)
        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/a/a4/Cute-Ball-Help-icon.png')
        .setTimestamp()
        .setFooter('GodBot is brought to you by Wawajabba', client.user.avatarURL);
    console.log(`${message.author.tag} requested the help message in ${message.channel.name}.`);
    return message.channel.send(helpEmbed);
}

function constructSpecificHelp(message, Discord, client, element) {
    if (!element[4]) {
        const specificHelpEmbed = new Discord.RichEmbed()
            .setTitle(`Help for ${element[1]}`)
            .setColor(0x63CCBE) // Soft blue
            .setDescription(element[3])
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/a/a4/Cute-Ball-Help-icon.png')
            .setTimestamp()
            .setFooter('GodBot is brought to you by Wawajabba', client.user.avatarURL);
        console.log(`${message.author.tag} requested the ${element[0]} help message in ${message.channel.name}.`);
        return message.channel.send(specificHelpEmbed);
    } else {
        let examples = '';
        for (let i = 0; i < element[4].length; i++) {
            examples += `\`${element[4][i][0]}\` ${element[4][i][1]}\n`;
        }
        const specificHelpEmbed = new Discord.RichEmbed()
            .setTitle(`Help for ${element[1]}`)
            .setColor(0x63CCBE) // Soft blue
            .setDescription(element[3] + '\n\u200B')
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/a/a4/Cute-Ball-Help-icon.png')
            .addField('__Usage examples:__', `${examples}`)
            .setTimestamp()
            .setFooter('GodBot is brought to you by Wawajabba', client.user.avatarURL);
        console.log(`${message.author.tag} requested the ${element[0]} help message in ${message.channel.name}.`);
        return message.channel.send(specificHelpEmbed);
    }
}

function chooseHelp(message, Discord, client) {
    const arg = message.content.toLowerCase().slice(5).trim();
    if (!arg || !arg.length) {
        constructHelp(message, Discord, client);
    } else {
        commands_list.forEach(element => {
            if (arg === element[0]) {
                return constructSpecificHelp(message, Discord, client, element);
            }
        });
    }
}

exports.getHelp = chooseHelp;