const logger = require('../features/logging');
const { AttachmentBuilder } = require('discord.js');

const sharp = require('sharp');
const https = require('https');
const GIFEncoder = require('gifencoder');
const pngFileStream = require('png-file-stream');
const fs = require('fs');

const imageSize = 112; // original size is 560x112, 5 images in one row
const imagePath = './images/pettingGif.png';
const totalImages = 5;
const pfpSize = 84;

async function main(message) {
    try {
        const user = message.mentions.users.first();
        if (!user) {
            return message.reply('You need to mention someone to pet, you silly bag of freshly rotten grapes');
        }

        logger.log(`${message.author.tag} / ${message.author.id} used the pet command on ${user.tag} / ${user.id}.`);

        // switch to member for server avatar and prevent cache
        const member = await message.guild.members.fetch({ user, force: true }); // user: user

        // fancy buffer stuff
        const dataPromise = await new Promise((resolve, reject) => {
            https.get(member.displayAvatarURL(), (res) => {
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
        const profilePicture = await sharp(dataPromise) // Let's start a new sharp on the underside image
            .resize(pfpSize, pfpSize) // Resize the underside image
            .composite([{
                input: circle(pfpSize), // make the image round
                blend: 'dest-in', // keeps only the part of the original image where circle overlaps
            }])
            .toBuffer();

        // create a transparant background with the correct size
        const background = sharp({
            create: {
                width: imageSize,
                height: imageSize,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        });

        // get our image to extract the gif frames from
        const gifFrames = sharp(imagePath);

        // create our 5 separate gif frames
        for (let i = 0; i < totalImages; i++) {
            const startX = i * imageSize; // Calculate the starting x-coordinate
            const startY = 0; // Starting y-coordinate is 0 since all images are in the same row
            const extractRegion = {
                left: startX,
                top: startY,
                width: imageSize,
                height: imageSize,
            };

            // Extract and store the Sharp object for the current image
            const gifFrame = await gifFrames
                .clone() // do not modify the source image
                .extract(extractRegion)
                .toBuffer();

            await background
                .clone() // do not modify the original background
                .composite([
                    // Pass in the buffer data to the composite function
                    { input: profilePicture, left: 16, top: 18 },
                    { input: gifFrame },
                ])
                .png()
                .toFile(`frame-${i}.png`);
        }

        // create the gif
        const encoder = new GIFEncoder(imageSize, imageSize);
        encoder.setTransparent(0x000000);
        const attachment = pngFileStream('frame-?.png')
            .pipe(encoder.createWriteStream({ repeat: 0, delay: 100, quality: 10 }));

        const sendFile = new AttachmentBuilder(attachment, { name: 'pet.gif' });
        await message.channel.send({ files: [sendFile] });

        // remove the temporary files
        for (let i = 0; i < totalImages; i++) {
            fs.unlinkSync(`frame-${i}.png`);
        }

    } catch (error) {
        logger.log('ERROR: Something went wrong with the pet command.');
        logger.error(error);
        message.reply('Something went wrong. I would have written a better error message but I\'m definitely not even going to try to do that. Just check the logs or something psshhhhh');
    }
}

// used to make images round and make the corners transparant
function circle(size) {
    return Buffer.from(
        `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${size / 2}" ry="${size / 2}" /></svg>`,
    );
}

module.exports = main;