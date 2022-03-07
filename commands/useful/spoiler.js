const { logs } = require('../../configurations/config.json');

async function main(client, message) {
    const rand = Date.now();
    const logsChannel = client.channels.cache.get(logs);
    if(message.attachments.first()) { //checks if an attachment is sent
        let format = '';
        try {
            format = /^[\s\S]+(\.[^.]+$)/.exec(message.attachments.first().name)[1];
        } catch {
            // do nothing, this file or whatever has no extension
        }
        message.channel.send({ content: `${message.author}, here is your spoilered file:`,
            files: [{
                attachment: message.attachments.first().url,
                name: `SPOILER_${rand}${format}`,
            }],
        }).then(message.delete());
        console.log(`${message.author.tag} requested a spoilered image in channel ${message.channel.name} for a file with name: ${message.attachments.first().name}`);
        logsChannel.send(`${message.author.tag} requested a spoilered image in channel ${message.channel.name} for a file with name: ${message.attachments.first().name}`);
    } else {
        message.delete();
        const url = message.content.slice(8).trim();
        if (!url || !url.length) {return message.reply('Please provide the URL to a file, or attach an image you want to make into a spoiler.');}
        console.log(`${message.author.tag} requested a spoilered image from an URL in ${message.channel.name}. URL: ${url}`);
        logsChannel.send(`${message.author.tag} requested a spoilered image from an URL in ${message.channel.name}. URL: <${url}>`);
        let format = '';
        try {
            format = /^[\s\S]+(\.[^.]+$)/.exec(url)[1];
            message.channel.send({ content: `${message.author}, here is your spoilered file:`,
                files: [{
                    attachment: url,
                    name: `SPOILER_${rand}${format}`,
                }],
            }).catch(() => {
                message.reply('Something went wrong getting your file. Please make sure the URL you provide is valid.');
            });
        } catch (error) {
            message.reply('Something went wrong getting your file. Please make sure the URL you provide points to a specific file and ends in an extension (.jpg, .pdf, etcetera).');
        }
    }
}

module.exports = main;