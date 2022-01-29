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
        setTimeout(() => {
            winningChatContest(message, client, userData);
        }, timeRemaining);

        timeRemaining = ~~(timeRemaining / 1000); // change timeremaining to seconds for the logs
        console.log(`Last chat contest elligible message was sent ${elapsed} ${quantiseWords(elapsed, 'second')} ago, ${~~(timeRemaining / 60)} ${quantiseWords(~~(timeRemaining / 60), 'minute')} and ${timeRemaining % 60} ${quantiseWords(timeRemaining % 60, 'second')} remaining until chat is ded.`);
        logsChannel.send(`Last chat contest elligible message was sent ${elapsed} ${quantiseWords(elapsed, 'second')} ago, ${~~(timeRemaining / 60)} ${quantiseWords(~~(timeRemaining / 60), 'minute')} and ${timeRemaining % 60} ${quantiseWords(timeRemaining % 60, 'second')} remaining until chat is ded.`);
    } else {
    timeRemaining *= -1; // timeRemaining is negative in this case
    timeRemaining = ~~(timeRemaining / 1000); // change timeremaining to seconds for the logs
    console.log(`Last chat contest elligible message was sent ${elapsed} ${quantiseWords(elapsed, 'second')} ago, which means chat has been dead for ${~~(timeRemaining / 60)} ${quantiseWords(~~(timeRemaining / 60), 'minute')} and ${timeRemaining % 60} ${quantiseWords(timeRemaining % 60, 'second')}.`);
    logsChannel.send(`Last chat contest elligible message was sent ${elapsed} ${quantiseWords(elapsed, 'second')} ago, which means chat has been dead for ${~~(timeRemaining / 60)} ${quantiseWords(~~(timeRemaining / 60), 'minute')} and ${timeRemaining % 60} ${quantiseWords(timeRemaining % 60, 'second')}.`);
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
    chatCombo = -1;

    // search back 1000 messages at most
    for (let i = 0; i < 10; i++) {

        for (const msg of messages.array()) {
            chatCombo++;
            if (!msg.author.bot) continue;
            if (!msg.author.id == botID) continue; // check if author is the bot
            if (!msg.content.includes('for successfully killing chat!')) continue;

            user = msg.mentions.users.first();
            lastWinner = user.id;
            console.log(`${user.tag} was found and set as the last chat-killer. ChatCombo is ${chatCombo}.`);
            logsChannel.send(`${user.tag} was found and set as the last chat-killer. ChatCombo is ${chatCombo}.`);
            return;
        }

        // get the next 100 messages to check
        messages = await channel.messages.fetch({ limit: 100, before: messages.last().id });
    }

    chatCombo = 0;
    console.log('ERROR: No succesful chat-killer was found in the last 1000 messages. Perhaps something is wrong with the code? ChatCombo was set to 0.');
    logsChannel.send('ERROR: No succesful chat-killer was found in the last 1000 messages. Perhaps something is wrong with the code? ChatCombo was set to 0.');
}

// run contest for the last message in general chat
function checkMessage(message, client, userData) {
    if (message.channel.id == chatContestChannel) {
        if (lastMessage == null || lastMessage.author.id !== message.author.id) {
            chatCombo++; // only increase chatCombo for new authors
            lastMessage = message; // only set for new users - otherwise kills in come late if someone sends multiple messages
        }

        setTimeout(() => {
            winningChatContest(message, client, userData);
        }, chatContestTime * 60 * 1000);
    }
}

async function deleteMessage(message, client) {
    if (message.channel.id == chatContestChannel) {
        if (message.id == lastMessage.id) {
            const newLastMessage = await getLastMessage(client);
            if (message) {
                lastMessage = newLastMessage;
            } else {
                lastMessage = null;
            }
        }

        // chatCombo could be decreased here, but I'm not bothering with it.
    }
}

// check if this message is still the last message in general chat, and reward the author if it is
async function winningChatContest(message, client, userData) {
    if (message.id == lastMessage.id) {
        const logsChannel = client.channels.cache.get(logs);
        if (message.author.id == lastWinner) {
            message.reply(`you were the last person to talk for ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, but you already won the last chat-killing contest! :skull:`);
            console.log(`${message.author.tag} / ${message.author.id} won the chat contest after ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, but they had already won the previous contest. ChatCombo: ${chatCombo}.`);
            logsChannel.send(`${message.author.tag} / ${message.author.id} won the chat contest after ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, but they had already won the previous contest. ChatCombo: ${chatCombo}.`);
        } else {
            lastWinner = message.author.id;
            if (chatCombo < 0) chatCombo = 0; // in case it's negative for whatever reason
            let chatMultiplier = (chatCombo / 75) + 0.5; // increases messages 0-300
            if (chatMultiplier > 4.5) chatMultiplier = 4.5;
            let chatMultiplierBonus = (chatCombo - 300) / 200; // increases messages 300-500
            if (chatMultiplierBonus > 1) chatMultiplierBonus = 1;
            if (chatMultiplierBonus < 0) chatMultiplierBonus = 0;
            // round to 2 decimals
            chatMultiplier = Math.round(chatMultiplier * 100) / 100;
            chatMultiplierBonus = Math.round(chatMultiplierBonus * 100) / 100;

            let gold;
            switch (Math.floor(Math.random() * chatMultiplier + chatMultiplierBonus)) {
                case 0:
                    gold = Math.floor(Math.random() * 14) + 6;
                    message.reply(`you were the last person to talk for ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, and you won a small amount of gold <:t_gold:668200334933622794> for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
                    break;
                case 1:
                case 2:
                case 4:
                    gold = Math.floor(Math.random() * 21) + 22;
                    message.reply(`you were the last person to talk for ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, and you won a normal bag of gold <:t_goldbag:668202265777274890> for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
                    break;
                case 3:
                case 5:
                    gold = Math.floor(Math.random() * 50) + 50;
                    message.reply(`you were the last person to talk for ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, and you won a big crate of gold <:t_treasure:668203286330998787> for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:`);
                    break;
                default:
                    gold = 100;
                    message.reply(`you were the last person to talk for ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, but something went wrong calculating your reward. You were awarded a default amount of gold <:t_treasure:668203286330998787> for successfully killing chat! **+${gold}** <:r_gold:401414686651711498>! :tada:\n<@346301339548123136>`);
            }

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
            const oldGold = User[message.author.id].gold;
            const newGold = Math.floor(oldGold + gold);
            User[message.author.id].gold = newGold;
            User[message.author.id].last_username = message.author.tag;
            userData.set(User, { merge: true });

            console.log(`${message.author.tag} / ${message.author.id} won ${gold} gold for being the last to talk in general chat for ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, after a conversation with combo ${chatCombo}, tier multiplier ${chatMultiplier} and multiplier bonus ${chatMultiplierBonus}. Gold: ${oldGold} -> ${newGold}.`);
            logsChannel.send(`${message.author.tag} / ${message.author.id} won ${gold} gold for being the last to talk in general chat for ${chatContestTime} ${quantiseWords(chatContestTime, 'minute')}, after a conversation with combo ${chatCombo}, tier multiplier ${chatMultiplier} and multiplier bonus ${chatMultiplierBonus}. Gold: ${oldGold} -> ${newGold}.`);
        }
        lastMessage = null;
        chatCombo = 0;
    }
}

const quantiseWords = (count, singular, plural = singular + 's') => `${count !== 1 ? plural : singular}`;

exports.startupCheck = checkChatContest;
exports.newMessage = checkMessage;
exports.deleteMessage = deleteMessage;
