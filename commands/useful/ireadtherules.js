const { prefix, roles, channels, serversServed } = require('../../configurations/config.json');
const getters = require('../../index');
const logger = require('../features/logging');
const defaultRoles = [roles.deities, roles.eventping, roles.arena, roles.data, roles.dungeon, roles.ideabox, roles.newspaper, roles.sail];

async function main(message) {
    // ignore if channel isn't botville
    if (message.channel.id !== channels.botville) return;

    // ignore if user already has Deities or admin role
    if (message.member.roles.cache.has(roles.deities) || message.member.roles.cache.has(roles.admin)) return;

    // get member object to add roles to
    const client = getters.getClient();
    const gvServer = client.guilds.cache.get(serversServed.godvilleServer);
    const newMember = await gvServer.members.fetch(message.author.id).catch(() => { /*do nothing*/ });
    if (!newMember) return;

    // attempt to add default roles
    let rolesFailed = false;
    await newMember.roles.add(defaultRoles).catch(error => {
        rolesFailed = true;
        logger.log(`ERROR NewMember: Failed to add default roles to ${message.author.tag}.`);
        logger.log(error);
    });

    message.channel.send(
        `Welcome to Godville, <@${message.author.id}>, and thank you for reading the rules! We have a lot of channels in this server, so in order to keep you from getting overwhelmed we've made it so you can pick which channels you'd like to see while keeping the others hidden. We've already given you access to server and Godville related channels. Do you want to hide these channels, or gain access to other channels that might interest you? Head over to <#${channels.reactionRoles}>!`

        + `\n\n<:r_godvoice:313795720123514880> Consider changing your server nickname to your godname, so people can recognise you more easily! Want to link your Godville profile to your Discord? Use \`${prefix}link\` followed by the URL to your Godville profile or your godname. Check the other commands our custom bot has with the \`${prefix}help\` command!`

        + '\n\n<:ms_milestone:441043753088712704> Enjoy the server! <:ms_gv_logo:313789584720789505>',
    );

    if (rolesFailed) {
        message.channel.send(`<@&${roles.admin}> Something went wrong while adding default server roles, please assign them manually.`);
    }
}

module.exports = main;