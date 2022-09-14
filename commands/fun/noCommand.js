const logger = require('../features/logging');
const { botID } = require('../../configurations/config.json');
const Discord = require('discord.js');
const sharp = require('sharp');
const https = require('https');

const resizeSize = 216; // original size is 300

async function main(message) {
    try {
        let user = message.mentions.users.first();
        if (!user) {
            return message.reply('You need to mention someone to nope, you silly bag of freshly rotten grapes');
        } else if (user.id == botID) {
            user = message.author; // don't nope the bot
        }

        logger.log(`${message.author.tag} / ${message.author.id} used the no command on ${user.tag} / ${user.id}.`);

        // fancy buffer stuff
        const dataPromise = await new Promise((resolve, reject) => {
            https.get(user.displayAvatarURL(), (res) => {
                let buffer = Buffer.alloc(0);
                res.on('data', (d) => {
                    buffer = Buffer.concat([buffer, d]);
                });
                res.on('end', () => {
                    resolve(buffer);
                });
            }).on('error', (e) => {
                reject(e);
            });
        });

        // shard you're a genius
        const imageToEdit = await sharp(dataPromise) // Let's start a new sharp on the underside image
            .resize(resizeSize, resizeSize) // Resize the underside image
            .greyscale(); // we make it boring

        await sharp('./images/nope.png')
            .resize(resizeSize, resizeSize)
            .toBuffer({ resolveWithObject: true }) // buffers all the waaaaaaay
            .then(({ data, info }) => { // We now have the data / info of that buffer
                imageToEdit
                    .composite([{
                        input: data, // Pass in the buffer data to the composite function
                    }])
                    .toBuffer();
                //console.log(info); // idk I might want this sometime
            })
            .catch(err => {
                throw ('Error: ', err);
            });

        const attachment = new Discord.MessageAttachment(imageToEdit);

        message.channel.send({ files: [attachment] });

    } catch (error) {
        console.error(error);
        logger.log('Something went wrong with the no command. Error: ' + error);
        message.reply('Something went wrong. I would have written a better error message but I\'m definitely not even going to try to do that. Just check the logs or something psshhhhh');
    }
}

module.exports = main;