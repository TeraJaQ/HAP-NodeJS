var fs = require('fs');
var Temperature = 0.0;
// MQTT Setup
var mqtt = require('mqtt');
var options = {
  port: 1883,
  host: '127.0.0.1',
  clientId: 'ExternalTemperatureSensor'
};
var client = mqtt.connect(options);
client.on('connect', function () {
  client.subscribe('ExtTemp');
  client.publish('info','exttemperature');
});
client.on('message', function(topic, message) {
  if (topic == 'ExtTemp')
    Temperature = parseFloat(message);
});
var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
// here's a fake temperature sensor device that we'll expose to HomeKit
var TEMP_SENSOR = {
  getTemperature: function() {
    client.publish('info','exttemperature');
    return (parseFloat(Temperature));
  },
  randomizeTemperature: function() {
    TEMP_SENSOR.currentTemperature = parseFloat(Temperature);
  }
}
// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".
var sensorUUID = uuid.generate('hap-nodejs:accessories:TemperaturaEsterna');
// This is the Accessory that we'll return to HAP-NodeJS that represents our temperature sensor.
var sensor = exports.accessory = new Accessory('Temperatura Eterna', sensorUUID);
//function delay(ms) {  var start_time = Date.now();  while (Date.now() - start_time < ms);}
// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
sensor.username = "13:3D:32:2D:54:FF";
sensor.pincode = "031-45-154";
// set some basic properties (these values are arbitrary and setting them is optional)
sensor
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Jacques Fargion")
  .setCharacteristic(Characteristic.Model, "ESP8266 DS18B20")
  .setCharacteristic(Characteristic.SerialNumber, "AA-0019");
// Add the actual TemperatureSensor Service.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
sensor
  .addService(Service.TemperatureSensor, "Temperatura Esterna")
  .getCharacteristic(Characteristic.CurrentTemperature)
  .on('get', function(callback) {
    callback(null, TEMP_SENSOR.getTemperature());
  });
setInterval(function() {
  TEMP_SENSOR.getTemperature()
  TEMP_SENSOR.randomizeTemperature();
  // update the characteristic value so interested iOS devices can get notified
  sensor
    .getService(Service.TemperatureSensor)
    .setCharacteristic(Characteristic.CurrentTemperature, TEMP_SENSOR.currentTemperature);
    fs.writeFile('logValue/ExtTemp.txt', TEMP_SENSOR.currentTemperature, function (err) {
     if (err) return console.log(err);
    });
}, 30000);

