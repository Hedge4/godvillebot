async function main(message) {
    const rand = Date.now();
    if(message.attachments.first()) { //checks if an attachment is sent
        let format = '';
        try {
            format = /^[\s\S]+(\.[^.]+$)/.exec(message.attachments.first().filename)[1];
        } catch {
            // do nothing
        }
        message.channel.send(`${message.author}, here is your spoilered file:`, {
            files: [{
                attachment: message.attachments.first().url,
                name: `SPOILER_${rand}${format}`,
            }],
        }).then(message.delete());
    } else {
        message.delete();
        const url = message.content.slice(8).trim();
        if (!url || !url.length) {return message.reply('please provide the URL to a file, or attach an image you want to make into a spoiler.');}
        let format = /^[\s\S]+(\.[^.]+$)/.exec(url)[1];
        if (!format) {format = '';}
        message.channel.send(`${message.author}, here is your spoilered file:`, {
            files: [{
                attachment: url,
                name: `SPOILER_${rand}${format}`,
            }],
        }).catch(function(error) {
            message.reply(error + '. Something went wrong grabbing your file. Please make sure the URL you provided is valid and points to a file, not a web page.');
        });
    }
}

module.exports = main;