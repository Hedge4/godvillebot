const path = require('path');
const fs = require('fs');

const categoryList = {};
const commandList = {};

function initialiseCommands() {
    // get the directory that the category directories are in
    // const categoriesDir = path.join(__dirname, 'categories');
    const categoriesDir = __dirname;

    // Read all directories in the categories directory
    fs.readdirSync(categoriesDir, { withFileTypes: true })
        .filter(dir => dir.isDirectory()) // Only keep directories
        .map(dir => dir.name) // Extract the names of the directories
        .forEach(categoryName => {
            const categoryPath = path.join(categoriesDir, categoryName, `${categoryName}_category.js`);

            // Check if the category file exists
            if (fs.existsSync(categoryPath)) {
                // const category = require(categoryPath);
                const category = require(categoryPath).initialiseCategory();

                // Ensure the category has a name property
                if (!category.name) {
                    console.warn(`Category '${categoryName}' does not have a 'name' property`);
                } else {
                    categoryList[category.name] = category;
                }
            } else {
                console.warn(`Category '${categoryName}' does not have a category file`);
            }
        });

  // Loop through all categories and commands to create a commandList dictionary
  for (const categoryName in categoryList) {
    const category = categoryList[categoryName];
    for (const command of category.commands) {
      // Check that the command has a name and execute function
      // TODO: Check this in category.initialise() instead
      if (!command.name || !command.execute) {
        console.warn(`Command in category '${categoryName}' is missing a 'name' or 'execute' property`);
        continue;
      }

      // Add the command and its aliases to the commandList object using the command name and each alias as the key
      commandList[command.name] = command.execute;
      if (command.alts) {
        for (const alt of command.alts) {
          commandList[alt] = command.execute;
        }
      }
    }
  }
}

exports.initialise = initialiseCommands;
exports.categories = categoryList;
exports.commands = commandList;