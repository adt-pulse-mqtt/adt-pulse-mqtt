const Pulse = require('./adt-pulse.js');
const mqtt = require('mqtt');
var config = require('/data/options.json');

var myAlarm = new Pulse(config.pulse_login.username, config.pulse_login.password);
var client = new mqtt.connect("mqtt://"+config.mqtt_host,config.mqtt_connect_options);
var alarm_state_topic = config.alarm_state_topic;
var alarm_command_topic = config.alarm_command_topic;
var zone_state_topic = config.zone_state_topic;
var smartthings_topic = config.smartthings_topic;
var smartthings = config.smartthings;

var alarm_last_state = "unknown";
var devices = {};

client.on('connect', function () {
  console.log("MQTT Sub to: "+alarm_command_topic);
  client.subscribe(alarm_command_topic)
  if (smartthings){
      client.subscribe(smartthings_topic+"/ADT Alarm System/alarm/state")
  }
});

client.on('message', function (topic, message) {
  console.log((new Date()).toLocaleString()+" Received Message:"+ topic + ":"+message);

  if (smartthings && topic==smartthings_topic+"/ADT Alarm System/alarm/state" && message.toString().includes("_push")){
      var toState=null;

      switch (message.toString()){
        case "off_push":
          toState="disarmed";
          break;
        case "stay_push":
          toState="arm_home";
          break;
        case "away_push":
          toState="arm_away";
          break;
      }
      console.log((new Date()).toLocaleString()+" Pushing alarm state to Hass:"+toState);

      if (toState!=null){
        client.publish(alarm_command_topic, toState,{"retain":false});
      }
      return;
  }
  if (topic!=alarm_command_topic){
    return;
  }

  var msg = message.toString();
  var action;
  var prev_state="disarmed";

  if(alarm_last_state=="armed_home") prev_state = "stay";
  if(alarm_last_state=="armed_away") prev_state = "away";

  if (msg =="arm_home"){
      action= {'newstate':'stay','prev_state':prev_state};
  }
  else if (msg=="disarm") {
     action= {'newstate':'disarm','prev_state':prev_state};
  }
  else if (msg=="arm_away") {
    action = {'newstate':'away','prev_state':prev_state};
  }  else{ // I don't know this mode #5
      console.log((new Date()).toLocaleString()+" Unsupportated state requested:"+msg);
      return;
  }

  myAlarm.setAlarmState(action);
});

// Register Callbacks:
myAlarm.onDeviceUpdate(
    function(device) {
        console.log("Device callback"+ JSON.stringify(device));
    }
);

myAlarm.onStatusUpdate(
  function(device) {
      var mqtt_state = "unknown";
      var sm_alarm_value = "off";

      var status = device.status.toLowerCase();

      // smartthings bridge has no typical alarm device with stay|away|alarm|home status.
      // we'll re-use the "alarm" and map strobe|siren|both|off to stay|away|alarm|home
      // Sorry I'm too lazy to write my own smartthngs bridge for now.

      if (status.includes('disarmed')) {
          mqtt_state = "disarmed";
          sm_alarm_value = "off";
      }
      if (status.includes('armed stay')) {
          mqtt_state = "armed_home";
          sm_alarm_value = "strobe";
      }
      if (status.includes('armed away')) {
          mqtt_state = "armed_away";
          sm_alarm_value = "siren";
      }
      if (status.includes('alarm')) {
          mqtt_state = "triggered";
          sm_alarm_value = "both";
      }
      if (status.includes('arming')) {
          mqtt_state = "pending";
          sm_alarm_value = "siren"; // temporary
      }

      if (!mqtt_state.includes(alarm_last_state) && !mqtt_state.includes('unknown')) {
         console.log((new Date()).toLocaleString()+": Pushing alarm state: "+mqtt_state+" to "+alarm_state_topic);
         client.publish(alarm_state_topic, mqtt_state,{"retain":true});
         if (smartthings){
           var sm_alarm_topic = smartthings_topic+"/ADT Alarm System/alarm/cmd";
           console.log((new Date()).toLocaleString()+": Pushing alarm state to smartthings"+sm_alarm_topic);
           client.publish(sm_alarm_topic, sm_alarm_value,{"retain":false});
         }
		  alarm_last_state = mqtt_state;
      }
  }
);

myAlarm.onZoneUpdate(
  function(device) {

    var dev_zone_state_topic = zone_state_topic+"/"+device.name+"/state";
    var devValue = JSON.stringify(device);
    var sm_dev_zone_state_topic;

    // smartthings bridge assumes actionable devices have a topic set with cmd
    // adt/zone/DEVICE_NAME/state needs to turn Macintosh
    // smartthings/DEVICE_NAME/door/cmd
    // or
    // smartthings/DEVICE_NAME/motion/cmd

    if (smartthings){
      var contactType = "door";
      var contactValue= (device.status == "devStatOK")? "closed":"open";

      if (device.tags.includes("motion")) {
        contactType="motion";
        contactValue = (device.status == "devStatOK")? "inactive":"active";
      }
       sm_dev_zone_state_topic=smartthings_topic+"/"+device.name+"/"+contactType+"/cmd";
    }

    if (devices[device.id]==null || device.activityTs!=devices[device.id].activityTs){
        client.publish(dev_zone_state_topic, devValue, {"retain":false});
        console.log((new Date()).toLocaleString()+": Pushing  "+dev_zone_state_topic+" to "+devValue);

        if (smartthings){
          client.publish(sm_dev_zone_state_topic, contactValue, {"retain":false});
          console.log((new Date()).toLocaleString()+": Pushing to smartthings: "+sm_dev_zone_state_topic+" to "+contactValue);
        }
	  }
      devices[device.id] = device;
  }
);


myAlarm.pulse();
