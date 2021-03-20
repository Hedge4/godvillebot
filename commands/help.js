const { prefix, levelup_channel, logs } = require('../configurations/config.json');

const commands_list = [
    ['help',
    `${prefix}help [command]`,
    'Displays this help message.',
    'Oh come on, just use the dang command!',
    [[`${prefix}help newspaper`, 'Sends more information about the newspaper bot features and commands.']]],
    ['godpower',
    'godpower',
    `Get extra information about the godpower system using \`${prefix}help godpower\`.`,
    'By talking in channels that aren\'t mostly spam you can gain ~3-21 godpower per minute. You can check your godpower with `>level` or check the overall rankings with `>ranking`.',
    [[`${prefix}toggle-mentions`, 'Enables or disables being mentioned on a level-up, depending on your current setting.']]],
    ['newspaper',
    'newspaper',
    `Get extra information about the newspaper funcions and the commands you can use for it using \`${prefix}help newspaper\`.`,
    'Every day, at 22:20 UTC (15 minutes after it changes), GodBot automatically solves the crossword in the Godville Times and sends the solution in <#431305701021974539>, where these commands also work.',
    [[`${prefix}crossword`, 'Sends the locally stored crossword solution in the current channel.'],
    [`${prefix}forecast`, 'Send the locally stored forecast in the current channel.'],
    [`${prefix}both`, 'Sends both the locally stored crossword solution and forecast in the current channel.'],
    [`${prefix}update`, 'Shows the time remaining before GodBot automatically updates its crossword solution and forecast.'],
    ['?rank newsping', 'Toggles whether you\'ll be mentioned to complete the bingo and crossword an hour before the newspaper updates.'],
    [`${prefix}renew`, 'Admin only. Force renews the stored crossword solution and forecast to the most up to date version.']]],
    ['fun',
    'fun',
    `Get a list of all commands that are just for fun, and explanations on how to use them with \`${prefix}help fun\`.`,
    'These commands are not useful in any way, but they could theoretically be considered entertaining.',
    [[`${prefix}minesweeper [-s size] [-b bomb_percentage]`, 'Generates a minesweeper game. Default size: 6. Default % of bombs: 15.'],
    [`${prefix}bubblewrap <text>`, 'Returns your message in bubblewrap style.']]],
    ['suggest',
    `${prefix}suggest <suggestion>`,
    'Sends a feature request for the bot to me. I need ideas!',
    `Use \`${prefix}suggest <suggestion>\` to send a suggestion to the [bot suggestion server](https://discord.gg/dFC4sWv), where I keep track of ideas I can add, have added, or have rejected. Suggestions have to be at least 20 characters long and should provide an explanation of what your suggested feature/command does.`],
    ['level',
    `${prefix}level [user]`,
    'Checks a user\'s level in the server.',
    'You can use this command to check the level card of anyone in the server. If you don\'t add a user, the bot will display your own level.',
    [[`${prefix}level`, 'Displays your own level card.'],
    [`${prefix}level RandomBob#6917`, 'Displays the level card of the user with username "RandomBob#6917". The identifier tag (#6917) is optional.'],
    [`${prefix}level @RandomBob`, 'Displays the level card of the user you mentioned.']]],
    ['gold',
    `${prefix}gold [user]`,
    'Checks how many server gold someone has.',
    'You can use this command to check the gold amount owned by anyone in the server. If you don\'t add a user, the bot will display your own gold. You will be able to use guild to buy fun server stuff in the future.',
    [[`${prefix}gold`, 'Displays how much how gold you have.'],
    [`${prefix}gold RandomBob#6917`, 'Displays the gold amount owned the user with username "RandomBob#6917". The identifier tag (#6917) is optional.'],
    [`${prefix}gold @RandomBob`, 'Displays the gold amount owned by the user you mentioned.']]],
    ['ranking',
    `${prefix}ranking [page]`,
    'Shows the server godpower rankings.',
    'Shows who has earned the most godpower since the creation of the bot. This will also show your own ranking, and you can include a page number to check more of the rankings than just the top 10.'],
    ['link',
    `${prefix}link <URL/god-name>`,
    'Links your Godville account to your Discord account.',
    `After using this command, the \`${prefix}profile\` command can analyse your godville account and display data about it. The bot will store your God name and link it to your unique Discord ID.`,
    [[`${prefix}link https://godvillegame.com/gods/RandomBob`, `Links your ${prefix}profile to the god 'RandomBob'.`],
    [`${prefix}link RandomBob`, `Links your ${prefix}profile to the god 'RandomBob'.`]]],
    ['profile',
    `${prefix}profile [user]`,
    'Shows your Godville account, if you\'ve linked it.',
    `Only usable if the requested user has used ${prefix}link before. This command will analyse the user's Godville profile, and return the most useful information from it, such as hero(ine) level, guild and achievements.`,
    [[`${prefix}profile`, 'Displays your own profile.'],
    [`${prefix}profile RandomBob#6917`, 'Displays the profile of the user with username "RandomBob#6917". The identifier tag (#6917) is optional.'],
    [`${prefix}profile @RandomBob`, 'Displays the profile of the user you mentioned.']]],
    ['godwiki',
    `${prefix}godwiki <search term>`,
    'Searches the godwiki.',
    'Returns a search query in the godwiki with the arguments you provided.',
    [[`${prefix}godwiki pretty potatoes`, 'Returns the link for the search query "pretty potatoes".']]],
    ['guides',
    `${prefix}guides [number]`,
    'Shows a list of useful Godville guides saved in the bot.',
    'The bot stores link to several useful guides on Godville\'s website Use this command to get those links.',
    [[`${prefix}guides`, 'Shows the list of all guides stored in the bot.'],
    [`${prefix}guides 2`, 'Shows more information about and the link to the second guide in the guides list.'],
    ['Adding a guide:', `Please use \`${prefix}suggest\` to suggest a guide! Make sure to include a short description, a longer one, the author(s) and the link!`]]],
    ['daily',
    `${prefix}daily`,
    'Claim your daily gold reward.',
    'Claim your daily 7-19 gold. You will be able to use gold to buy fun server stuff in the future.'],
    ['spoiler',
    `${prefix}spoiler [URL]`,
    'Have the bot post an image/file as a spoiler.',
    'Easily mark an image or file as a spoiler, even using the mobile app. You can post the file/image as an attachment in your message, or as a URL after the command. If you add an attachment a URL will be ignored.'],
    ['spoiler',
    `${prefix}code`,
    'View the bot\'s code.',
    'yeah idk I kinda added this command as an example, you know? It\'s not really useful or anything...'],
    ['break',
    `${prefix}break [minutes]`,
    'Admin only. Pauses the bot for a while.',
    'Admin only. Pauses the bot for [minutes] minutes, 1 minute if no number is specified. The number will be rounded up and has to be in the range 1-60.'],
];

function constructHelp(message, Discord, client) {
    let text = '**__List of commands and functions:__**\n';
    for (let i = 0; i < commands_list.length; i++) {
        text += `\`${commands_list[i][1]}\` ${commands_list[i][2]}\n`;
    }
    const helpEmbed = new Discord.MessageEmbed()
        .setTitle('GodBot commands')
        .setColor(0x63CCBE) // Soft blue
        .setDescription(`GodBot gives XP, or 'godpower' for talking, and provides several other Godville related functions, such as linking your profile and daily crossword solutions. Use \`${prefix}help [command]\` for more information on a specific command/function.\n\n` + text)
        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/a/a4/Cute-Ball-Help-icon.png')
        .setTimestamp()
        .setFooter('GodBot is brought to you by Wawajabba', client.user.avatarURL());
    const logsChannel = client.channels.cache.get(logs);
    console.log(`${message.author.tag} requested the help message in ${message.channel.name}.`);
    logsChannel.send(`${message.author.tag} requested the help message in ${message.channel.name}.`);
    return helpEmbed;
}

function constructSpecificHelp(message, Discord, client, element) {
    if (!element[4]) {
        const specificHelpEmbed = new Discord.MessageEmbed()
            .setTitle(`Help for ${element[1]}`)
            .setColor(0x63CCBE) // Soft blue
            .setDescription(element[3])
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/a/a4/Cute-Ball-Help-icon.png')
            .setTimestamp()
            .setFooter('GodBot is brought to you by Wawajabba', client.user.avatarURL());
        const logsChannel = client.channels.cache.get(logs);
        console.log(`${message.author.tag} requested the ${element[0]} help message in ${message.channel.name}.`);
        logsChannel.send(`${message.author.tag} requested the ${element[0]} help message in ${message.channel.name}.`);
        return specificHelpEmbed;
    } else {
        let examples = '';
        for (let i = 0; i < element[4].length; i++) {
            examples += `\`${element[4][i][0]}\` ${element[4][i][1]}\n`;
        }
        const specificHelpEmbed = new Discord.MessageEmbed()
            .setTitle(`Help for ${element[1]}`)
            .setColor(0x63CCBE) // Soft blue
            .setDescription(element[3] + '\n\u200B')
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/a/a4/Cute-Ball-Help-icon.png')
            .addField('__Usage examples:__', `${examples}`)
            .setTimestamp()
            .setFooter('GodBot is brought to you by Wawajabba', client.user.avatarURL());
        const logsChannel = client.channels.cache.get(logs);
        console.log(`${message.author.tag} requested the ${element[0]} help message in ${message.channel.name}.`);
        logsChannel.send(`${message.author.tag} requested the ${element[0]} help message in ${message.channel.name}.`);
        return specificHelpEmbed;
    }
}

function chooseHelp(message, Discord, client, correct_channel) {
    const arg = message.content.toLowerCase().slice(5).trim();
    let helpEmbed = '';
    if (!arg || !arg.length) {
        helpEmbed = constructHelp(message, Discord, client);
    } else if (!commands_list.some(function(e) {
        if (arg === e[0]) {
            helpEmbed = constructSpecificHelp(message, Discord, client, e);
            return true;
        }
    })) {
        return message.reply(`I don't know the command \`${prefix}${arg}\`!`);
    }
    if (correct_channel) {
        return message.channel.send(helpEmbed);
    } else {
        message.reply(`I've sent my help message in <#${levelup_channel}>!`);
        return client.channels.cache.get(levelup_channel).send(helpEmbed);
    }
}

exports.getHelp = chooseHelp;