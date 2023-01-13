const logger = require('../features/logging.js');

async function main(message, url) {
    const rand = Date.now(); // new random filename
    //checks if an attachment is sent
    if (message.attachments.first()) {
        let format = '';
        try {
            format = /^[\s\S]+(\.[^.]+$)/.exec(message.attachments.first().name)[1];
        } catch {
            // do nothing, this file or whatever has no extension
        }
        logger.log(`${message.author.tag} requested a spoilered image in channel ${message.channel.name} for a file with name: ${message.attachments.first().name}`);

        message.channel.send({
            content: `${message.author}, here is your spoilered file:`,
            files: [
                {
                    attachment: message.attachments.first().url,
                    name: `SPOILER_${rand}${format}`,
                },
            ],
        }).then(message.delete());
    } else {
        if (!url || !url.length) {
            {
                message.reply('Please provide the URL to a file, or attach an image you want to make into a spoiler.');
                return;
            }
        }
        logger.log(`${message.author.tag} requested a spoilered image from an URL in ${message.channel.name}. URL: ${url}`);

        let format = '';
        try {
            format = /^[\s\S]+(\.[^.]+$)/.exec(url)[1];
            message.channel.send({
                content: `${message.author}, here is your spoilered file:`,
                files: [
                    {
                        attachment: url,
                        name: `SPOILER_${rand}${format}`,
                    },
                ],
            }).then(message.delete())
            // catch deals with both errors in .send() and .delete()
                .catch(() => {
                    message.reply('Something went wrong getting your file. Please make sure the URL you provide is valid.');
                });
        } catch (error) {
            message.reply('Something went wrong getting your file. Please make sure the URL you provide points to a specific file and ends in an extension (.jpg, .pdf, .yeet, etcetera).');
        }
    }
}

module.exports = main;