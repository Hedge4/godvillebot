const logger = require('../../features/logging.js');
const { clientId } = require('../../configurations/config.json');
const Discord = require('discord.js'); // TODO: remove, import only the specifically needed part
const sharp = require('sharp');
const https = require('https');

const imageSize = 216; // original image is 432, so we take half for clean resizing
const pfpBonkeeSize = Math.round(0.2 * imageSize / 2) * 2;
const pfpBonkerSize = Math.round(0.31 * imageSize / 2) * 2;
const leftBonkeeGap = Math.round(0.05 * imageSize);
const topBonkeeGap = Math.round(0.444 * imageSize);
const leftBonkerGap = Math.round(0.515 * imageSize);
const topBonkerGap = Math.round(0.205 * imageSize);

// used to make images round and remove the excess corners
function circle(size) {
    return Buffer.from(
        `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${size / 2}" ry="${size / 2}" /></svg>`,
    );
}
// used to add a black edge to the profile pictures
function circumference(size) {
    const stroke = 2;
    const radius = size / 2 - stroke / 2;
    const edge = radius + stroke / 2;

    return Buffer.from(
        `<svg><circle cx="${edge}" cy="${edge}" r="${radius}" stroke="#000" stroke-width="${stroke}" fill="none"/></svg>`,
    );
}

async function main(message) {
    try {
        let bonker = message.author;
        const user = message.mentions.users.first();
        let bonkee = user;
        if (!bonkee) {
            return message.reply('You need to mention someone to bonk, now go step on a lego dumdum');
        } else if (bonkee.id == clientId) { // don't bonk the bot, if you do roles get swapped
            bonker = bonkee;
            bonkee = message.author;
        } else if (bonker == bonkee) { // if you bonk yourself the bot will be the bonker
            bonker = message.client.user;
        }

        logger.log(`${message.author.tag} / ${message.author.id} used the bonk command on ${user.tag} / ${user.id}.`);

        // switch to members for server avatars and prevent cache
        bonker = await message.guild.members.fetch({ user: bonker, force: true });
        bonkee = await message.guild.members.fetch({ user: bonkee, force: true });

        // fancy buffer stuff for the bonker
        const dataPromiseBonker = await new Promise((resolve, reject) => {
            https.get(bonker.displayAvatarURL(), (res) => {
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

        // fancy buffering for the bonkee
        const dataPromiseBonkee = await new Promise((resolve, reject) => {
            https.get(bonkee.displayAvatarURL(), (res) => {
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

        // used to cut off the top 30% of the bonkee's pfp
        const cutoff = await sharp({
            create: {
                width: pfpBonkeeSize,
                height: Math.round(pfpBonkeeSize * 0.7),
                channels: 3,
                background: { r: 0, g: 0, b: 0 },
            },
        })
            .png()
            .toBuffer();

        // load our bonk image
        const bonk = await sharp('./resources/bonk.jpg')
            .resize(imageSize, imageSize) // resize so we ensure the ratio between sizes is correct
            .png()
            .toBuffer(); // output to buffer to 'apply' changes (idk)

        // load the bonker's pfp
        const pfpBonker = await sharp(dataPromiseBonker)
            .resize(pfpBonkerSize, pfpBonkerSize)
            .png()
            .flatten({ background: '#ffffff' }) // solid white background
            .composite([{
                input: circumference(pfpBonkerSize),
                top: 0,
                left: 0,
            }, {
                // make the image round
                input: circle(pfpBonkerSize),
                blend: 'dest-in', // this blend mode keeps only the part of the original image where the overlay would be drawn
            }])
            .toBuffer(); // output to buffer to 'apply' changes (idk)

        // now load the bonkee's image
        let pfpBonkee = await sharp(dataPromiseBonkee)
            .resize(pfpBonkeeSize, pfpBonkeeSize)
            .png()
            .flatten({ background: '#ffffff' }) // solid white background
            .composite([{
                input: circumference(pfpBonkeeSize),
                top: 0,
                left: 0,
            }, {
                // same as before, makes the image round
                input: circle(pfpBonkeeSize),
                blend: 'dest-in',
            }, {
                // this removes the top part of the image, again by using the dest-in blend mode
                input: cutoff,
                blend: 'dest-in',
                left: 0,
                top: Math.round(pfpBonkeeSize * 0.3),
            }])
            .toBuffer(); // output to buffer to 'apply' changes (idk)

        // we rotate after a first output and then output again, to force the right order of operations
        pfpBonkee = await sharp(pfpBonkee)
            .rotate(43, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer();

        // we create our final composited image
        const newImage = await sharp(bonk)
            .composite([{
                input: pfpBonkee, // Pass in the buffer data to the composite function
                left: leftBonkeeGap,
                top: topBonkeeGap,
            }, {
                input: pfpBonker,
                left: leftBonkerGap,
                top: topBonkerGap,
            }])
            .toBuffer(); // this is our final output

        // share the created image with the world
        const attachment = new Discord.AttachmentBuilder(newImage);
        message.channel.send({ files: [attachment] });

        // one big catch all because I'm lazy
    } catch (error) {
        console.error(error);
        logger.log('Something went wrong with the bonk command. Error: ' + error);
        message.reply('Something went wrong. I would have written a better error message but nahhh. Just check the logs or something, now psshhhht, begone');
    }
}

module.exports = main;