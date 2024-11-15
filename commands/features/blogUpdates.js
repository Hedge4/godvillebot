const https = require('https');
const xml2js = require('xml2js');
const TurndownService = require('turndown');
const { EmbedBuilder } = require('discord.js');
const { botName, roles, channels } = require('../../configurations/config.json');
const getters = require('../../index');
const logger = require('./logging');

const rssUrl = 'https://feeds.feedburner.com/Godville-Blog';
let firebaseDoc = null;
let lastBlogId;

function onStartup(blogDoc) {
    firebaseDoc = blogDoc;
    blogDoc.get().then(docData => {
        lastBlogId = docData.data().lastId;
    }).catch(error => {
        logger.log('ERROR: couldn\'t fetch last blog ID from Firebase:');
        logger.error(error);
    });

    // Check for updates every 5 minutes
    setInterval(checkForUpdates, 5 * 60 * 1000);

    setTimeout(() => {
        checkForUpdates();
    }, 5000);
}

// Function to fetch and parse RSS feed
function checkForUpdates() {
    // download the RSS feed
    const dataPromise = new Promise((resolve, reject) => {
        https.get(rssUrl, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (e) => {
            reject(e);
        });
    });

    // parse the XML data
    dataPromise
        .then((data) => {
            xml2js.parseString(data, (err, result) => {
                if (err) {
                    logger.log('ERROR: couldn\'t parse Godville blog XML:');
                    logger.error(err);
                    return;
                }

                // Access the list of items in the RSS feed
                const items = result.rss.channel[0].item;

                // Extract the blog post ID from the latest item
                const latestPost = items[0];
                const currentPostId = latestPost.link[0].match(/\d+$/)[0];

                // If lastBlogId is null, this is the first time the bot is running or database parsing failed or sumthing
                if (lastBlogId === null) {
                    lastBlogId = currentPostId;
                    return;
                }

                // Check if the latest post is different from the last seen post
                if (currentPostId === lastBlogId) return;

                // Check if difference is more than 1
                if (currentPostId - lastBlogId > 1) {
                    const client = getters.getClient();
                    const modLogs = client.channels.cache.get(channels.modLogs);
                    const errMsg = `ERROR: Godville blog went from post ${lastBlogId} to ${currentPostId}, skipping ${currentPostId - lastBlogId - 1} posts!`;
                    logger.log(errMsg);
                    modLogs.send(errMsg);

                    // No return, we still want to send the latest post. Mods can check the skipped posts later.
                }

                // Check if difference is less than 1
                if (currentPostId - lastBlogId < 0) {
                    const client = getters.getClient();
                    const modLogs = client.channels.cache.get(channels.modLogs);
                    const errMsg = `ERROR: Godville blog went BACKWARDS from post ${lastBlogId} to ${currentPostId}!`;
                    logger.log(errMsg);
                    modLogs.send(errMsg);
                    return;
                }

                // Update the last seen post ID
                lastBlogId = currentPostId;
                firebaseDoc.set({ lastId: lastBlogId })
                    .catch((error) => {
                        logger.log('ERROR: couldn\'t update last blog ID in Firebase:');
                        logger.error(error);
                    });

                // Send the new post to the channel
                sendBlogUpdate(latestPost);
            });
        })
        .catch((error) => {
            logger.log('ERROR: couldn\'t fetch Godville blog RSS feed:');
            logger.error(error);
        });
}

function sendBlogUpdate(blogItem) {
    const client = getters.getClient();
    const blogChannel = client.channels.cache.get(channels.blogUpdates);

    const title = blogItem.title[0];
    let link = blogItem.link[0];
    const description = blogItem.description[0];
    const pubDate = blogItem.pubDate[0];

    link = link.replace(/http:/gi, 'https:');
    const turndownService = new TurndownService();
    let markdown = turndownService.turndown(description);
    // Cut off markdown at 2000 characters
    if (markdown.length > 2000) {
        markdown = markdown.slice(0, 1997) + '...';
    }

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setURL(link)
        .setThumbnail('https://godvillegame.com/images/logo_gv.png')
        .setDescription(markdown)
        .setTimestamp(new Date(pubDate))
        .setColor(0x00FF00)
        .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: client.user.avatarURL() });

    blogChannel.send({ content: `New blog post <@&${roles.blogPing}>!`, embeds: [embed] })
        .then((msg) => {
            if (msg.crosspostable) {
                msg.crosspost();
            }
        })
        .catch((error) => {
            const modLogs = client.channels.cache.get(channels.modLogs);
            const errMsg = 'ERROR: couldn\'t send new blog update to godville-blogs!';
            logger.log(errMsg);
            logger.error(error);
            modLogs.send(errMsg);
        });

        logger.log(`BLOG: New blog posted: ${title} - ${link}`);
}


exports.setup = onStartup;


// todo
// const { FIREBASE: serviceAccount } = require('../../configurations/secret.json');
// const admin = require('firebase-admin');
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
// });
// const db = admin.firestore();
// const otherDataCollection = db.collection('data');
// const blogData = otherDataCollection.doc('blog');
// onStartup(blogData);
// setTimeout(checkForUpdates, 3000);