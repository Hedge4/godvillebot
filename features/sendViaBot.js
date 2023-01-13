const { botName } = require('../../configurations/config.json');
const Discord = require('discord.js'); // TODO: remove, import only the specifically needed part
const getters = require('../../index.js');

function main(message) {
    let content = message.content.trim();
    let index = message.content.trim().indexOf('>');
    if (index < 0) return sendHelp(message, 'You didn\'t provide a target for the message to be sent to.');
    const target = content.slice(1, index).trim(); // we're left without < and > but with @/#
    content = content.slice(index + 1).trim(); // get everything after the target

    const attachments = [];
    message.attachments.forEach(element => {
        attachments.push(element.url);
    });

    // get message ID of the message this should be a reply to
    let replyID;
    index = content.trim().indexOf('reply{');
    if (index >= 0) {
        const secondIndex = content.indexOf('}', index);
        if (secondIndex < 0) return sendHelp(message, 'The reply{} tag wasn\'t closed with a curly bracket.');
        replyID = content.slice(index + 6, secondIndex).trim();
        content = content.slice(0, index).trim() + ' ' + content.slice(secondIndex + 1).trim();
    }

    const rawEmbeds = [];
    while (content.trim().indexOf('embed{') >= 0) {
        index = content.trim().indexOf('embed{');
        const secondIndex = content.indexOf('}', index);
        if (secondIndex < 0) return sendHelp(message, 'An embed{} tag wasn\'t closed with a curly bracket.');
        rawEmbeds.push(content.slice(index + 6, secondIndex).trim());
        content = content.slice(0, index).trim() + ' ' + content.slice(secondIndex + 1).trim();
    }

    content = content.trim(); // in case a space was added in front when removing reply{} or embed{} tags in front
    const finishedEmbeds = constructEmbeds(rawEmbeds);
    if (typeof finishedEmbeds === 'string' || finishedEmbeds instanceof String) {
        return sendHelp(message, finishedEmbeds); // if something went wrong when making the embeds, this is the error message
    }

    if (target.startsWith('#')) {
        sendtoChannel(message, target.slice(1), { content: content, files: attachments, embeds: finishedEmbeds }, replyID);
    } else if (target.startsWith('@')) {
        sendtoUser(message, target.slice(1), { content: content, files: attachments, embeds: finishedEmbeds }, replyID);
    } else {
        sendHelp(message, `${target} doesn't start with # or @.`);
    }
}

function sendHelp(message, error = 'Something went wrong.') {
    message.reply('Error: ' + error);
}

async function sendtoChannel(message, target, fwd, replyID) {
    const client = getters.getClient();

    try {
        // this could return the wrong type of (not text) channel... but I'd get some other error out of that anyway.
        const channel = await client.channels.fetch(target);

        // get message to reply to if a reply ID was given, otherwise just send to channel
        if (replyID) {
            await channel.send({ reply: { messageReference: replyID }, content: fwd.content, files: fwd.attachments, embeds: fwd.embeds });
        } else {
            await channel.send({ content: fwd.content, files: fwd.attachments, embeds: fwd.embeds });
        }
        // if we didn't error yet we log the sent message
        const logMsg = `**Sent the following message to '${channel.name}' / <#${channel.id}> in '${channel.guild.name}':**\n`;
        message.channel.send({ content: logMsg + fwd.content, files: fwd.attachments, embeds: fwd.embeds });
    } catch (error) {
        sendHelp(message, error);
    }
}

async function sendtoUser(message, target, fwd, replyID) {
    const client = getters.getClient();
    if (target.startsWith('!')) target = target.slice(1);
    if (isNaN(target)) {
        if (target.startsWith('!')) {
            target = target.slice(1);
            if (isNaN(target)) { return sendHelp(message, `@!${target} isn't a person you silly goof`); }
        } else { return sendHelp(message, `@${target} isn't a person you silly goof`); }
    }

    try {
        const user = await client.users.fetch(target);
        const dmChannel = await user.createDM();

        // get message to reply to if a reply ID was given, otherwise just send to channel
        if (replyID) {
            await dmChannel.send({ reply: { messageReference: replyID }, content: fwd.content, files: fwd.attachments, embeds: fwd.embeds });
        } else {
            await dmChannel.send({ content: fwd.content, files: fwd.attachments, embeds: fwd.embeds });
        }
        // if we didn't error yet we log the sent message
        const logMsg = `**Sent the following message to '${user.tag}' / ${user.id}:**\n`;
        message.channel.send({ content: logMsg + fwd.content, files: fwd.attachments, embeds: fwd.embeds });
    } catch (error) {
        sendHelp(message, error);
    }
}

function constructEmbeds(rawEmbeds) {
    const embeds = [];

    for (let embedIndex = 0; embedIndex < rawEmbeds.length; embedIndex++) {
        let element = rawEmbeds[embedIndex];
        const originalElement = element;

        // big thingamajingy to catch all kinds of fancy and non fancy errors. low effort ayeee
        try {
            const embedParts = [];

            // get the different constructors of an embed, start indicated by +++
            let index = element.indexOf('+++');
            while (index >= 0) {
                const secondIndex = element.indexOf('+++', index + 3);
                // slice up to the end of the string if there is no next +++ in the string
                embedParts.push(secondIndex < 0 ? element.slice(index + 3).trim() : element.slice(index + 3, secondIndex).trim());
                if (secondIndex >= 0) element = element.slice(secondIndex);
                else break; // we don't loop anymore if there's no next parameter indicated with +++

                // set index for next loop
                index = element.indexOf('+++');
            }

            // we do stuff yehyeh
            for (let i = 0; i < embedParts.length; i++) {
                let body = embedParts[i].split(' ');
                if (!body) throw `BodyError: ${embedParts} isn't a valid argument to construct an embed.`;
                const type = body.shift().toLowerCase();
                body = body.join(' ');
                if (!type) throw `TypeError: ${embedParts} isn't a valid argument to construct an embed.`;
                embedParts[i] = { type: type, body: body };
            }

            const client = getters.getClient();
            const embed = new Discord.EmbedBuilder()
                .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: client.user.avatarURL() });

            // bob the builder
            embedParts.forEach(e => {
                switch (e.type) {
                    case 'title': embed.setTitle(e.body); break;
                    case 'url': embed.setURL(e.body); break;
                    case 'color': embed.setColor(e.body); break;
                    case 'description': embed.setDescription(e.body); break;
                    case 'thumbnail': embed.setThumbnail(e.body); break;
                    case 'image': embed.setImage(e.body); break;
                    case 'field': {
                        index = e.body.indexOf('|||');
                        const secondIndex = e.body.indexOf('|||', index + 3);
                        // if there's no third parameter or if it doesn't say 'true' (e.g. 'false') that means no inline
                        if (secondIndex < 0 || e.body.slice(secondIndex + 3).trim() !== 'true') {
                            embed.addFields([{ name: e.body.slice(0, index).trim(), value: e.body.slice(index + 3).trim(), inline: false }]);
                        } else { embed.addFields([{ name: e.body.slice(0, index).trim(), value: e.body.slice(index + 3, secondIndex).trim(), inline: true }]); }
                        break;
                    }
                    case 'timestamp':
                        e.body.length == 0 ? embed.setTimestamp() : embed.setTimestamp(e.body);
                        break;
                    // case 'footer':
                    //     index = e.body.indexOf('|||');
                    //     if (index < 0) embed.setFooter(e.body);
                    //     else embed.setFooter({ text: e.body.slice(0, index).trim(), iconURL: e.body.slice(index + 3).trim() });
                    //     break;
                    default: throw `${e.type} isn't recognised as a way to construct an embed.`;
                }
            });

            // ayee we done with this one
            embeds.push(embed);

        } catch (error) {
            return `The following embed couldn't be constructed:\`\`\`\n${originalElement}\`\`\`${error}`;
        }
    }

    return embeds;
}

module.exports = main;