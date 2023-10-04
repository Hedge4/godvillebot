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
    const subcommandsList = `Available subcommands: \`${prefix}cc list\`, \`${prefix}cc categorise\`, \`${prefix}cc rename\`, \`${prefix}cc edit\`, \`${prefix}cc add\`, \`${prefix}cc delete\``;
    const isAdmin = message.member.roles.cache.has(roles.admin);

    // check if command is too long
    if (command.length > 20) {
        message.reply('That subcommand/category seems too long...');
        return;
    }

    // if no subcommand is specified, show available subcommands
    if (!command.length) {
        // for admins, list available subcommands in the message
        showAllCustoms(message, '', isAdmin ? subcommandsList : '');
        return;
    }

    // ADMIN PERMS check (these commands require admin perms)
    if (isAdmin) {
        switch (command) {
            case 'categorise':
            case 'categorize':
                categorise(message, content);
                return;
            case 'rename':
                rename(message, content);
                return;
            case 'edit':
                edit(message, content);
                return;
            case 'create':
            case 'add':
                add(message, content);
                return;
            case 'delete':
            case 'remove':
                remove(message, content);
                return;
        }
    }

    // check for 'list' command type
    if (['show', 'list', 'category', 'all', 'showall'].includes(command)) {
        // other options for showing available categories/commands
        showAllCustoms(message, content);
        return;
    }

    // check if user specified a category to show
    const possibleCategory = command.charAt(0).toUpperCase() + command.slice(1); // capitalise first letter
    if (Object.keys(categories).includes(possibleCategory)) {
        // if yes, pass it to showAllCustoms
        showAllCustoms(message, possibleCategory);
        return;
    }

    // if not returned yet, input isn't a valid command or category
    message.reply(`"${command}" isn't a valid subcommand, category, or only works for admins! ${isAdmin ? subcommandsList : ''}`
        + `\nDid you mean \`${prefix}cc list ${possibleCategory}\` or \`${prefix}${command}\`?`);
}


function showAllCustoms(message, content, explanationMessage = '') {
    // all lowercase to detect 'all', later make first letter uppercase for category matching
    let category = content.split(' ')[0].toLowerCase();
    const options = Object.keys(categories).sort(); // sort alphabetically

    if (!category || !category.length) {
        // list options if no argument was given, then show all categories
        if (!explanationMessage) explanationMessage = `You can specify one of these categories: \`${options.join('`, `')}\` or \`all\`.\nMake sure to use \`${prefix}customs list [category]\``;
        category = 'all';
    }

    if (category === 'all') {
        // display all categories
        const embed = new EmbedBuilder()
            .setTitle('All custom commands')
            .setColor('3CB2E4')
            .setFooter({ text: `${botName} is brought to you by Wawajabba`, iconURL: getters.getClient().user.avatarURL() })
            .setTimestamp();

        // sort categories from most to least commands
        options.sort((keyA, keyB) => {
            if (categories[keyA].length > categories[keyB].length) return -1;
            if (categories[keyA].length < categories[keyB].length) return 1;
            return 0;
        });

        options.forEach(option => {
            embed.addFields({ name: option, value: `${categories[option].join('\n')}`, inline: true });
        });

        logger.log(`${message.author.tag} viewed all custom commands categories in ${message.channel.name}.`);
        // if set, attach explanation message
        if (explanationMessage) message.reply({ content: explanationMessage, embeds: [embed] }).catch(e => logger.log(e));
        else message.reply({ embeds: [embed] }).catch(e => logger.log(e));
        return;
    }

    // capitalise first letter to use as index for the categories array
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
    if (!command) {
        message.reply('You need to specify a custom command to edit!');
        return;
    }

    if (!customCommands[command]) {
        message.reply(`I don't know \`${prefix}${command}\` whoopsie`);
        return;
    }

    const newReply = content.slice(command.length + 1).trim();
    if (!newReply) {
        message.reply(`You need to specify a new bot response for \`${prefix}${command}\`!`);
        return;
    }
    if (newReply.length > 200) {
        message.reply('Custom command reactions have an arbitrary limit of 200 characters!');
        return;
    }

    const docRef = customsCollection.doc(command);
    const oldReply = customCommands[command].reply;
    customCommands[command].reply = newReply;
    docRef.update({ reply: newReply });

    logger.toChannel(`CUSTOMS: ${message.author.tag} edited ${prefix}${command}:\`\`\`\n${oldReply}\n— — —\n${newReply}\`\`\``);
    logger.toConsole(`CUSTOMS: ${message.author.tag} edited ${prefix}${command}:\n${oldReply}\n— — —\n${newReply}`);
    message.reply('Done!');
}

function rename(message, content) {
    // both current and new command name should be lowercase
    content = content.toLowerCase();
    const command = content.split(' ')[0];
    if (!command) {
        message.reply('You need to specify a custom command to rename!');
        return;
    }
    const commandObj = customCommands[command];

    if (!commandObj) {
        message.reply(`I don't know \`${prefix}${command}\` whoopsie`);
        return;
    }

    const newName = content.slice(command.length + 1).trim().split(' ')[0];
    if (!newName) {
        message.reply(`You need to specify a new name for \`${prefix}${command}\`!`);
        return;
    }
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
    logger.log(`CUSTOMS: ${message.author.tag} renamed ${prefix}${command} to ${newName}.`);
    message.reply('Done!');
}

function categorise(message, content) {
    // commands and categories are always lowercase (categories have first letter made uppercase later)
    content = content.toLowerCase();
    const command = content.split(' ')[0];
    if (!command) {
        message.reply('You need to specify a custom command to categorise!');
        return;
    }

    if (!customCommands[command]) {
        message.reply(`I don't know \`${prefix}${command}\` whoopsie`);
        return;
    }

    let newCategory = content.slice(command.length + 1).trim();
    newCategory = newCategory.charAt(0).toUpperCase() + newCategory.slice(1);
    if (!command) {
        message.reply(`You need to specify a new category for \`${prefix}${command}\`!`);
        return;
    }
    if (newCategory.length > 20) {
        message.reply('Category names can\'t be longer than 20 characters!');
        return;
    }

    const docRef = customsCollection.doc(command);
    const oldCategory = customCommands[command].category;
    customCommands[command].category = newCategory;
    docRef.update({ category: newCategory });

    updateCategories(); // update the categories
    logger.log(`CUSTOMS: ${message.author.tag} (re)categorised ${prefix}${command} from ${oldCategory} to ${newCategory}.`);
    message.reply(`Done, \`${prefix}${command}\` was moved from ${oldCategory} to ${newCategory}!`);
}

function remove(message, content) {
    // commands are always lowercase
    const command = content.split(' ')[0].toLowerCase();
    if (!command) {
        message.reply('You need to specify a custom command to delete!');
        return;
    }

    if (!customCommands[command]) {
        message.reply(`I don't know \`${prefix}${command}\` whoopsie`);
        return;
    }

    // delete both local and database object
    delete customCommands[command];
    const docRef = customsCollection.doc(command);
    docRef.delete();

    updateCategories(); // update the categories
    logger.log(`CUSTOMS: ${message.author.tag} deleted ${prefix}${command}.`);
    message.reply(`Yoink, \`${prefix}${command}\` has been deleted!`);
}

function add(message, content) {
    // commands are always lowercase
    const command = content.split(' ')[0].toLowerCase();
    if (!command) {
        message.reply('You need to specify a command name and a bot response for it!');
        return;
    }
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
    if (!cmdReply) {
        message.reply(`You need to specify a bot response for \`${prefix}${command}\`!`);
        return;
    }
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
    logger.toChannel(`CUSTOMS: ${message.author.tag} added ${prefix}${command} with reply:\`\`\`\n${cmdReply}\`\`\``);
    logger.toConsole(`CUSTOMS: ${message.author.tag} added ${prefix}${command} with reply:\n${cmdReply}`);
    message.reply('Done!');
}


exports.run = runCommands;
exports.setup = setup;
