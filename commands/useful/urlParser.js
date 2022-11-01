const Discord = require('discord.js'); // TODO: remove, import only the specifically needed part
const { prefix, botName } = require('../../configurations/config.json');
const startupFile = require('../../index');
const logger = require('../features/logging');

const regex = /(?:([a-z][a-z0-9\-+.]*):(?:\/\/)?)?(?:([^<>\s]{2,})@)?((?:(?:[^<>\s.:/?#]+\.)+[^<>\s.:/?#]+)|(?:(?:[^<>\s.:/?#]+\.)?\[?[a-z0-9:]+\]?))(?::([\d]+))?(\/[^<>\s?#]+\/?)?(?:\?([^<>\s#]+))?(?:#([^<>\s]+))?/i;


async function main(message, content) {
    if (content.length > 200) {
        return message.reply('I don\'t parse URLs over 200 characters.');
    }

    // these prevent embeds, remove them if they're around the URL
    if (content.startsWith('<') && content.endsWith('>')) {
        content = content.slice(1, -1);
    }

    if (!content.length) {
        return message.reply(`Parsing URLs is hard so use this command to prove I didn't set it up correctly I guess. If it can't parse your URL and I can fix it you get some gold. Usage: \`${prefix}parseUrl <link>\`\nThe regex I use: ${regex.toString()}`);
    }

    const res = regex.exec(content);

    if (!res) {
        return message.reply('No URL match found. If this URL is correct and working, you can go nag Wawajabba for some gold.');
    }

    let fullMatch, scheme, auth, domain, port, path, queries, fragment;
    // eslint-disable-next-line prefer-const
    [fullMatch, scheme, auth, domain, port, path, queries, fragment] = res;

    const highlightedContent = content.slice(0, res.index) + '__' + content.slice(res.index, fullMatch.length + res.index) + '__' + content.slice(fullMatch.length + res.index);
    let embedBody = `**Input (match underlined):**\n${highlightedContent}\n\n`;

    if (scheme) {
        embedBody += `**Scheme:** ${scheme}\n`;
    }
    if (auth) {
        auth = auth.split(':');
        embedBody += '**Authentication:**\n';
        embedBody += `User: ${auth[0]}\n`;
        if (auth[1]) embedBody += `Pass: ${auth[1]}\n`;
    }
    embedBody += `**Full domain:** ${domain}\n`;
    if (port) {
        embedBody += `**Port:** ${port}\n`;
    }
    if (path) {
        embedBody += `**Path:** ${path}\n`;
    }
    if (queries) {
        embedBody += '**Queries and parameters:**\n';
        queries = queries.split('&');
        for (let i = 0; i < queries.length; i++) {
            const elem = queries[i].split('=');
            embedBody += `${elem[0]}: ${elem[1]}\n`;
        }
    }
    if (fragment) {
        embedBody += `**Fragment:** ${fragment}\n`;
    }

    const client = startupFile.getClient();
    const embed = new Discord.EmbedBuilder()
        .setTitle('Parsed URL')
        .setColor(0x632db4) // purpleee
        .setDescription(embedBody)
        .setTimestamp()
        .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: client.user.avatarURL() });

    message.reply({ embeds: [embed] });
    logger.log(`${message.author.tag} / ${message.author.id} used the ${prefix}parseUrl command in ${message.channel.name}, for this URL: <${content}>`);
}

module.exports = main;