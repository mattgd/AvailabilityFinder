# AvailabilityFinder
Finds and lists out availability from your Google Calendar.

[![Build Status](https://travis-ci.org/mattgd/AvailabilityFinder.svg?branch=master)](https://travis-ci.org/mattgd/AvailabilityFinder/)
[![codecov](https://codecov.io/gh/mattgd/AvailabilityFinder/branch/master/graph/badge.svg)](https://codecov.io/gh/mattgd/AvailabilityFinder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

### Running the App
1. Run `npm install` to install the dependencies.
2. Type `node .` to run the app.


### Developing AvailabilityFinder

To run a version of AvailabilityFinder for development, you must create a Google
Calendar API key and download your credentials JSON file.

### Using AvailabilityFinder

1. To run a basic version of the CLI, type `node . --now`.
    * This will invoke the availability finder command with the start date set 
      to now, and the end date to one week from now.
2. A prompt saying "Authorize this app by visiting this url" will appear. Paste 
   the link into your web browser to allow AvailabilityFinder read-only access 
   to your Google Calendar.