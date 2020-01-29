const https = require('https');
const { prefix } = require('../config.json');

async function show_profile(message, client, Discord, godData) {

    let self = false;
    let user = message.mentions.users.first();
    if (!user) {
        if (message.content.length >= 10) {
            let username = message.content.slice(8).trim();
            if (message.content.includes('#')) {
                const args = username.split('#');
                username = args[0];
                const discriminator = args[1].slice(0, 4);
                user = client.users.find(foundUser => foundUser.tag == (username + '#' + discriminator));
            } else {
                user = client.users.find(foundUser => foundUser.username == username);
            }
            if (!user) {
                message.reply('mention a valid user or use a valid username!');
                return;
            }
        } else {
            user = message.author;
            self = true;
        }
    }

    let author = user.tag;
    const nickname = message.guild.member(user) ? message.guild.member(user).displayName : null;
    if (nickname !== user.username) {
        author += '/' + nickname;
    }

    const godDoc = await godData.get();
    if(godDoc.data()[user.id] === undefined) {
        if (self === false) {
            return message.reply(`${user} hasn't linked their Godville account yet.`);
        } else { return message.reply(`You haven't linked your Godville account yet. You can do that with the following command in <#315874239779569666>: \n${prefix}\`link god_name\` or\n\`>link <https://godvillegame.com/gods/GOD_NAME>\``); }
    }
    const godURL = godDoc.data()[user.id];
    let god = godURL.slice(30);
    god = decodeURI(god);

    const godvilleData = await getGodData(godURL, message);
    if (!godvilleData) {
        const godEmbed = new Discord.RichEmbed()
        .setTitle(god)
        .setURL(godURL)
        .setDescription('Click the god(dess)\'s username to open their Godville page.')
        .addField('ERROR', 'Extra data such as their Gravatar and level could not be found for this god; this page has probably been linked incorrectly.')
        .setColor('006600')
        .setFooter(author, user.displayAvatarURL);
        return message.channel.send(godEmbed);
    }

    if (!godvilleData[6]) {
        const godEmbed = new Discord.RichEmbed()
        .setTitle(`${god} - Age: ${godvilleData[11]}`)
        .setURL(godURL)
        .setThumbnail(godvilleData[1])
        .setDescription(`Click the ${godvilleData[4]}'s username to open their Godville page.`)
        .addField(`${godvilleData[0]}`, `${godvilleData[2]}, level ${godvilleData[3]}`, true)
        .addField('Motto', godvilleData[8], true)
        .addField('Guild', `[${godvilleData[9]}](${godvilleData[10]})`, true)
        .addField('Medals', godvilleData[5], false)
        .setColor('006600')
        .setFooter(author, user.displayAvatarURL);
        message.channel.send(godEmbed);
    } else {
        const godEmbed = new Discord.RichEmbed()
        .setTitle(`${god} - Age: ${godvilleData[11]}`)
        .setURL(godURL)
        .setThumbnail(godvilleData[1])
        .setDescription(`Click the ${godvilleData[4]}'s username to open their Godville page.`)
        .addField(`${godvilleData[0]}`, `${godvilleData[2]}, level ${godvilleData[3]}`, true)
        .addField('Motto', godvilleData[8], true)
        .addField('Guild', `[${godvilleData[9]}](${godvilleData[10]})`, true)
        .addField('Pet type', godvilleData[6], true)
        .addField('Pet name/level', godvilleData[7], true)
        .addField('Medals', godvilleData[5], false)
        .setColor('006600')
        .setFooter(author, user.displayAvatarURL);
        message.channel.send(godEmbed);
    }
}

function link_profile(message, godData) {
    let link = message.content.slice(5).trim();
    link = link.replace('%20', ' ');
    if (link.startsWith('https://godvillegame.com/gods/')) {
        if (/[a-z0-9- ]{3,30}/i.test(link.slice(30))) {
            link = link.replace(' ', '%20');
            const user = {};
            user[message.author.id] = link;
            godData.set(user, { merge: true });
            return message.reply('I have set or updated the link to your Godville account.');
        } else {
            message.reply(`The start of your link seems correct, but '${link.slice(30)}' doesn't look like a correct god name.`);
            return message.channel.send('God names can only contain letters, numbers, hyphens and spaces. Using %20 to encode spaces is okay too.');
        }
    } else if (/[a-z0-9- ]{3,30}/i.test(link)) {
        message.reply(`'${link}' looks like a god name. I have set or updated the link to your Godville account.`);
        link = 'https://godvillegame.com/gods/' + link.replace(' ', '%20');
        const user = {};
        user[message.author.id] = link;
        godData.set(user, { merge: true });
        return;
    } else {
        message.reply('your link doesn\'t start with \'<https://godvillegame.com/gods/>\' or you made a typo in your god name.');
        message.channel.send('Please format the link exactly like this:\n\'<https://godvillegame.com/gods/YOUR-GOD-NAME>\'');
        return message.channel.send('God names can only contain letters, numbers, hyphens and spaces. Using %20 to encode spaces is okay too.');
    }


/*    if (!link.startsWith('https://godvillegame.com/gods/')) {
        message.channel.send(`<@${message.author.id}>, your link doesn't start with '<https://godvillegame.com/gods/>'`);
        goodLink = false;
    }
    if (goodLink === true) {
        if (link.slice(30) !== /[a-z0-9- ]{3,30}/i) {
            goodLink = false;
            message.reply(`${link.slice(30)} doesn't look like a correct god name.`);
        }
    }
    if (goodLink === true) {
        const user = {};
        user[message.author.id] = link;
        godData.set(user, { merge: true });
        message.reply('I have set or updated the link to your Godville account.');
    } else { return message.channel.send('Please format the link exactly like this:\n\'<https://godvillegame.com/gods/YOUR-GOD-NAME>\''); }
*/}

exports.show = show_profile;
exports.link = link_profile;

async function getGodData(URL, message) {
    const myFirstPromise = new Promise((resolve, reject) => {
        https.get(URL, (res) => {
            res.on('data', (d) => {
                //console.log(String(d));
                resolve(String(d));
        });
        }).on('error', (e) => {
            //console.error(e);
            reject(e);
        });
    });

    let html = '';
    await myFirstPromise.then((result) => {
        html = result;
        //console.log(html);
    }).catch((error) => {
        console.log('Oops! Couldn\'t get this God\'s page!' + error);
    });

    if (!html) {
        message.channel.send('Could not obtain online data. This is most likely a connection error.');
        return(null);
    }

    const rx_gravatar = /(?:img alt="Gravatar)[\s\S]*?src="([\s\S]*?)\?/;
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

    const gravatar_regex = rx_gravatar.exec(html);
    if (!gravatar_regex) {
        return(null);
    }

    let motto = rx_motto.exec(html)[1];
    const level = rx_level.exec(html)[1];
    const name = decodeURI(rx_name.exec(html)[1]);
    const age = rx_age.exec(html)[1];
    const gravatar_url = gravatar_regex[1];
    const gender_res = rx_gender.exec(html);
    const god_gender_res = rx_god_gender.exec(html);
    const temple = rx_temple.exec(html);
    const ark = rx_ark.exec(html);
    const animalist = rx_animalist.exec(html);
    const trader = rx_trader.exec(html);
    const CM = rx_CM.exec(html);
    const pet_type_res = rx_pet_type.exec(html);
    const guild_url_res = rx_guild_url.exec(html);

    let guild_name = 'No guild.';
    let guild_url = '';
    if (guild_url_res) {
        guild_name = (decodeURI(rx_guild.exec(html)[1].trim())).replace('&#39;', '\'');
        guild_url = guild_url_res[1];
    }
    motto = (decodeURI(motto.trim())).replace('&#39;', '\'');
    if (!motto.length) {
        motto = 'No motto set.';
    }
    let pet_name = '';
    let pet_type = '';
    if (pet_type_res) {
        pet_name = (decodeURI(rx_pet_name.exec(html)[1])).replace('&#39;', '\'');
        pet_type = (decodeURI(pet_type_res[1])).replace('&#39;', '\'');
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
        god_gender = 'god';
    } else { god_gender = 'goddess'; }
    let achievements = '';
    if (!temple && !animalist) {
        achievements = `This ${god_gender} doesn't have any medals yet.`;
    }
    if (temple) { achievements += `${temple.slice(1)}\n`; }
    if (ark) { achievements += `${ark.slice(1)}\n`; }
    if (animalist) { achievements += `${animalist.slice(1)}\n`; }
    if (trader) { achievements += `${trader.slice(1)}\n`; }
    if (CM) { achievements += `${CM.slice(1)}\n`; }

    return([gender, gravatar_url, name, level, god_gender, achievements, pet_type, pet_name, motto, guild_name, guild_url, age]);
}