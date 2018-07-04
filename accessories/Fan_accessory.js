var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var Value;
var power=0; 
var outTopic1='HOME/Ventilatore/SetSpeed';
var outTopic2='HOME/Ventilatore/GetSpeed';
var inTopic1 = 'HOME/Ventilatore/StatusSpeed';
var inTopic2 = 'HOME/Ventilatore/Status'

// MQTT Setup
var mqtt = require('mqtt');
var options = {
  port: 1883,
  host: '127.0.0.1',
  clientId: 'Fan'
};
var client = mqtt.connect(options);
client.on('connect', function () {

 client.subscribe(inTopic1);
 client.subscribe(inTopic2);
 client.publish(outTopic2,'?');
});
client.on('message', function(topic, message) {
 if (topic == inTopic1){
   Value = parseFloat(message);
   FAKE_FAN.rSpeed = Value;
 }
 if (topic == inTopic2)
   FAKE_FAN.powerOn = parseFloat(message);
});
// here's a fake hardware device that we'll expose to HomeKit
var FAKE_FAN = {
  powerOn: false,
  rSpeed: 100,
  setPowerOn: function(on) {
    if(on){
      //put your code here to turn on the fan
      FAKE_FAN.powerOn = on;
      client.publish(outTopic1,FAKE_FAN.rSpeed.toString())
    } else{
      //put your code here to turn off the fan
      FAKE_FAN.powerOn = on;
      client.publish(outTopic1,"0")
    }
  },
  setSpeed: function(value) {
    console.log("Setting fan rSpeed to %s", value);
    FAKE_FAN.rSpeed = value;
    client.publish(outTopic1,FAKE_FAN.rSpeed.toString())
    //put your code here to set the fan to a specific value
  },
  getPower: function() {      //to restore information from mqtt when raspberry reboot
    if(this.outputLogs) 
     console.log("'%s' is %s.", this.name, this.power ? "on" : "off");
	client.publish("HOME/Ventilatore/Status/?","?");
	return FAKE_FAN.powerOn;
  },
  getSpeedStatus: function(){   //to restore information from mqtt when raspberry reboot
    client.publish(outTopic2,'?');
    return FAKE_FAN.rSpeed;
  },
  identify: function() {
    //put your code here to identify the fan
    console.log("Fan Identified!");
  }
}
// This is the Accessory that we'll return to HAP-NodeJS that represents our fake fan.
var fan = exports.accessory = new Accessory('Fan', uuid.generate('hap-nodejs:accessories:Fan'));
// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
fan.username = "1A:22:32:42:2E:FF";
fan.pincode = "031-45-154";
// set some basic properties (these values are arbitrary and setting them is optional)
fan
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "JaQ")
  .setCharacteristic(Characteristic.Model, "Rev-1")
  .setCharacteristic(Characteristic.SerialNumber, "0025");

// listen for the "identify" event for this Accessory
fan.on('identify', function(paired, callback) {
  FAKE_FAN.identify();
  callback(); // success
});
// Add the actual Fan Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
fan
  .addService(Service.Fan, "Fan") // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    FAKE_FAN.setPowerOn(value);
    if (value){
    client.publish(outTopic1,FAKE_FAN.rSpeed.toString());
    } else {
    client.publish(client.publish(outTopic1,"0"));
    }
    callback(); // Our fake Fan is synchronous - this value has been successfully set
  });
fan
  .getService(Service.Fan)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    // this event is emitted when you ask Siri directly whether your fan is on or not. you might query
    // the fan hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.
client.publish("HOME/Ventilatore/Status/?","?");
    var err = null; // in case there were any problems

    if (FAKE_FAN.powerOn) {
      callback(err, true);
    }
    else {
      callback(err, false);
    }
});
// also add an "optional" Characteristic for spped
fan
  .getService(Service.Fan)
  .addCharacteristic(Characteristic.RotationSpeed)
  .on('get', function(callback) {
    callback(null, FAKE_FAN.rSpeed);
  })
  .on('set', function(Value, callback) {
    FAKE_FAN.setSpeed(Value);
    callback();
  })
  
setInterval(function(){
client.publish("HOME/Ventilatore/Status/?","?");
},60000);
