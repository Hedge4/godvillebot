# GodBot
Version: 5.12.4

I should probably include some sort of description here. Meh, I'll add it later (read: probably never).

## What's new in version 5?
Version 5 includes a full rewrite off all files related to the Godville Times newspaper, removing any leftover Python files and related dependencies in the process. This version re-introduces a daily summary of the newspaper, and commands to solve the crossword through downloading and parsing the [Omnibus list](https://wiki.godvillegame.com/Omnibus_List) by either uploading an HTML file of the newspaper or an array of terms to solve.

Additionally, all files were updated to work with discord.js V13 instead of V12, and methods and prompts were updated accordingly. I also revisited how the bot calculates delays and created a `timers.js` feature file, building up to a tasks scheduling system that will be introduced next. `index.js` now has getter methods for often referenced objects like `Discord` and `client`, and the bot owner can send messages/embeds to specific channels through the bot. Lastly, the bot can now be used to send a message including files and embeds to a specific channel or user.

### What has been added since?
* 5.1 Added >no, which takes a mentioned user's profile picture, greyscales it, and overlays a red 'forbidden' sign.
* 5.2 Added >remindme, and a scheduler file + document in the database to keep track of scheduled events.
* 5.3 Added boss, shop, bookmaker medal and bricks/logs/pairs/words/savings progress to >profile and >gvprofile cards!
* 5.4 The bot can now also react with emojis for the >react command because of smarter command parsing.
* 5.5 God(des)Bot has replaced Dyno for reaction roles, and can toggle roles if users add/remove reactions to a specific message.
* 5.6 Added the >bonk command! (this took way too much effort)
* 5.7 Completely restructured and cleaned up config.json and updated files using it.
* 5.8 Added the >hug command, similar to >nope and >bonk.
* 5.9 Enabled spookmode, and added random messages that appear randomly and get deleted quickly.
* 5.10 Added the >botTime command
* 5.11 Added the >url/>parseURL command, not because it's useful but because I like it.
* 5.12 Updated to discord.js V14.6, and updated other outdated packages.
* 5.13 GoddessBot now automatically joins new threads, adds Dyno and notifies #los-adminos

## What's new in version 4?
Version 4 is updated to work with discord.js version 12, and instructions with changed methods have been rewritten.
I've added more logging lines for commands that weren't (completely) logged yet, and for each log to the console
the bot now also sends a message to its dedicated logging channel on Discord, for a more permanent logging solution.
Lastly, commands now support aliases and are sorted into modules (as of version 4.2).

### What has been added since?
* 4.1 GodBot now shows the last update's changes on startup.
* 4.2 Commands now support aliases and all commands/files have been ordered in four different modules.
* 4.3 Added code to run contests through the bot's DMs, which can be easily turned on or off.
* 4.4 Added randomly changing nickname when someone talks in #general for April Fools. This will become a >randomnick command.
* 4.5 Added chat contests that reward a small or big amount of gold if someone is the last to talk in #general for 10 minutes.
* 4.6 Restructured bot functions into a 'features' folder for much tidier files, and added a >ping command.
* 4.7 Added >react command, which can react with alphabetical emojis to messages with a specific message.
* 4.8 Added a message reaction function that can randomly react to certain words in messages, and added and enabled spookmode.
* 4.9 Added one generic getUser() function that can be accessed from anywhere in the features folder.
* 4.10 Accepting/rejecting suggestions now sends a message in botville, and accepted suggestions reward gold!
* 4.11 Added >gvprofile to show any Godville profile, and added >showlink to only show someone's linked URL, without fetching their profile.
* 4.12 Added >makevote <msg_id>, which will make any message into a vote (encourage/miracle/punish) and remove reactions as necessary. The bot now correctly chooses singular/plural in some prompts.

## What's new in version 3?
Version 3 adds the functionality of CrosswordGod to GodBot, so just running one of the two bots will be enough.
It means rewriting some of CrosswordGod's code so it can be run as a function instead of the worker file,
adding python libraries and the packages find, fs and python-shell to take over all functionality.

### What has been added since?
* 3.1 Added structure for commands that can only be used once a day.
* 3.2 Added a >daily command for 7-19 gold every day.
* 3.3 Completely changed the >help command and added help functions for specific commands.
* 3.4 Restructured some of the chaotic code in crosswordgod.js
* 3.5 The forecast is now also automatically sent to MK when it updates.
* 3.6 Moved some file locations, ordered config files in configurations folder and fixed require references in an effort to keep the main folder tidier.
* 3.7 A change of devices, inexperience and a $ git push --force caused all of the commits before version 3.3 to be lost. Those old commits have been restored and the new commits after version 3.2 have all been compiled in this version.
* 3.8 The crossword solutions now tell you to add the solutions to the omnibus if they weren't found, for future crosswords.
* 3.9 Added a daily timeout to mention everyone with the 'newsping' role an hour before the newspaper updates.
* 3.10 Added explanations for all help commands.
* 3.11 Added a >break command for admins only, to pause the bot for a short while.
* 3.12 Added 'fun' folder and command detector, and the >bubblewrap command. Also made command detection more efficient.
* 3.13 Added 'useful' commands folder and command detector, and the >spoiler command.
* 3.14 Added the >minesweeper command to the list of fun commands.
* 3.15 GodBot now reacts when mentioned, and from level 50 onward the godpower required for the next level is fixed at 6666.
* 3.16 Users blocked for various actions are now stored in the database, and can be added/removed with >block.

## What's new in version 2?
Version 2 entails a major rewrite of all the code.
There's now a 'commands' folder with separate files for each function/command.

### What has been added since?
* 2.1 Added a simple >guides command that displays all guides stored in an array 'guides'. >guides [number] displays a more detailed description and hyperlink of that guide.
* 2.2 The >help command now uses an array to store commands and their usage. It is expandable to later include more detailed descriptions for >help [specific command].
* 2.3 Added a >purge command that can only be used in the courtroom to keep it nice and tidy as easily as possible.
* 2.4 The >link command can now be used to link a Discord account (ID) with a Godville account.
* 2.5 Users can use >profile to get the name and link of their own or another user's Godville account.
* 2.6 The >profile command now also downloads the god page of the user and extracts certain data from it to show in the profile embed.
* 2.7 The bot can now search the godwiki for a specific search term with >godwiki.
* 2.8 Instead of a generic message, the bot now shows a nice restart embed on restart and its version number.
* 2.9 For >link, the bot now accepts god names as well and has a 100% working checking system.
* 2.10 Bot owner can now use 'accept message_ID' or 'reject message_ID' in the suggestions channel to move messages to the accepted or rejected channel.
* 2.11 accept and reject in the suggestion channel now accept reasons as well.
* 2.12 Added logging for all commands except for >suggest. Admin role and purge channels are now defined in config.json.
* 2.13 Giving xp will still check for a minimum message size, but will remove any urls, emojis and custom emojis first.

## What's new in version 1?
Version 0 was only about creating the XP and gold system, but version 1 focusses on making the bot work online. The bot now uses a database to store userdata instead of a local file, and the bot is now hosted on Heroku. All userdata is reset.

### What has been added since?
* 1.1 It is now possible to check someone's else level or gold by mentioning them.
* 1.2 >level now also displays someone's total godpower stat.
* 1.3 When a user is awarded godpower, the bot now also stores their most up-to-date username to the database.
* 1.4 Added a >toggle-mentions command so users can disable being mentioned when they level up.
* 1.5 Added a >ranking command to display who has earned the most godpower. >level now also displays a user's server rank.
* 1.6 The >suggest command can now be used to suggest features to the bot owner. Messages sent with suggest go to the bot owner's DM, and later to a private server.
* 1.7 Added a simple and incomplete >help message.

## Version 0
In version 0 the bot could only detect messages and award a user a certain amount of XP/godpower.

### What has been added since?
* 0.1 The bot now uses a local file to store userdata between restarts.
* 0.2 >level has been added and can be used to check your level and godpower, and how much godpower you need to reach the next one.
* 0.3 Gold has been added and is awarded on level-ups. It can be checked with >gold.
* 0.4 Commands can now only be used in certain channels, and earning XP is disabled for spammy channels.
