void handler(const char *event, const char *data) {
    Serial.print(event);
    Serial.print(", received subscribe event after minutes: ");
    Serial.println(data);
    Particle.publish("kareturn", data, NO_ACK);
}

void setup()
{
	/*
		Highest observed test was a KORE SIM with a 31 minute timeout. 
		If we were to test all iterations 1-31, that comes up to 492 minutes, or 8.26667 hours.
		We want to be able to comprehensively test up to this limit, so we round up to 9 hours, or 540 minutes
		We want a non zero timeout to actually allow the system to be recovered in a remote deploy.
	*/
 	Particle.keepAlive(9 * 60 * 60); the device DOES fall offline, it will have a way to be remotely recovered every hour.
	Particle.subscribe("katest", handler, MY_DEVICES);
	Serial.begin(9600);
}

void loop() {}
