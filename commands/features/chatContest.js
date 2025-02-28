const { clientId, channels } = require('../../configurations/config.json');
const main = require('../../index');
const logger = require('../features/logging');

// basic setup for chat contests
const contestActive = false;
let lastMessage = null, lastWinner = '', chatCombo = 0;
let lastKillTimestamp;
const contestChannel = channels.generalChat;
const defaultContestTime = 30;
const minContestTime = 15;
const maxContestTime = 90;
const randomFactor = 0.04; // -4% to 4% less/extra time
const checkMaxMessages = 2000;

// setup for measuring chat activity
let lastMinute = 0;
let lowestKillTimer = maxContestTime;
const messagesHistory = {};
const interactionsStorage = 60; // for how long the amount of interactions per minute is stored
const interactionsPerMinute = new Array(interactionsStorage).fill(0);
const killTimerStorage = maxContestTime + 2; // so +1 we get the last x minutes instead of x-1, +1 for extreme drifting
const killTimerHistory = new Array(killTimerStorage).fill([]);
const conversionAnchors = { 0: maxContestTime, 5: 60, 15: 40, 25: 30, 50: minContestTime };
const sortedConversionAnchors = Object.keys(conversionAnchors).sort((a, b) => a - b);

// on startup, get the latest message that could apply for the chat contest
async function onStartup() {
    if (!contestActive) return;
    
    // start clearing old interaction history every minute
    clearInteractionsInterval();
    // this sets lastKilltimestamp, which we need for getLastMessage
    await setLastWinner();

    lastMessage = await getLastMessage(20); // get last message in the channel sent by a normal user
    if (!lastMessage) {
        logger.log('ChatContest: There were no messages after the last chat kill, or the last 20 messages were retrieved incorrectly, too old, or all sent by bots.'
            + ' No chat killing timers were set.');
        return;
    }

    let elapsed = Date.now() - lastMessage.createdTimestamp;
    // get the time remaining until they will win (in seconds)
    const chatkillTime = defaultContestTime * 60 * 1000;
    let timeRemaining = chatkillTime - elapsed;

    // add only latest chat interaction
    const relativeMinute = ~~(lastMessage.createdTimestamp / 1000 / 60) % interactionsStorage;
    if (elapsed < 60 * 60 * 1000) {
        interactionsPerMinute[relativeMinute]++;
    }
    // add to message history that rolls around every killTimerStorage minutes
    const historyMinute = ~~(Date.now() / 1000 / 60) % killTimerStorage;
    messagesHistory[lastMessage.id] = chatkillTime;
    killTimerHistory[historyMinute].push(lastMessage.id);

    if (timeRemaining >= 0) {
        // set timer if the message hasn't won (yet)
        setTimeout(winningChatContest, timeRemaining, lastMessage);

        // update timeRemaining and elapsed for the logs
        timeRemaining = ~~(timeRemaining / 1000);
        elapsed = ~~(elapsed / 1000);
        const secondsElapsed = `${elapsed} ${quantiseWords(elapsed, 'second')}`;
        const minutesRem = `${~~(timeRemaining / 60)} ${quantiseWords(~~(timeRemaining / 60), 'minute')}`;
        const secondsRem = `${timeRemaining % 60} ${quantiseWords(timeRemaining % 60, 'second')}`;
        logger.log(`ChatContest: Last chat contest elligible message (by ${lastMessage.author.tag}) was sent ${secondsElapsed} ago,`
            + ` ${minutesRem} and ${secondsRem} remaining until chat is dead (using the default timer of ${defaultContestTime} minutes).`);
        return;
    }

    // if we reach this point, the message should've already won the chatContest
    // update timeRemaining and elapsed for the logs
    timeRemaining = ~~(timeRemaining / -1000);
    elapsed = ~~(elapsed / 1000);
    const secondsElapsed = `${elapsed} ${quantiseWords(elapsed, 'second')}`;
    const minutesRem = `${~~(timeRemaining / 60)} ${quantiseWords(~~(timeRemaining / 60), 'minute')}`;
    const secondsRem = `${timeRemaining % 60} ${quantiseWords(timeRemaining % 60, 'second')}`;
    logger.log(`ChatContest: Last chat contest elligible message was sent ${secondsElapsed} ago,`
        + ` which means chat has been dead for ${minutesRem} and ${secondsRem} (using the default timer of ${defaultContestTime} minutes).`);

    // LATE WIN: since only messages sent after the last win are found, this message should've won
    winningChatContest(lastMessage, true);
}

// get the most recent message sent in the contestChannel by a normal user
async function getLastMessage(searchAmount = 20) {
    const client = main.getClient();
    const channel = client.channels.cache.get(contestChannel);
    // limit = amount of messages to fetch (Discord gets mad at anything >100)
    const messages = await channel.messages.fetch({ limit: searchAmount })
        .catch(e => {
            console.error(e);
            logger.toChannel(e);
            return null;
        });

    // we continue looping through the collection of messages we've found, considering only valid messages sent by humans
    // keep looping to find the oldest message by one author, stop looping if we find a different author
    let foundMessage;
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
    const channel = client.channels.cache.get(contestChannel);

    chatCombo = 0;
    let lastId; // to track consecutive authors
    let messages = await channel.messages.fetch({ limit: 100 });

    let lastWinnerFound = false;
    let interactionHistoryFilled = false;
    let interactionsFound = 0;

    // caps out after checkMaxMessages messages
    for (let i = 0; i < ~~(checkMaxMessages / 100); i++) {
        for (const msg of messages.values()) {
            // chatCombo doesn't increase for bots or consecutive authors
            if (!msg.author.bot && msg.author.id !== lastId) {
                chatCombo++;
                lastId = msg.author.id;

                // keep searching until we fill interactionHistory with [interactionsStorage] minutes of interactions
                if (!interactionHistoryFilled) {
                    // if the message is older than [interactionsStorage] minutes, we've filled the history
                    if (Date.now() - msg.createdTimestamp > interactionsStorage * 60 * 1000) {
                        interactionHistoryFilled = true;
                        logger.log(`ChatContest: Found ${interactionsFound} interactions in the last ${interactionsStorage} minutes.`);
                    } else {
                        const relativeMinute = ~~(msg.createdTimestamp / 1000 / 60) % interactionsStorage;
                        interactionsPerMinute[relativeMinute]++;
                        interactionsFound++;
                    }
                }
            }

            // keep searching until we find the last winner
            if (!lastWinnerFound) {
                // ignore everything that isn't a message by the bot about killing chat
                if (!msg.author.id === clientId) continue; // check if author is the bot
                if (!msg.content.includes('for successfully killing chat!')) continue;

                const user = msg.mentions.users.first();
                lastWinner = user.id;
                lastKillTimestamp = msg.createdTimestamp;
                logger.log(`ChatContest: ${user.tag} was found and set as the last chat-killer. ChatCombo is ${chatCombo}.`);
                lastWinnerFound = true;
            }

            if (lastWinnerFound && interactionHistoryFilled) return;
        }

        // get the next 100 messages to check
        messages = await channel.messages.fetch({ limit: 100, before: messages.last().id });
    }

    if (!lastWinnerFound) {
        logger.log(`ChatContest: No successful chat-killer was found in the last ${checkMaxMessages} messages.`
            + ` Within those messages, chatCombo got up to ${chatCombo}.`);
    }

    if (!interactionHistoryFilled) {
        logger.log(`ChatContest: Found ${interactionsFound} interactions in the last ${interactionsStorage} minutes,`
            + 'but didn\'t reach the end of the message history.');
    }

    // set lastKillTimestamp to the oldest message we found
    channel.messages.fetch(lastId)
        .then((msg) => lastKillTimestamp = msg.createdTimestamp)
        .catch(() => {
            logger.log('ChatContest: Something went wrong and lastKillTimestamp couldn\'t be set.');
        });
}

// start contest timer for the last message in general chat, if it's eligible
function onNewMessage(message) {
    if (!contestActive) return;
    
    // filter out wrong channels and bots
    if (message.channel.id !== contestChannel) return;
    if (message.author.bot) return;

    // get required delay for this message to kill chat
    const killTimerMs = generateKillTimer();

    // check if this is a new lastMessage, and if chatCombo/interactions should update
    if (!lastMessage || lastMessage.author.id !== message.author.id) {
        // only increase chatCombo and update lastMessage for new authors
        chatCombo++;
        lastMessage = message;

        // update chat interactions record
        const currentMinute = ~~(Date.now() / 1000 / 60) % interactionsStorage;
        clearInteractionMinute(currentMinute);
        interactionsPerMinute[currentMinute]++;
    }

    // rolls around every killTimerStorage minutes
    const historyMinute = ~~(Date.now() / 1000 / 60) % killTimerStorage;
    messagesHistory[message.id] = killTimerMs;
    killTimerHistory[historyMinute].push(message.id);

    setTimeout(winningChatContest, killTimerMs, message);
}

// update lastMessage in case the deleted message was significant, chatCombo is not updated
async function onMessageDelete(deletedMessage) {
    if (!contestActive) return;
    
    if (deletedMessage.channel.id !== contestChannel) { return; }
    if (deletedMessage.createdTimestamp <= lastKillTimestamp) { return; }

    // find the now latest eligible message to compare if it's different than what we had stored
    const potentialLastMessage = await getLastMessage();

    // if we find a new potential last message to compare our stored lastMessage with
    if (potentialLastMessage) {
        const elapsed = ~~((Date.now() - potentialLastMessage.createdTimestamp) / 1000); // in seconds
        const minutes = `${~~(elapsed / 60)} ${quantiseWords(~~(elapsed / 60), 'minute')}`;
        const seconds = `${elapsed % 60} ${quantiseWords(elapsed % 60, 'second')}`;

        // === killTimerMs undefined handling explained ===
        // There are two possible scenarios if killTimerMs is undefined:
        // 1. The message is older than [killTimerStorage] minutes, and not in the history anymore
        // 2. The message was never in the history, likely due to bot startup
        //
        // In scenario 1, the message is definitely old enough. In scenario 2, we use the default (startup) timer.
        // ================================================
        const killTimerMs = messagesHistory[potentialLastMessage.id] || defaultContestTime * 60 * 1000;

        // if the previous lastMessage was the message that was deleted or undefined (e.g. right after chatKill)
        if (!lastMessage || lastMessage.id === deletedMessage.id) {
            logger.log('ChatContest: The last message was deleted in the chat contest channel.'
                + ` Found a new chat kill eligible message by ${potentialLastMessage.author.tag},`
                + ` sent ${minutes} and ${seconds} ago.`);
            lastMessage = potentialLastMessage;

            // also immediately check if this new chatkill eligible message should win the chatContest
            if (Date.now() - potentialLastMessage.createdTimestamp >= killTimerMs) {
                // LATE WIN: since only messages sent after the last win are found, this message should've won
                winningChatContest(potentialLastMessage, true);
            }
            return;
        }

        // if the message we found is the same as our stored lastMessage
        if (lastMessage.id === potentialLastMessage.id) {
            return;
        }

        // if lastMessage and potentialLastMessage are different, but lastMessage is older
        // this only happens if the order of requests gets messed up, and potentialLastMessage is outdated
        if (lastMessage.createdTimestamp < potentialLastMessage.createdTimestamp) {
            return;
        }

        // if potentialLastMessage is older (this means the deleted message previously interrupted a streak from one author)
        logger.log('ChatContest: A message interrupting a message streak from one user was deleted in the chat contest channel, so an older lastMessage was found'
            + ` sent by ${potentialLastMessage.author.tag}, ${minutes} ${quantiseWords(minutes, 'minute')} and ${seconds} ${quantiseWords(seconds, 'second')} ago.`);
        lastMessage = potentialLastMessage;

        // also immediately check if this new chatkill eligible message should win the chatContest
        if (Date.now() - potentialLastMessage.createdTimestamp >= killTimerMs) {
            // LATE WIN: since only messages sent after the last win are found, this message should've won
            winningChatContest(potentialLastMessage, true);
        }

        return;
    }

    // \/ NO POTENTIAL LAST MESSAGE FOUND \/

    // if lastMessage is undefined (e.g. right after chatKill)
    if (!lastMessage) {
        logger.log('ChatContest: A chatkill eligible message was deleted in the chat contest channel.'
            + ' lastMessage was unknown and can\'t be found; no messages eligible for chat kills.');
        return;
    }

    // if lastMessage is the message that was deleted, and no new eligible messages are found
    if (lastMessage.id === deletedMessage.id) {
        lastMessage = null;
        logger.log('ChatContest: The most recent message was deleted in the chat contest channel.'
            + ' No new message eligible for a chat kill could be found.');
        return;
    }

    // lastMessage is known so it doesn't matter that we don't know the potential last message
    // logger.log('ChatContest: A message was deleted in the chat contest channel.');
    return;
}

async function winningChatContest(message, lateWin = false) {
    // check if this message is still the last message in general chat
    if (!lastMessage || message.id !== lastMessage.id) {
        return;
    }

    // reset, chatCombo is reset later (before returning)
    lastMessage = null;
    lastKillTimestamp = Date.now();
    lowestKillTimer = maxContestTime;

    const killTimer = Math.round(messagesHistory[message.id] / 1000 / 6) / 10;
    // if no killTimer was found, calculate elapsed time since message was sent
    if (!killTimer) lateWin = true;

    let minutes;
    if (lateWin) {
        const elapsed = ~~((Date.now() - message.createdTimestamp) / 1000); // in seconds
        minutes = Math.round((elapsed / 60) * 10) / 10; // to minutes with one decimal
        minutes = `${minutes} ${quantiseWords(minutes, 'minute')}`;
    } else {
        minutes = `${killTimer} ${quantiseWords(killTimer, 'minute')}`;
    }

    if (message.author.id === lastWinner) {
        message.reply(`You were the last person to talk for ${minutes}, but you already won the last chat-killing contest! :skull:`)
            .catch(() => {
                message.channel.send(`<@${message.author.id}>: You were the last person to talk for ${minutes}, but you already won the last chat-killing contest! :skull:\n\nThis is a fallback reply since you (probably) deleted your message, which should make this scenario impossible. But since this is a bug you'll get the win anyway.`);
            });
        logger.log(`ChatContest: ${message.author.tag} / ${message.author.id} won the chat contest after ${minutes}, but they had already won the previous contest. ChatCombo: ${chatCombo}.`);
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

    logger.log(`ChatContest: ${message.author.tag} / ${message.author.id} won ${gold} gold for being the last to talk in general chat for ${minutes}, after a conversation with chatCombo ${chatCombo}. There was a ${tierChance} chance of getting the reward tier they got. Gold: ${oldGold} -> ${newGold}.`);
    chatCombo = 0;
}

// \only use to generate a killTimer for a new message, to look up old timers use messagesHistory[message.id]
function generateKillTimer() {
    // [storedInteractions] (unused): total interactions the last [interactionsStorage] minutes
    // [weightedTotalInteractions]: weighted so short bursts of activity are less important
    const weightedTotalInteractions = interactionsPerMinute.reduce((sum, count) => {
        if (count >= 1) count -= 0.5;
        return sum + Math.sqrt(count);
    }, 0);

    // the timer has a minimum of [minContestTime]
    if (weightedTotalInteractions <= sortedConversionAnchors[0]) {
        const killTimer = conversionAnchors[sortedConversionAnchors[0]];
        // no need to take an average, since the lowest killTimer should always be the same
        return killTimer * 60 * 1000;
    }
    // and a maximum of [maxContestTime]
    if (weightedTotalInteractions >= sortedConversionAnchors[sortedConversionAnchors.length - 1]) {
        let killTimer = conversionAnchors[sortedConversionAnchors[sortedConversionAnchors.length - 1]];
        killTimer = (killTimer + lowestKillTimer) / 2; // average with lowest killTimer, preserves bursts of activity
        return killTimer * 60 * 1000;
    }

    // conversionAnchors stores fixed weightedTotalInteractions values and asocciated killTimers
    let lower = sortedConversionAnchors[0];
    let upper;
    for (const point of sortedConversionAnchors) {
        if (point <= weightedTotalInteractions) {
            lower = point;
            continue;
        } else {
            upper = point;
            break;
        }
    }

    // lerp between the two closest conversionAnchors to get exact killTimer
    const lowerValue = conversionAnchors[lower];
    const upperValue = conversionAnchors[upper];
    const lerpFactor = (weightedTotalInteractions - lower) / (upper - lower);
    let killTimer = lowerValue + lerpFactor * (upperValue - lowerValue);

    // store new lowest killTimer if applicable
    if (killTimer < lowestKillTimer) { lowestKillTimer = killTimer; } else {
        // if the new killTimer is higher than the lowest, average them so bursts of activity since the last
        // chatkill are persistent (and don't become irrelevant once they move out of the history)
        killTimer = (killTimer + lowestKillTimer) / 2;
    }

    // add a random factor of -4% to 4%
    const randomMultiplier = 1 + Math.random() * randomFactor * 2 - randomFactor; // [-randomFactor, +randomFactor]
    killTimer *= randomMultiplier;

    // ensure killTimer is within the [minContestTime] and [maxContestTime] bounds after random factor
    killTimer = Math.min(Math.max(killTimer, minContestTime), maxContestTime);

    // return killTimer in milliseconds
    return killTimer * 60 * 1000;
}

// clear this minute's interactions, if not yet cleared by a message
function clearInteractionsInterval() {
    const currentMinute = ~~(Date.now() / 1000 / 60) % interactionsStorage;
    clearInteractionMinute(currentMinute);

    // set timeout for next minute clear (add 1 second as a margin of error)
    const secondsRemaining = 60 - ~~(Date.now() / 1000) % 60;
    setTimeout(clearInteractionsInterval, (secondsRemaining + 1) * 1000);
}

function clearInteractionMinute(currentMinute) {
    // only clear history if we're in a new minute
    if (currentMinute === lastMinute) return;

    interactionsPerMinute[currentMinute] = 0;
    lastMinute = currentMinute;

    // rolls around every killTimerStorage minutes
    const currentHistoryMinute = ~~(Date.now() / 1000 / 60) % killTimerStorage;
    killTimerHistory[currentHistoryMinute].forEach(msgId => {
        if (messagesHistory[msgId]) delete messagesHistory[msgId];
    });
    killTimerHistory[currentHistoryMinute] = [];
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;

exports.startupCheck = onStartup;
exports.newMessage = onNewMessage;
exports.deleteMessage = onMessageDelete;
