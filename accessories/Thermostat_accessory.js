var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');

var topicCurrentTemperature = 'HOME/Termostato/Current/Temperature';
var topicCurrentHumidity = 'HOME/Termostato/Current/Humidity';
var topicTargetTemperature = "HOME/Termostato/Target/Temperature";
var topicTargetHumidity = 'HOME/Termostato/Target/Humidity';
var topicTargetHCS = 'HOME/Termostato/Target/Hcs';
var topicCurrentHCS = 'HOME/Termostato/Current/HCS';

var Temperature = 24;
var CurrentHumidity =20;
var targetHum = 40;
var targetTemp = 25;

var state = false;

var targetHeatCoolState = 0;
var currentHCS = 0;

var vuota=0;
var vuota2 = ".";

var fs = require('fs');

var options = {
  port: 1883,
  host: '127.0.0.1',
  clientId: 'Termostato_j'
};


var client = mqtt.connect(options);

client.on('connect', function () {
 client.subscribe('HOME/Termostato/#');
 client.publish('HOME/Termostato/getall','info');
 client.publish('HOME/Termostato/getStatus/Humidity','???');
 client.publish('HOME/Termostato/getStatus/Temperature','???');
});

client.on('message', function(topic, message) {
  if(topic == topicCurrentTemperature){
    Temperature = parseFloat(message);
    fs.writeFile('logValue/RoomTemp.txt', Temperature, function (err) {
     if (err) return console.log(err);
    });
  }
  else if(topic == topicCurrentHumidity){
    CurrentHumidity = parseFloat(message);
    fs.writeFile('logValue/RoomHumi.txt', CurrentHumidity, function (err) {
     if (err) return console.log(err);
    });
  }
  else if(topic == topicCurrentHCS){
    currentHCS=parseFloat(message);
    fs.writeFile('logValue/currentHCS.txt', currentHCS, function (err) {
     if (err)
      return console.log(err);
    });
   TermostatoCasa
     .getService(Service.Thermostat)
     .setCharacteristic(Characteristic.CurrentHeatingCoolingState, currentHCS);

     if(currentHCS == 0){
       fs.writeFile('logValue/RoomTargetTemp.txt', vuota2, function (err) {
        if (err)
         return console.log(err);
       });
     }
  }
  else if (topic == "HOME/Termostato/RecoveryTemperature"){
	targetTemp=parseFloat(message);
  }
  else if (topic == "HOME/Termostato/RecoveryHumidity"){
    targetHum=parseFloat(message);
  }
  else if (topic == "HOME/Termostato/RecoveryTargetHCS"){
    targetHeatCoolState=parseFloat(message);
  }
});

var TERMOSTATO_CASA = {
//number: paramsObject.id,
  current_temperature: Temperature, // celsius
  target_temperature: targetTemp,   // celsius
  current_relative_humidity: CurrentHumidity,    // 50%
  target_humidity: targetHum,
  temperature_scale: Characteristic.TemperatureDisplayUnits.CELSIUS,
  //current_heating_cooling_state: Characteristic.CurrentHeatingCoolingState.OFF,
  //target_heating_cooling_state: Characteristic.TargetHeatingCoolingState.OFF,

//  cooling_threshold_temperature: 31,
//  heating_threshold_temperature: 15,

  setTemperature: function(tmp) {
    if(tmp != targetTemp){
      TERMOSTATO_CASA.target_temperature = tmp;
      targetTemp = tmp;
      client.publish(topicTargetTemperature, targetTemp.toString());
	if(currentHCS==1){
	 fs.writeFile('logValue/RoomTargetTemp.txt', targetTemp, function (err) {
	 if (err) return console.log(err);});
	}
	 else {
	  fs.writeFile('logValue/RoomTargetTemp.txt', vuota2, function (err) {
	   if (err) return console.log(err);});
	 }
    }
  },
  setHumidity: function(hum){
    if(hum != targetHum){
     TERMOSTATO_CASA.target_humidity = hum;
     targetHum = hum;
     client.publish(topicTargetHumidity, targetHum.toString());
    }
  },
  setTargetHeatingCoolingState: function(state) {
    TERMOSTATO_CASA.target_heating_cooling_state = state;
    targetHeatCoolState = state;
    client.publish("HOME/Termostato/Target/Hcs", targetHeatCoolState.toString());
  }
}

var TermostatoCasaUUID = uuid.generate('"hap-nodejs:accessories:TermostatoCasa');

var name = "Termostato Casa"
//var serial = genMAC(paramsObject.id);

var TermostatoCasa = exports.accessory = new Accessory(name, TermostatoCasaUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
TermostatoCasa.username = "1A:AA:3C:4D:5E:AF";
TermostatoCasa.pincode = "031-45-154";

TermostatoCasa
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Jacques Fargion")
  .setCharacteristic(Characteristic.Model, "ESP-Termostat")
  .setCharacteristic(Characteristic.SerialNumber, "AA-0020");

TermostatoCasa
  .addService(Service.Thermostat, name); // services exposed to the user should have "names"
// add required Characteristics

// current temperature
TermostatoCasa
  .getService(Service.Thermostat)
  .getCharacteristic(Characteristic.CurrentTemperature)
  .on('get', function(callback) {
    TERMOSTATO_CASA.current_temperature = Temperature;
    callback(null, TERMOSTATO_CASA.current_temperature);
  });
// current relative humidity
TermostatoCasa
  .getService(Service.Thermostat)
  .getCharacteristic(Characteristic.CurrentRelativeHumidity)
  .on('get', function(callback) {
    TERMOSTATO_CASA.CurrentHumidity = CurrentHumidity;
    callback(null, TERMOSTATO_CASA.CurrentHumidity);
  });

// target temperature
TermostatoCasa
  .getService(Service.Thermostat)
  .getCharacteristic(Characteristic.TargetTemperature)
  .on('get', function(callback) {
    TERMOSTATO_CASA.target_temperature = targetTemp;
    callback(null, TERMOSTATO_CASA.target_temperature);
  })
  .on('set', function(value, callback) {
    TERMOSTATO_CASA.setTemperature(value);
    callback();
  });

// target humidity
TermostatoCasa
  .getService(Service.Thermostat)
  .getCharacteristic(Characteristic.TargetRelativeHumidity)
  .on('get', function(callback) {
    TERMOSTATO_CASA.target_humidity = targetHum;
    callback(null, TERMOSTATO_CASA.target_humidity);
  })
  .on('set', function(value, callback) {
    TERMOSTATO_CASA.setHumidity(value);
    callback();
  });
// current heating cooling state
TermostatoCasa
  .getService(Service.Thermostat)
  .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
  .on('get', function(callback) {
    TERMOSTATO_CASA.current_heating_cooling_state = currentHCS;
    callback(null, TERMOSTATO_CASA.current_heating_cooling_state);
  });

// target heating cooling state
TermostatoCasa
  .getService(Service.Thermostat)
  .getCharacteristic(Characteristic.TargetHeatingCoolingState)
  .on('get', function(callback) {
    TERMOSTATO_CASA.target_heating_cooling_state = targetHeatCoolState;
    callback(null, TERMOSTATO_CASA.target_heating_cooling_state);
  })
  .on('set', function(value, callback) {
    console.log(value);
    TERMOSTATO_CASA.setTargetHeatingCoolingState(value);
    callback();
  });

// display units (Termostato only has read)
TermostatoCasa
  .getService(Service.Thermostat)
  .getCharacteristic(Characteristic.TemperatureDisplayUnits)
  .on('get', function(callback) {
    callback(null, TERMOSTATO_CASA.display_units);
  });

  setInterval(function(){
  client.publish('HOME/Termostato/getStatus/Temperature','???');
  client.publish('HOME/Termostato/getStatus/Humidity','???');
  TermostatoCasa
    .getService(Service.Thermostat)
    .setCharacteristic(Characteristic.CurrentTemperature, Temperature);
  TermostatoCasa
    .getService(Service.Thermostat)
    .setCharacteristic(Characteristic.CurrentRelativeHumidity, CurrentHumidity);
   TermostatoCasa
    .getService(Service.Thermostat)
    .setCharacteristic(Characteristic.TargetTemperature, targetTemp);
}, 10000);


