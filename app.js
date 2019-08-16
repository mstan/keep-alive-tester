require('dotenv').config();

let INTERVAL = parseInt(process.env.STARTING_INTERVAL) || 10; // In minutes, the amount of time to wait before sending next time.
let INTERVAL_RECEIVED = parseInt(process.env.STARTING_INTERVAL) || 10; // The last published interval returned from one of our devices.

const DEVICE_ID = process.env.DEVICE_ID;
const TOKEN = process.env.TOKEN; // `particle token create`

const Particle = require('particle-api-js');
const particle = new Particle();

let handler; // a globally scoped variable to be bound to for the setTimeout() to reschedule to each time.

let responses = 0;

// a function for publishing an event to the cloud
function publishEvent(interval) {
	let options = {
		name: "katest",
		data: interval,
		isPrivate: true,
		auth: TOKEN
	}

	particle.publishEvent(options)
		.then( (data) => {
			console.log(`Published keepAlive event for ${INTERVAL}`);
		}, 
		(err) => {
			console.log(err);
		})
}

// a stream listener to listen for devices that ping back from the cloud.
function setEventListener() {
	const options = {
		name: "kareturn",
		auth: TOKEN,
	}
	if(DEVICE_ID) { options.deviceId = DEVICE_ID; }

	particle.getEventStream(options)
		.then((stream) => {
			stream.on('event', function(data) {
				if(data && data.data) {
					initialResponse = true; // an initial value was received, so we know it's online to some extent!
					responses++;
					INTERVAL_RECEIVED = data.data;
					console.log(`Received response from device for interval of ${INTERVAL_RECEIVED}`);
				}
			},
			(err) => {
				throw new Error(err);
			})
		})
}

// a handler function scheduled for each iteration. 
// each execution it ensures the last ping was received, then proceeds to increment by one
// it then publishes a new event and reschedules the event to occur again at the next interval
function setHandler() {
	if(INTERVAL != INTERVAL_RECEIVED) {
		if(responses == 0) {
			console.log('No pings were ever returned:');
			console.log('- Please confirm that your unit is online and running the test firmware');
			console.log('- Ensure tests are being run promptly after start. Your unit may have already fallen outside its keep alive window');
			console.log('- Consider reducing your initial keep alive test value. It might be too high');
		} else if(responses == 1) {
			console.log('Only the initial ping was returned. Your device is online, but your initial keep alive test value could be too high.');
			console.log('Consider reducing your initial test value');
		} else {
			console.log('The last ping was not returned. Break sequence.')
			console.log(`The highest returned value was ${INTERVAL_RECEIVED}`);			
		}
		process.exit(0);

	}

	INTERVAL++; // increment 
	publishEvent(INTERVAL); //publish a new event to be handled

	// schedule another iteration at the specified offset.
	handler = setTimeout( () => {
		setHandler();
	}, INTERVAL * 60 * 1000);
}

setEventListener();
setHandler();