const { channels, botName, clientId } = require('../../configurations/config.json');
const logger = require('../features/logging');

let tableState = '';

// triggers the bot reacts to, and their possible reactions
// sorted by priority, as some are deactivated if a higher priority event sent a message
const reactionEvents = Object.values({
    // object for clarity, but converted to array
    DoubleFlip: {
        active(message) {
            // check channel before changing state
            if (channels.botServer.general !== message.channel.id) return false;

            // active if (final) state in message is not the same as the current state
            const oldTableState = tableState;
            const matches = message.content.match(/(┬─+┬|┻━+┻)/g);
            if (!matches) return false; // triggers haven't been checked yet at this point
            tableState = matches.pop(); // take last occurrence
            return oldTableState[0] === tableState[0]; // compare first leg of table so length doesn't matter
        },
        // active() already checks all conditions
        triggers: [
            { value: /┬─+┬/, isRegex: true },
            { value: /┻━+┻/, isRegex: true },
        ],
        reactions: [
            'OI HOW DARE YOU YA DOUBLE-FLIPPIN\' BASTARD',
        ],
    }, Unflip: {
        active() { return true; },
        enabled: [channels.botServer.general],
        chance: 0.3,
        executeAfter() {
            tableState = '┬─┬';
        },
        triggers: [
            { value: /┻━+┻/, isRegex: true },
            // { value: '(╯°□°)╯︵ ┻━┻' },
        ],
        reactions: [
            '┬─┬ノ( º _ ºノ)',
        ],
    }, Flip: {
        active() { return true; },
        enabled: [channels.botServer.general],
        chance: 0.1,
        executeAfter() {
            tableState = '┻━┻';
        },
        triggers: [
            { value: /┬─+┬/, isRegex: true },
            // { value: '┬─┬ノ( º _ ºノ)' },
        ],
        reactions: [
            '(╯°□°)╯︵ ┻━┻',
        ],
    }, Spookmode: {
        active() { return (new Date).getMonth() === 9; }, // only in October for Halloween
        ignoreBotPings: true, // no reaction if bot was pinged
        noDoubleReactions: true, // no reaction if another text reaction was sent already
        cooldown: { delay: 42 * 1000 }, // 42 seconds
        alternativeReaction: '🎃',
        disabled: [channels.venting, channels.appeals, channels.politicsDebate, channels.wholesome, channels.writing, '1020381945714200596'],
        triggers: [
            { value: 'spook' },
            { value: 'monster' },
            { value: /\bscar(e|y)/, isRegex: true },
            { value: 'jumpscare' },
            { value: 'horror' },
            { value: 'horrify' },
            { value: 'terror' },
            { value: 'terrify' },
            { value: 'scream' },
            { value: 'skeleton' },
            { value: 'creepy' },
            { value: /jack.o.{0,2}lantern/, isRegex: true },
            { value: 'ghost' },
            { value: 'vampire' },
            { value: 'werewolf' },
            { value: 'zombie' },
            { value: 'fright' },
            { value: 'halloween' },
            { value: /\b(be)?witch/, isRegex: true },
            { value: 'spider' },
            { value: 'skull' },
            { value: 'fear' },
            { value: 'mummy' },
            { value: 'trick or treat' },
            { value: 'wicked' },
            { value: 'soul' },
            { value: /\bboo(\b|o)/, isRegex: true },
            { value: 'haunt' },
            { value: /dea(d|th)/, isRegex: true },
            { value: /\bgermans?\b/, isRegex: true },
            { value: /\bd?evil\b/, isRegex: true },
            { value: /\bsatan\b/, isRegex: true },
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
            'https://i.pinimg.com/originals/8f/a8/c2/8fa8c22a2c6ceff2592920c83589bec7.gif',
            'https://images.squarespace-cdn.com/content/v1/59396fee59cc6877bacf5ab5/1666713542891-TZI9IXZQK0RHYXPSGLCA/pumpkins-halloween.gif',
            'https://tenor.com/view/halloween-anime-cute-girls-twins-gif-26942686',
            'https://tenor.com/view/halloween-jack-o-lantern-gif-7267670644237174261',
            'https://tenor.com/view/tonight-see-you-moon-gif-13604557',
            'https://tenor.com/view/costume-cat-lady-love-fashion-gif-23841593',
            'https://tenor.com/view/muppets-kermit-fangs-vampire-twilight-gif-22289479',
            'https://tenor.com/view/happy-halloween-halloween-music-halloween-party-rock-and-roll-gif-12790075',
            'https://tenor.com/view/halloween-dancing-pumpkin-dancing-pumpkin-character-october31_st-gif-22667829',
        ],
    }, Christmas: {
        active() {
            // only active 24-26 December
            const isDecember = (new Date).getMonth() === 11; // 0-based
            const today = (new Date).getDate();
            const correctDays = today >= 24 && today <= 26; // 1-based
            return isDecember && correctDays;
        },
        ignoreBotPings: true, // no reaction if bot was pinged
        noDoubleReactions: true, // no reaction if another text reaction was sent already
        cooldown: { delay: 42 * 1000 }, // 42 seconds
        alternativeReaction: '1040373925407891468',
        disabled: [channels.venting, channels.appeals, channels.politicsDebate, channels.wholesome, channels.writing, '1020381945714200596'],
        triggers: [
            { value: /\bgermans?\b/, isRegex: true },
            { value: /\bchrist(mas)?\b/, isRegex: true },
            { value: 'xmas' },
            { value: 'holiday' },
            { value: 'gift' },
            { value: 'santa' },
            { value: 'mistletoe' },
            { value: 'festiv' },
            { value: 'decoration' },
            { value: 'holiday' },
            { value: /\bpresents?\b/, isRegex: true },
            { value: 'santa' },
            { value: 'winter wonderland' },
            { value: 'jolly' },
            { value: 'celebrat' },
            { value: 'happy' },
            { value: 'happiness' },
            { value: 'carol' },
            { value: 'jesus' },
            { value: 'chimney' },
            { value: 'sleigh' },
            { value: 'noel' },
            { value: 'light' },
            { value: 'stocking' },
            { value: 'candy cane' },
            { value: /\beve\b/, isRegex: true },
            { value: /\bel(f\b|v[^\b\s])/, isRegex: true },
            { value: 'grinch' },
            { value: 'snow' },
            { value: 'reindeer' },
            { value: 'red nose' },
            { value: 'saint' },
            { value: 'sinterklaas' },
            { value: 'boxing day' },
            { value: 'mistletoe' },
        ],
        reactions: [
            'https://giphy.com/gifs/cute-animal-mood-9JrvLb0fnrn7k1ZjhX',
            'https://giphy.com/gifs/cute-animal-mood-9JrvLb0fnrn7k1ZjhX',
            'https://tenor.com/view/happy-gif-24244592',
            'https://tenor.com/view/merry-christmas-dance-happy-thrilled-excited-gif-15889418',
            'https://tenor.com/view/sports-sportsmanias-emoji-animated-emojis-merry-christmas-gif-19449254',
            'https://tenor.com/view/santa-merry-christmas-merrychristmas-clause-gif-24266320',
            'https://tenor.com/view/christmas-tiny-love-cute-kitten-gif-24181504',
            'https://tenor.com/view/black-cat-christmas-tree-black-christmas-tree-black-cat-christmas-tree-black-cats-gif-15394966',
            'https://tenor.com/view/cat-viralhog-hanging-fall-christmas-tree-gif-19753294',
            'https://tenor.com/view/merry-christmas-tired-sleeping-christ-sleeping-christmas-gif-15888583',
            'https://tenor.com/view/macaulay-culkin-merry-christmas-ya-filthy-animal-gif-13110096',
            'https://tenor.com/view/xmas-ornaments-gif-19460358',
            'https://tenor.com/view/christmas-lights-merry-christmas-happy-xmas-santa-dino-christmas-sweater-gif-10513598',
            'https://tenor.com/view/dancing-eddie-davis-the-original-ironsanctuary-jamming-turning-gif-22614898',
            'https://tenor.com/view/christmas-cat-catmas-tree-shiny-gif-13136371',
            'https://tenor.com/view/cat-vs-ornament-cat-ornament-lights-christmas-gif-19575177',
            'https://tenor.com/view/cat-angry-merry-christmas-merry-shitmas-who-did-dat-gif-15798660',
            'https://tenor.com/view/chouette-santa-hat-gif-14143275',
            'https://tenor.com/view/mimi-migros-weihnachten-eule-augen-gif-15503830',
            'https://tenor.com/view/mickey-mouse-christmas-mickey-christmas-merry-christmas-gif-23890544',
            'https://tenor.com/view/christmas-kitty-gif-24173429',
            'https://media.discordapp.net/attachments/641185066927652865/1051481031494074448/image0.gif',
            'https://media.discordapp.net/attachments/641185066927652865/1051481745033269288/image0.gif',
            'https://media.discordapp.net/attachments/641185066927652865/1051481745440129104/image1.gif',
            'https://media.discordapp.net/attachments/639993830837321748/1051489701023977513/image0.gif',
            'https://media.discordapp.net/attachments/785479612079407114/1051491628688343130/image0.gif',
            'https://media.discordapp.net/attachments/785479612079407114/1051491629313310860/image2.gif',
            'https://media.discordapp.net/attachments/785479612079407114/1051491629623672975/image3.gif',
            'https://media.discordapp.net/attachments/785479612079407114/1051494110877462591/image2.gif',
            'https://media.discordapp.net/attachments/785479612079407114/1051494111250759790/image2.gif',
            'https://media.discordapp.net/attachments/785479612079407114/1051494111250759790/image2.gif',
            'https://media.discordapp.net/attachments/785479612079407114/1051494111733100594/image3.gif',
            'https://tenor.com/view/christmas-tree-spirit-gif-24013423',
            'https://tenor.com/view/christmas-tree-gif-27250258',
            'https://tenor.com/view/cat-christmas-flying-xmas-cat-gif-24247775',
            'https://tenor.com/view/merry-christmas-wrecking-ball-swing-gif-15821868',
            'https://tenor.com/view/christmas-christmas-tree-art-dancing-design-gif-25680336',
            'https://tenor.com/view/teletubbies-christmas-tree-dancing-dance-around-christmas-tree-dance-gif-24237600',
            'https://tenor.com/view/merry-christmas-spirit-dance-santa-gif-24675529',
            'https://tenor.com/view/canta-claus-merry-christmas-christmas-in-july-xmas-jokes-gif-12544215',
            'https://tenor.com/view/sinterklaas-dab-dabbing-gif-10429189',
            'https://tenor.com/view/cat-pop-pop-pop-pop-pop-popping-mouth-cap-popping-gif-19400424',
            'https://tenor.com/view/merry-christmas-everyone-santa-clause-south-park-christmas-snow-s23e10-gif-19313199',
        ],
    }, Innocent: {
        type: 'reaction',
        active() { return true; },
        disabled: [channels.venting, channels.appeals, channels.politicsDebate],
        triggers: [
            { value: 'innocent' },
        ],
        reactions: [
            '1028903377544958114',
        ],
    }, BotMention: {
        active() { return true; },
        ignoreBotPings: true, // no reaction if bot was pinged
        disabled: [channels.venting, channels.appeals],
        autoDelete: 5 * 1000, // 5 seconds
        triggers: [
            { value: botName.toLowerCase() },
            { value: 'goddessbot' },
            { value: 'godbot' },
        ],
        reactions: [
            'https://media2.giphy.com/media/KDQQcjwU0GBtcOecs9/giphy.gif',
            'https://media.tenor.com/wt6iR2MLYJAAAAAM/raven-nervous.gif',
            'https://media.tenor.com/mVPgKMQFIfsAAAAM/looking-around-guilty.gif',
            'https://66.media.tumblr.com/85649825a5392e8cd3d832a4ed1534f5/tumblr_njpy6zj5by1tq4of6o1_500.gif',
            'https://www.tingono.com/hs-fs/hubfs/Surprise!.gif',
        ],
    },
});


// react when someoene has a certain trigger in their message
function messageReactions(message) {
    let reactionMessageSent;

    for (const e of reactionEvents) {
        // if true, no reactions for messages in which the bot is pinged
        if (e.ignoreBotPings && RegExp(`<@!?${clientId}>`).test(message.content)) continue;

        // if true, no text reactions if another text reaction was sent already
        if (e.noDoubleReactions && reactionMessageSent) continue;

        // checkMessage returns true if a text message was sent
        reactionMessageSent = checkMessage(e, message) || reactionMessageSent;
    }
}

// test if this event should be triggered for this message
function checkMessage(reactionEvent, message) {
    // return if the event isn't active
    if (!reactionEvent.active(message)) return;

    // ignore channels where this feature is disabled
    if (reactionEvent.disabled) {
        if (reactionEvent.disabled.includes(message.channel.id)) return;
    } else if (reactionEvent.enabled) {
        // or the opposite mode, ignore if channel is not enabled
        if (!reactionEvent.enabled.includes(message.channel.id)) return;
    }

    // if the reaction has a specified chance to activate
    if (reactionEvent.chance && Math.random() > reactionEvent.chance) return;

    // return if the message doesn't contain one of the triggers
    const content = message.content.toLowerCase();
    if (!reactionEvent.triggers.some(trigger => testTrigger(trigger, content))) return;

    if (reactionEvent.cooldown) {
        // don't execute if reaction (for this channel) is on cooldown
        if (reactionEvent.cooldown[message.channel.id]) {
            // apply alternative reaction if set
            if (reactionEvent.alternativeReaction) {
                message.react(reactionEvent.alternativeReaction)
                    .catch(() => {
                        logger.log(`ERROR messageReactions: Could not apply alternative (cooldown) reaction ${reactionEvent.alternativeReaction}.`);
                    });
            }
            return;
        }
        // set a new cooldown (for this channel) if not on cooldown
        reactionEvent.cooldown[message.channel.id] = true;
        setTimeout(() => {
            reactionEvent.cooldown[message.channel.id] = false;
        }, reactionEvent.cooldown.delay);
    }

    const chosenReaction = reactionEvent.reactions[Math.floor(Math.random() * reactionEvent.reactions.length)];
    // execute a function after the reaction, if defined
    if (reactionEvent.executeAfter) reactionEvent.executeAfter();

    // react to the message with either a reaction or a message
    if (reactionEvent.type === 'reaction') {
        message.react(chosenReaction)
            .catch(() => {
                logger.log(`ERROR messageReactions: Could not apply reaction ${chosenReaction}.`);
            });
    } else {
        const autoDelete = chosenReaction.autoDelete || reactionEvent.autoDelete; // object property has priority, falsy if both are undefined
        const reactionContent = chosenReaction.value || chosenReaction; // value property if object, else it's the string itself

        message.channel.send(reactionContent).then(msg => {
            // if defined, delete the message after autoDelete milliseconds
            if (!autoDelete) return;
            setTimeout(() => {
                msg.delete().catch(/* do nothing */);
            }, autoDelete);
        });

        // return true if a (text) reaction was sent
        return true;
    }
}

const customEmojiRegex = /<[^:>\s]*:[^:>\s]+:\d+>/g; // filter out custom emojis
const mentionRegex = /<(?:@(?:!|&)?|#)\d+>/g; // filter out member, person and channel mentions
const urlRegex = /(?:ht|f)tps?:\/\/([!#$&-;=?-[\]_a-z~]|%[0-9a-f]{2})+/ig; // filter out links
function testTrigger(trigger, content) {
    const triggerValue = trigger.value || trigger; // value property if object, else 'trigger' is a string

    const filteredContent = content.replace(customEmojiRegex, '').replace(mentionRegex, '').replace(urlRegex, '');
    if (trigger.isRegex) {
        return triggerValue.test(filteredContent);
    } else { return filteredContent.includes(triggerValue); }
}

module.exports = messageReactions;
