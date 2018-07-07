var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');
var outTopic1='HOME/Ventilatore/SetSpeed';
var outTopic2='HOME/Ventilatore/GetSpeed';
var outTopic3='HOME/Ventilatore/SetPower';
var outTopic4='HOME/Ventilatore/GetPower';
var inTopic1 = 'HOME/Ventilatore/Status/Speed';
var inTopic2 = 'HOME/Ventilatore/Status/Power'
var pwr = 0;
var targetSpeed = 50;
var speed = 50;
// MQTT Setup
var mqtt = require('mqtt');

var options = {
  port: 1883,
  host: '127.0.0.1',
  clientId: 'Fan'
};
var client = mqtt.connect(options);
client.on('connect', function () {
 //console.log("subscribing to status feed");
 client.subscribe(inTopic1);
 client.subscribe(inTopic2);
 client.publish(outTopic2,'?');
 client.publish(outTopic4,'?');
});

client.on('message', function(topic, message) {
  //console.log(parseFloat(message));
  if (topic == inTopic1){
   speed = parseFloat(message);
   FAKE_FAN.target_speed = speed;
   fan
    .getService(Service.Fan)
    .setCharacteristic(Characteristic.RotationSpeed,speed );
   }
   else if (topic == inTopic2){
     pwr = parseFloat(message);
     FAKE_FAN.powerOn = pwr;
     fan
      .getService(Service.Fan)
      .setCharacteristic(Characteristic.On,pwr);
   }
});

var FAKE_FAN = {
  setPowerOn: function(on) {
    pwr = on;
    if(on){
      //put your code here to turn on the fan
      FAKE_FAN.powerOn = on;
      client.publish(outTopic3, on.toString())
    } else{
      //put your code here to turn off the fan
      FAKE_FAN.powerOn = on;
      client.publish(outTopic3, on.toString())
    }
  },
  setSpeed: function(value) {
    targetSpeed = value;
    FAKE_FAN.target_speed = value;
    console.log("Setting fan rSpeed to %s", value);
    client.publish(outTopic1, value.toString());
  },
  identify: function() {
    console.log("Fan Identified!");
  }
}
var name = "Ventilatore"
var fan = exports.accessory = new Accessory(name, uuid.generate('hap-nodejs:accessories:Ventilatore'));

fan.username = "1A:22:32:EA:2E:FF";
fan.pincode = "031-45-154";

fan
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Jacques Fargion")
  .setCharacteristic(Characteristic.Model, "ESP-FAN")
  .setCharacteristic(Characteristic.SerialNumber, "AA-0004");

fan.on('identify', function(paired, callback) {
  FAKE_FAN.identify();
  callback(); // success
});

fan
  .addService(Service.Fan, "Ventilatore")
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    FAKE_FAN.powerOn = pwr;
    callback(null, FAKE_FAN.powerOn);
});

fan
  .getService(Service.Fan,) // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    FAKE_FAN.setPowerOn(value);
    callback(); // Our fake Fan is synchronous - this value has been successfully set
});

fan
  .getService(Service.Fan)
  .addCharacteristic(Characteristic.RotationSpeed)
  .on('get', function(callback) {
    FAKE_FAN.target_speed = targetSpeed;
    callback(null, FAKE_FAN.target_speed);
  })
  .on('set', function(Value, callback) {
    FAKE_FAN.setSpeed(Value);
    callback();
})

setInterval(function(){
client.publish(outTopic2,'?');
 client.publish(outTopic4,'?');
},10000);

