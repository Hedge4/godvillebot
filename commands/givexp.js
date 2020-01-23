const { prefix, levelup_channel, no_xp_prefixes, cdSeconds, xp_blocked } = require('../config.json');
const godpowerCooldown = new Set();

async function giveGodpower(message, userData, Discord, client) {
    let spam = 0;

    if (xp_blocked.includes(message.author.id)) {return;}

    no_xp_prefixes.forEach(element => {
        if (message.content.startsWith(element)) {spam = 1;}
    });

    if (message.content.length < 7) {spam = 1;}

    if (message.content.trim().match(/(<:([^:]+):([0-9]{18})>([ ]*))+/)) {spam = 1;}

    if (godpowerCooldown.has(message.author.id)) {spam = 1;}

    if (spam === 1) {
        return;
    }

    const userDoc = await userData.get();
    const User = {};
    const godpowerAdd = Math.floor(Math.random() * 5) + 3;
    if(userDoc.data()[message.author.id] === undefined) {
        User[message.author.id] = {
            godpower: 0,
            gold: 0,
            total_godpower: 0,
            level: 0,
        };
        User[message.author.id].last_username = message.author.tag;
        await userData.set(User, { merge: true });
    } else {
        User[message.author.id] = userDoc.data()[message.author.id];
    }

    console.log(godpowerAdd + ' godpower added for user ' + message.author.tag + ' in channel ' + message.channel.name);
    godpowerCooldown.add(message.author.id);

    const curGodpower = User[message.author.id].godpower;
    const curLevel = User[message.author.id].level;
    const nextLevel = Math.floor(100 * 1.2 ** (curLevel ** (4 / 5)));
    const newGodpower = curGodpower + godpowerAdd;
    User[message.author.id].godpower = newGodpower;
    User[message.author.id].total_godpower = User[message.author.id].total_godpower + godpowerAdd;
    totalGodpower = totalGodpower + godpowerAdd;

    if (nextLevel <= newGodpower) {
        console.log('User ' + message.author.tag + ' levelled up from level ' + curLevel + ' to level ' + eval(curLevel + 1));
        const goldAdd = Math.floor(100 * (Math.sqrt(curLevel + 1)));
        User[message.author.id].godpower = newGodpower - nextLevel;
        User[message.author.id].level = curLevel + 1;
        User[message.author.id].gold = User[message.author.id].gold + goldAdd;
        const newLevel = curLevel + 2;
        const newNextLevel = Math.floor(100 * 1.2 ** ((curLevel + 1) ** (4 / 5)));
        const nickname = message.guild.member(message.author) ? message.guild.member(message.author).displayName : null;

        const lvlUpEmbed = new Discord.RichEmbed()
            .setColor('d604cf')
            .setTitle(nickname + ' levelled UP! <:screen_pantheonup:441043802325778442>')
            .setDescription('You gathered ' + nextLevel + ' godpower <:stat_godpower:401412765232660492> and levelled up to level ' + User[message.author.id].level + '! :tada: - You now have ' + User[message.author.id].total_godpower + ' godpower total.')
            .addField('Gold rewarded', `You earned ${goldAdd} <:stat_gold:401414686651711498> for reaching level ` + User[message.author.id].level + '. You now have ' + User[message.author.id].gold + ' gold total.')
            .setFooter(`You'll need ${newNextLevel} godpower for level ${newLevel}. Use ${prefix}toggle-mentions to enable/disable being mentioned on level-up.`, message.author.displayAvatarURL);
        if (User[message.author.id].mention !== false) { client.channels.get(levelup_channel).send('Congratulations on reaching level ' + User[message.author.id].level + ', ' + message.author + '!');}
        client.channels.get(levelup_channel).send(lvlUpEmbed);
    }

    User[message.author.id].last_username = message.author.tag;
    userData.set(User, { merge: true });
    userData.update({ 1:totalGodpower });

    setTimeout(() => {
        godpowerCooldown.delete(message.author.id);
    }, cdSeconds * 1000);
}

exports.giveGodpower = giveGodpower;