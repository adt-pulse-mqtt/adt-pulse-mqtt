const Pulse = require('./adt-pulse.js');
const mqtt = require('mqtt');
var config = require('/data/options.json');

var myAlarm = new Pulse(config.pulse_login.username, config.pulse_login.password);
var client = new mqtt.connect("mqtt://"+config.mqtt_host,config.mqtt_connect_options);
var alarm_state_topic = config.alarm_state_topic;
var alarm_command_topic = config.alarm_command_topic;
var zone_state_topic = config.zone_state_topic;

var alarm_last_state = "unknown";

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
      var logtime = new Date();

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
         console.log(logtime.toLocaleString()+": Pushing alarm state: "+mqtt_state+" to "+alarm_state_topic);
         client.publish(alarm_state_topic, mqtt_state,{"retain":"true"});
         alarm_last_state = mqtt_state;
      }
  }
)

myAlarm.onZoneUpdate(
  function(device) {
    console.log(logtime.toLocaleString()+": Zone state: receieved '"+ device + "' will push to "+ zone_state_topic);
  }
)

client.on('connect', () => {
  var logtime = new Date();
  console.log(logtime.toLocaleString()+': Connected successfully to mqtt');
})

// Login - gets all devices, zones and status and invokes callbacks:
// myAlarm.login();
myAlarm.pulse();
