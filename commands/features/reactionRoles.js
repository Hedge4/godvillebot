const { channels } = require('../../configurations/config.json');
const logger = require('./logging');
let client;

/* example categoryData with explanations:
message id: {
    name: category name for display in >getrole command
    desc: category description for display in >getrole command
    availableAsCommand: boolean, set availability through >getrole command
    roles: {
        reaction id or emote: {
            roleId: role id as string
            fullName: role name for display in >getrole command
            alts: array of alternative names for >getrole command, commands will always be simplified to lowercase without spaces,
                underscores or dashes, and the role name is automatically added as well
            desc: role description for >getrole command
        },
    },
}, */

const categoryData = {
    '817245288208007189': {
        name: 'Server related channels',
        desc: 'These channels offer extra features in the server, and aren\'t specifically tailored to one particular topic or interest.',
        availableAsCommand: true,
        roles: {
            '<:r_godvoice:313795720123514880>': {
                fullName: 'Eventping',
                alts: ['event', 'events'],
                roleId: '801205667565273108',
                desc: 'Get notified about server events',
            },
            '🎧': {
                fullName: 'Music bot',
                alts: ['musicbot'],
                roleId: '351507395949887488',
                desc: 'Listen to music from Youtube via Discord!',
            },
            '<:ms_godvillelogo:313789584720789505>': {
                fullName: 'Simplify server',
                alts: ['godvilleonly', 'simplify'],
                roleId: '1093884657830994032',
                desc: 'Hide nonessential channels unrelated to Godville.',
            },
        },
    },
    '817245315405053994': {
        name: 'Godville related channels',
        desc: 'These channels are about specific features of the game, for in-depth discussion. You have access to these channels by default, but can remove those you\'re not interested in.',
        availableAsCommand: true,
        roles: {
            '<:t_goldbrick:668184145276436491>': {
                fullName: 'Arena',
                roleId: '321586849464188929',
                desc: 'Get arena advice, or organise a fight',
            },
            '1️⃣': {
                fullName: 'Arenaping',
                roleId: '385257763649093633',
                desc: 'Schedule arena fights',
            },
            '0️⃣': {
                fullName: 'Blogping',
                roleId: '1306791626311729162',
                desc: 'Get mentioned for new Godville blog posts!',
            },
            '2️⃣': {
                fullName: 'Sparping',
                roleId: '901969781589176330',
                alts: ['spar', 'sparring', 'spars'],
                desc: 'Schedule friendly sparring matches',
            },
            '<:t_book:668225252999954442>': {
                fullName: 'Datamining',
                alts: ['data', 'datamine'],
                roleId: '653672864712491019',
                desc: 'Help with datamining, or book progress',
            },
            '<:t_log:668185664650739723>': {
                fullName: 'Dungeons and digging',
                alts: ['dungeon', 'dig', 'dungeons', 'digging', 'dungeonanddig'],
                roleId: '321643163913551872',
                desc: 'Ask about dungeons, or organise a joint adventure',
            },
            '4️⃣': {
                fullName: 'Digping',
                roleId: '403594583864377347',
                desc: 'Fight a dig boss together',
            },
            '5️⃣': {
                fullName: 'Dungeonping',
                roleId: '385257678936473600',
                desc: 'Find a team to dungeon with',
            },
            '8️⃣': {
                fullName: 'Basementping',
                roleId: '1018664221115940895',
                desc: 'Find a dungeon team to explore the basement',
            },
            '<:i_rejected:700766050345549884>': {
                fullName: 'Ideaboxing',
                alts: ['ideabox'],
                roleId: '321643270515982347',
                desc: 'Talk about the ideabox, and improve your prompts',
            },
            '9️⃣': {
                fullName: 'Ideaboxping',
                roleId: '1039853677101453362',
                desc: 'Get a (daily) word prompt for ideabox inspiration',
            },
            '📰': {
                fullName: 'Newspaper and crossword',
                alts: ['news', 'newspaper', 'crossword'],
                roleId: '429354829266288661',
                desc: 'Discuss the news, and get crossword help',
            },
            '6️⃣': {
                fullName: 'Newsping',
                roleId: '677288625301356556',
                desc: 'Get a daily newspaper reminder',
            },
            '<:t_ark:668206710413852730>': {
                fullName: 'Sailing',
                alts: ['sail', 'sails'],
                roleId: '321643133983260676',
                desc: 'Ask for sailing advice or discuss sail adventures',
            },
            '7️⃣': {
                fullName: 'Sailping',
                roleId: '385257725845831682',
                desc: 'Ensure you match for sailing adventures',
            },
        },
    },
    '817245331095158817': {
        name: 'Miscellaneous channels',
        desc: 'These channels are about specific topics not related to the server or Godville that you might be interested in.',
        availableAsCommand: true,
        roles: {
            '⛩️': {
                fullName: 'Anime and manga',
                alts: ['anime', 'manga'],
                roleId: '321022037688582144',
                desc: '',
            },
            '🎨': {
                fullName: 'Art and photography',
                alts: ['art', 'photography', 'ert'],
                roleId: '321022003509460992',
                desc: '',
            },
            '🐿️': {
                fullName: 'Dogville',
                alts: ['animals', 'animal'],
                roleId: '371494991253733377',
                desc: 'Animal pictures',
            },
            '🍲': {
                fullName: 'Food and cooking',
                alts: ['food', 'cooking'],
                roleId: '418276015480242178',
                desc: '',
            },
            '🚨': {
                fullName: 'Memezone',
                roleId: '321021476352294912',
                desc: '',
            },
            '🎤': {
                fullName: 'Music and recordings',
                alts: ['music', 'recordings', 'recording'],
                roleId: '321021944432689153',
                desc: '',
            },
            '🗞️': {
                fullName: 'Politics and debate',
                alts: ['politics', 'debate'],
                roleId: '321022131083280385',
                desc: '',
            },
            '📚': {
                fullName: 'Reading',
                roleId: '1021573139584524338',
                desc: '',
            },
            '🏞️': {
                fullName: 'Sports and nature',
                alts: ['sports', 'nature'],
                roleId: '818996395641798686',
                desc: '',
            },
            '📺': {
                fullName: 'Tv and movies',
                alts: ['tv', 'movies'],
                roleId: '1048575366480023552',
                desc: '',
            },
            '📢': {
                fullName: 'Venting and support',
                alts: ['venting', 'support'],
                roleId: '322398869524840448',
                desc: '',
            },
            '🎮': {
                fullName: 'Videogames',
                roleId: '325190743608131584',
                desc: '',
            },
            '<:cbc_kittyhug:669704540433416192>': {
                fullName: 'Goodville',
                alts: ['wholesome', 'wholesomeness'],
                roleId: '734018519443701770',
                desc: 'Positive and wholesome content',
            },
            '✍️': {
                fullName: 'Writing',
                roleId: '369320944101097475',
                desc: '',
            },
        },
    },
};

// fetch messages that should trigger reaction roles
function fetchToggleMessages(clientVar) {
    client = clientVar;

    client.channels.fetch(channels.reactionRoles).then(channel => {
        Object.values(categoryData).forEach(msg => {
            channel.messages.fetch(msg);
        });
    });
}

async function reactionUpdate(type, reaction, user, message) {
    // disregard reactions not in #toggleChannels
    if (message.channel.id !== channels.reactionRoles) return;

    // prevent people blocked from using reaction roles from using the bot
    if (reactionRolesBlocked.includes(message.author.id)) { return; }

    // return if category isn't registered
    if (!categoryData[message.id]) {
        return logger.log(`ReactionRoles: Detected a reaction to a message in <#${channels.reactionRoles}>, but the message with id ${message.id} isn't registered in categoryData.`);
    }

    // the role name in categoryData - differs based on if this is a regular or guild emoji
    let roleIdentifier;
    if (reaction.emoji.id === null) roleIdentifier = reaction.emoji.name;
    else roleIdentifier = `<:${reaction.emoji.identifier}>`;
    const roleInfo = categoryData[message.id].roles[roleIdentifier];

    // return if role isn't registered
    if (!roleInfo) {
        return logger.log(`ReactionRoles: Detected an unknown reaction to one of the messages in <#${channels.reactionRoles}>. The reaction was ${roleIdentifier} by user ${user.tag}.`);
    }
    const roleId = roleInfo.roleId; // get roleId from categoryData based on the identifier

    const guild = reaction.message.guild;
    const memberWhoReacted = await guild.members.fetch(user);
    const role = guild.roles.cache.find(r => r.id === roleId);

    // return in case role doesn't exist (anymore)
    if (!role) {
        return logger.log(`ReactionRoles: Couldn't ${type} role ${roleInfo.fullName} / ${roleIdentifier} / ${roleId} to user ${user.tag} because the role couldn't be found.`);
    }

    if (type === 'add') {
        memberWhoReacted.roles.add(role)
            .catch((e) => { logger.log(`ReactionRoles: Couldn't add role ${role.name} to user ${user.tag}: ${e}.`); })
            .then(logger.log(`ReactionRoles: Successfully added the ${role.name} role to ${user.tag}.`));
    } else {
        memberWhoReacted.roles.remove(role)
            .catch((e) => { logger.log(`ReactionRoles: Couldn't remove role ${role.name} from user ${user.tag}: ${e}.`); })
            .then(logger.log(`ReactionRoles: Successfully removed the ${role.name} role from ${user.tag}.`));
    }
}

async function commandUpdate() {
    // to be added later to replace ?rank
}

exports.load = fetchToggleMessages;
exports.reaction = reactionUpdate;
exports.command = commandUpdate;
exports.categories = categoryData;
