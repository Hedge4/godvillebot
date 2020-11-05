const { logs } = require('../../configurations/config.json');

function main(client, message) {
    let size = 6;
    let bomb = 15;
    message.content.toLowerCase().slice(12).trim().split('-').forEach(arg => {
        if (arg.startsWith('s')) {
            const num = parseInt(arg.slice(1));
            if (!isNaN(num)) {
                if (num >= 2 && num <= 13) {
                    size = num;
                } else { message.reply(`size should 2-13. Using previous value ${size}.`); }
            } else { message.reply(`size input should be an integer, not ${num}. Using previous value (${size}).`); }
        }
        if (arg.startsWith('b')) {
            const num = parseFloat(arg.slice(1));
            if (!isNaN(num)) {
                if (num >= 0 && num <= 60) {
                    bomb = num;
                } else { message.reply(`bomb percentage should be 0-60. Using previous value ${bomb}%.`); }
            } else { message.reply(`bomb input should be a number, not ${num}. Using previous value (${bomb})%.`); }
        }
    });
    const logsChannel = client.channels.cache.get(logs);
    console.log(`${message.author.tag} requested a minesweeper game in ${message.channel.name}.`);
    logsChannel.send(`${message.author.tag} requested a minesweeper game in ${message.channel.name}.`);
    const bombs = [];
    while (bombs.length < Math.round(size * size * bomb / 100)) {
        const coord = `${Math.floor(Math.random() * size)}, ${Math.floor(Math.random() * size)}`;
        if (!bombs.includes(coord)) { bombs.push(coord); }
    }

    const nums = [':zero:', ':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:'];
    const game = [];
    for (let x = 0; x < size; x++) {
        game.push([]);
        for (let y = 0; y < size; y++) {
            let num = 0;
            if (x - 1 >= 0 && y - 1 >= 0 && bombs.includes(`${x - 1}, ${y - 1}`)) { num++; }
            if (y - 1 >= 0 && bombs.includes(`${x}, ${y - 1}`)) { num++; }
            if (x + 1 <= size && y - 1 >= 0 && bombs.includes(`${x + 1}, ${y - 1}`)) { num++; }
            if (x - 1 >= 0 && bombs.includes(`${x - 1}, ${y}`)) { num++; }
            if (bombs.includes(`${x}, ${y}`)) { num++; }
            if (x + 1 <= size && bombs.includes(`${x + 1}, ${y}`)) { num++; }
            if (x - 1 >= 0 && y + 1 <= size && bombs.includes(`${x - 1}, ${y + 1}`)) { num++; }
            if (y + 1 <= size && bombs.includes(`${x}, ${y + 1}`)) { num++; }
            if (x + 1 <= size && y + 1 <= size && bombs.includes(`${x + 1}, ${y + 1}`)) { num++; }

            game[x].push(nums[num]);
        }
    }
    bombs.forEach(e => {
        const xy = e.split(',');
        game[xy[0].trim()][xy[1].trim()] = ':bomb:';
    });
    let spoilers = '';
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            spoilers += `||${game[x][y]}|| `;
        }
        spoilers += '\n';
    }
    message.reply(`here is your minesweeper game with size ${size} and ${bombs.length} bombs:\n${spoilers}`);
}

module.exports = main;