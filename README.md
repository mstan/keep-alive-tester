# Keep Alive Tester

This app is a two part device app and node app written to help approximate the keep Alive requiried to operate a Particle device in a partiicular location


## Setup
- Clone this repo
- `npm install` in working directory
- `cp .env.sample .env`
- Using Particle CLI, generate new token using `particle token create`
- Paste new token as TOKEN value in .env file
- Flash the `device_app.bin` to your Particle cellular device
- Start Particle Device running application code
- `node app.js` in this working directory
- OPTIONAL: Set starting interval to a higher default value (default: 0)

## How this works

### What is keep alive?

All Particle cellular devices operate on UDP. By nature of UDP, a device must keep data coming to keep its connection open. If there is no activiity for a period of time, the connection will be closed. 

If a device is primarily publishing out (to the cloud), this is generally not as big of a problem as the device is able to re-establish a new connection with the tower and then talk out to a specified IP. 

### WHy is it important?

However, in the reverse, this can be VERY problematic for devices that need information sent down to them from the cloud. Once the connection is closed, the device is unreachable and there is no way to talk down to it. Even worse is if the cloud's IP were to change--the device has no way to know where it needs to send new requests.

As such, keep alive is a value set on devices that--if activity is not noticed for that period of time, keep alive sends a small payload out to keep the connection alive and healthy.

By default, Particle sets this value to be 23 minutes as a result of extensive testing. However, as Particle continues to grow and adopt new cellular partners onto the platform, it's possible that the value may be lower for these operators.

### Why is this application not just a device OS app that publishes up to the cloud?

Due to the nature of Particle's Device OS, it is built with the intent of trying to re-establish connectivity whenever it is lost. Any Particle function that intends to check the status of connectivity or make use of the current connection will acknowledge that such connectivity does not exist and will attempt to re-establish it.

For example: if Particle.publish() were used to publish out at a specified interval--even if that interval were outside the keep alive value--Particle.publish() will notice the connection is broken and try to re-establish connectivity before publishing. There is no way to make this behavior conditional.

Therefore repository is a two part application (Device side application) as well as a cloud side application (Node app) that determines what the keep alive value for a device is in a particular area.

### How the Device OS application works

The device OS application is an extremely simple application that has no looping function, only a listener. Whenever the listener receives an event, it publishes up an event as a result. 

Since the .subscribe() event does not check for the status of a connection, only incoming events, it cannot be triggered by an event it is unable to receive. This prevents .publish() from attempting to re-establish a potentially broken connection, since .subscribe() being triggered should guarantee an already healthy connection.

#### Why the 2 hour keep alive value is set

By nature of this application, the unit must go offline and become unresponsive for testing. For remote deployments, this is problematic as it renders the device unrecoverable.

Therefore, a keep alive value must be set, albeit at a high value not to interfere with standard keep alive testing. 

keep alive is only ever triggered if a device has not sent other data. Therefore, through the duration of testing, each successful subscribe will reset the keep alive from being triggered and interfereing with testing.

Most cellular operators set a very low default keep alive value, anywhere from 1.5 to 7 minutes. Particle devices intentionally have a longer keep alive. The longest observed keep alive test was 31 minutes on an Electron LTE.

By nature of how the application runs, the device will be pinged at a set interval, and then wait the duration of that interval to check whether the connection still exists. If the connection is broken, the device will be unrecoverable until it's 2 hour keep alive value is triggered. Once the keep alive is triggered, the device becomes recoverable for the duration of its keep alive timeout. If the timeout window is missed--the owner will have to wait another 2 hours before attempting to recover the device.

The 2 hour keep alive is set inentionally high to not interfere with standard testing. As 31 minutes is the highest known value at the time of this testing, it is reasonably assumed that values much higher will not be observed. Anecdotally, if a SIM card has a keep alive that exceeds 2 hours, this test will not not accurately reflect the keep alive and report an unusually high value.


### How the Node application works

The node application is a simple application that works in two parts. There is the publisher and the listener. These work in parallel to ensure activity going to and coming from the device.

An example for testing the keep alive at the 10 minute interval
-> Publisher publishes an event with a 10 minute interval
-> Publisher waits 10 minutes before attempting to send the 11 minute event
-> During the 10 minute interval, the subscriber will listen for a return from the device, returning the 10 minute message
-> At 10 minutes, the publisher attempts to send an 11 minute payload. Before it sends, it ensures that in the previous 10 minutes, the 10 minute payload was received

-> If the payload for 10 minutes was not received, the 11 minute payload does not get sent and the session is terminated, denoting 10 minutes as the timeout.

-> If the payload for 10 minutes was received, the 11 minute payload sends, repeating the process at 12 minutes.


#### The publisher

The publisher initializes on application start and sends out an immediate event. This event ensures connectivity occurred at that specific moment on the device. From hee, the publisehr waits a specified amount of time (the interval) before sending another ping. This ensures a period of inactivity where the device is not transmitting and gives the cell tower an opportunity to close a potentially inactive connection.

After the initial publish, each time the publisher is about to send a new event, it ensures that the last event sent was received by the listener. This ensures that the device was on AND that it is able to communicate out. If the previous event was not received, we can reasonably assume that either the device was not online to begin with, was turned off, or is on, but the connection was closed by the tower. Multiple tests showing a cutoff at the same value would heavily suggest the unit is indeed functionial, and that the keep alive timeout value is being reached.

### The listener

The listener runs ascynhronously to the publisher and listens for incoming events being published by devices. The intent for this listener is to update the last received value that the publisher sent.


### Preliminary results
Preliminary results to test the behavior of this device were run in Sacramento, CA using AT&T.

A device running Particle's 2G/3G capable SIM card that come with the Electron (G350,U260,U270) and embedded in the E Series 3G Global resulted in a routine 26 minute keep alive time out for Sacramento.

A device runnning Particle's embedded Boron 2G/3G, E Series, or Electron LTE embedded SIM card resulted in a routine 31 minute keep alive time out for Sacramento 

## Notes

- By default, this application listens for event names from ANY device owned by this account. Only one unit should be run at a time for testing. If multiple units need to be run at a time, multiple instances of this node app should be run by setting the DEVICE_ID environment variable for their associated device
- The keep alive set by default will be 2 hours. This is done to ensure the device is recoverable once it (intentionally) fails a keep alive ping. Under a 2 
- Once a device reaches its timeout and this node application exits--the device is not reachable until its 2 hour keepAlive cycle. Once the keepAlive occurs, the device will only be reachable for its keepAlive window--afterward, one must wait for the next 2 hour keep alive cycle before it reachable again or until it is reset.
- For each test iteration, a device consumes data for handling a subscribed event and publishing an event. Tests should be used sparingly as this may consume a non-insignifcant amount of data if left unchecked.
- The default starting interval is 0 minutes (meaning, the app will increment to 1 minute and then increment 1 minute for each iteration). You can change the STARTING_INTERVAL to a higher base value if you wish to decrease testing time. If the default STARTING_INTERVAL is too high though, the test will fail, not returning any known good intervals.