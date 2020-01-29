# GodBot
Version: 2.9.3

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