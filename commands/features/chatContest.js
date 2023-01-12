const { clientId } = require('../../configurations/config.json');
const logger = require('../features/logging');

// basic setup for chat contests
let lastMessage = null, lastWinner = '', chatCombo = 0;
const chatContestChannel = '313398424911347712';
const chatContestTime = 30;
let lastKillTimestamp;

// get the latest message applying for the chat contest
async function checkChatContest(client, userData) {
    const message = await getLastMessage(client); // get last message in the channel sent by a normal user

    if (!message) {
        logger.log('The last 20 messages were either retrieved incorrectly, were too old, or were all sent by bots. No chat killing timers were set.');
        setLastWinner(client);
        return;
    }

    let elapsed = Date.now() - message.createdTimestamp;
    // get the time remaining until they would've won (in seconds)
    let timeRemaining = chatContestTime * 60 * 1000 - elapsed;
    elapsed = ~~(elapsed / 1000); // change elapsed to seconds for the logs at the end of the function
    if (timeRemaining >= 0) {
        // set timer, message and author if the message isn't too old
        lastMessage = message;
        setTimeout(() => {
            winningChatContest(message, client, userData);
        }, timeRemaining);

        timeRemaining = ~~(timeRemaining / 1000); // change timeremaining to seconds for the logs
        logger.log(`Last chat contest elligible message (by ${message.author.tag}) was sent ${elapsed} ${quantiseWords(elapsed, 'second')} ago, ${~~(timeRemaining / 60)} ${quantiseWords(~~(timeRemaining / 60), 'minute')} and ${timeRemaining % 60} ${quantiseWords(timeRemaining % 60, 'second')} remaining until chat is dead.`);
    } else {
        timeRemaining *= -1; // timeRemaining is negative in this case
        timeRemaining = ~~(timeRemaining / 1000); // change timeremaining to seconds for the logs
        logger.log(`Last chat contest elligible message was sent ${elapsed} ${quantiseWords(elapsed, 'second')} ago, which means chat has been dead for ${~~(timeRemaining / 60)} ${quantiseWords(~~(timeRemaining / 60), 'minute')} and ${timeRemaining % 60} ${quantiseWords(timeRemaining % 60, 'second')}.`);
    }

    setLastWinner(client);
    return;
}

// get the most recent message sent in the chatContestChannel by a normal user
async function getLastMessage(client) {
    const amount = 20; // amount of messages to fetch (Discord gets mad at anything >100)
    const channel = client.channels.cache.get(chatContestChannel);
    const messages = await channel.messages.fetch({ limit: amount })
        .catch(e => {
            console.error(e);
            logger.toChannel(e);
            return null;
        });

    let foundMessage; // we use this to make sure we get the last message by a unique user, but the first one for that user
    // loop through messages until one not sent by a bot is found
    for (const message of messages.values()) {
        if (foundMessage) { // we do different stuff based on if we already found the last user or not
            if (message.author.bot) { // skip bot messages in between messages by the same author
                continue;
            } else if (foundMessage.author.id === message.author.id) { // same author: keep searching for an even earlier message
                foundMessage = message;
                continue;
            } else { return foundMessage; } // if the author changed, that means foundMessage was the earliest message by that author
        } else {
            if (message.author.bot) continue; // if we didn't find the last user yet, skip bots
            foundMessage = message;
        }
    }

    // If not returned yet, the last author or bots had more messages than the sample size amount of messages.
    // return the earliest found message, or nothing if all messages were sent by bots
    return foundMessage ? foundMessage : null;
}

async function setLastWinner(client) {
    const channel = client.channels.cache.get(chatContestChannel);

    let user;
    let messages = await channel.messages.fetch({ limit: 100 });
    chatCombo = -1;

    // search back 1000 messages at most
    for (let i = 0; i < 10; i++) {
        for (const msg of messages.values()) {
            chatCombo++;
            if (!msg.author.bot) continue;
            if (!msg.author.id == clientId) continue; // check if author is the bot
            if (!msg.content.includes('for successfully killing chat!')) continue;

            user = msg.mentions.users.first();
            lastWinner = user.id;
            lastKillTimestamp = msg.createdTimestamp;
            logger.log(`${user.tag} was found and set as the last chat-killer. ChatCombo is ${chatCombo}.`);
            return;
        }

        // get the next 100 messages to check
        messages = await channel.messages.fetch({ limit: 100, before: messages.last().id });
    }

    chatCombo = 500;
    logger.log('ERROR: No successful chat-killer was found in the last 1000 messages. Perhaps something is wrong with the code? ChatCombo was set to 500.');
}

// run contest for the last message in general chat
function checkMessage(message, client, userData) {
    if (message.channel.id == chatContestChannel) {
        if (lastMessage == null || lastMessage.author.id !== message.author.id) {
            chatCombo++; // only increase chatCombo for new authors
            lastMessage = message; // only set for new authors - otherwise kills come in late if someone sends multiple messages
        }

        setTimeout(() => {
            winningChatContest(message, client, userData);
        }, chatContestTime * 60 * 1000);
    }
}

async function deleteMessage(message, client) {
    if (message.channel.id == chatContestChannel) { // we check this just for decreasing chatCombo later
        if (message.createdTimestamp > lastKillTimestamp) {
            // decrease chatCombo for messages not sent by bots + sent after last chat kill
            chatCombo--;

            // if this was the latest message, find the now latest message
            if (message.id == lastMessage.id) {
                logger.log('Last message deleted in chat contest channel. ChatCombo reduced and searching for new message.');
                const newLastMessage = await getLastMessage(client);
                if (message) {
                    const elapsed = ~~((Date.now() - newLastMessage.createdTimestamp) / 1000); // in seconds
                    const minutes = `${~~(elapsed / 60)} ${quantiseWords(~~(elapsed / 60), 'minute')}`;
                    const seconds = `${elapsed % 60} ${quantiseWords(elapsed % 60, 'second')}`;
                    logger.log(`Found new chat kill eligible message by ${newLastMessage.author.tag}, sent ${minutes} and ${seconds} ago.`);
                    lastMessage = newLastMessage;
                } else {
                    logger.log('No new latest chat kill eligible message was found.');
                    lastMessage = null;
                }
            } else {
                logger.log('Message deleted in chat contest channel. ChatCombo was reduced by one.');
            }
        }
    }
}

async function winningChatContest(message, client, userData) {
    // check if this message is still the last message in general chat
    if (!lastMessage || message.id !== lastMessage.id) {
        return;
    }

    if (message.author.id == lastWinner) {
        message.reply(`You were the last person to talk for ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, but you already won the last chat-killing contest! :skull:`);
        logger.log(`${message.author.tag} / ${message.author.id} won the chat contest after ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, but they had already won the previous contest. ChatCombo: ${chatCombo}.`);

        lastMessage = null;
        chatCombo = 0;
        return;
    }

    lastWinner = message.author.id;
    const limit = (val, minVal = 0, maxVal = 1) => Math.max(minVal, Math.min(maxVal, val));
    const toPercent = (val) => Math.round(val * 1000) / 10 + '%';

    let smallRewardChance = (250 - chatCombo) / 200;
    let bigRewardChance = (chatCombo - 200) / 500;
    smallRewardChance = limit(smallRewardChance);
    bigRewardChance = limit(bigRewardChance, 0, 0.6);

    let gold, tierChance;
    const r = Math.random();

    if (r < smallRewardChance) {
        // small reward
        gold = Math.floor(Math.random() * 14) + 6;
        tierChance = toPercent(smallRewardChance);
        message.reply(`You were the last person to talk for ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, and you won a small amount of gold <:t_gold:668200334933622794> for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
    } else if (r < 1 - bigRewardChance) {
        // normal reward
        gold = Math.floor(Math.random() * 21) + 22;
        tierChance = toPercent(1 - smallRewardChance - bigRewardChance);
        message.reply(`You were the last person to talk for ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, and you won a normal bag of gold <:t_goldbag:668202265777274890> for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
    } else {
        // big reward
        gold = Math.floor(Math.random() * 50) + 50;
        tierChance = toPercent(bigRewardChance);
        message.reply(`You were the last person to talk for ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, and you won a big crate of gold <:t_treasure:668203286330998787> for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
    }

    // update database
    const userDoc = await userData.get();
    const User = {};
    if (userDoc.data()[message.author.id] === undefined) {
        User[message.author.id] = {
            godpower: 0,
            gold: 0,
            total_godpower: 0,
            level: 0,
        };
        User[message.author.id].last_username = message.author.tag;
        await userData.set(User, { merge: true });
    } else {
        User[message.author.id] = userDoc.data()[message.author.id];
    }
    const oldGold = User[message.author.id].gold;
    const newGold = Math.floor(oldGold + gold);
    User[message.author.id].gold = newGold;
    User[message.author.id].last_username = message.author.tag;
    userData.set(User, { merge: true });

    logger.log(`${message.author.tag} / ${message.author.id} won ${gold} gold for being the last to talk in general chat for ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, after a conversation with chatCombo ${chatCombo}. There was a ${tierChance} chance of getting the reward tier they got. Gold: ${oldGold} -> ${newGold}.`);
    lastMessage = null;
    chatCombo = 0;
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;

exports.startupCheck = checkChatContest;
exports.newMessage = checkMessage;
exports.deleteMessage = deleteMessage;
