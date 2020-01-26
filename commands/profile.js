async function show_profile(message, client, Discord, godData) {

    let self = false;
    let user = message.mentions.users.first();
    if (!user) {
        if (message.content.length >= 7) {
            let username = message.content.slice(6).trim();
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
    .setColor('006600')
    .setFooter(author, user.displayAvatarURL);
    message.channel.send(godEmbed);
}

exports.show = show_profile;