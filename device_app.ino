void handler(const char *event, const char *data) {
    Serial.print(event);
    Serial.print(", received subscribe event after minutes: ");
    Serial.println(data);
    Particle.publish("kareturn", data, NO_ACK);
}

void setup()
{
 	Particle.keepAlive(2 * 60 * 60); the device DOES fall offline, it will have a way to be remotely recovered every other hour.
	Particle.subscribe("katest", handler, MY_DEVICES);
	Serial.begin(9600);
}

void loop() {}
