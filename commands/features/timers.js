function getDelay(targetHour, targetMinute) {
    const now = new Date();
    // we're getting all of these in UTC so we can perform calculations no matter what device this runs on
    const years = now.getUTCFullYear();
    const months = now.getUTCMonth();
    let days = now.getUTCDate();
    let hours = now.getUTCHours();
    let minutes = now.getUTCMinutes();

    // change days/hours/minutes such that we get the next time targetHour/targetMinute happens (not previous)
    if (hours === targetHour) {
        if (minutes >= targetMinute) {
            days += 1;
        }
    }
    if (hours > targetHour) {
        days += 1;
    }
    hours = targetHour;
    minutes = targetMinute;

    minutes -= now.getTimezoneOffset(); // we need to do this because when getting the new date the local machine's timezone offset is automatically added on - this compensates it because our values are already UTC.
    const then = new Date(years, months, days, hours, minutes);
    const delay = then.valueOf() - now.valueOf();
    const delayHours = Math.floor(delay / 1000 / 3600);
    const delayMins = Math.floor((delay % (1000 * 3600)) / (60 * 1000));
    const delaySecs = Math.floor((delay % (1000 * 3600 * 60)) / (1000));
    return { delay: delay, goalDate: then, hoursFromNow: delayHours, minutesFromNow: delayMins, secondsFromNow: delaySecs };
}

exports.getDelay = getDelay;