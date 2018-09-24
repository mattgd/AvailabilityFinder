'use strict';

const moment = require('moment');
const DEFAULT_DATE_FORMAT = 'ddd MM/DD h:mm a';

class AvailabilitySlot {

    constructor(startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
    }

    toString() {     
        return `${moment(this.startDate).format(DEFAULT_DATE_FORMAT)} to ${moment(this.endDate).format(DEFAULT_DATE_FORMAT)}`
    }

    print() {
      console.log( this.toString() );
    }

}

module.exports = AvailabilitySlot;