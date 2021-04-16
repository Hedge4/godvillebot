const { logs } = require('../../configurations/config.json');

// basic setup for chat contests
let lastMessage = null, lastWinner = '', chatCombo = 0;
const chatContestChannel = '313398424911347712';
const chatContestTime = 30;

// get the latest message applying for the chat contest
function checkChatContest(client, userData) {
    const channel = client.channels.cache.get(chatContestChannel);
    // get latest few messages of the channel
    channel.messages.fetch()
        .then(messages => {
            // loop through messages until one not sent by a bot is found
            for (const message of messages.array()) {
                if (message.author.bot) continue;
                const elapsed = Date.now() - message.createdTimestamp;
                // get the time remaining until they would've won
                const timeRemaining = (chatContestTime * 60 * 1000) - elapsed;
                if (timeRemaining >= 0) {
                    // set timer, message and author if the message isn't too old
                    lastMessage = message;
                    chatCombo = 1; // sadly combo has to reset because lazy (jk but keeping combo is too much effort)
                    setTimeout(() => {
                        winningChatContest(message, client, userData);
                    }, timeRemaining);
                }
                const logsChannel = client.channels.cache.get(logs);
                console.log(`Last chat contest elligible message was sent ${elapsed} milliseconds ago, ${timeRemaining} seconds remaining until chat is ded.`);
                logsChannel.send(`Last chat contest elligible message was sent ${elapsed} milliseconds ago, ${timeRemaining} seconds remaining until chat is ded.`);
                return;
            }
        })
        .catch(console.error);
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
            let chatMultiplier = (chatCombo / 75) + 0.5;
            if (chatMultiplier > 4.5) chatMultiplier = 4.5;
            let gold;
            switch (Math.floor(Math.random() * chatMultiplier)) {
                case 0:
                    gold = Math.floor(Math.random() * 14) + 6;
                    message.reply(`you were the last person to talk for ${chatContestTime} minutes, and you won a small amount of gold <:t_gold:668200334933622794> for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
                    break;
                case 1:
                case 2:
                    gold = Math.floor(Math.random() * 21) + 22;
                    message.reply(`you were the last person to talk for ${chatContestTime} minutes, and you won a normal bag of gold <:t_goldbag:668202265777274890> for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
                    break;
                case 3:
                case 4:
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