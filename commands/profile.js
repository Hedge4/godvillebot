const https = require('https');

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
            return message.reply(`${author} hasn't linked their Godville account yet.`);
        } else { return message.reply('You haven\'t linked your Godville account yet.'); }
    }
    const godURL = godDoc.data()[user.id];
    let god = godURL.slice(30);
    god = god.replace('%20', ' ');

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

    const godEmbed = new Discord.RichEmbed()
    .setTitle(god)
    .setURL(godURL)
    .setThumbnail(godvilleData[1])
    .setDescription('Click the god(dess)\'s username to open their Godville page.')
    .addField(`${godvilleData[0]} name`, godvilleData[2], true)
    .addField(`${godvilleData[0]} level`, godvilleData[3], true)
    .setColor('006600')
    .setFooter(author, user.displayAvatarURL);
    message.channel.send(godEmbed);
}

function link_profile(message, godData) {
    let goodLink = true;
    const link = message.content.slice(5).trim();
    if (!link.startsWith('https://godvillegame.com/gods/')) {
        message.channel.send(`<@${message.author.id}>, your link doesn't start with 'https://godvillegame.com/gods/'`);
        goodLink = false;
    }
    if (goodLink === true) {
        if (link.slice(30).includes('/')) {
            goodLink === false;
            message.channel.send(`<@${message.author.id}>, your god name can't contain '/'.`);
        }
        if (link.slice(30).includes('?')) {
            goodLink === false;
            message.channel.send(`<@${message.author.id}>, your god name can't contain '?'.`);
        }
    }
    if (goodLink === true) {
        const user = {};
        user[message.author.id] = link;
        godData.set(user, { merge: true });
        message.reply('I have set or updated the link to your Godville account.');
    } else { return message.channel.send('Please format the link exactly like this:\n\'https://godvillegame.com/gods/YOUR_GOD_NAME\''); }
}

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
    const gravatar_regex = rx_gravatar.exec(html);
    if (!gravatar_regex) {
        return(null);
    }
    const level = rx_level.exec(html)[1];
    const name = rx_name.exec(html)[1];
    const gravatar_url = gravatar_regex[1];
    const gender_res = rx_gender.exec(html);
    let gender = '';
    if (!gender_res) {
        gender = 'Hero';
    } else { gender = 'Heroine'; }

    return([gender, gravatar_url, name, level]);
}