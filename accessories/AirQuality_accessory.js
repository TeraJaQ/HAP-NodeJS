var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var fs = require('fs');

var AirQualityValue = 0;
var AirQualityAlarm = 0;

// MQTT Setup
var mqtt = require('mqtt');
console.log("HomeKit Smoke Sensor Connecting to MQTT broker...");
var mqtt = require('mqtt');
var options = {
  port: 1883,
  host: '127.0.0.1',
  clientId: 'AirQuality'
};
var client = mqtt.connect(options);
console.log("HomeKit AirQuality Sensor Connecting to MQTT broker...");
client.subscribe('AirQuality');
client.on('message', function(topic, message) {
  console.log("MQTT Air Quality  message arrived");
  console.log(parseFloat(message));
  if (topic == 'AirQuality'){
    AirQualityValue = parseFloat(message);

   if ((AirQualityValue > 0) && (AirQualityValue <= 1000))
	AirQualityAlarm = 1;
   if ((AirQualityValue > 1000) && (AirQualityValue <= 2000))
	AirQualityAlarm = 2;
   if ((AirQualityValue > 2000) && (AirQualityValue <= 5000))
        AirQualityAlarm = 3;
   if ((AirQualityValue > 5000) && (AirQualityValue <= 8000))
        AirQualityAlarm = 4;
   if (AirQualityValue > 8000)
        AirQualityAlarm = 5;
   }
});

var AIR_QUALITY_SENSOR = {
  getAirQualityValue: function() {
    console.log("Ottengo la qualità dell'aria...");
    client.publish('get/AirQuality','???');
    AIR_QUALITY_SENSOR.AirQuality = AirQualityAlarm;
    return (AIR_QUALITY_SENSOR.AirQuality);
},
  setAirQualityValue: function() {
    AIR_QUALITY_SENSOR.AirQuality = AirQualityAlarm;
  }
}
// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".

var sensorUUID = uuid.generate('hap-nodejs:accessories:AirQualitySensor');
var sensor = exports.accessory = new Accessory('AirQualitySensor', sensorUUID);

sensor.username = "14:1D:3B:25:2A:AA";
sensor.pincode = "031-45-154";
// set some basic properties (these values are arbitrary and setting them is optional)

sensor
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Jacques Fargion")
  .setCharacteristic(Characteristic.Model, "MQ-135")
  .setCharacteristic(Characteristic.SerialNumber, "AA-1234");

sensor
  .addService(Service.AirQualitySensor, "AirQualitySensor")
  .getCharacteristic(Characteristic.AirQuality)
  .on('get', function(callback) {
    // return our current value
    callback(null, AirQualityAlarm);
  });

  setInterval(function() {
  AIR_QUALITY_SENSOR.getAirQualityValue()
  AIR_QUALITY_SENSOR.setAirQualityValue();

  // update the characteristic value so interested iOS devices can get notified
  sensor
    .getService(Service.AirQualitySensor)
    .setCharacteristic(Characteristic.CarbonDioxideLevel, AirQualityValue);

  sensor
    .getService(Service.AirQualitySensor)
    .setCharacteristic(Characteristic.AirQuality, AIR_QUALITY_SENSOR.AirQuality);
    //.setSmokeValue(Characteristic.SmokeDetected, SmokeValue);
    fs.writeFile('logValue/AirQuality.txt', AirQualityValue, function (err) {
     if (err) return console.log(err);
    });
}, 5000);
