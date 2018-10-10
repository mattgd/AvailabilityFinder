'use strict';

const moment = require('moment');
const DEFAULT_DATE_FORMAT = 'ddd MM/DD h:mm a';
const MS_PER_MINUTE = 60000;

class AvailabilitySlot {

    constructor(startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
    }

    /**
     * Returns the duration in minutes of the AvailabilitySlot.
     * @returns the duration in minutes.
     */
    getDuration() {
        return Math.abs(this.startDate.getTime() - this.endDate.getTime()) / MS_PER_MINUTE;
    }

    /**
     * Provides a string representation of the AvailabilitySlot.
     */
    toString() {     
        return `${moment(this.startDate).format(DEFAULT_DATE_FORMAT)} to ${moment(this.endDate).format(DEFAULT_DATE_FORMAT)}`
    }

}

/**
 * Returns an Array of AvailablitySlot objects.
 * @param {Date} startDate The date to start looking for availability.
 * @param {Date} endDate The date to stop looking for availability.
 * @param {number} bufferTime The amount of time in minutes to buffer events with.
 * @param {number} appointmentLength The length of the appointment in minutes
 * @param {object[]} events An Array of Google Calendar event objects.
 * @return {AvailabilitySlot[]} An Array of AvailablitySlot objects.
 */
function getAvailabilitySlots(startDate, endDate, bufferTime, appointmentLength, events) {
    var availabilitySlots = [];
    var slotStartDate = startDate;
    var event;
    let isFirst = true;
  
    for (event of events) {
      const start = new Date(event.start.dateTime || event.start.date);
      const end = new Date(event.end.dateTime || event.end.date);
      
      var slot;
      if (isFirst) {
        slot = new AvailabilitySlot(slotStartDate, moment(start).subtract(bufferTime, 'm').toDate());
        isFirst = false;
      } else {
        slot = new AvailabilitySlot(moment(slotStartDate).add(bufferTime, 'm').toDate(), moment(start).subtract(bufferTime, 'm').toDate());
      } 

      if (slot.getDuration() >= appointmentLength) {
        availabilitySlots.push(slot);
      }
  
      slotStartDate = end; // Set to end of current event
    }
  
    // Add any remaining availability after events.
    slot = new AvailabilitySlot(moment(slotStartDate).add(bufferTime, 'm').toDate(), endDate);
    if (slot.getDuration() >= appointmentLength) {
      availabilitySlots.push(slot);
    }
  
    return availabilitySlots;
  }

module.exports = { AvailabilitySlot, getAvailabilitySlots };