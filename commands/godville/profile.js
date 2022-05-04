const https = require('https');
const { MessageEmbed } = require('discord.js');

const { prefix, botvilleChannel } = require('../../configurations/config.json');
const logger = require('../features/logging');
const getUsers = require('../features/getUsers');
const getters = require('../../index');


async function showProfile(message, username, godData) {

    let self;
    let user;
    if (username.length > 0) {
        user = getUsers.One(username);
        if (!user) {
            return message.reply('Mention a valid user or use a valid username/ID!');
        }
    } else {
        user = message.author;
        self = true;
    }

    let author = user.tag;
    const nickname = message.guild.members.cache.get(user) ? message.guild.members.cache.get(user).displayName : null;
    if (nickname && nickname !== user.username) {
        author += '/' + nickname;
    }

    const godDoc = await godData.get();
    if (godDoc.data()[user.id] === undefined) {
        if (!self) {
            return message.reply(`<@${user.id}> hasn't linked their Godville account yet. They can do so using the \`${prefix}link\` command in <#${botvilleChannel}>.`);
        } else { return message.reply(`You haven't linked your Godville account yet. You can do that with the following command in <#${botvilleChannel}>: \`${prefix}link GODNAME\` or \`${prefix}link https://godvillegame.com/gods/GOD_NAME\``); }
    }
    const godURL = godDoc.data()[user.id];
    let god = godURL.slice(30);
    god = decodeURI(god);
    logger.log(`${message.author.tag} requested the profile page for ${god} AKA ${user.tag} in channel ${message.channel.name}.`);

    let godvilleData = null;
    try {
        godvilleData = await getGodData(godURL, message);
    } catch (err) {
        logger.log(`Error while getting god data for ${godURL}! Error: \n` + err);
        godvilleData = null;
    }

    const godEmbed = generateEmbed(god, godURL, godvilleData, { text: author, iconURL: user.displayAvatarURL() });
    return message.channel.send({ embeds: [godEmbed] });
}


async function showGodvilleProfile(message, godURL) {

    godURL = godURL.replace(/%20/g, ' ');
    if (!godURL.startsWith('https://godvillegame.com/gods/')) {
        if (!(/^[A-Z][a-zA-Z0-9- ]{2,29}$/.test(godURL))) {

            return message.reply(`This god(dess) name, '${godURL}', seems to be illegal. Make sure it only includes letters, numbers, hypens and spaces, and starts with a capital letter.`);
        } else {
            godURL = 'https://godvillegame.com/gods/' + godURL;
        }

    } else if (!(/^[A-Z][a-zA-Z0-9- ]{2,29}$/.test(godURL.slice(30)))) {

        return message.reply(`The god(dess) name at the end of the URL, '${godURL.slice(30)}', seems to be illegal. Make sure it only includes letters, numbers, hypens and spaces, and starts with a capital letter.`);
    }

    let god = godURL.slice(30);
    godURL = godURL.replace(/ /g, '%20');
    god = decodeURI(god);
    logger.log(`${message.author.tag} requested the profile page for URL ${godURL} in channel ${message.channel.name}.`);

    let godvilleData = null;
    try {
        godvilleData = await getGodData(godURL, message);
    } catch (err) {
        logger.log(`Error while getting god data for ${godURL}! Error: \n` + err);
        godvilleData = null;
    }

    const godEmbed = generateEmbed(god, godURL, godvilleData);
    return message.channel.send({ embeds: [godEmbed] });
}


function generateEmbed(god, godURL, godvilleData, footer = undefined) {
    if (!footer) {
        const client = getters.getClient();
        footer = { text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() };
    }

    if (!godvilleData) {
        const godEmbed = new MessageEmbed()
            .setTitle(god)
            .setURL(godURL)
            .setDescription('Click the god(dess)\'s username to open their Godville page.')
            .addField('ERROR', 'I couldn\'t found any data for this god(dess). Either my parsing code is outdated, the bot can\'t acces this page, or it was linked incorrectly. Click the blue link to check if the latter is the cause of this problem.')
            .setColor('006600')
            .setFooter(footer);
        return godEmbed;
    }

    // we return so there's no need for an else statement

    const godEmbed = new MessageEmbed()
        .setTitle(`${godvilleData.godGender} ${god}`)
        .setURL(godURL)
        .setThumbnail(godvilleData.avatarUrl)
        .setDescription('Not coming soon: Badges!')
        .addField(`${godvilleData.gender}`, `${godvilleData.name}, level ${godvilleData.level}\n${godvilleData.age} old`, true)
        .addField('Motto', godvilleData.motto, true)
        .setColor('006600')
        .setFooter(footer);

    if (godvilleData.guildName) {
        godEmbed.addField('Guild', `[${godvilleData.guildName}](${godvilleData.guildUrl})`, true);
    }
    if (godvilleData.petType) {
        godEmbed.addField('Pet', `[${godvilleData.petType}](${godvilleData.petUrl})\n${godvilleData.petName}`, true);
    }
    if (godvilleData.bossName) {
        godEmbed.addField('Boss', `${godvilleData.bossName}\n${godvilleData.bossPower} power`, true);
    }
    if (godvilleData.shop) {
        godEmbed.addField('Shop', godvilleData.shop, true);
    }

    godEmbed.addField('Medals', godvilleData.achievements, false);

    return godEmbed;
}


async function showLink(message, username, client, godData) {
    let self;
    let user;
    if (username.length > 0) {
        user = getUsers.One(username, client);
        if (!user) {
            return message.reply('Mention a valid user or use a valid username/ID!');
        }
    } else {
        user = message.author;
        self = true;
    }

    let fetchedUser = user.tag;
    const nickname = message.guild.members.cache.get(user) ? message.guild.members.cache.get(user).displayName : null;
    if (nickname && nickname !== user.username) {
        fetchedUser += '/' + nickname;
    }

    const godDoc = await godData.get();
    if (godDoc.data()[user.id] === undefined) {
        if (!self) {
            return message.reply(`<@${user.id}> hasn't linked their Godville account yet. They can do so using the \`${prefix}link\` command in <#${botvilleChannel}>.`);
        } else { return message.reply(`You haven't linked your Godville account yet. You can do that with the following command in <#${botvilleChannel}>: \`${prefix}link GODNAME\` or \`${prefix}link https://godvillegame.com/gods/GOD_NAME\``); }
    }

    const godURL = godDoc.data()[user.id];
    let god = godURL.slice(30);
    god = decodeURI(god);
    message.reply(`This is the god(dess) linked to ${fetchedUser}: **${god}** <${godURL}>`);

    logger.log(`${message.author.tag} requested the profile URL for god(dess) ${god} AKA ${user.tag} in channel ${message.channel.name}.`);
}


async function getGodData(URL, message) {
    const myFirstPromise = new Promise((resolve, reject) => {
        https.get(URL, (res) => {
            res.on('data', (d) => {
                //console.log(String(d));
                resolve(String(d));
            });
        }).on('error', (e) => {
            console.error(e);
            reject(e);
        });
    });

    let html = '';
    await myFirstPromise.then((result) => {
        html = result;
        //console.log(html);
    }).catch((error) => {
        logger.log(`Oops! Couldn't get god page for url ${URL}!` + error);
        message.channel.send('Could not obtain online data. This is most likely a connection error, or the linked URL is incorrect.');
        return (null);
    });

    if (!html) {
        logger.log(`Failed to get any html for URL ${URL}.`);
        message.channel.send('Could not obtain online data. This is most likely a connection error.');
        return (null);
    }


    const godData = {};

    // BASIC INFO
    const rx_level = /(?:class="level">)[\s\S]*?(\d+)/;
    const rx_name = /essential_info">[\s\S]*?<h3>([\s\S]*?)</;
    const rx_age = /label">Age(?:[\s\S]+?>){2}([\s\S]+?)</;
    const rx_gender = /caption">\s*(Hero(?:ine)?)/;
    const rx_god_gender = /caption">\s*(God(?:ess)?)/;

    godData.level = rx_level.exec(html)[1];
    godData.name = decodeURI(rx_name.exec(html)[1]).trim();
    godData.age = rx_age.exec(html)[1];
    godData.gender = rx_gender.exec(html)[1];
    godData.godGender = rx_god_gender.exec(html)[1];


    // AVATAR
    const rx_avatar = /(?:img alt="Gravatar)[^>]*?src="([^"?]*)["?]/;

    let avatar_url = '';
    const avatar_url_res = rx_avatar.exec(html);
    if (!avatar_url_res) {
        avatar_url = 'https://godvillegame.com/images/avatar.png';
    } else {
        avatar_url = avatar_url_res[1];
        if (avatar_url !== 'https://www.gravatar.com/avatar') {
            const rand = Date.now();
            avatar_url += rand;
        }
    }
    godData.avatarUrl = avatar_url;


    // GUILD
    const rx_guild = /name guild">[^>]+href="([^">]+?)">([^<>]+)/;
    const guild_res = rx_guild.exec(html);

    if (guild_res) {
        godData.guildName = decodeURI(guild_res[2].trim()).replace(/&#39;/g, '\'');
        // if the url contains spaces we need to encode it (if it doesn't we might accidentally double encode if we do)
        godData.guildUrl = guild_res[1].includes(' ') ? encodeURI(guild_res[1]) : guild_res[1];
    }


    // MOTTO
    const rx_motto = /motto">([^<]+)</;
    const motto_res = rx_motto.exec(html);

    if (motto_res) {
        godData.motto = decodeURI(motto_res[1]).trim().replace(/&#39;/g, '\'');
    } else {
        godData.motto = 'No motto set.';
    }


    // PET
    const rx_pet = /label">Pet[\s\S]*?href="([^">]+?)">(.*?)<\/a>(.*?)</;
    const pet_res = rx_pet.exec(html);

    if (pet_res) {
        // if the url contains spaces we need to encode it (if it doesn't we might accidentally double encode if we do)
        godData.petUrl = pet_res[1].includes(' ') ? encodeURI(pet_res[1]) : pet_res[1];
        godData.petType = decodeURI(pet_res[2]).trim().replace(/&#39;/g, '\'');
        godData.petName = decodeURI(pet_res[3]).trim().replace(/&#39;/g, '\'');
    }


    // BOSS
    const rxBoss = /label">Boss[\s\S]*?name">(.*?) with.*?(\d*%)/;
    const bossRes = rxBoss.exec(html);

    if (bossRes) {
        godData.bossName = decodeURI(bossRes[1]).trim().replace(/&#39;/g, '\'');
        godData.bossPower = bossRes[2];
    }


    // SHOP
    const rxShop = /label">Shop[\s\S]*?name">([^<]*)</;
    const shopRes = rxShop.exec(html);

    if (shopRes) {
        godData.shop = decodeURI(shopRes[1]).trim().replace(/&#39;/g, '\'');
    }


    // ACHIEVEMENTS
    const rx_temple = />(Temple Owner since )(\d+)\/(\d+)\/(\d+)/;
    const rx_ark = />(Ark Owner since )(\d+)\/(\d+)\/(\d+)/;
    const rx_animalist = />(Animalist since )(\d+)\/(\d+)\/(\d+)/;
    const rx_trader = />(Trader since )(\d+)\/(\d+)\/(\d+)/;
    const rx_creature_master = />(Creature Master since )(\d+)\/(\d+)\/(\d+)/;
    const rx_bookmaker = />(Bookmaker since )(\d+)\/(\d+)\/(\d+)/;

    const temple = rx_temple.exec(html);
    const ark = rx_ark.exec(html);
    const animalist = rx_animalist.exec(html);
    const trader = rx_trader.exec(html);
    const creature_master = rx_creature_master.exec(html);
    const bookmaker = rx_bookmaker.exec(html);

    // achievements needs to end with \n because the progressString is added at the end
    let achievements = '';
    if (!temple && !animalist) {
        achievements = `This ${godData.godGender} doesn't have any medals yet.\n`;
    } else {
        [temple, ark, animalist, trader, creature_master, bookmaker].forEach(e => {
            // transform mm-dd-yy to dd-mm-yy
            if (e) { achievements += `${e[1]}${e[3]}-${e[2]}-${e[4]}\n`; }
        });
    }

    // PROGRESS
    const progress = {};
    const rxBricks = /label">Bricks for Temple[\s\S]*?name">([^<]*)</i;
    const rxLogs1 = /label">Wood for Ark[\s\S]*?name">([^<]*)</i;
    const rxLogs2 = /label">Ark Completed at[\s\S]*?name">[^<()]*\((.*?)\)</i;
    const rxPairs = /label">Twos of Every Kind[\s\S]*?name">[^<()]*\((.*?)\)</i;
    const rxWords = /label">Words in Book[\s\S]*?name">([^<]*)</i;
    const rxSavings = /label">Savings[\s\S]*?name">[^<()]*\((.*?)\)</i;

    progress.bricks = rxBricks.exec(html);
    if (!ark) progress.logs = rxLogs1.exec(html);
    else progress.logs = rxLogs2.exec(html);
    progress.pairs = rxPairs.exec(html);
    progress.words = rxWords.exec(html);
    progress.savings = rxSavings.exec(html);

    const progressActive = [];
    Object.keys(progress).forEach(key => {
        const elem = progress[key];
        if (elem) progressActive.push(`${key}: ${elem[1]}`);
    });

    let progressString = progressActive.join(', ');
    progressString = `*${progressString[0].toUpperCase()}${progressString.slice(1)}*`;
    achievements += progressString; // there already is a newline before this added string
    godData.achievements = achievements;


    return (godData);
}

exports.showProfile = showProfile;
exports.showGodvilleProfile = showGodvilleProfile;
exports.showLink = showLink;