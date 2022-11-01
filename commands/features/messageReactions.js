const { channels } = require('../../configurations/config.json');

// triggers the bot reacts to, and their possible reactions
const reactionEvents = [
    {
        name: 'Spookmode',
        active() { return (new Date).getMonth() === 9; }, // only in October
        disabled: [channels.venting, channels.appeals, channels.politicsDebate, channels.wholesome, channels.writing, '1020381945714200596'],
        triggers: [
            { name: 'spook', isRegex: false },
            { name: /\bscar(e|y)/, isRegex: true },
            { name: 'scary', isRegex: false },
            { name: 'horror', isRegex: false },
            { name: 'horrify', isRegex: false },
            { name: 'terror', isRegex: false },
            { name: 'terrify', isRegex: false },
            { name: 'scream', isRegex: false },
            { name: 'skeleton', isRegex: false },
            { name: 'creepy', isRegex: false },
            { name: 'pumpkin', isRegex: false },
            { name: 'ghost', isRegex: false },
            { name: 'vampire', isRegex: false },
            { name: 'werewolf', isRegex: false },
            { name: 'zombie', isRegex: false },
            { name: 'fright', isRegex: false },
            { name: 'halloween', isRegex: false },
            { name: /\b(be)?witch/, isRegex: true },
            { name: 'spider', isRegex: false },
            { name: 'skull', isRegex: false },
            { name: 'fear', isRegex: false },
            { name: 'mummy', isRegex: false },
            { name: 'trick or treat', isRegex: false },
            { name: 'wicked', isRegex: false },
            { name: 'soul', isRegex: false },
            { name: /\bboo\b/, isRegex: true },
            { name: 'haunt', isRegex: false },
            { name: /dea(d|th)/, isRegex: true },
            { name: /\bgermans?\b/, isRegex: true },
            { name: /\bd?evil\b/, isRegex: true },
            { name: /\bsatan\b/, isRegex: true },
        ],
        reactions: [
            'https://c.tenor.com/EaQlLgHY9dwAAAAM/pumpkins-pumpkin.gif',
            'https://c.tenor.com/uDCPw_UdZOoAAAAM/skeleton-dance.gif',
            'https://c.tenor.com/SmKGlfj3-b8AAAAM/spooky-scary.gif',
            'https://c.tenor.com/YeQWMRS0lO8AAAAM/me-dance.gif',
            'https://c.tenor.com/Y8IBqhQ5A5sAAAAM/skeleton-cartoon.gif',
            'https://c.tenor.com/zaAohlKdikYAAAAM/music-xylophone.gif',
            'https://c.tenor.com/8k9yFg-2jrgAAAAM/halloween-pumpkin.gif',
            'https://c.tenor.com/f1pfRCozhwkAAAAM/halloween-dance.gif',
            'https://c.tenor.com/p5lu_-ZRz1kAAAAM/halloween-happy-halloween.gif',
            'https://c.tenor.com/y91zil0e_cIAAAAM/spooky-spooktober.gif',
            'https://c.tenor.com/BFa7avN8704AAAAM/scooby-doo-ghost.gif',
            'https://c.tenor.com/kzg4ltFT3DUAAAAM/halloween-costume-halloween.gif',
            'https://c.tenor.com/0VDOCNBNGRYAAAAM/pumpkin-halloween.gif',
            'https://c.tenor.com/SC7uzUof0CIAAAAM/good-morning.gif',
            'https://c.tenor.com/5sLtZKdCpuAAAAAM/charlie-brown-halloween.gif',
            'https://c.tenor.com/ygHZpGppN-AAAAAM/charlie-brown-charlie.gif',
            'https://c.tenor.com/D9c5rJLXeX4AAAAM/peanuts-pumpkin.gif',
            'https://c.tenor.com/goiub_JGR4IAAAAM/dog-chuky.gif',
            'https://c.tenor.com/hPm6cOQLwiwAAAAM/trick-or-treat-halloween.gif',
            'https://c.tenor.com/UJDSkhrX7dQAAAAM/skeleton-cartoon.gif',
            'https://c.tenor.com/j0cFtSAFgMcAAAAM/skeleton-dance.gif',
            'https://c.tenor.com/Tibn6ocZqWMAAAAM/skeleton.gif',
            'https://c.tenor.com/D-0Km1XZdg4AAAAM/halloween-skeleton.gif',
            'https://c.tenor.com/fkSDYzvj-YAAAAAM/trickortreat-candy.gif',
            'https://c.tenor.com/r5ciOAcH744AAAAM/alex-geerken-geerken.gif',
            'https://giphy.com/gifs/scoobydoo-cartoon-scooby-doo-xUOwG2okEttn63fAdi',
            'https://giphy.com/gifs/scoobydoo-cartoon-scooby-doo-d3YHjeWGX9iem9Ww',
            'https://giphy.com/gifs/scoobydoo-cartoon-scooby-doo-3o7WIHXhUvghR1UPKw',
            'https://giphy.com/gifs/4TgADFrAKzq2wKyomS',
            'https://giphy.com/gifs/1msH9EAiebErjjvnFh',
            'https://c.tenor.com/VAMMQgYaBxAAAAAM/ghostbusters-slimer.gif',
            'https://c.tenor.com/tyLLgTXgnUAAAAAM/ghostbusters-saw.gif',
            'https://c.tenor.com/ZdT_2uHCn68AAAAM/ghostbusters-hey-anybody-see-a-ghost.gif',
            'https://c.tenor.com/PJeAlsCltpAAAAAM/ghosts-paranormal.gif',
            'https://c.tenor.com/G45tmoDDWu8AAAAM/mickey-mouse-the-haunted-house.gif',
            'https://c.tenor.com/sEdtSYw_r6cAAAAM/kermit-frog.gif',
            'https://c.tenor.com/XPxNNs64OjoAAAAM/pumpkin-dance.gif',
            'https://c.tenor.com/jKT9mRO-Cy8AAAAM/mickeymouse-hauntedhouse.gif',
            'https://c.tenor.com/pumlhVq14NgAAAAM/halloween-debate.gif',
            'https://c.tenor.com/urENiUnyq4gAAAAM/bongo-halloween.gif',
            'https://c.tenor.com/BD-m_yxL_poAAAAM/halloween-salem.gif',
            'https://c.tenor.com/u55xQXaz1yQAAAAM/halloween-cat-hiss.gif',
            'https://c.tenor.com/5Rf5B1Ji82sAAAAM/garfield-odie.gif',
            'https://c.tenor.com/gu7EeXlMQHcAAAAM/trick-or-treat-viralhog.gif',
            'https://c.tenor.com/MU43d6h7sU4AAAAM/beavis-and-butthead-trick-or-treat.gif',
            'https://c.tenor.com/XtmjyV8L2jQAAAAM/dog-dogs-cute-puppy-halloween.gif',
            'https://c.tenor.com/J073fUtEMPoAAAAM/muumy-costume-the-pet-collective.gif',
            'https://c.tenor.com/QYgKCI3yZHgAAAAM/halloween-dog.gif',
            'https://c.tenor.com/xgKBJ-1YizgAAAAM/happy-halloween-dance.gif',
            'https://c.tenor.com/HMpEb9MPCUIAAAAM/halloween-mickey.gif',
            'https://c.tenor.com/3k644Yo8pfwAAAAM/skeleton-mickeymouse.gif',
            'https://c.tenor.com/6lU3BX5Lc_IAAAAM/pelo-spooky.gif',
            'https://c.tenor.com/NlYGh72i9rMAAAAM/lol-hahaha.gif',
            'https://c.tenor.com/-qYc88iSc9gAAAAM/huey-luey-and-duey-halloween.gif',
            'https://c.tenor.com/_0zRWyx38OYAAAAM/pumpkin-spice.gif',
            'https://c.tenor.com/jNn7kck6cYYAAAAM/the-office.gif',
            'https://tenor.com/view/pennywise-it-scary-smile-gif-12240248',
            'https://cdn.discordapp.com/attachments/872456115676393512/1024788384692047932/image0.gif',
            'https://cdn.discordapp.com/attachments/872456115676393512/1024788447929577552/image0.gif',
            'https://tenor.com/view/imagen-animada-gif-18874126',
            'https://tenor.com/view/horror-gif-5045237',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTC39EgG5Mpeh3XIOzyVRLypp_BKq3nIbRlug',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUTh_Yt30tjEyG5kkNyBgKwXfefNlfrqiKJQ',
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTju30MOyVsDNZSF8mtRUFNpi4zX7AeOiXHng',
            'https://tenor.com/view/pumpkin-gif-23554708',
            'https://tenor.com/view/fall-autumn-goodmorning-morning-season-gif-23324284',
            'https://tenor.com/view/ghost-gif-13060487',
            'https://tenor.com/view/heinzel-satanic-ritual-gif-17325845',
            'https://tenor.com/view/skeleton-skull-gif-18854593',
            'https://tenor.com/view/afraid-scared-spongebob-nightmare-anxious-gif-17742018',
        ],
    },
];


// react when someoene has a certain trigger in their message
function messageReactions(message) {
    // no message reactions for messages in which the bot is pinged
    if (/<@!?666851479444783125>/.test(message.content)) return;

    reactionEvents.forEach(e => {
        testTrigger(e, message);
    });
}

// test whether a message
function testTrigger(reactionEvent, message) {
    if (reactionEvent.active) {
        // ignore channels where this feature is disabled
        if (reactionEvent.disabled) {
            if (reactionEvent.disabled.includes(message.channel.id)) return;
        } else if (reactionEvent.enabled) {
            // or the opposite mode, ignore if channel is not enabled
            if (!reactionEvent.disabled.includes(message.channel.id)) return;
        }
        const content = message.content.toLowerCase();
        if (reactionEvent.triggers.some((e) => {

            const customEmojiRegex = /<[^:>\s]*:[^:>\s]+:\d+>/g; // filter out custom emojis
            const mentionRegex = /<(?:@(?:!|&)?|#)\d+>/g; // filter out member, person and channel mentions
            const urlRegex = /(?:ht|f)tps?:\/\/([!#$&-;=?-[\]_a-z~]|%[0-9a-f]{2})+/ig; // filter out links
            const filteredContent = content.replace(customEmojiRegex, '').replace(mentionRegex, '').replace(urlRegex, '');

            if (e.isRegex) {
                return e.name.test(filteredContent);
            } else { return filteredContent.includes(e.name); }
        })) {
            message.channel.send(reactionEvent.reactions[Math.floor(Math.random() * reactionEvent.reactions.length)]);
        }
    }
}

module.exports = messageReactions;
