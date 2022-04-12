const https = require('https');
const { prefix, logs, botvilleChannel } = require('../../configurations/config.json');
const getUsers = require('../features/getUsers');

async function showProfile(message, username, client, Discord, godData) {

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
    const logsChannel = client.channels.cache.get(logs);
    console.log(`${message.author.tag} requested the profile page for ${god} AKA ${user.tag} in channel ${message.channel.name}.`);
    logsChannel.send(`${message.author.tag} requested the profile page for ${god} AKA ${user.tag} in channel ${message.channel.name}.`);

    let godvilleData = null;
    try {
        godvilleData = await getGodData(godURL, message, client);
    } catch (err) {
        console.log(`Error while getting god data for ${godURL}! Error: \n` + err);
        logsChannel.send(`Error while getting god data for ${godURL}! Error: \n` + err);
        godvilleData = null;
    }

    if (!godvilleData) {
        const godEmbed = new Discord.MessageEmbed()
            .setTitle(god)
            .setURL(godURL)
            .setDescription('Click the god(dess)\'s username to open their Godville page.')
            .addField('ERROR', 'Extra data such as their (gr)avatar and level could not be found for this god; either the bot can\'t acces this page or it was linked incorrectly. In case of the former, the link above will still work.')
            .setColor('006600')
            .setFooter({ text: author, iconURL: user.displayAvatarURL() });
        return message.channel.send({ embeds: [godEmbed] });
    }

    if (!godvilleData[6]) {
        const godEmbed = new Discord.MessageEmbed()
            .setTitle(`${godvilleData[4]} ${god}`)
            .setURL(godURL)
            .setThumbnail(godvilleData[1])
            .setDescription('Coming soon: Badges!')
            .addField(`${godvilleData[0]}`, `${godvilleData[2]}, level ${godvilleData[3]}\n${godvilleData[11]} old`, true)
            .addField('Motto', godvilleData[8], true)
            .addField('Guild', `[${godvilleData[9]}](${godvilleData[10]})`, true)
            .addField('Medals', godvilleData[5], false)
            .setColor('006600')
            .setFooter({ text: author, iconURL: user.displayAvatarURL() });
        return message.channel.send({ embeds: [godEmbed] });
    } else {
        const godEmbed = new Discord.MessageEmbed()
            .setTitle(`${godvilleData[4]} ${god}`)
            .setURL(godURL)
            .setThumbnail(godvilleData[1])
            .setDescription('Coming soon: Badges!')
            .addField(`${godvilleData[0]}`, `${godvilleData[2]}, level ${godvilleData[3]}\n${godvilleData[11]} old`, true)
            .addField('Motto', godvilleData[8], true)
            .addField('Guild', `[${godvilleData[9]}](${godvilleData[10]})`, true)
            .addField('Pet', `${godvilleData[6]}\n${godvilleData[7]}`, true)
            .addField('Medals', godvilleData[5], false)
            .setColor('006600')
            .setFooter({ text: author, iconURL: user.displayAvatarURL() });
        return message.channel.send({ embeds: [godEmbed] });
    }
}

async function showGodvilleProfile(message, godURL, client, Discord) {

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
    const logsChannel = client.channels.cache.get(logs);
    console.log(`${message.author.tag} requested the profile page for URL ${godURL} in channel ${message.channel.name}.`);
    logsChannel.send(`${message.author.tag} requested the profile page for URL ${godURL} in channel ${message.channel.name}.`);

    let godvilleData = null;
    try {
        godvilleData = await getGodData(godURL, message, client);
    } catch (err) {
        console.log(`Error while getting god data for ${godURL}! Error: \n` + err);
        logsChannel.send(`Error while getting god data for ${godURL}! Error: \n` + err);
        godvilleData = null;
    }

    if (!godvilleData) {
        const godEmbed = new Discord.MessageEmbed()
            .setTitle(god)
            .setURL(godURL)
            .setDescription('Click the god(dess)\'s username to open their Godville page.')
            .addField('ERROR', 'I couldn\'t found any data for this god(dess). Either the bot can\'t acces this page or it was linked incorrectly. In case of the former, the link above will still work.')
            .setColor('006600');
        return message.channel.send({ embeds: [godEmbed] });
    }

    if (!godvilleData[6]) {
        const godEmbed = new Discord.MessageEmbed()
            .setTitle(`${godvilleData[4]} ${god}`)
            .setURL(godURL)
            .setThumbnail(godvilleData[1])
            .setDescription('Coming soon: Badges!')
            .addField(`${godvilleData[0]}`, `${godvilleData[2]}, level ${godvilleData[3]}\n${godvilleData[11]} old`, true)
            .addField('Motto', godvilleData[8], true)
            .addField('Guild', `[${godvilleData[9]}](${godvilleData[10]})`, true)
            .addField('Medals', godvilleData[5], false)
            .setColor('006600');
        return message.channel.send({ embeds: [godEmbed] });
    } else {
        const godEmbed = new Discord.MessageEmbed()
            .setTitle(`${godvilleData[4]} ${god}`)
            .setURL(godURL)
            .setThumbnail(godvilleData[1])
            .setDescription('Coming soon: Badges!')
            .addField(`${godvilleData[0]}`, `${godvilleData[2]}, level ${godvilleData[3]}\n${godvilleData[11]} old`, true)
            .addField('Motto', godvilleData[8], true)
            .addField('Guild', `[${godvilleData[9]}](${godvilleData[10]})`, true)
            .addField('Pet', `${godvilleData[6]}\n${godvilleData[7]}`, true)
            .addField('Medals', godvilleData[5], false)
            .setColor('006600');
        return message.channel.send({ embeds: [godEmbed] });
    }
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

    const logsChannel = client.channels.cache.get(logs);
    console.log(`${message.author.tag} requested the profile URL for god(dess) ${god} AKA ${user.tag} in channel ${message.channel.name}.`);
    logsChannel.send(`${message.author.tag} requested the profile URL for god(dess) ${god} AKA ${user.tag} in channel ${message.channel.name}.`);
}

async function getGodData(URL, message, client) {
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

    const logsChannel = client.channels.cache.get(logs);
    let html = '';
    await myFirstPromise.then((result) => {
        html = result;
        //console.log(html);
    }).catch((error) => {
        console.log(`Oops! Couldn't get god page for url ${URL}!` + error);
        logsChannel.send(`Oops! Couldn't get god page for url ${URL}!` + error);
        message.channel.send('Could not obtain online data. This is most likely a connection error, or the linked URL is incorrect.');
        return (null);
    });

    if (!html) {
        console.log(`Failed to get any html for URL ${URL}.`);
        logsChannel.send(`Failed to get any html for URL ${URL}.`);
        message.channel.send('Could not obtain online data. This is most likely a connection error.');
        return (null);
    }


    // BASIC INFO
    const rx_level = /(?:class="level">)[\s\S]*?(\d+)/;
    const rx_name = /essential_info">[\s\S]*?<h3>([\s\S]*?)</;
    const rx_age = /label">Age(?:[\s\S]+?>){2}([\s\S]+?)</;
    const rx_gender = /caption">\s*(Hero(?:ine)?)/;
    const rx_god_gender = /caption">\s*(God(?:ess)?)/;

    const level = rx_level.exec(html)[1];
    const name = decodeURI(rx_name.exec(html)[1]).trim();
    const age = rx_age.exec(html)[1];
    const gender = rx_gender.exec(html)[1];
    const god_gender = rx_god_gender.exec(html)[1];


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


    // GUILD
    const rx_guild = /name guild">[^>]+href="([^">]+?)">([^<>]+)/;
    const guild_res = rx_guild.exec(html);

    let guild_name = 'No guild.';
    let guild_url;
    if (guild_res) {
        guild_name = (decodeURI(guild_res[2].trim())).replace(/&#39;/g, '\'');
        guild_url = guild_res[1];
    }


    // MOTTO
    const rx_motto = /motto">([^<]+)</;
    const motto_res = rx_motto.exec(html);

    let motto = 'No motto set.';
    if (motto_res) {
        motto = (decodeURI(motto_res[1])).trim().replace(/&#39;/g, '\'');
    }


    // PET
    const rx_pet_type = /label">Pet(?:[\s\S]*?>){3}([\s\S]*?)</;
    const rx_pet_name = /label">Pet(?:[\s\S]*?>){4}([\s\S]*?)</;
    const pet_type_res = rx_pet_type.exec(html);

    let pet_name;
    let pet_type;
    if (pet_type_res) {
        pet_name = (decodeURI(rx_pet_name.exec(html)[1].trim())).replace(/&#39;/g, '\'');
        pet_type = (decodeURI(pet_type_res[1])).replace(/&#39;/g, '\'');
    } else {
        pet_name = null;
        pet_type = null;
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

    let achievements = '';
    if (!temple && !animalist) {
        achievements = `This ${god_gender} doesn't have any medals yet.`;
    } else {
        [temple, ark, animalist, trader, creature_master, bookmaker].forEach(e => {
            // transform mm-dd-yy to dd-mm-yy
            if (e) { achievements += `${e[1]}${e[3]}-${e[2]}-${e[4]}\n`; }
        });
    }


    return ([gender, avatar_url, name, level, god_gender, achievements, pet_type, pet_name, motto, guild_name, guild_url, age]);
}

exports.showProfile = showProfile;
exports.showGodvilleProfile = showGodvilleProfile;
exports.showLink = showLink;