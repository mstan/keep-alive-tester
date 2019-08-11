# Keep Alive Tester

This app is a two part device app and node app written to help approximate the keep Alive requiried to operate a Particle device in a partiicular location


## Setup
- Clone this repo
- `npm install` in working directory
- `cp .env.sample .env`
- Set EMAIL and PASSWORD parameters to Particle email and password in .env file
- Flash the `device_app.ino` to your Particle cellular device
- Start Particle Device running application code
- `node app.js` in this working directory

## Notes

- By default, this application listens for event names from ANY device owned by this account. Only one unit should be run at a time for testing. If multiple units need to be run at a time, multiple instances of this node app should be run by setting the DEVICE_ID environment variable for their respective device
- The keep alive currently is set at 9 hours for these devices. This reasonably assumes that a user can test all keepAlives from 1 minute to 32 minutes in one session.
- Once a device reaches its timeout and this node application exits--the device is not reachable until its 9 hour keepAlive cycle. Once the keepAlive occurs, the device will only be reachable for its keepAlive window--afterward, one must wait for the next 9 hour keep alive cycle before it reachable again or until it is reset.
- For each test iteration, a device consumes data for handling a subscribed event and publishing an event. Tests should be used sparingly as this may consume a non-insighifcant amount of data is left unchecked.
- The starting interval is 0 minutes (meaning, the app will increment to 1 minute and then increment 1 minute for each iteration). You can change the STARTING_INTERVAL to a higher base value if you have an expected minimum value. If you set the STARTING_INTERVAL to one larger than the keepAlive, the application wll time out, and incorrectly return your STARTING_INTERVAL as the highest received value.
- 2FA is not presently supported.