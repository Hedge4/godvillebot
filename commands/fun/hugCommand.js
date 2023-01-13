const logger = require('../features/logging.js');
const Discord = require('discord.js'); // TODO: remove, import only the specifically needed part
const sharp = require('sharp');
const https = require('https');

const imgPath = './resources/hug3.png';
const imageSize = 200; // 216 would be more consistent, but starting res is 200px
const pfpHuggeeSize = Math.round(0.33 * imageSize / 2) * 2;
const pfpHuggerSize = Math.round(0.365 * imageSize / 2) * 2;
const leftHuggeeGap = Math.round(0.07 * imageSize);
const topHuggeeGap = Math.round(0.18 * imageSize);
const leftHuggerGap = Math.round(0.45 * imageSize);
const topHuggerGap = Math.round(0.114 * imageSize);

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
        let hugger = message.author;
        let huggee = message.mentions.users.first();
        if (!huggee) {
            return message.reply('You need to mention someone to hug, now go step on a lego dumdum');
        } else if (hugger == huggee) { // if you hug yourself the bot will be the hugger
            hugger = message.client.user;
        }

        logger.log(`${message.author.tag} / ${message.author.id} used the hug command on ${huggee.tag} / ${huggee.id}.`);

        // switch to members for server avatars and prevent cache
        hugger = await message.guild.members.fetch({ user: hugger, force: true });
        huggee = await message.guild.members.fetch({ user: huggee, force: true });

        // fancy buffer stuff for the hugger
        const dataPromiseHugger = await new Promise((resolve, reject) => {
            https.get(hugger.displayAvatarURL(), (res) => {
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

        // fancy buffering for the huggee
        const dataPromiseHuggee = await new Promise((resolve, reject) => {
            https.get(huggee.displayAvatarURL(), (res) => {
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

        // load our hug image
        const hug = await sharp(imgPath)
            .resize(imageSize, imageSize) // resizing disabled because this image is already 300 x 300 pixels
            .png()
            .toBuffer(); // output to buffer to 'apply' changes (idk)

        // load the hugger's pfp
        let pfpHugger = await sharp(dataPromiseHugger)
            .resize(pfpHuggerSize, pfpHuggerSize)
            .png()
            .flatten({ background: '#ffffff' }) // solid white background
            .composite([{
                input: circumference(pfpHuggerSize),
                top: 0,
                left: 0,
            }, {
                // make the image round
                input: circle(pfpHuggerSize),
                blend: 'dest-in', // this blend mode keeps only the part of the original image where the overlay would be drawn
            }])
            .toBuffer(); // output to buffer to 'apply' changes (idk)

        // now load the huggee's image
        let pfpHuggee = await sharp(dataPromiseHuggee)
            .resize(pfpHuggeeSize, pfpHuggeeSize)
            .png()
            .flatten({ background: '#ffffff' }) // solid white background
            .composite([{
                input: circumference(pfpHuggeeSize),
                top: 0,
                left: 0,
            }, {
                // same as before, makes the image round
                input: circle(pfpHuggeeSize),
                blend: 'dest-in',
            }])
            .toBuffer(); // output to buffer to 'apply' changes (idk)

        // we rotate after a first output and then output again, to force the right order of operations
        pfpHuggee = await sharp(pfpHuggee)
            .rotate(-10, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer();
        pfpHugger = await sharp(pfpHugger)
            .rotate(28, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer();

        // we create our final composited image
        const newImage = await sharp(hug)
            .composite([{
                input: pfpHuggee, // Pass in the buffer data to the composite function
                left: leftHuggeeGap,
                top: topHuggeeGap,
            }, {
                input: pfpHugger,
                left: leftHuggerGap,
                top: topHuggerGap,
            }])
            .toBuffer(); // this is our final output

        // share the created image with the world
        const attachment = new Discord.AttachmentBuilder(newImage);
        message.channel.send({ files: [attachment] });

        // one big catch all because I'm lazy
    } catch (error) {
        console.error(error);
        logger.log('Something went wrong with the hug command. Error: ' + error);
        message.reply('Something went wrong. I would have written a better error message but nahhh. Just check the logs or something, now psshhhht, begone');
    }
}

module.exports = main;