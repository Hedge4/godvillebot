const { EmbedBuilder } = require('discord.js');
const { prefix, botName } = require('../../configurations/config.json');
const logger = require('../../features/logging.js');


async function main(client, message, content) {
    const args = /(\d+)\s+#?([a-f\d]{6})/.exec(content);
    if (!args) {
        message.reply(`Your input was invalid. Correct syntax:\n\`${prefix}roleColour <roleId> <hex colour code>\``);
        return;
    }

    const role = await message.guild.roles.fetch(args[1]).catch(console.error);
    if (!role) {
        message.reply(`This server doesn't have a role with id ${args[1]}.`);
        return;
    }

    const oldColour = role.hexColor;
    await role.setColor(args[2]).catch(e => {
        message.reply(`Something went wrong, I probably don't have permissions to change the colour of \`${role.name}\`. ${e}`);
        logger.log(`${message.author.tag} tried to change the role colour of '${role.name}', but I didn't have permissions.`);
        return;
    });

    const resEmbed = new EmbedBuilder()
        .setColor(args[2])
        .setTitle(`Updated role ${role.name} :white_check_mark:`)
        .setDescription(`Changed colour from ${oldColour} to #${args[2]}.`)
        .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: client.user.avatarURL() })
        .setTimestamp();
    message.reply({ embeds: [resEmbed] });
    logger.log(`${message.author.tag} changed the role colour of '${role.name}' from ${oldColour} to #${args[2]}.`);
}


module.exports = main;