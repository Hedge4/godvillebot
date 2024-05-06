//const logger = require('../features/logging');
const downloadAttachment = require('./crosswordDownloader');

async function main(attachment, maxByteSize) {
    const fileContent = await downloadAttachment(attachment.url, maxByteSize); // if something goes wrong it throws an error
    if (!fileContent) {
        throw (`Error: I couldn't download any content from the file '${attachment.name}' you provided.`);
    }

    const [grid, wordStarts] = getGridFromFile(fileContent);

    return getWordsFromGrid(grid, wordStarts);
}

function getGridFromFile(html) {
    const crossTableRegex = /<table id="cross_tbl"[\s\S]*?<\/table>/;
    const table = crossTableRegex.exec(html);
    if (!table) {
        throw ('Error: Crossword not found! Possible causes:'
            + ' 1️⃣ You weren\'t logged in when you downloaded the html from the newspaper page.'
            + ' 2️⃣ You downloaded the wrong page, or sent a different file. Make sure to download https://godvillegame.com/news.'
            + ' 3️⃣ The HTML layout of the crossword was changed, and I can\'t detect it anymore.');
    }

    // this returns all table rows, and all sub-matches which are the table d's (what is td short for?)
    const rowsRegex = /<tr>[\s\S]*?<\/tr>/g;
    const elemsRegex = /<td class="[^c][\s\S]*?<\/td>/g; // matches all elements except cc_wrap class on the side
    const numRegex = /class="num">(\d+)<\/div>/;
    const rows = [...table[0].matchAll(rowsRegex)]; // match all rows in <table />, and convert to array
    if (!rows.length) {
        throw ('Error: I found the crossword in your file, but couldn\'t find any table rows. Either something went wrong with your download,'
            + ' or the HTML layout of the crossword was changed, and I can\'t detect it anymore.');
    }

    // we build a grid based on this result, and keep track of which positions are the start of a word
    const grid = [], wordStarts = [];
    for (let y = 0; y < rows.length; y++) {
        const row = rows[y][0]; // first value in the match is the whole match (there is also subgroups/properties)
        const elems = [...row.matchAll(elemsRegex)]; // first get the different elements in the row
        if (!elems.length) {
            throw ('Error: I found the crossword in your file, but at least one of the rows appeared to be empty. Either something'
                + ' went wrong with your download, or the HTML layout of the crossword was changed and I can\'t detect it anymore.');
        }

        // now we build this row of the grid
        const gridRow = [];
        for (let x = 0; x < elems.length; x++) {
            const elem = elems[x][0]; // first value in the match is the whole match (there is also subgroups/properties)

            // these are cells that aren't part of the crossword (and invisible)
            if (elem.startsWith('<td class=" ">')) {
                gridRow.push('');
                continue;
            }

            // other cells can have a number in them, indicating a word starts there
            // const includesNum = elem.includes('class="num"');
            const includesNum = numRegex.exec(elem);
            // includesNum[1] stores the number found in the cell
            if (includesNum) wordStarts.push({ X: x, Y: y, num: includesNum[1] });

            // unkown cells, we push . as a wildcard to match all characters
            if (elem.startsWith('<td class="td_cell ">')) {
                gridRow.push('.');
                continue;
            }

            // in known cells their value is in the second <div> container (but the first one to be closed)
            if (elem.startsWith('<td class="td_cell known ">')) {
                if (!includesNum) gridRow.push(elem[elem.indexOf('</div>') - 1]); // value before the first closing tag is our known letter
                else gridRow.push(elem[elem.indexOf('</div>', elem.indexOf('</div>') + 1) - 1]); // get second div if there's a number div present
                continue;
            }

            // if by now this iteration is still going, this element is incorrect
            throw (`Error: Element ${x} in row ${y} of the crossword couldn't be interpreted. Element: ${elem.replace(/\s+/g, ' ')}`);
        }

        // after that whole loop, we push the now completed gridRow to our grid
        grid.push(gridRow);
    }

    // lastly we go check if all of our rows have the same length
    if (!grid.every(e => { return e.length === grid[0].length; })) {
        throw ('Error: I could parse the crossword from your file, but not all rows had the same length!');
    }

    // woohooo we have built a grid
    return [grid, wordStarts];
}

function getWordsFromGrid(grid, wordStarts) {
    const horizontalWords = [], verticalWords = [];
    // for each start position we check in both directions whether it's a word, and add it
    wordStarts.forEach(pos => {
        if (!pos.num) pos.num = '?';
        let wordFound = false; // if no word found at end of loop then something went wrong
        let wordObj = { searchString: '', startX: pos.X, startY: pos.Y, num: pos.num };

        // Horizontal - first check - there is no cell to the left
        if ((!grid[pos.Y][pos.X - 1]) || (grid[pos.Y][pos.X - 1] === '')) {
            // second check - there is a cell to the right
            if (!((!grid[pos.Y][pos.X + 1]) || (grid[pos.Y][pos.X + 1] === ''))) {
                wordFound = true;
                wordObj.searchString = grid[pos.Y][pos.X];

                let x = pos.X + 1;
                // continue checking cells to the right until undefined
                while (!((!grid[pos.Y][x]) || (grid[pos.Y][x] === ''))) {
                    wordObj.searchString += grid[pos.Y][x];
                    x++;
                }

                // push our finished word once there is no next cell on the right
                horizontalWords.push(wordObj);
                // reset word for potential vertical word
                wordObj = { searchString: '', startX: pos.X, startY: pos.Y, num: pos.num };
            }
        }

        // Vertical - first check - there is no cell up
        if ((!grid[pos.Y - 1]) || grid[pos.Y - 1][pos.X] === '') {
            // second check - there is a cell down
            if (!((!grid[pos.Y + 1]) || (grid[pos.Y + 1][pos.X] === ''))) {
                wordFound = true;
                wordObj.searchString = grid[pos.Y][pos.X];

                let y = pos.Y + 1;
                // continue checking cells below until undefined
                while (!((!grid[y]) || (grid[y][pos.X] === ''))) {
                    wordObj.searchString += grid[y][pos.X];
                    y++;
                }

                // push our finished word once there is no next cell below
                verticalWords.push(wordObj);
            }
        }

        // we need to find at least one word per position
        if (!wordFound) {
            throw (`According to the parsed HTML there should be a word starting at cell (${pos.X}, ${pos.Y})`
                + ' but I couldn\'t find one.');
        }
    });

    // sort vertical words from left to right
    verticalWords.sort((a, b) => {
        const aNum = a.startX;
        const bNum = b.startX;
        if (aNum === bNum) return 0; // keep original order (sorted up to down) in case of same x values
        return bNum < aNum ? 1 : -1; // lower x position takes precedence
    });

    // words are parsed from the grid from top to bottom then left to right,
    // so there's no need to sort horizontal words

    // return our found words
    return { horizontal: horizontalWords, vertical: verticalWords };
}

module.exports = main;