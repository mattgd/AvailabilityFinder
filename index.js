const AvailabilitySlot = require('./AvailabilitySlot');

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const moment = require('moment');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'token.json';
const DEFAULT_DATE_FORMAT = 'ddd MM/DD h:mm a';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Calendar API.
  authorize(JSON.parse(content), findAvailability);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
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
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function findAvailability(auth) {
  const calendar = google.calendar({version: 'v3', auth});

  getDateInput('start date', function(startDate) {
    if (startDate) {
      getDateInput('end date', function(endDate) {
        if (endDate) {
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
              var availableSlots = getAvailabilitySlots(startDate, events);

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
      });
    }
  });
}

/**
 * Returns an Array of AvailablitySlot objects.
 * @param {object[]} events An Array of Google Calendar event objects.
 * @return {AvailabilitySlot[]} An Array of AvailablitySlot objects.
 */
function getAvailabilitySlots(startDate, events) {
  var availabilitySlots = [];
  var slotStartDate = startDate;

  for (event of events) {
    const start = event.start.dateTime || event.start.date;
    const end = event.end.dateTime || event.end.date;

    var slot = new AvailabilitySlot(slotStartDate, start);                
    availabilitySlots.push(slot);

    slotStartDate = end; // Set to end of current event
  }

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