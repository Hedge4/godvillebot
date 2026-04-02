const { channels } = require('../../configurations/config.json');
const logger = require('./logging');

const badvilleChannelId = channels.badville;
const mutedRole = '1488704245648850984';
const bananaHammerEmoji = 'a_bananahammer:399054359343792141';
const bannedEmoji = 'a_banned:1488668149518831738';

// Avoid duplicate unmutes
const activeMutes = new Map();

// Check if a message contains the letter 'e' or similar characters
function hasLetterE(text) {
    let cleanText = text.replace(/<a?:[^:>\s]+:\d+>/g, '');
    cleanText = cleanText.replace(/<(?:@(?:!|&)?|#)\d+>/g, '');
    // VERY aggressive E detection - it's a very bad letter and we must be as thorough as possible in preventing evildoers from finding ways to sneak it in. Includes Latin, Greek, Cyrillic, Phonetic, Math, Currency, and Leet speak variations
    const eRegex = /[eèéêëēĕėęěȅȇȩḙḛḝẹẻẽếềểễệɛεеёє€℮ℯℇ℈∃∄∈∉∊3ǝə∑Σæœₑᵉⅇ³ЭЗえ]/i;
    return eRegex.test(cleanText);
}

// Mute user, add reaction(s), schedule unmute
async function muteUser(message, durationSeconds, addBannedEmoji = false) {
    const member = message.member;
    if (!member.manageable) return;
    if (member.user.bot) return;

    try {
        // Add banned emojis
        if (addBannedEmoji) message.react(bannedEmoji).catch(() => { /* Do nothing */ });
        message.react(bananaHammerEmoji).catch(() => { /* Do nothing */ });

        // Schedule removing temporary emoji
        setTimeout(async () => {
            try {
                // Fetch message to ensure reactions are populated in cache for v14
                const refetchedMessage = await message.fetch().catch(() => null);
                const reaction = refetchedMessage?.reactions.cache.find(r => r.emoji.name === 'a_bananahammer' || r.emoji.id === '399054359343792141');
                if (reaction) {
                    await reaction.users.remove(message.client.user.id);
                }
            } catch (_) { /* Do nothing */ }
        }, durationSeconds * 1000);

        // Detect duplicate mutes, keep the longest one
        const expiresAt = Date.now() + durationSeconds * 1000;
        if (activeMutes.has(member.id)) {
            const existingMute = activeMutes.get(member.id);
            if (expiresAt > existingMute.expiresAt) {
                // Cancel existing unmute timeout
                clearTimeout(existingMute.timeout);
                logger.log(`BadVille: Removed existing mute for ${message.author.tag} (${member.id}) to apply longer mute of ${durationSeconds} seconds.`);
            } else {
                // Existing mute is longer, skip this one
                logger.log(`BadVille: Skipped mute for ${message.author.tag} (${member.id}) as existing mute is longer.`);
                return;
            }
        }

        // Schedule unmute
        const muteTimeout = setTimeout(async () => {
            try {
                const refetchedMember = await message.guild.members.fetch(member.id).catch(() => null);
                if (refetchedMember && refetchedMember.manageable) {
                    await refetchedMember.roles.remove(mutedRole);
                }

                logger.log(`BadVille: Unmuted ${message.author.tag} (${member.id}) after ${durationSeconds} seconds.`);
            } catch (e) {
                logger.log(`BadVille: Error unmuting ${message.author.tag}: ${e.message}`);
            } finally {
                // Remove from active mutes
                activeMutes.delete(member.id);
            }
        }, durationSeconds * 1000);
        logger.log(`BadVille: Muted ${message.author.tag} (${member.id}) for ${durationSeconds} seconds${addBannedEmoji ? ' (contained letter e)' : ' (random 80% chance)'}.`);

        // Add muted role
        await member.roles.add(mutedRole);

        // Track mute
        activeMutes.set(member.id, {
            expiresAt,
            timeout: muteTimeout,
        });
    } catch (error) {
        logger.log(`BadVille: Error muting ${message.author.tag}: ${error.message}`);
        activeMutes.delete(member.id);
    }
}

// Handle messages in badville
async function handleBadvilleMessage(message) {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) {
        return;
    }

    // Only handle messages in badville channel
    if (message.channel.id !== badvilleChannelId) {
        return;
    }

    // Check for letter 'e' (5 minute mute + banned emoji)
    if (hasLetterE(message.content)) {
        await muteUser(message, 5 * 60, true);
        return;
    }

    // 80% chance of random mute (15-60 seconds)
    const randomChance = Math.random();
    if (randomChance < 0.8) {
        const muteSeconds = Math.floor(Math.random() * 46) + 15;
        await muteUser(message, muteSeconds, false);
    }
}

async function handleBadvilleMessageEdit(newMessage) {
    // Ignore bots and DMs
    if (newMessage.author.bot || !newMessage.guild) {
        return;
    }

    // Only handle messages in badville channel
    if (newMessage.channel.id !== badvilleChannelId) {
        return;
    }

    // Check for letter 'e' (5 minute mute + banned emoji)
    if (hasLetterE(newMessage.content)) {
        await muteUser(newMessage, 5 * 60, true);
        return;
    }
}

exports.handleBadvilleMessage = handleBadvilleMessage;
exports.handleBadvilleMessageEdit = handleBadvilleMessageEdit;
