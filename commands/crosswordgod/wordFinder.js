const https = require('https');
//const logger = require('../../features/logging.js');

async function main(attachment) {
    const fileContent = await downloadAttachment(attachment.url); // if something goes wrong it throws an error
    if (!fileContent) {
        throw(`Error: I couldn't download any content from the file '${attachment.name}' you provided.`);
    }

    const grid = getGridFromFile(fileContent);

    return getWordsFromGrid(grid);
}

function getGridFromFile(html) {
    const Regex = /id="cross_tbl".*?<tbody>(.*?)<\/tbody>/s;
    const crossword = Regex.exec(html);
    if (!crossword) {
        throw('Error: I couldn\'t find the Godville Times crossword in this file. Possible causes:'
            + ' 1. You weren\'t logged in when you downloaded the html from the newspaper page.'
            + ' 2. You downloaded the wrong page, or sent in a non-HTML file.'
            + ' 3. The HTML layout of the crossword was changed, and I can\'t detect it anymore.');
    }

    // this returns all table rows, and all sub-matches which are the table d's (what is td short for?)
    const rowsRegex = /<tr>.*?<\/tr>/gs;
    const elemsRegex = /<td class="[^c].*?<\/td>/gs; // matches all elements except cc_wrap class on the side
    const rows = [...crossword[1].matchAll(rowsRegex)]; // we need to match on just the subgroup of our match from the regex
    if (!rows.length) {
        throw('Error: I found the crossword in your file, but it appeared to be empty. Either something went wrong with your download,'
        + ' or the HTML layout of the crossword was changed, and I can\'t detect it anymore.');
    }

    // we build a grid based on this result, and keep track of which positions are the start of a word
    const grid = [], wordStarts = [];
    for (let y = 0; y < rows.length; y++) {
        const row = rows[y][0]; // first value in the match is the whole match (there is also subgroups/properties)
        const elems = [...row.matchAll(elemsRegex)]; // first get the different elements in the row
        if (!elems.length) {
            throw('Error: I found the crossword in your file, but at least one of the rows appeared to be empty. Either something'
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
            const includesNum = elem.includes('class="num"');
            if (includesNum) wordStarts.push({ X: x, Y: y });

            // unkown cells, we push . as a wildcard to match all characters
            if (elem.startsWith('<td class="td_cell ">')) {
                gridRow.push('.');
                continue;
            }

            // in known cells their value is in the second <div> container (but the first one to be closed)
            if (elem.startsWith('<td class="td_cell known ">')) {
                if (!includesNum) gridRow.push(elem[elem.indexOf('</div>') - 1]); // push the value before the first closing tag
                else gridRow.push(elem[elem.indexOf('</div>', elem.indexOf('</div>') + 1) - 1]); // skip one div if there's a number div present
                continue;
            }

            // if by now this iteration is still going, this element is incorrect
            throw(`Error: Element ${x} in row ${y} of the crossword couldn't be interpreted. Element: ${elem.replace(/\s+/g, ' ')}`);
        }

        // after that whole loop, we push the now completed gridRow to our grid
        grid.push(gridRow);
    }

    // lastly we go check if all of our rows have the same length
    if (!grid.every(e => { return e.length === grid[0].length; })) {
        throw('Error: I could parse the crossword from your file, but not all rows had the same length!');
    }

    // woohooo we have built a grid
    return { Grid: grid, WordStarts: wordStarts };
}

function getWordsFromGrid(grid) {
    const foundHorizontal = [], foundVertical = [];
    // for each start position we check in both directions whether it's a word, and add it
    grid.WordStarts.forEach(pos => {
        let wordFound = false; // if no word found at end of loop then something went wrong

        // check horizontal
        if ((!grid.Grid[pos.Y][pos.X - 1]) || (grid.Grid[pos.Y][pos.X - 1] === '')) { // first check - there is no cell to the left
            if (!((!grid.Grid[pos.Y][pos.X + 1]) || (grid.Grid[pos.Y][pos.X + 1] === ''))) { // first check - there is a cell to the right
                wordFound = true;
                let word = grid.Grid[pos.Y][pos.X];
                let x = pos.X + 1;
                while(!((!grid.Grid[pos.Y][x]) || (grid.Grid[pos.Y][x] === ''))) { // continue doing second check while increasing x
                    word += grid.Grid[pos.Y][x];
                    x++;
                }
                // push our finished word once there is no next cell on the right
                foundHorizontal.push(word);
            }
        }

        // check vertical
        if ((!grid.Grid[pos.Y - 1]) || grid.Grid[pos.Y - 1][pos.X] === '') { // first check - there is no cell up
            if (!((!grid.Grid[pos.Y + 1]) || (grid.Grid[pos.Y + 1][pos.X] === ''))) { // second check - there is a cell down
                wordFound = true;
                let word = pos.X + '|' + grid.Grid[pos.Y][pos.X]; // we add pos.X to sort from left to right later and then remove it, | is to split the pos
                let y = pos.Y + 1;
                while(!((!grid.Grid[y]) || (grid.Grid[y][pos.X] === ''))) { // continue doing second check while increasing y
                    word += grid.Grid[y][pos.X];
                    y++;
                }
                // push our finished word once there is no next cell below
                foundVertical.push(word);
            }
        }

        // we need to find at least one word per position
        if (!wordFound) {
            throw(`According to the parsed HTML there should be a word starting at cell (${pos.X}, ${pos.Y})`
            + ' but I couldn\'t find any.');
        }
    });

    // sort our vertical words from left to right
    foundVertical.sort((a, b) => {
        const aNum = a.slice(0, a.indexOf('|')); // get the x position of the word
        const bNum = b.slice(0, b.indexOf('|'));
        if (aNum === bNum) return 0; // keep original order (sorted up to down) in case of same x values
        return bNum < aNum ? 1 : -1; // lower x position takes precedence
    });

    // remove the x position and splitter '|' from our vertical words
    const foundVertical2 = foundVertical.map(e => {
        return e.slice(e.indexOf('|') + 1); // return word minus anything before and including |
    });

    // return our found words
    return { Horizontal: foundHorizontal, Vertical: foundVertical2 };
}

async function downloadAttachment(URL) {
    const timeout = 10;

    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => { // this only needs to reject because if it returns in time that means there is an error
            reject(`Error: Timed out after ${timeout} seconds while getting data from <${URL}>.`);
        }, timeout * 1000);
    });

    const dataPromise = new Promise((resolve, reject) => {
        https.get(URL, (res) => {
            let data;
            res.on('data', (d) => {
                data += d;
            });
            res.on('end', () => {
                resolve(String(data));
            });
        }).on('error', (e) => {
            reject(e);
        });
    });

    const res = await Promise.race([dataPromise, timeoutPromise])
    .then((result) => {
        if (!result) {
            throw(`Error: Something went wrong when downloading from url <${URL}>! No data was received.`);
        }
        //logger.toChannel(`Successfully received file content from <${URL}>`); // need separate log to prevent automatic embed
        //logger.toConsole(`Successfully received file content from ${URL}`);
        return result;
    }).catch((error) => {
        throw(`Error: Something went wrong when downloading from url <${URL}>! Error: ` + error);
    });

    return res;
}

module.exports = main;