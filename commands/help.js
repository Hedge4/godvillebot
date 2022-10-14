const { prefix, channels } = require('../configurations/config.json');
const logger = require('./features/logging');

const commands_list = [
    ['help',
        `${prefix}help [command]`,
        'Displays this help message.',
        'Oh come on, just use the dang command!',
        [[`${prefix}help newspaper`, 'Sends more information about the newspaper bot features and commands.']]],
    ['godpower',
        'godpower',
        `Get extra information about the godpower system using \`${prefix}help godpower\`.`,
        'By talking in channels that aren\'t mostly spam you can gain ~3-21 godpower per minute. You can check your godpower with `>level` or check the overall rankings with `>ranking`.\n\n Godpower is just for measuring chatting activity and has nothing to do with godpower in the game.',
        [[`${prefix}toggle-mentions`, 'Enables or disables being mentioned on a level-up, depending on your current setting.']]],
    ['newspaper',
        'newspaper',
        `Get extra information about the newspaper funcions and the commands you can use for it using \`${prefix}help newspaper\`.`,
        'Every day, at 22:10 UTC (5 minutes after it changes), GodBot automatically downloads and summarises the Godville Times, and then sends it in <#431305701021974539>. These commands also work in that channel.',
        [[`${prefix}solve`, 'Solves one or more crossword words using the Omnibus List. Use a dot ( . ) for unknown characters, and commas to separate different words. You can also use * to match 1 or more characters.'],
        [`${prefix}solvehtml`, 'Download the newspaper page (**while logged in, otherwise the crossword is hidden**) and add the file to the message with this command. The bot will automatically extract and solve the crossword.'],
        [`${prefix}newspaper`, 'Sends today\'s Godville Time\'s summary. Please note the bot updates five minutes after the (normal) daily reset.'],
        [`${prefix}newsdelay`, 'Shows the time remaining before GodBot automatically updates its Godville Time\'s summary.'],
        [`${prefix}refreshomnibus`, 'Downloads a newer version of the Omnibus List (the bot uses this to solve the crossword). The bot automatically updates its own Omnibus List reference every day, so only use this in case this update failed or if there was a recent addition to the Omnibus List.'],
        ['?rank newsping', 'Toggles whether you\'ll be mentioned to complete the bingo and crossword an hour before the newspaper updates.'],
        [`${prefix}refreshnews`, '(Admin only.) Forcefully updates the bot\'s summary of today\'s Godville Times. Use only when the bot fails to update, or if the newspaper refreshed later than usual.'],
        [`${prefix}omnibusbackup`, '(Owner only.) Creates a new local backup of the Omnibus List. Do not use while the bot is being hosted, as the backup will be reset after at most a day.']]],
    ['fun',
        'fun',
        `Get a list of all commands that are just for fun, and explanations on how to use them with \`${prefix}help fun\`.`,
        'These commands are not useful in any way, but they could theoretically be considered entertaining.',
        [[`${prefix}minesweeper [-s size] [-b bomb_percentage]`, 'Generates a minesweeper game. Default size: 6. Default % of bombs: 15.'],
        [`${prefix}bubblewrap <text>`, 'Returns your message in bubblewrap style.'],
        [`${prefix}randomnick`, 'Gives you a fancy randomly generated nickname!'],
        [`${prefix}nope <user>`, 'Nopes the specified user.'],
        [`${prefix}bonk <user>`, 'Bonks the specified user - they deserved it!'],
        [`${prefix}hug <user>`, 'Hugs the specified user, because sometimes we care about positive vibes too :two_hearts:']]],
    ['suggest',
        `${prefix}suggest <suggestion>`,
        'Sends a feature request for the bot to me. I need ideas!',
        `Use \`${prefix}suggest <suggestion>\` to send a suggestion to the [bot suggestion server](https://discord.gg/dFC4sWv), where I keep track of ideas I can add, have added, or have rejected. Suggestions have to be at least 20 characters long and should provide an explanation of what your suggested feature/command does.`],
    ['level',
        `${prefix}level [user]`,
        'Checks a user\'s level in the server.',
        'You can use this command to check the level card of anyone in the server. If you don\'t specify a user, the bot will display your own level.',
        [[`${prefix}level`, 'Displays your own level card.'],
        [`${prefix}level RandomBob#6917`, 'Displays the level card of the user with username "RandomBob#6917". The identifier tag (#6917) is optional.'],
        [`${prefix}level @RandomBob`, 'Displays the level card of the user you mentioned.']]],
    ['gold',
        `${prefix}gold [user]`,
        'Checks how many server gold someone has.',
        'You can use this command to check the gold amount owned by anyone in the server. If you don\'t specify a user, the bot will display your own gold. You will be able to use guild to buy fun server stuff in the future.\n\nGold is just for bragging rights/transactions in the server and has nothing to do with Godville itself.',
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
    ['showlink',
        `${prefix}showlink <user>`,
        'Displays the Godville link associated with that Discord user.',
        `Displays the Godville link associated with that Discord user. Useful in case you want to check something that isn't in the ${prefix}profile command.`,
        [[`${prefix}showlink @RandomBob`, 'Shows the Godville URL for Discord user RandomBob.'],
        [`${prefix}showlink 346301339548123136`, 'Shows the Godville URL for the Discord user with this ID.']]],
    ['profile',
        `${prefix}profile [user]`,
        'Shows your or someone else\'s Godville account, if you/they have linked it.',
        `Shows your or someone else's Godville account, if you/they have linked it. Only usable if the requested user has used ${prefix}link before. This command will analyse the user's Godville profile, and return the most useful information from it, such as hero(ine) level, guild and achievements.`,
        [[`${prefix}profile`, 'Displays your own profile.'],
        [`${prefix}profile RandomBob#6917`, 'Displays the profile of the user with username "RandomBob#6917". The identifier tag (#6917) is optional.'],
        [`${prefix}profile @RandomBob`, 'Displays the profile of the user you mentioned.']]],
    ['gvprofile',
        `${prefix}gvprofile <URL/god-name>`,
        'Shows Godville profile data for a requested Godville user.',
        'This command will analyse a Godville user\'s profile, and return the most useful information from it, such as hero(ine) level, guild and achievements. To be looked up via this command, the user does not have to be in the discord.',
        [[`${prefix}gvprofile Randombob`, 'Displays the profile of Godville user "Randombob".'],
        [`${prefix}gvprofile https://godvillegame.com/gods/Wawajabba`, 'Displays the profile of Godville user "Wawajabba".']]],
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
    ['code',
        `${prefix}code`,
        'View the bot\'s code.',
        'yeah idk I kinda added this command as an example, you know? It\'s not really useful yet or anything...'],
    ['randomnick',
        `${prefix}randomnick`,
        'Let the bot assign you a random nickname.',
        'This command, which can only be used in spam allowed channels, will create a random new nickname for you from a pool of ~1000 nicknames and adjectives.\n\nThere will be a random chance for a nickname following one of these three formats:\n a) *nickname* + *nickname*\n b) *adjective* + *nickname*\n c) *nickname* + the + *adjective*'],
    ['react',
        `${prefix}react <message ID> <reaction>`,
        'Add letter emojis as a reaction to a message.',
        'I am too tired to explain this right now, so just try it, lol. You get the ID of the message you want to react to by right clicking on it and copying the ID (developer mode) or copying the link and only using the last number of the url.'],
    ['makevote',
        `${prefix}makevote <message ID> [number]`,
        'Make a message into a vote. Support multiple choice votes if you specify a number of votes (2 to 10).',
        'Not even going to write any better instructions here lol. I wonder how long it\'ll be until someone sees this.'],
    ['ping',
        `${prefix}ping`,
        'Check the bot\'s ping!',
        'See how long it takes before your command reaches the bot!\n\nAlso checks another kind of ping, but I\'m not really sure what it means. Please just assume it means something and that it is correct though.'],
    ['remindme',
        `${prefix}remindme <amount> <time unit> [message]`,
        'Have the bot send you a reminder after a certain time.',
        'You\'ll figure it out champ.'],
    ['break',
        `${prefix}break [minutes]`,
        'Admin only. Pauses the bot for a while. Currently broken - so don\'t do it.',
        'Admin only. Pauses the bot for [minutes] minutes, 1 minute if no number is specified. The number will be rounded up and has to be in the range 1-60.'],
];

function constructHelp(message, Discord, client) {
    let text = '**__List of commands and functions:__**\n';
    for (let i = 0; i < commands_list.length; i++) {
        text += `\`${commands_list[i][1]}\` ${commands_list[i][2]}\n`;
    }
    const helpEmbed = new Discord.EmbedBuilder()
        .setTitle('GodBot commands')
        .setColor(0x63CCBE) // Soft blue
        .setDescription(`GodBot gives XP, or 'godpower' for talking, and provides several other Godville related functions, such as linking your profile and daily crossword solutions. Use \`${prefix}help [command]\` for more information on a specific command/function.\n\n` + text)
        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/a/a4/Cute-Ball-Help-icon.png')
        .setTimestamp()
        .setFooter({ text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() });
    logger.log(`${message.author.tag} requested the help message in ${message.channel.name}.`);
    return helpEmbed;
}

function constructSpecificHelp(message, Discord, client, element) {
    if (!element[4]) {
        const specificHelpEmbed = new Discord.EmbedBuilder()
            .setTitle(`Help for ${element[1]}`)
            .setColor(0x63CCBE) // Soft blue
            .setDescription(element[3])
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/a/a4/Cute-Ball-Help-icon.png')
            .setTimestamp()
            .setFooter({ text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() });
        logger.log(`${message.author.tag} requested the ${element[0]} help message in ${message.channel.name}.`);
        return specificHelpEmbed;
    } else {
        let examples = '';
        const examplesList = [];
        for (let i = 0; i < element[4].length; i++) {
            if (examples.length + `\`${element[4][i][0]}\` ${element[4][i][1]}\n`.length > 1000) { // max 1024 chars per field
                examplesList.push(examples); // empty examples and start as new
                examples = '';
            }
            examples += `\`${element[4][i][0]}\` ${element[4][i][1]}\n`;
        }
        if (examplesList.length) examplesList.push(examples); // if we made use of examplesList, add the last examples as well

        const specificHelpEmbed = new Discord.EmbedBuilder()
            .setTitle(`Help for ${element[1]}`)
            .setColor(0x63CCBE) // Soft blue
            .setDescription(element[3] + '\n\u200B')
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/a/a4/Cute-Ball-Help-icon.png')
            .setTimestamp()
            .setFooter({ text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() });

        if (examplesList.length) {
            for (let i = 0; i < examplesList.length; i++) {
                const e = examplesList[i];
                specificHelpEmbed.addFields([{ name: `__Usage examples ${i + 1}:__`, value: `${e}` }]);
            }
        } else {
            specificHelpEmbed.addFields([{ name: '__Usage examples:__', value: `${examples}` }]);
        }

        logger.log(`${message.author.tag} requested the ${element[0]} help message in ${message.channel.name}.`);
        return specificHelpEmbed;
    }
}

function chooseHelp(message, Discord, client) {
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
    if (Object.values(channels.commandsAllowed).includes(message.channel.id)) {
        return message.channel.send({ embeds: [helpEmbed] });
    } else {
        message.reply(`I've sent my help message in <#${channels.botville}>!`);
        return client.channels.cache.get(channels.botville).send({ embeds: [helpEmbed] });
    }
}

module.exports = chooseHelp;