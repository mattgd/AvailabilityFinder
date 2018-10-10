#!/usr/bin/env node
'use strict';

const { getAvailabilitySlots } = require('./AvailabilitySlot'),
      { convertToDate, addTimeString } = require('./DateUtil'),
      fs = require('fs'),
      {google} = require('googleapis'),
      moment = require('moment'),
      program = require('commander'),
      readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'token.json';
const DEFAULT_DATE_FORMAT = 'ddd MM/DD h:mm a';
const DEFAULT_NOW_RANGE = '1w';
const DEFAULT_BUFFER_TIME = 30;
const DEFAULT_APPOINTMENT_LENGTH = 0;

program
  .version('0.0.2')
  .description('Finds and lists out availability from your Google Calendar.')
  .option('-S, --start-date <date>', 'availability search start date')
  .option('-E, --end-date <date>', 'availability search end date')
  .option('-d, --date-format <format>', 'optional output date format')
  .option('-n, --now [range]', 'set availability start/end dates based on ' +
    'current date/time where range is days or weeks (e.g. 5d, 1w), default 1w')
  .option('-b, --buffer-time <time>', 'amount of buffer time between events and availability in minutes')
  .option('-l, --appointment-length <time>', 'length of the appointment in minutes')
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
    let startDate = program.startDate ? convertToDate(program.startDate) : new Date();
    let endDate;

    if (program.endDate) {
      endDate = convertToDate(program.endDate);
    } else {
      endDate = addTimeString(startDate, program.now !== true ? program.now : DEFAULT_NOW_RANGE);
    }

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
      var bufferTime = program.bufferTime ? +program.bufferTime : DEFAULT_BUFFER_TIME;
      var appointmentLength = program.appointmentLength ? +program.appointmentLength : DEFAULT_APPOINTMENT_LENGTH;
      var availableSlots = getAvailabilitySlots(startDate, endDate, bufferTime, 
                                                appointmentLength, events);

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
