const logger = require('../features/logging');
const https = require('https');

async function downloadAttachment(URL, maxByteSize) {
    const timeout = 10;

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => { // this only needs to reject because if it returns in time that means there is an error
            reject(`Error: Timed out after ${timeout} seconds while getting data from ${URL}.`);
        }, timeout * 1000);
    });

    const dataPromise = new Promise((resolve, reject) => {
        https.get(URL, (res) => {
            let data = ''; // Initialize data as an empty string
            let bytesRead = 0; // Initialize bytesRead

            res.on('data', (d) => {
                if (bytesRead + d.length <= maxByteSize) {
                    data += d;
                    bytesRead += d.length;
                } else {
                    // if data exceeds the maximum byte amount, resolve early
                    logger.log(`Crossword: Data from ${URL} exceeded ${maxByteSize} bytes, ignoring excess text.`);
                    res.destroy();
                    resolve(data);
                }
            });
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (e) => {
            reject(e);
        });
    });

    const res = await Promise.race([dataPromise, timeoutPromise])
    .then((result) => {
        if (!result) {
            throw(`Error: Something went wrong when downloading from url ${URL}! No data was received.`);
        }
        return result;
    }).catch((error) => {
        throw(`Error: Something went wrong when downloading from url ${URL}!\nError: ` + error?.stack || String(error));
    });

    // convert buffer to string
    return res.toString();
}

module.exports = downloadAttachment;