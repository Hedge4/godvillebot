//const { prefix } = require('../../configurations/config.json');
const getters = require('../../index');

function main(message) {
    let content = message.content.trim();
    const index = message.content.trim().indexOf('>');
    if (index < 0) return sendHelp(message, '');
    content = content.slice(index + 1).trim(); // get everything after the target
    const target = content.slice(1, index).trim(); // we're left without < and > but with @/#

    const attachments = [];
    message.attachments.forEach(element => {
        attachments.push(element);
    });

    const embeds = [];

    message.channel.send({ content: content, attachments: attachments, embeds: embeds });
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

function constructEmbed(rawEmbed) {
    //
}

module.exports = main;