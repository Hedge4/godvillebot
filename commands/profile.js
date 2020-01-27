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
    const god = godURL.slice(30, -1);

    const godEmbed = new Discord.RichEmbed()
    .setTitle(god)
    .setURL(godURL)
    .setDescription('Click the god\'s username to open their Godville page.')
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
    if (!link.endsWith('/')) {
        message.channel.send(`<@${message.author.id}>, your link doesn't end with '/'`);
        goodLink = false;
    }
    if (goodLink === true) {
        if (link.slice(30, -1).includes('/' || '?')) {
            goodLink === false;
            message.channel.send(`<@${message.author.id}>, your god name can't contain '/' or '?'.`)
        }
    }
    if (goodLink === true) {
        const user = {};
        user[message.author.id] = link;
        godData.set(user, { merge: true });
        message.reply('I have set or updated the link to your Godville account.');
    } else { return message.channel.send('Please format the link exactly like this:\n\'https://godvillegame.com/gods/YOUR_GOD_NAME/\''); }
}

exports.show = show_profile;
exports.link = link_profile;