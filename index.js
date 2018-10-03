#!/usr/bin/env node
'use strict';

const AvailabilitySlot = require('./AvailabilitySlot'),
      fs = require('fs'),
      {google} = require('googleapis'),
      moment = require('moment'),
      program = require('commander'),
      readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'token.json';
const DEFAULT_DATE_FORMAT = 'ddd MM/DD h:mm a';
const DEFAULT_BUFFER_TIME = 30;
const MS_PER_MINUTE = 60000;

program
  .version('0.0.2')
  .description('Finds and lists out availability from your Google Calendar.')
  .option('-S, --start-date <date>', 'availability search start date')
  .option('-E, --end-date <date>', 'availability search end date')
  .option('-d, --date-format <format>', 'optional output date format')
  .option('-n, --now [range]', 'set availability start/end dates based on current date/time where range is days or weeks (e.g. 5d, 1w), default 1w')
  .action(run)
  .parse(process.argv); // end with parse to parse through the input

/**
 * Initiates the AvailabilityFinder program.
 */
function run() {
  if (!(program.startDate && program.endDate) && !program.now) {
    // If program was called with no start/end date, show help.
    program.help();
  } else {
    const startDate = program.startDate ? program.startDate : new Date();
    const endDate = program.endDate ? program.endDate : calculateDate(program.now);

    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
      if (err) {
        return console.log('Error loading client secret file:', err);
      }

      // Authorize a client with credentials, then call the Google Calendar API.
      authorize(JSON.parse(content), findAvailability, startDate, endDate);
    });
  }
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, startDate, endDate) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      return getAccessToken(oAuth2Client, callback, startDate, endDate);
    }

    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, startDate, endDate);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 * @param {Date} startDate The startDate to search from.
 * @param {Date} endDate The startDate to search to.
 */
function getAccessToken(oAuth2Client, callback, startDate, endDate) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        return console.error('Error retrieving access token', err);
      }

      oAuth2Client.setCredentials(token);

      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) {
          console.error(err);
        }

        console.log('Token stored to', TOKEN_PATH);
      });

      callback(oAuth2Client, startDate, endDate);
    });
  });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function findAvailability(auth, startDate, endDate) {
  const calendar = google.calendar({version: 'v3', auth});

  calendar.events.list({
    calendarId: 'primary',
    timeMin: startDate,
    timeMax: endDate,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) {
      return console.log('The API returned an error: ' + err);
    }

    const events = res.data.items;
    if (events.length) {
      var bufferTime = DEFAULT_BUFFER_TIME;
      var availableSlots = getAvailabilitySlots(startDate, endDate, bufferTime, events);

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // Print out the header
      rl.write(`Availability from ${moment(startDate).format(DEFAULT_DATE_FORMAT)} to ${moment(endDate).format(DEFAULT_DATE_FORMAT)}:\n`);

      // Print out the availability slot
      availableSlots.map((slot) => {
        rl.write(`\u2022 ${slot}\n`);
      });

      rl.close();
      process.stdin.destroy();
    } else {
      console.log('No upcoming events found.');
    }
  });
}

/**
 * Returns an Array of AvailablitySlot objects.
 * @param {Date} startDate The date to start looking for availability.
 * @param {Date} endDate The date to stop looking for availability.
 * @param {Date} bufferTime The amount of time buffer events with.
 * @param {object[]} events An Array of Google Calendar event objects.
 * @return {AvailabilitySlot[]} An Array of AvailablitySlot objects.
 */
function getAvailabilitySlots(startDate, endDate, bufferTime, events) {
  var availabilitySlots = [];
  var slotStartDate = startDate;
  var event;

  for (event of events) {
    const start = event.start.dateTime || event.start.date;
    const end = event.end.dateTime || event.end.date;

    var slot = new AvailabilitySlot(slotStartDate, moment(start).subtract(bufferTime, 'm').toDate());                
    availabilitySlots.push(slot);

    slotStartDate = end; // Set to end of current event
  }

  // Add any remaining availability after events.
  availabilitySlots.push(new AvailabilitySlot(slotStartDate, endDate));

  return availabilitySlots;
}

/**
 * Gets a date input from stdin by prompting the user.
 * @param {string} dateName Name of the date for output purposes.
 * @param {function} callback The result callback.
 */
function getDateInput(dateName, callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the ' + dateName + ' for availability: ', (dateStr) => {
    let date = new Date(dateStr);

    // Check for invalid dateStr
    if (!date) {
      rl.write(dateStr + ' is not in a valid date format.');
      rl.close();
      callback(null);
    }

    rl.close();
    callback(date.toISOString());
  });
}

/**
 * Takes in a time string (e.g. 5d, 1w) and returns the current
 * date/time plus the time string amount.
 * @param {string} timeStr The time string to add to the current date.
 * @returns the current date/time plus the time string amount.
 */
function calculateDate(timeStr) {
  var count = +timeStr.substr(0, timeStr.length - 1);
  var unit = timeStr.substr(timeStr.length - 1);

  return moment().add(count, unit).toDate();
}