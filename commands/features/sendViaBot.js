//const { prefix } = require('../../configurations/config.json');
const getters = require('../../index');

function main(message) {
    let content = message.content.trim();
    let index = message.content.trim().indexOf('>');
    if (index < 0) return sendHelp(message, 'You didn\'t provide a target for the message to be sent to.');
    content = content.slice(index + 1).trim(); // get everything after the target
    const target = content.slice(1, index).trim(); // we're left without < and > but with @/#

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

    console.log(rawEmbeds);
    const finishedEmbeds = constructEmbeds(rawEmbeds);
    console.log(finishedEmbeds);
    if (typeof finishedEmbeds === 'string' || finishedEmbeds instanceof String) {
        return sendHelp(message, finishedEmbeds); // if something went wrong when making the embeds, this is the error message
    }

    message.channel.send({ content: content, files: attachments, embeds: finishedEmbeds })
    .catch(e => sendHelp(message, 'Couldn\'t send message! ' + e));
}

function sendHelp(message, error = 'Something went wrong.') {
    message.reply('Error: ' + error);
}

function sendtoChannel() {
    //
}

function sendtoUser() {
    //
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
                embedParts[i] = { type : type, body : body };
            }

            const Discord = getters.getDiscord();
            const client = getters.getClient();
            const embed = new Discord.MessageEmbed()
            .setFooter({ text: 'GodBot is brought to you by Wawajabba', iconURL: client.user.avatarURL() });

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
                            embed.addField(e.body.slice(0, index).trim(), e.body.slice(index + 3).trim(), false);
                        } else { embed.addField(e.body.slice(0, index).trim(), e.body.slice(index + 3, secondIndex).trim(), true); }
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