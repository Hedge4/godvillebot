const { clientId } = require('../../configurations/config.json');
const main = require('../../index');
const logger = require('../features/logging');

// basic setup for chat contests
let lastMessage = null, lastWinner = '', chatCombo = 0;
const chatContestChannel = '313398424911347712';
const chatContestTime = 30;
const checkMaxMessages = 2000;
let lastKillTimestamp = 0;

// on startup, get the latest message that could apply for the chat contest
async function onStartup() {
    // this sets lastKilltimestamp, which we need for getLastMessage
    await setLastWinner();

    const message = await getLastMessage(20); // get last message in the channel sent by a normal user
    lastMessage = message;

    if (!message) {
        logger.log('The last 20 messages were either retrieved incorrectly, were too old, or were all sent by bots.'
            + ' No chat killing timers were set.');
        setLastWinner();
        return;
    }

    let elapsed = Date.now() - message.createdTimestamp;
    // get the time remaining until they would've won (in seconds)
    let timeRemaining = chatContestTime * 60 * 1000 - elapsed;

    if (timeRemaining >= 0) {
        // set timer if the message hasn't won (yet)
        setTimeout(() => {
            winningChatContest(message);
        }, timeRemaining);

        timeRemaining = ~~(timeRemaining / 1000); // change timeremaining to seconds for the logs
        const secondsElapsed = `${elapsed} ${quantiseWords(elapsed, 'second')}`;
        const minutesRem = `${~~(timeRemaining / 60)} ${quantiseWords(~~(timeRemaining / 60), 'minute')}`;
        const secondsRem = `${timeRemaining % 60} ${quantiseWords(timeRemaining % 60, 'second')}`;
        logger.log(`Last chat contest elligible message (by ${message.author.tag}) was sent ${secondsElapsed} ago,`
            + ` ${minutesRem} and ${secondsRem} remaining until chat is dead.`);
        return;
    }

    // if we reach this point, the message should've already won the chatContest
    // update timeRemaining and elapsed for the logs (make positive and convert to seconds)
    timeRemaining = ~~(timeRemaining / -1000);
    elapsed = ~~(elapsed / 1000);

    const secondsElapsed = `${elapsed} ${quantiseWords(elapsed, 'second')}`;
    const minutesRem = `${~~(timeRemaining / 60)} ${quantiseWords(~~(timeRemaining / 60), 'minute')}`;
    const secondsRem = `${timeRemaining % 60} ${quantiseWords(timeRemaining % 60, 'second')}`;
    logger.log(`Last chat contest elligible message was sent ${secondsElapsed} ago,`
        + ` which means chat has been dead for ${minutesRem} and ${secondsRem}.`);

    // LATE WIN: since only messages sent after the last win are found, this message should've won
    winningChatContest(message, true);
}

// get the most recent message sent in the chatContestChannel by a normal user
async function getLastMessage(searchAmount = 20) {
    const client = main.getClient();
    const channel = client.channels.cache.get(chatContestChannel);
    // limit = amount of messages to fetch (Discord gets mad at anything >100)
    const messages = await channel.messages.fetch({ limit: searchAmount })
        .catch(e => {
            console.error(e);
            logger.toChannel(e);
            return null;
        });

    let foundMessage;

    // we continue looping through the collection of messages we've found, considering only valid messages sent by humans
    // keep looping to find the oldest message by one author, stop looping if we find a different author
    for (const message of messages.values()) {
        // these aren't valid messages
        if (message.author.bot) continue;
        if (!message.id) continue;
        if (message.createdTimestamp < lastKillTimestamp) continue;

        // store first (valid) message and keep looking for an older message by that author
        if (!foundMessage) {
            foundMessage = message;
            continue;
        }

        // stop looking if we find another author, the previous loop found the oldest message by that author
        if (foundMessage.author.id !== message.author.id) {
            return foundMessage;
        } else {
            // keep looking if we found an older message by the same author
            foundMessage = message;
            continue;
        }
    }

    // If not returned yet, the last author or bots had more messages than the sample size amount of messages.
    // Return the earliest found message, or nothing if no valid messages were found in the selection
    return foundMessage ? foundMessage : null;
}

// On startup, finds the last person who won the chat contest and saves it (so they can't win twice)
async function setLastWinner() {
    const client = main.getClient();
    const channel = client.channels.cache.get(chatContestChannel);

    chatCombo = 0;
    let lastId; // to track consecutive authors
    let messages = await channel.messages.fetch({ limit: 100 });

    // search back 2000 messages at most
    for (let i = 0; i < ~~(checkMaxMessages / 100); i++) {
        for (const msg of messages.values()) {
            // chatCombo doesn't increase for bots or consecutive authors
            if (!msg.author.bot && msg.author.id !== lastId) {
                chatCombo++;
                lastId = msg.author.id;
            }

            // ignore everything that isn't a message by the bot about killing chat
            if (!msg.author.id === clientId) continue; // check if author is the bot
            if (!msg.content.includes('for successfully killing chat!')) continue;

            const user = msg.mentions.users.first();
            lastWinner = user.id;
            lastKillTimestamp = msg.createdTimestamp;
            logger.log(`${user.tag} was found and set as the last chat-killer. ChatCombo is ${chatCombo}.`);
            return;
        }

        // get the next 100 messages to check
        messages = await channel.messages.fetch({ limit: 100, before: messages.last().id });
    }

    logger.log(`ERROR: No successful chat-killer was found in the last ${checkMaxMessages} messages.`
        + ` Within those messages, chatCombo got up to ${chatCombo}.`);

    // set lastKillTimestamp to the oldest message we found
    channel.messages.fetch(lastId)
        .then((msg) => lastKillTimestamp = msg.createdTimestamp)
        .catch(() => {
            logger.log('Something went wrong and lastKillTimestamp couldn\'t be set.');
        });
}

// start contest timer for the last message in general chat, if it's eligible
function onNewMessage(message) {
    if (message.channel.id == chatContestChannel) {
        if (!lastMessage || lastMessage.author.id !== message.author.id) {
            chatCombo++; // only increase chatCombo for new authors
            lastMessage = message; // only set for new authors - otherwise kills come in late if someone sends multiple messages
        }

        setTimeout(() => {
            winningChatContest(message);
        }, chatContestTime * 60 * 1000);
    }
}

async function onMessageDelete(deletedMessage) {
    if (deletedMessage.channel.id !== chatContestChannel) { return; }
    if (deletedMessage.createdTimestamp <= lastKillTimestamp) { return; }

    // decrease chatCombo for messages not sent by bots + sent after last chat kill
    chatCombo--;

    // find the now latest eligible message to compare if it's different than what we had stored
    const potentialLastMessage = await getLastMessage();

    // if we find a new potential last message to compare our stored lastMessage with
    if (potentialLastMessage) {
        const elapsed = ~~((Date.now() - potentialLastMessage.createdTimestamp) / 1000); // in seconds
        const minutes = `${~~(elapsed / 60)} ${quantiseWords(~~(elapsed / 60), 'minute')}`;
        const seconds = `${elapsed % 60} ${quantiseWords(elapsed % 60, 'second')}`;

        // if the previous lastMessage was the message that was deleted or undefined (e.g. right after chatKill)
        if (!lastMessage || lastMessage.id === deletedMessage.id) {
            logger.log('The last message was deleted in the chat contest channel and chatCombo was reduced by one.'
                + ` Found a new chat kill eligible message by ${potentialLastMessage.author.tag},`
                + ` sent ${minutes} and ${seconds} ago.`);
            lastMessage = potentialLastMessage;

            // also immediately check if this new chatkill eligible message should win the chatContest
            if (Date.now() - potentialLastMessage.createdTimestamp >= chatContestTime * 60 * 1000) {
                // LATE WIN: since only messages sent after the last win are found, this message should've won
                winningChatContest(potentialLastMessage, true);
            }

            return;
        }

        // if the message we found is the same as our stored lastMessage
        if (lastMessage.id === potentialLastMessage.id) {
            logger.log('(PL=) A message was deleted in the chat contest channel and chatCombo was reduced by one.');
            return;
        }

        // if lastMessage and potentialLastMessage are different, but lastMessage is older
        // this only happens if the deleted message came after lastMessage, but was sent by the same person
        if (lastMessage.createdTimestamp < potentialLastMessage.createdTimestamp) {
            logger.log('(PL<) A message was deleted in the chat contest channel and chatCombo was reduced by one.');
            return;
        }

        // if potentialLastMessage is older (this means the deleted message previously interrupted a streak from one author)
        logger.log('A message was deleted in the chat contest channel and chatCombo was reduced by one.'
            + ' The deleted message interrupted a message streak by one user, and an older lastMessage was found'
            + ` sent by ${potentialLastMessage.author.tag}, ${minutes} and ${seconds} ago.`);
        lastMessage = potentialLastMessage;

        // also immediately check if this new chatkill eligible message should win the chatContest
        if (Date.now() - potentialLastMessage.createdTimestamp >= chatContestTime * 60 * 1000) {
            // LATE WIN: since only messages sent after the last win are found, this message should've won
            winningChatContest(potentialLastMessage, true);
        }

        return;
    }

    // NO POTENTIAL LAST MESSAGE FOUND AFTER LAST 'IF'-statement

    // if lastMessage is undefined (e.g. right after chatKill)
    if (!lastMessage) {
        logger.log('A chatkill eligible message was deleted in the chat contest channel and chatCombo was reduced by one.'
            + ' lastMessage was unknown and also can\'t be found; no messages eligible for chat kills.');
        return;
    }

    // if lastMessage is the message that was deleted, and no new eligible messages are found
    if (lastMessage.id === deletedMessage.id) {
        lastMessage = null;
        logger.log('The last message was deleted in the chat contest channel and chatCombo was reduced by one.'
            + ' No new message(s) eligible for chat kills could be found.');
        return;
    }

    // lastMessage is known so it doesn't matter that we don't know the potential last message
    logger.log('(L) A message was deleted in the chat contest channel and chatCombo was reduced by one.');
    return;
}

async function winningChatContest(message, lateWin = false) {
    // check if this message is still the last message in general chat
    if (!lastMessage || message.id !== lastMessage.id) {
        return;
    }

    lastMessage = null;
    lastKillTimestamp = Date.now();

    let minutes = `${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}`;
    if (lateWin) {
        const elapsed = ~~((Date.now() - message.createdTimestamp) / 1000); // in seconds
        minutes = Math.round((elapsed / 60) * 10) / 10; // to minutes with one decimal
        minutes = `${minutes} ${quantiseWords(minutes, 'minute')}`;
    }

    if (message.author.id === lastWinner) {
        message.reply(`You were the last person to talk for ${minutes}, but you already won the last chat-killing contest! :skull:`)
            .catch(() => {
                message.channel.send(`<@${message.author.id}>: You were the last person to talk for ${minutes}, but you already won the last chat-killing contest! :skull:\n\nThis is a fallback reply since you (probably) deleted your message, which should make this scenario impossible. But since this is a bug you'll get gold anyway.`);
            });
        logger.log(`${message.author.tag} / ${message.author.id} won the chat contest after ${minutes}, but they had already won the previous contest. ChatCombo: ${chatCombo}.`);
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

    let gold, tierChance, rewardText;
    const r = Math.random();

    // determine tier-specific variables
    if (r < smallRewardChance) {
        // small reward
        gold = Math.floor(Math.random() * 14) + 6;
        tierChance = toPercent(smallRewardChance);
        rewardText = 'a small amount of gold <:t_gold:668200334933622794>';
    } else if (r < 1 - bigRewardChance) {
        // normal reward
        gold = Math.floor(Math.random() * 21) + 22;
        tierChance = toPercent(1 - smallRewardChance - bigRewardChance);
        rewardText = 'a normal bag of gold <:t_goldbag:668202265777274890>';
    } else {
        // big reward
        gold = Math.floor(Math.random() * 50) + 50;
        tierChance = toPercent(bigRewardChance);
        rewardText = 'a big crate of gold <:t_treasure:668203286330998787>';
    }

    // send reward message
    message.reply(`You were the last person to talk for ${minutes}, and you won ${rewardText} for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`)
        .catch(() => {
            // in case the last message was deleted
            message.channel.send(`<@${message.author.id}>: You were the last person to talk for ${minutes}, and you won ${rewardText} for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:\n\nThis is a fallback reply since you (probably) deleted your message, which should make this scenario impossible. But since this is a bug you'll get gold anyway.`);
        });

    // update database
    const userData = main.getUserData();
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

    logger.log(`${message.author.tag} / ${message.author.id} won ${gold} gold for being the last to talk in general chat for ${minutes}, after a conversation with chatCombo ${chatCombo}. There was a ${tierChance} chance of getting the reward tier they got. Gold: ${oldGold} -> ${newGold}.`);
    lastMessage = null;
    chatCombo = 0;
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;

exports.startupCheck = onStartup;
exports.newMessage = onNewMessage;
exports.deleteMessage = onMessageDelete;
