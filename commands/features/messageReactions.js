// triggers the bot reacts to, and their possible reactions
const reactionEvents = [

{
    name: 'Spookmode',
    active: true,
    triggers: ['spook', 'scare', 'scary', 'horror', 'horrify', 'terror', 'terrify', 'scream', 'skeleton',
    'creepy', 'boo', 'ghost', 'vampire', 'nito', 'werewolf', 'zombie', 'fright', 'halloween', 'racism', 'witch'],
    reactions: ['https://c.tenor.com/EaQlLgHY9dwAAAAM/pumpkins-pumpkin.gif',
    'https://c.tenor.com/uDCPw_UdZOoAAAAM/skeleton-dance.gif',
    'https://c.tenor.com/SmKGlfj3-b8AAAAM/spooky-scary.gif',
    'https://c.tenor.com/YeQWMRS0lO8AAAAM/me-dance.gif',
    'https://c.tenor.com/Y8IBqhQ5A5sAAAAM/skeleton-cartoon.gif',
    'https://c.tenor.com/zaAohlKdikYAAAAM/music-xylophone.gif',
    'https://c.tenor.com/8k9yFg-2jrgAAAAM/halloween-pumpkin.gif',
    'https://c.tenor.com/f1pfRCozhwkAAAAM/halloween-dance.gif',
    'https://c.tenor.com/wbMvvdjxdLwAAAAM/pumpkin-dancing.gif',
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
    'https://tenor.com/view/pennywise-it-scary-smile-gif-12240248'],
},

];


// react when someoene has a certain trigger in their message
function messageReactions(message) {
    reactionEvents.forEach(e => {
        testTrigger(e, message);
    });
}

// test whether a message
function testTrigger(reactionEvent, message) {
    if (reactionEvent.active) {
        const content = message.content.toLowerCase();
        if (reactionEvent.triggers.some((e) => content.includes(e))) {
            message.channel.send(reactionEvent.reactions[Math.floor(Math.random() * reactionEvent.reactions.length)]);
        }
    }
}

module.exports = messageReactions;