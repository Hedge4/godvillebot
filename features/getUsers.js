const getters = require('../index.js');

// returns a user object (or undefined)
// username should be selected beforehand, so no additional arguments get in
function getOneUser(username, client = undefined) {
    if (!client) client = getters.getClient();

    username = username.trim();
    let user;

    // using cache is fine here, since we fetch all members on startup
    if (/^<@!?[0-9]+>$/.test(username)) { // check mentions through regex
        const userID = /^<@!?([0-9]+)>$/.exec(username)[1];
        user = client.users.cache.get(userID);
    } else if (username.includes('#')) { // check discord username
        const args = username.split('#');
        username = args[0];
        const discriminator = args[1];
        user = client.users.cache.find(foundUser => foundUser.tag == (username + '#' + discriminator));
    } else if (!isNaN(username) && !isNaN(parseInt(username)) && username % 1 == 0) { // check id
        user = client.users.cache.get(username);
    } else { // find by username
        user = client.users.cache.find(foundUser => foundUser.username == username);
    }

    return user;
}

function getMoreUsers(usernames, client = undefined) {
    if (!client) client = getters.getClient();

    const foundUsers = [];
    const notFoundUsers = [];

    usernames.forEach(username => {
        const user = getOneUser(username, client);

        if (user) {
            foundUsers.push(user);
        } else {
            notFoundUsers.push(user);
        }
    });

    return {
        found: foundUsers,
        notFound: notFoundUsers,
    };
}

exports.One = getOneUser;
exports.Multiple = getMoreUsers;