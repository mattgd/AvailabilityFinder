const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const moment = require('moment');

// If modifying these scopes, delete token.json.
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

  /*const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });*/
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

            // TODO: Implement the following fields: buffer time, time range 
            // (9am-5pm, or 9-17), appointment length, date output format, timezone selection
            // Availbilities per day (prioritized by length of time)

            const events = res.data.items;
            if (events.length) {
              var availableSlots = [];
              var slotStartDate = startDate;

              for (event of events) {
                const start = event.start.dateTime || event.start.date;
                const end = event.end.dateTime || event.end.date;
                
                availableSlots.push(
                  moment(slotStartDate).format(DEFAULT_DATE_FORMAT) + ' to ' + 
                  moment(start).format(DEFAULT_DATE_FORMAT)
                );

                slotStartDate = end; // Set to end of current event
              }

              // Print out the header
              console.log(
                'Availability from ' + 
                moment(startDate).format(DEFAULT_DATE_FORMAT) + ' to ' + 
                moment(endDate).format(DEFAULT_DATE_FORMAT) + ':'
              );

              // Print out the availability slot
              availableSlots.map((slot, i) => {
                console.log(`\u2022 ${slot}`);
              });
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
 * Gets a date input from stdin by prompting the user.
 * @param {string} dateName Name of the date for output purposes.
 * @param {*} callback The result callback.
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