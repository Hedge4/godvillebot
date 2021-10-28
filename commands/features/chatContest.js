const { logs, botID } = require('../../configurations/config.json');

// basic setup for chat contests
let lastMessage = null, lastWinner = '', chatCombo = 0;
const chatContestChannel = '313398424911347712';
const chatContestTime = 30;

// get the latest message applying for the chat contest
async function checkChatContest(client, userData) {
    const logsChannel = client.channels.cache.get(logs);
    const message = await getLastMessage(client); // get last message in the channel sent by a normal user

    if (!message) {
        console.log('The last 20 messages were either retrieved incorrectly, were too old, or were all sent by bots. No chat killing timers were set.');
        logsChannel.send('The last 20 messages were either retrieved incorrectly, were too old, or were all sent by bots. No chat killing timers were set.');
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
        chatCombo = 1; // sadly combo has to reset because lazy (jk but keeping combo is too much effort)
        setTimeout(() => {
            winningChatContest(message, client, userData);
        }, timeRemaining);

        timeRemaining = ~~(timeRemaining / 1000); // change timeremaining to seconds for the logs
        console.log(`Last chat contest elligible message was sent ${elapsed} seconds ago, ${timeRemaining / 60} minutes and ${timeRemaining % 60} seconds remaining until chat is ded.`);
        logsChannel.send(`Last chat contest elligible message was sent ${elapsed} seconds ago, ${timeRemaining / 60} minutes and ${timeRemaining % 60} seconds remaining until chat is ded.`);
    } else {
    timeRemaining *= -1; // timeRemaining is negative in this case
    timeRemaining = ~~(timeRemaining / 1000); // change timeremaining to seconds for the logs
    console.log(`Last chat contest elligible message was sent ${elapsed} seconds ago, which means chat has been dead for ${timeRemaining / 60} minutes and ${timeRemaining % 60} seconds.`);
    logsChannel.send(`Last chat contest elligible message was sent ${elapsed} seconds ago, which means chat has been dead for ${timeRemaining / 60} minutes and ${timeRemaining % 60} seconds.`);
    }

    setLastWinner(client);
    return;
}

// get the most recent message sent in the chatContestChannel by a normal user
async function getLastMessage(client) {
    const amount = 20; // amount of messages to fetch (max 100)
    const channel = client.channels.cache.get(chatContestChannel);
    const messages = await channel.messages.fetch({ limit: amount })
        .catch(console.error);

    // loop through messages until one not sent by a bot is found
    for (const message of messages.array()) {
        if (message.author.bot) continue;
        return message;
    }
    return null; // if no suitable messages were found in the fetched collection
}

async function setLastWinner(client) {
    const channel = client.channels.cache.get(chatContestChannel);
    const logsChannel = client.channels.cache.get(logs);

    let user;
    let messages = await channel.messages.fetch({ limit: 100 });

    // search back 1000 messages at most
    for (let i = 0; i < 10; i++) {

        for (const msg of messages.array()) {
            if (!msg.author.bot) continue;
            if (!msg.author.id == botID) continue; // check if author is the bot
            if (!msg.content.includes('for successfully killing chat!')) continue;

            user = msg.mentions.users.first();
            lastWinner = user.id;
            console.log(`${user.tag} was found and set as the last chat-killer.`);
            logsChannel.send(`${user.tag} was found and set as the last chat-killer.`);
            return;
        }

        // get the next 100 messages to check
        messages = await channel.messages.fetch({ limit: 100, before: messages.last().id });
    }

    console.log('ERROR: No succesful chat-killer was found in the last 1000 messages. Perhaps something is wrong with the code?');
    logsChannel.send('ERROR: No succesful chat-killer was found in the last 1000 messages. Perhaps something is wrong with the code?');
}

// run contest for the last message in general chat
function checkMessage(message, client, userData) {
    if (message.channel.id == chatContestChannel) {
        if (lastMessage == null || lastMessage.author.id !== message.author.id) {
            chatCombo++;
            lastMessage = message;
            setTimeout(() => {
                winningChatContest(message, client, userData);
            }, chatContestTime * 60 * 1000);
        }
    }
}

async function deleteMessage(message, client) {
    if (message.channel.id == chatContestChannel) {
        if (message.id == lastMessage.id) {
            const newLastMessage = await getLastMessage(client);
            if (message) {
                chatCombo -= 1;
                lastMessage = newLastMessage;
            } else {
                lastMessage = null;
            }
        }
    }
}

// check if this message is still the last message in general chat, and reward the author if it is
async function winningChatContest(message, client, userData) {
    if (message.id == lastMessage.id) {
        const logsChannel = client.channels.cache.get(logs);
        if (message.author.id == lastWinner) {
            message.reply(`you were the last person to talk for ${chatContestTime} minutes, but you already won the last chat-killing contest! :skull:`);
            console.log(`${message.author.tag} / ${message.author.id} won the chat contest after ${chatContestTime} minutes, but they had already won the previous contest.`);
            logsChannel.send(`${message.author.tag} / ${message.author.id} won the chat contest after ${chatContestTime} minutes, but they had already won the previous contest.`);
        } else {
            lastWinner = message.author.id;
            let chatMultiplier = (chatCombo / 75) + 0.5; // increases messages 0-300
            if (chatMultiplier > 4.5) chatMultiplier = 4.5;
            let chatMultiplier2 = (chatCombo - 300) / 200; // increases messages 300-500
            if (chatMultiplier2 > 1) chatMultiplier2 = 1;
            if (chatMultiplier2 < 0) chatMultiplier2 = 0;
            let gold;
            switch (Math.floor(Math.random() * chatMultiplier) + chatMultiplier2) {
                case 0:
                    gold = Math.floor(Math.random() * 14) + 6;
                    message.reply(`you were the last person to talk for ${chatContestTime} minutes, and you won a small amount of gold <:t_gold:668200334933622794> for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
                    break;
                case 1:
                case 2:
                case 4:
                    gold = Math.floor(Math.random() * 21) + 22;
                    message.reply(`you were the last person to talk for ${chatContestTime} minutes, and you won a normal bag of gold <:t_goldbag:668202265777274890> for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
                    break;
                case 3:
                case 5:
                    gold = Math.floor(Math.random() * 50) + 50;
                    message.reply(`you were the last person to talk for ${chatContestTime} minutes, and you won a big crate of gold <:t_treasure:668203286330998787> for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
                    break;
            }
            console.log(`${message.author.tag} / ${message.author.id} won ${gold} gold for being the last to talk in general chat for ${chatContestTime} minutes, after a conversation with combo ${chatCombo} and tier multiplier ${chatMultiplier}.`);
            logsChannel.send(`${message.author.tag} / ${message.author.id} won ${gold} gold for being the last to talk in general chat for ${chatContestTime} minutes, after a conversation with combo ${chatCombo} and tier multiplier ${chatMultiplier}.`);

            const userDoc = await userData.get();
            const User = {};
            if(userDoc.data()[message.author.id] === undefined) {
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
            User[message.author.id].gold += gold;
            User[message.author.id].last_username = message.author.tag;
            userData.set(User, { merge: true });
        }
        lastMessage = null;
        chatCombo = 0;
    }
}

exports.check = checkChatContest;
exports.newMessage = checkMessage;
exports.deleteMessage = deleteMessage;
