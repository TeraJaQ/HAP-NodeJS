var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var fs = require('fs');

var SmokeValue = 0;
var SmokeAlarm = 0;

// MQTT Setup
var mqtt = require('mqtt');
console.log("HomeKit Smoke Sensor Connecting to MQTT broker...");
var mqtt = require('mqtt');
var options = {
  port: 1883,
  host: '127.0.0.1',
  clientId: 'SmokeSensor'
};
var client = mqtt.connect(options);
console.log("HomeKit Smoke Sensor Connecting to MQTT broker...");
client.subscribe('SmokeSensor');
client.on('message', function(topic, message) {
  console.log("MQTT SmokeSensor message arrived");
  console.log(parseFloat(message));
  if (topic == 'SmokeSensor'){
    SmokeValue = parseFloat(message);
   if (SmokeValue > 120)
	SmokeAlarm = 1;
   if (SmokeValue <=120)
	SmokeAlarm = 0;
   }
});

var SMOKE_SENSOR = {
  getSmokeValue: function() { 
    console.log("Ottengo la temperatura esterna...");
    client.publish('get/SmokeSensor','???');
    SMOKE_SENSOR.SmokeDetected = SmokeAlarm;
    return (SMOKE_SENSOR.SmokeDetected);  
},
  setSmokeValue: function() {
    SMOKE_SENSOR.SmokeDetected = SmokeAlarm;
  }
}
// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".

var sensorUUID = uuid.generate('hap-nodejs:accessories:SmokeSensor');
var sensor = exports.accessory = new Accessory('Smoke Sensor', sensorUUID);

sensor.username = "14:1D:3A:25:54:FF";
sensor.pincode = "031-45-154";
// set some basic properties (these values are arbitrary and setting them is optional)

sensor
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Jacques Fargion")
  .setCharacteristic(Characteristic.Model, "GasSensor V2")
  .setCharacteristic(Characteristic.SerialNumber, "AA-1234");

  sensor
  .addService(Service.SmokeSensor, "Smoke Sensor")
  .getCharacteristic(Characteristic.SmokeDetected)
  .on('get', function(callback) {
    // return our current value
    callback(null, SmokeAlarm);
  });

  setInterval(function() {
  SMOKE_SENSOR.getSmokeValue()
  SMOKE_SENSOR.setSmokeValue();

  // update the characteristic value so interested iOS devices can get notified

  sensor
    .getService(Service.SmokeSensor)
    .setCharacteristic(Characteristic.SmokeDetected, SMOKE_SENSOR.SmokeDetected);
    //.setSmokeValue(Characteristic.SmokeDetected, SmokeValue);
    fs.writeFile('logValue/Smoke.txt', SmokeValue, function (err) {
     if (err) return console.log(err);
    });
}, 5000);
