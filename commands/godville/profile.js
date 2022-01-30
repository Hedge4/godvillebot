const https = require('https');
const { prefix, logs, botvilleChannel } = require('../../configurations/config.json');
const getUsers = require('../features/getUsers');

async function showProfile(message, username, client, Discord, godData) {

    let self;
    let user;
    if (username.length > 0) {
        user = getUsers.One(username, client);
        if (!user) {
            return message.reply('mention a valid user or use a valid username/ID!');
        }
    } else {
        user = message.author;
        self = true;
    }


    let author = user.tag;
    const nickname = message.guild.member(user) ? message.guild.member(user).displayName : null;
    if (nickname !== user.username) {
        author += '/' + nickname;
    }

    const godDoc = await godData.get();
    if(godDoc.data()[user.id] === undefined) {
        if (!self) {
            return message.reply(`<@${user.id}> hasn't linked their Godville account yet.\nThey can do so using the \`${prefix}link\` command in <#${botvilleChannel}>.`);
        } else { return message.reply(`you haven't linked your Godville account yet. You can do that with the following command in <#${botvilleChannel}>: \`${prefix}link GODNAME\` or \`${prefix}link https://godvillegame.com/gods/GOD_NAME\``); }
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
    } catch(err) {
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
        return message.channel.send(godEmbed);
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
        return message.channel.send(godEmbed);
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
        return message.channel.send(godEmbed);
    }
}

async function showGodvilleProfile(message, godURL, client, Discord) {

    godURL = godURL.replace(/%20/g, ' ');
    if (!godURL.startsWith('https://godvillegame.com/gods/')) {
        if (!(/^[A-Z][a-zA-Z0-9- ]{2,29}$/.test(godURL))) {

            return message.reply(`this god(dess) name, '${godURL}', seems to be illegal. Make sure it only includes letters, numbers, hypens and spaces, and starts with a capital letter.`);
        } else {
            godURL = 'https://godvillegame.com/gods/' + godURL;
        }

    } else if (!(/^[A-Z][a-zA-Z0-9- ]{2,29}$/.test(godURL.slice(30)))) {

        return message.reply(`the god(dess) name at the end of the URL, '${godURL.slice(30)}', seems to be illegal. Make sure it only includes letters, numbers, hypens and spaces, and starts with a capital letter.`);
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
    } catch(err) {
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
        return message.channel.send(godEmbed);
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
        return message.channel.send(godEmbed);
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
        return message.channel.send(godEmbed);
    }
}

async function showLink(message, username, client, godData) {
    let self;
    let user;
    if (username.length > 0) {
        user = getUsers.One(username, client);
        if (!user) {
            return message.reply('mention a valid user or use a valid username/ID!');
        }
    } else {
        user = message.author;
        self = true;
    }

    let fetchedUser = user.tag;
    const nickname = message.guild.member(user) ? message.guild.member(user).displayName : null;
    if (nickname !== user.username) {
        fetchedUser += '/' + nickname;
    }

    const godDoc = await godData.get();
    if(godDoc.data()[user.id] === undefined) {
        if (!self) {
            return message.reply(`<@${user.id}> hasn't linked their Godville account yet.\nThey can do so using the \`${prefix}link\` command in <#${botvilleChannel}>.`);
        } else { return message.reply(`you haven't linked your Godville account yet. You can do that with the following command in <#${botvilleChannel}>: \`${prefix}link GODNAME\` or \`${prefix}link https://godvillegame.com/gods/GOD_NAME\``); }
    }

    const godURL = godDoc.data()[user.id];
    let god = godURL.slice(30);
    god = decodeURI(god);
    message.reply(`this is the god(dess) linked to ${fetchedUser}: **${god}** <${godURL}>`);

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
        return(null);
    });

    if (!html) {
        console.log(`Failed to get any html for URL ${URL}.`);
        logsChannel.send(`Failed to get any html for URL ${URL}.`);
        message.channel.send('Could not obtain online data. This is most likely a connection error.');
        return(null);
    }

    const rx_avatar = /(?:img alt="Gravatar)[\s\S]*?src="([\s\S]*?)\?/;
    const rx_level = /(?:class="level">)[\s\S]*?(\d+)/;
    const rx_name = /og:title[\s\S]*?hero[\w]* ([\s\S]*?)"/;
    const rx_gender = /heroine/i;
    const rx_god_gender = /goddess/i;
    const rx_temple = />(Temple Owner since \d+\/\d+\/\d+)/;
    const rx_ark = />(Ark Owner since \d+\/\d+\/\d+)/;
    const rx_animalist = />(Animalist since \d+\/\d+\/\d+)/;
    const rx_trader = />(Trader since \d+\/\d+\/\d+)/;
    const rx_CM = />(Creature Master since \d+\/\d+\/\d+)/;
    const rx_pet_type = /label">Pet(?:[\s\S]*?>){3}([\s\S]*?)</;
    const rx_pet_name = /label">Pet(?:[\s\S]*?>){4}([\s\S]*?)</;
    const rx_motto = /motto">([\s\S]+?)</;
    const rx_guild = /name guild">[\s\S]+?>([\s\S]+?)</;
    const rx_guild_url = /name guild[\s\S]+?href="([\s\S]+?)"/;
    const rx_age = /label">Age(?:[\s\S]+?>){2}([\s\S]+?)</;

    const motto_res = rx_motto.exec(html);
    const level = rx_level.exec(html)[1];
    const name = decodeURI(rx_name.exec(html)[1]);
    const age = rx_age.exec(html)[1];
    const gender_res = rx_gender.exec(html);
    const god_gender_res = rx_god_gender.exec(html);
    const temple = rx_temple.exec(html);
    const ark = rx_ark.exec(html);
    const animalist = rx_animalist.exec(html);
    const trader = rx_trader.exec(html);
    const CM = rx_CM.exec(html);
    const pet_type_res = rx_pet_type.exec(html);
    const guild_url_res = rx_guild_url.exec(html);

    let avatar_url = '';
    const avatar_url_res = rx_avatar.exec(html);
    if (!avatar_url_res) {
        avatar_url = 'https://godvillegame.com/images/avatar.png';
    } else {
        avatar_url = avatar_url_res[1];
        const rand = Date.now();
        avatar_url += rand;
    }
    let guild_name = 'No guild.';
    let guild_url = '';
    if (guild_url_res) {
        guild_name = (decodeURI(rx_guild.exec(html)[1].trim())).replace(/&#39;/g, '\'');
        guild_url = guild_url_res[1];
    }
    let motto = 'No motto set.';
    if (motto_res) {
        motto = (decodeURI(motto_res[1].trim())).replace(/&#39;/g, '\'');
    }
    let pet_name = '';
    let pet_type = '';
    if (pet_type_res) {
        pet_name = (decodeURI(rx_pet_name.exec(html)[1])).replace(/&#39;/g, '\'');
        pet_type = (decodeURI(pet_type_res[1])).replace(/&#39;/g, '\'');
    } else {
        pet_name = null;
        pet_type = null;
    }
    let gender = '';
    let god_gender = '';
    if (!gender_res) {
        gender = 'Hero';
    } else { gender = 'Heroine'; }
    if (!god_gender_res) {
        god_gender = 'God';
    } else { god_gender = 'Goddess'; }
    let achievements = '';
    if (!temple && !animalist) {
        achievements = `This ${god_gender} doesn't have any medals yet.`;
    }
    if (temple) { achievements += `${temple.slice(1)}\n`; }
    if (ark) { achievements += `${ark.slice(1)}\n`; }
    if (animalist) { achievements += `${animalist.slice(1)}\n`; }
    if (trader) { achievements += `${trader.slice(1)}\n`; }
    if (CM) { achievements += `${CM.slice(1)}\n`; }

    return([gender, avatar_url, name, level, god_gender, achievements, pet_type, pet_name, motto, guild_name, guild_url, age]);
}

exports.showProfile = showProfile;
exports.showGodvilleProfile = showGodvilleProfile;
exports.showLink = showLink;