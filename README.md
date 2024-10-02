# GodBot

GodBot was created as a custom bot for the unofficial Godville Discord server. Godville is a self-playing comedy game where you, as a deity, 'control' a hero who will willfully ignore most of your requests.
- [Create your own Godville account](https://godvillegame.com/login)
- [Join the Discord server!](https://discord.gg/tAtGGQE)

## Features
- A levelling system for chatting in the server,
- the basis of an economy system (though gold has no use yet),
- a modular command system,
- a scheduling and reminder system,
- onboarding message and command,
- obtaining roles through reactions or commands, for users to toggle channels in the server,
- linking and showing your Godville profile,
- sharing the Godville newspaper daily,
- solving the Godville crossword from the newspaper,
- a reward system for the last to talk in general-chat (chatContest),
- custom message reactions and random message events,
- custom commands configurable without code changes,
- some useful commands (making polls, self muting, spoilering images),
- some fun commands (random nickname, dice rolls, bubblewrap, minesweeper),
- commands to create images with a user's profile picture (bonk, pet, hug, nope),
- option to chat as the bot via a dedicated channel,
- option to track contest submissions through the bot's DMs,
- some moderation functions,
- and a logging system.

[Check out the full changelog here.](./CHANGELOG.md)

## License

This project is not licensed for public or commercial use. Please see the [LICENSE.md](./LICENSE.md) file for details. You may study the code and reuse small parts for educational purposes, but redistribution or commercial use requires permission.

For inquiries about usage, contact me at [heddevanheerde4@gmail.com](mailto:heddevanheerde4@gmail.com) or on Discord ([@wawajabba](https://discordapp.com/channels/@me/346301339548123136/)).

## Contributing

Contributions are very welcome! You're free to open a PR yourself if you know what you're doing, but you can also talk to me for inspiration or for help setting up a basis for a new command or feature you want to add. JavaScript is fun to learn, and if you're looking for a programming challenge I can set one up for you!

Contributors retain ownership of their work, but by contributing to GodBot, you grant me the right to relicense your work in the future through any open-source licenses. I will make a custom command for attribution, but for any attribution in the code or some other way contact me.

**To contribute:**
1. Fork the repository.
2. Create a new branch for your feature or fix (recommended, but optional).
3. Make your changes and commit them.
4. Submit a pull request.

**Before submitting, please ensure:**
- your branch is up-to-date with main,
- you add at least a few comments explaining your code,
- your code follows the linting configurations in [eslint.config.js](./eslint.config.js).

For larger changes, please open an issue to discuss your ideas beforehand.

## Installation and Usage

Installing and running this code should be fairly easy and you can follow the instructions below. However, since GodBot was made for two specific servers (the Godville server and its own feedback/suggestions server) it will need quite a few configuration changes before running successfully. **Because of this, it's easier to contact me for any testing you may need to do.** Some things you would need are:

- create a file secret.json in configurations with your own bot token and Firebase serviceAccountKey (see [example-secret.json](./configurations/example-secret.json)),
- create your own bot and enter its token,
- create your own Firebase project and Service Account or disable any parts of the code using the database,
- invite your own bot to a server of your own (preferably with **admin perms**),
- update required channel IDs and other things in [config.json](./configurations/config.json).

### Instructions to run the code anyway:
```bash
# Clone the repository
git clone https://github.com/Hedge4/godvillebot.git

# Navigate to the project directory
cd godvillebot

# Install dependencies
npm install

# Example of how to run the project
node .
```

## Contact

For any questions or contributions, feel free to contact me at [heddevanheerde4@gmail.com](mailto:heddevanheerde4@gmail.com) or on Discord ([@wawajabba](https://discordapp.com/channels/@me/346301339548123136/)).

## Support me

GodBot is a passion project, and while I don't intend to earn any money from it, any support is appreciated. If you’d like to show your appreciation, you can tip me through Ko-fi:

- [Ko-fi (wawajabba)](https://ko-fi.com/wawajabba)

Feedback, ideas or contributions motivate me and are appreciated just as much. Thank you for your support!
