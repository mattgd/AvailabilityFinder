import moment from 'moment';

/**
 * Validates a date string input and returns it as a Date.
 * @param {string} dateStr The date string input.
 * @returns a JavaScript Date object.
 */
const convertToDate = (dateStr: string) => {
    let date = new Date(dateStr);
    
    // Check for invalid dateStr
    if (!date instanceof Date || isNaN(date)) {
        throw new TypeError(dateStr + ' is not in a valid date format.');
    }

    return date;
}

/**
 * Takes in a time string (e.g. 5d, 1w) and returns the current
 * date/time plus the time string amount.
 * @param {Date} date The date to add time to.
 * @param {string} timeStr The time string to add to the current date.
 * @returns the current date/time plus the time string amount.
 */
function addTimeString(date: Date, timeStr: string) {
    var count = +timeStr.substr(0, timeStr.length - 1);
    var unit = timeStr.substr(timeStr.length - 1);

    return moment(date).add(count, unit).toDate();
}

export { convertToDate, addTimeString };
