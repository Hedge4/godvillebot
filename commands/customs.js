const { EmbedBuilder } = require('discord.js');
const { prefix, botName, roles } = require('../configurations/config.json');
const getters = require('../index');
const logger = require('./features/logging');

const customCommands = {};
const categories = {};
let customsCollection;

function setup(collection) {
    customsCollection = collection;
    const promiseArray = [];

    // get all documents in the customCommands collection
    collection.listDocuments().then(documents => {
        documents.forEach(doc => {
            // get data of each document, save it by the document's id (the command name)
            promiseArray.push(doc.get().then(docData => {
                customCommands[doc.id] = docData.data();
            }));
        });

        // get our category lists when we've received all data
        Promise.all(promiseArray).then(() => {
            logger.log(`CUSTOMS: Loaded ${Object.keys(customCommands).length} commands!`);
            updateCategories();
        });
    });
}

function updateCategories() {
    // empty category object
    for (const key in categories) delete categories[key];

    // add each command name to a category array
    Object.keys(customCommands).forEach(command => {
        let category = customCommands[command].category;
        if (!category) category = 'Uncategorised';

        if (categories[category]) {
            // if defined, append to that array
            categories[category].push(command);
        } else {
            // otherwise, create new category array for this command
            categories[category] = [command];
        }
    });

    // now sort each category in ascending order
    Object.keys(categories).forEach(category => {
        categories[category] = categories[category].sort();
    });

    logger.log(`CUSTOMS: (Re)loaded ${Object.keys(categories).length} categories!`);
}

function runCommands(message, cmd, content) {
    if (cmd in customCommands) {
        // check if this is a custom command
        message.channel.send(customCommands[cmd].reply);
        return;
    }

    if (!['cc', 'customs', 'custom'].includes(cmd)) {
        // if this command doesn't have anything to do with this module, return
        return;
    }

    // get our module-specific command in lowercase for comparison
    const command = content.split(' ')[0].toLowerCase();
    content = content.slice(command.length + 1).trim();

    if (!command.length) {
        // if no arguments are given, show the available command categories
        showAllCustoms(message, content);
        return;
    }

    if (['show', 'list', 'category', 'showall', 'all'].includes(command)) {
        // other options for showing available categories/commands
        showAllCustoms(message, content);
        return;
    }

    // check admin perms for the other commands
    if (!message.member.roles.cache.has(roles.admin)) {
        message.reply('You need admin permissions for most customs-related commands.'
            + `\nDid you mean \`${prefix}customs list ${command}\` or \`${prefix}${command}\`?`);
        return;
    }

    // check the remaining commands, for which the user needs admin rights
    switch (command) {
        case 'show':
        case 'list':
        case 'category':
        case 'showall':
        case 'all':
            showAllCustoms(message, content);
            break;
        case 'categorise':
        case 'categorize':
            categorise(message, content);
            break;
        case 'rename':
            rename(message, content);
            break;
        case 'edit':
            edit(message, content);
            break;
        case 'create':
        case 'add':
            add(message, content);
            break;
        case 'delete':
        case 'remove':
            remove(message, content);
            break;
        default:
            message.reply(`${command} isn't a defined command!`);
            break;
    }

    message.react('✅');
}


function showAllCustoms(message, content) {
    // all lowercase to detect 'all', later make first letter uppercase for category matching
    let category = content.split(' ')[0].toLowerCase();
    const options = Object.keys(categories).sort();

    if (!category || !category.length) {
        // list options if no argument was given
        message.reply(`Specify one of these categories: \`${options.join('`, `')}\` or \`all\`.`
            + `\nMake sure to use \`${prefix}customs list [category]\``);
        return;
    }

    if (category === 'all') {
        // display all categories
        const embed = new EmbedBuilder()
            .setTitle('All custom commands')
            .setColor('3CB2E4')
            .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: getters.getClient().user.avatarURL() })
            .setTimestamp();

        options.forEach(option => {
            embed.addFields({ name: option, value: `${categories[option].join('\n')}`, inline: true });
        });

        logger.log(`${message.author.tag} viewed all custom commands categories in ${message.channel.name}.`);
        message.reply({ embeds: [embed] }).catch(e => logger.log(e));
        return;
    }

    // capitalise first letter for categories
    category = category.charAt(0).toUpperCase() + category.slice(1);

    if (!options.includes(category)) {
        // invalid category
        message.reply(`No commands are categorised as ${category}!`);
        return;
    }

    // display one category
    const embed = new EmbedBuilder()
        .setTitle(`Custom commands —> ${category}`)
        .setColor('3CB2E4')
        .setDescription(`${categories[category].join('\n')}`)
        .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: getters.getClient().user.avatarURL() })
        .setTimestamp();

    logger.log(`${message.author.tag} viewed custom commands category ${category} in ${message.channel.name}.`);
    message.reply({ embeds: [embed] }).catch(e => logger.log(e));
}

function edit(message, content) {
    // command is lowercase, rest of content isn't
    const command = content.split(' ')[0].toLowerCase();

    if (!customCommands[command]) {
        message.reply(`I don't know ${command} whoopsie`);
        return;
    }

    const newReply = content.slice(command.length + 1).trim();
    if (newReply.length > 200) {
        message.reply('Custom command reactions have an arbitrary limit of 200 characters!');
        return;
    }

    const docRef = customsCollection.doc(command);
    const oldReply = customCommands[command].reply;
    customCommands[command].reply = newReply;
    docRef.update({ reply: newReply });

    logger.log(`CUSTOMS: ${message.author.tag} edited ${command}:\`\`\`\n${oldReply}\n— — —\n${newReply}\`\`\``);
    message.reply('Done!');
}

function rename(message, content) {
    // both current and new command name should be lowercase
    content = content.toLowerCase();
    const command = content.split(' ')[0];
    const commandObj = customCommands[command];

    if (!commandObj) {
        message.reply(`I don't know ${command} whoopsie`);
        return;
    }

    const newName = content.slice(command.length + 1).trim().split(' ')[0];
    if (newName.length > 20) {
        message.reply('Custom command names have an arbitrary limit of 20 characters!');
        return;
    }

    // check if command doesn't exist already
    if (customCommands[newName]) {
        message.reply(`${newName} is already defined as a custom command!`);
        return;
    }

    const oldDocRef = customsCollection.doc(command);
    const newDocRef = customsCollection.doc(newName);

    oldDocRef.delete();
    newDocRef.set(commandObj);
    delete customCommands[command];
    customCommands[newName] = commandObj;

    updateCategories(); // name changed so update our categories
    logger.log(`CUSTOMS: ${message.author.tag} renamed ${command} to ${newName}.`);
    message.reply('Done!');
}

function categorise(message, content) {
    // commands and categories are always lowercase (categories have first letter made uppercase later)
    content = content.toLowerCase();
    const command = content.split(' ')[0];

    if (!customCommands[command]) {
        message.reply(`I don't know ${command} whoopsie`);
        return;
    }

    let newCategory = content.slice(command.length + 1).trim();
    newCategory = newCategory.charAt(0).toUpperCase() + newCategory.slice(1);

    if (newCategory.length > 20) {
        message.reply('Category names can\'t be longer than 20 characters!');
        return;
    }

    const docRef = customsCollection.doc(command);
    const oldCategory = customCommands[command].category;
    customCommands[command].category = newCategory;
    docRef.update({ category: newCategory });

    updateCategories(); // update the categories
    logger.log(`CUSTOMS: ${message.author.tag} (re)categorised ${command} from ${oldCategory} to ${newCategory}.`);
    message.reply(`Done, ${command} was moved from ${oldCategory} to ${newCategory}!`);
}

function remove(message, content) {
    // commands are always lowercase
    const command = content.split(' ')[0].toLowerCase();

    if (!customCommands[command]) {
        message.reply(`I don't know ${command} whoopsie`);
        return;
    }

    // delete both local and database object
    delete customCommands[command];
    const docRef = customsCollection.doc(command);
    docRef.delete();

    updateCategories(); // update the categories
    logger.log(`CUSTOMS: ${message.author.tag} deleted ${command}.`);
    message.reply(`Yoink, ${command} has been deleted!`);
}

function add(message, content) {
    // commands are always lowercase
    const command = content.split(' ')[0].toLowerCase();

    if (command.length > 20) {
        message.reply('Custom command names have an arbitrary limit of 20 characters!');
        return;
    }

    // check if command doesn't exist already
    if (customCommands[command]) {
        message.reply('This custom command is already defined!');
        return;
    }

    const cmdReply = content.slice(command.length + 1).trim();
    if (cmdReply.length > 200) {
        message.reply('Custom command reactions have an arbitrary limit of 200 characters!');
        return;
    }

    // create a new object that's uncategorised by default
    const newCommand = { category: null, reply: cmdReply };
    const docRef = customsCollection.doc(command);

    customCommands[command] = newCommand;
    docRef.set(newCommand);

    updateCategories(); // update the categories
    logger.log(`CUSTOMS: ${message.author.tag} added ${command} with reply:\`\`\`\n${cmdReply}\`\`\``);
    message.reply('Done!');
}


exports.run = runCommands;
exports.setup = setup;
