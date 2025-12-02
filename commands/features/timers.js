/**
 * Calculates the delay until the next occurrence of a daily recurring event at a specific UTC time.
 * For example, if an event happens every day at 12:30 UTC, this returns how long until the next 12:30 UTC.
 * If the specified time has already passed today, it calculates to tomorrow's occurrence.
 * @param {number} targetHourUTC - The target hour in UTC (0-23).
 * @param {number} targetMinuteUTC - The target minute (0-59).
 * @returns {Object} An object containing:
 *   - delay: Total delay in milliseconds
 *   - goalDate: The Date object of the target moment
 *   - hoursFromNow: Hours remaining until the target
 *   - minutesFromNow: Minutes remaining (not including full hours)
 *   - secondsFromNow: Seconds remaining (not including full minutes)
 */
function getDelay(targetHourUTC, targetMinuteUTC) {
    const now = new Date();
    // we're getting all of these in UTC so we can perform calculations no matter what device this runs on
    // performing all calculations based on local time isn't possible, our target hour/minute are in UTC time
    const years = now.getUTCFullYear();
    const months = now.getUTCMonth();
    let days = now.getUTCDate();
    let hours = now.getUTCHours();
    let minutes = now.getUTCMinutes();

    // change days/hours/minutes such that we get the next time targetHourUTC/targetMinuteUTC happens (not previous)
    if (hours === targetHourUTC) {
        if (minutes >= targetMinuteUTC) {
            days += 1;
        }
    }
    if (hours > targetHourUTC) {
        days += 1;
    }
    hours = targetHourUTC;
    minutes = targetMinuteUTC;

    // minutes -= now.getTimezoneOffset(); // we need to do this because when getting the new date the local machine's timezone offset is automatically added on - this compensates it because our values are already UTC.
    // Date.UTC is a saviour so I don't have to fuck around with timezones anymore yaaaaaaaaay
    const then = new Date(Date.UTC(years, months, days, hours, minutes));

    const delay = then.valueOf() - now.valueOf();
    const delayHours = Math.floor(delay / 1000 / 3600);
    const delayMins = Math.floor((delay % (1000 * 3600)) / (60 * 1000));
    const delaySecs = Math.floor((delay % (1000 * 60)) / (1000));
    return { delay: delay, goalDate: then, hoursFromNow: delayHours, minutesFromNow: delayMins, secondsFromNow: delaySecs };
}

/**
 * More expansive version of getDelay() that returns the delay until any specific moment in the future.
 * @param {Object} options - Configuration object for the target date. All properties are optional and default to current UTC time values.
 * @param {number} [options.year] - The target year (defaults to current UTC year).
 * @param {number} [options.month] - The target month, 0-11 (defaults to current UTC month).
 * @param {number} [options.date] - The target day of month, 1-31 (defaults to current UTC date).
 * @param {number} [options.hours] - The target hours in UTC, 0-23 (defaults to current UTC hours).
 * @param {number} [options.minutes] - The target minutes, 0-59 (defaults to current UTC minutes).
 * @param {number} [options.seconds] - The target seconds, 0-59 (defaults to current UTC seconds).
 * @param {number} [options.milliseconds] - The target milliseconds, 0-999 (defaults to current UTC milliseconds).
 * @returns {number} The delay in milliseconds until the target moment.
 */
function getLongDelay(options) {
    const now = new Date();

    const year = options.year ?? now.getUTCFullYear();
    const month = options.month ?? now.getUTCMonth();
    const date = options.date ?? now.getUTCDate();
    const hours = options.hours ?? now.getUTCHours();
    const minutes = options.minutes ?? now.getUTCMinutes();
    const seconds = options.seconds ?? now.getUTCSeconds();
    const milliseconds = options.milliseconds ?? now.getUTCMilliseconds();

    const targetDate = new Date(Date.UTC(year, month, date, hours, minutes, seconds, milliseconds));
    const delay = targetDate.valueOf() - now.valueOf();

    if (delay < 0) {
        throw new Error(`Target moment ${targetDate.toISOString()} is in the past (${Math.abs(delay)}ms ago).`);
    }
    return delay;
}

exports.getDelay = getDelay;
exports.getLongDelay = getLongDelay;
