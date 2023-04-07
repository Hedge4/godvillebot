const { channels } = require('../../configurations/config.json');
const logger = require('./logging');
let client;

const roleData = {
    '817245288208007189': {
        name: 'Server related channels',
        desc: 'These channels offer extra features in the server, and aren\'t specifically tailored to one particular topic or interest.',
        roles: {
            '<:r_godvoice:313795720123514880>': {
                fullName: 'Eventping',
                roleName: null,
                roleId: '801205667565273108',
                desc: 'Get notified about server events',
            },
            '🎧': {
                fullName: 'Music bot',
                roleName: null,
                roleId: '351507395949887488',
                desc: 'Listen to Youtube via Discord!',
            },
            '<:ms_godvillelogo:313789584720789505>': {
                fullName: 'Simplify server',
                roleName: null,
                roleId: '1093884657830994032',
                desc: 'Hide nonessential channels unrelated to Godville.',
            },
        },
    },
    '817245315405053994': {
        name: 'Godville related channels',
        desc: 'These channels are about specific features of the game, for in-depth discussion. You have access to these channels by default, but can remove those you\'re not interested in.',
        roles: {
            '<:t_goldbrick:668184145276436491>': {
                fullName: 'Arena',
                roleName: null,
                roleId: '321586849464188929',
                desc: '',
            },
            '1️⃣': {
                fullName: 'Arenaping',
                roleName: null,
                roleId: '385257763649093633',
                desc: 'Schedule arena fights',
            },
            '2️⃣': {
                fullName: 'Sparping',
                roleName: null,
                roleId: '901969781589176330',
                desc: 'Schedule friendly sparring matches',
            },
            '<:t_book:668225252999954442>': {
                fullName: 'Datamining',
                roleName: null,
                roleId: '653672864712491019',
                desc: '',
            },
            '<:t_log:668185664650739723>': {
                fullName: 'Dungeoning and digging',
                roleName: null,
                alts: ['dungeon', 'dig', 'dungeoning', 'digging', 'dungeonanddig', 'dungeoninganddigging'],
                roleId: '321643163913551872',
                desc: '',
            },
            '4️⃣': {
                fullName: 'Digping',
                roleName: null,
                roleId: '403594583864377347',
                desc: 'Fight a dig boss together',
            },
            '5️⃣': {
                fullName: 'Dungeonping',
                roleName: null,
                roleId: '385257678936473600',
                desc: 'Find a team to dungeon with',
            },
            '8️⃣': {
                fullName: 'Basementping',
                roleName: null,
                roleId: '1018664221115940895',
                desc: 'Find a dungeon team to explore the basement',
            },
            '<:i_rejected:700766050345549884>': {
                fullName: 'Ideaboxing',
                roleName: null,
                roleId: '321643270515982347',
                desc: '',
            },
            '9️⃣': {
                fullName: 'Ideaboxping',
                roleName: null,
                roleId: '1039853677101453362',
                desc: 'Get a (daily) word prompt for ideabox inspiration',
            },
            '📰': {
                fullName: 'Newspaper and crossword',
                roleName: null,
                alts: ['news', 'newspaper', 'crossword'],
                roleId: '429354829266288661',
                desc: '',
            },
            '6️⃣': {
                fullName: 'Newsping',
                roleName: null,
                roleId: '677288625301356556',
                desc: 'Get a daily newspaper reminder',
            },
            '<:t_ark:668206710413852730>': {
                fullName: 'Sailing',
                roleName: null,
                roleId: '321643133983260676',
                desc: '',
            },
            '7️⃣': {
                fullName: 'Sailping',
                roleName: null,
                roleId: '385257725845831682',
                desc: 'Ensure matching for sails',
            },
        },
    },
    '817245331095158817': {
        name: 'Miscellaneous channels',
        desc: 'These channels are about specific topics not related to the server or Godville that you might be interested in.',
        roles: {
            '⛩️': {
                fullName: 'Anime and manga',
                roleName: null,
                alts: ['anime', 'manga'],
                roleId: '321022037688582144',
                desc: '',
            },
            '🎨': {
                fullName: 'Art and photography',
                roleName: null,
                alts: ['art', 'photography'],
                roleId: '321022003509460992',
                desc: '',
            },
            '🐿️': {
                fullName: 'Dogville',
                roleName: null,
                alts: ['animals', 'animal'],
                roleId: '371494991253733377',
                desc: 'Animal pictures',
            },
            '🍲': {
                fullName: 'Food and cooking',
                roleName: null,
                alts: ['food', 'cooking'],
                roleId: '418276015480242178',
                desc: '',
            },
            '🚨': {
                fullName: 'Memezone',
                roleName: null,
                roleId: '321021476352294912',
                desc: '',
            },
            '🎤': {
                fullName: 'Music and recordings',
                roleName: null,
                alts: ['music', 'recordings'],
                roleId: '321021944432689153',
                desc: '',
            },
            '⚖️': {
                fullName: 'Philosophy',
                roleName: null,
                roleId: '733458541418905603',
                desc: '',
            },
            '🗞️': {
                fullName: 'Politics and debate',
                roleName: null,
                alts: ['politics', 'debate'],
                roleId: '321022131083280385',
                desc: '',
            },
            '📚': {
                fullName: 'Reading',
                roleName: null,
                roleId: '1021573139584524338',
                desc: '',
            },
            '🏞️': {
                fullName: 'Sports and nature',
                roleName: null,
                alts: ['sports', 'nature'],
                roleId: '818996395641798686',
                desc: '',
            },
            '📺': {
                fullName: 'Tv and movies',
                roleName: null,
                alts: ['tv', 'movies'],
                roleId: '1048575366480023552',
                desc: '',
            },
            '📢': {
                fullName: 'Venting and support',
                roleName: null,
                alts: ['venting', 'support'],
                roleId: '322398869524840448',
                desc: '',
            },
            '🎮': {
                fullName: 'Videogames',
                roleName: null,
                roleId: '325190743608131584',
                desc: '',
            },
            '<:cbc_kittyhug:669704540433416192>': {
                fullName: 'Wholesome content',
                roleName: null,
                roleId: '734018519443701770',
                desc: '',
            },
            '✍️': {
                fullName: 'Writing',
                roleName: null,
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
        Object.values(roleData).forEach(msg => {
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
    if (!roleData[message.id]) {
        return logger.log(`ReactionRoles: Detected a reaction to a message in <#${channels.reactionRoles}>, but the message with id ${message.id} isn't registered in roleData.`);
    }

    // the role name in roleData - differs based on if this is a regular or guild emoji
    let roleIdentifier;
    if (reaction.emoji.id === null) roleIdentifier = reaction.emoji.name;
    else roleIdentifier = `<:${reaction.emoji.identifier}>`;
    const roleInfo = roleData[message.id].roles[roleIdentifier];

    // return if role isn't registered
    if (!roleInfo) {
        return logger.log(`ReactionRoles: Detected an unknown reaction to one of the messages in <#${channels.reactionRoles}>. The reaction was ${roleIdentifier} by user ${user.tag}.`);
    }
    const roleId = roleInfo.roleId; // get roleId from roleData based on the identifier

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
