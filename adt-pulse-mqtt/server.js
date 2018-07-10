const Pulse = require('./adt-pulse.js');
const mqtt = require('mqtt');
var config = require('/data/options.json');

var myAlarm = new Pulse(config.pulse_login.username, config.pulse_login.password);
var client = new mqtt.connect("mqtt://"+config.mqtt_host,config.mqtt_connect_options);
var alarm_state_topic = config.alarm_state_topic;
var alarm_command_topic = config.alarm_command_topic;
var zone_state_topic = config.zone_state_topic;

var alarm_last_state = "unknown";
var devices = {};


// Register Callbacks:
myAlarm.onDeviceUpdate(
    function(device) {
        console.log(device);
    }
);

myAlarm.onStatusUpdate(
  function(device) {
      var mqtt_state = "unknown";
      var status = device.status.toLowerCase();

      if (status.includes('disarmed')) {
          mqtt_state = "disarmed";
      }
      if (status.includes('armed stay')) {
          mqtt_state = "armed_home";
      }
      if (status.includes('armed away')) {
          mqtt_state = "armed_away";
      }
      if (status.includes('alarm')) {
          mqtt_state = "triggered";
      }
      if (status.includes('arming')) {
          mqtt_state = "pending";
      }

      if (!mqtt_state.includes(alarm_last_state) && !mqtt_state.includes('unknown')) {
         console.log((new Date()).toLocaleString()+": Pushing alarm state: "+mqtt_state+" to "+alarm_state_topic);
         client.publish(alarm_state_topic, mqtt_state,{"retain":"true"});
         alarm_last_state = mqtt_state;
      }
  }
)

myAlarm.onZoneUpdate(
  function(device) {
    if (devices[device.id]==null){
        console.log ((new Date()).toLocaleString()+" New device: "+ device.id);
    }

    dev_zone_state_topic = zone_state_topic+"/"+device.name+"/state";

    if (devices[device.id]==null || device.activityTs!=devices[device.id].activityTs){
        console.log((new Date()).toLocaleString()+": Zone state: receieved '"+ device.id + "' will push to "+ dev_zone_state_topic+" "+ JSON.stringify(device));
        client.publish(dev_zone_state_topic, JSON.stringify(device),{"retain":"true"});
	  }
      else{
        console.log((new Date()).toLocaleString()+" Zone "+device.id+ " din't change. Skipping");
      }
      devices[device.id] = device;
  }
)

client.on('connect', () => {
  console.log((new Date()).toLocaleString()+': Connected successfully to mqtt');
})

// Login - gets all devices, zones and status and invokes callbacks:
// myAlarm.login();
myAlarm.pulse();
