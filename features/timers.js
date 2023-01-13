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

exports.getDelay = getDelay;