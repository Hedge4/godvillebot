const { repository: { url: repositoryURL } } = require('../../package.json');

async function main(message) {
    return message.reply('The bot\'s creator (@wawajabba) has made the GitHub repository public!'
        + `\nYou're free to check out the code at ${repositoryURL}.`
        + '\n\nYou can also use parts of the code, but please remember to read LICENSE.md before you do.'
        + '\nContributions are very welcome! Contact me if you have any ideas or need help to get started, or just submit a pull request.');
}

module.exports = main;