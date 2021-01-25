[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/digitalcraig/adt-pulse-mqtt) [![Build Status](https://travis-ci.com/digitalcraig/adt-pulse-mqtt.svg?branch=master)](https://travis-ci.com/digitalcraig/adt-pulse-mqtt) [![Coverage Status](https://coveralls.io/repos/github/digitalcraig/adt-pulse-mqtt/badge.svg)](https://coveralls.io/github/digitalcraig/adt-pulse-mqtt) 

# adt-pulse-mqtt
ADT Pulse bridge for Home Assistant using MQTT. 

Integrates ADT Pulse to Home Assistant. You can also choose to add the ADT Pulse alarm system and ADT devices to your SmartThings.
SmartApp allows automatic running our Routines upon alarm changing states.

## Hassio Setup
Add the repository (https://github.com/digitalcraig/adt-pulse-mqtt) to Hassio.
Hit Install. Don't forget to configure `pulse_login` with your ADT Pulse Portal username and password. I recommend using a separate login for Home Assistant use. 
You'll need an MQTT broker to run this. I'm using Mosquitto broker (https://www.home-assistant.io/addons/mosquitto/).

In most cases, the mqtt_host option and the mqtt username and password options are sufficient. 
For advanced confgurations, you may want to use the mqtt_url option instead. Additional connections options are available (see https://www.npmjs.com/package/mqtt#connect).

### Configuration
Change the config of the app in hassio then edit the configuration.yaml:

To add the control panel:

<pre>alarm_control_panel:
  - platform: mqtt
    name: "ADT Pulse"
    state_topic: "home/alarm/state"
    command_topic: "home/alarm/cmd"
    payload_arm_home: "arm_home"
    payload_arm_away: "arm_away"
    payload_disarm: "disarm"
</pre>

After running the add-on, get a list all the zones found. There are a couple of ways to do this, but they all involve subscribing to the wildcard topic "adt/zones/#".

I recommend the MQTT Snooper app on Android or just use the mosquito command-line command:

<pre>
# mosquitto_sub -h YOUR_MQTT_IP -v -t "adt/zone/#"
</pre>

Once you know the names of MQTT topics for your zones, add the following to the configuration.yaml for each zone in binary_sensor:

<pre>
binary_sensor:
  - platform: mqtt
    name: "Kitchen Door"
    state_topic: "adt/zone/Kitchen Door/state"
    payload_on: "devStatOpen"
    payload_off: "devStatOK"
    device_class: door
    retain: true
</pre>

This will provide basic support for door sensors. You can add additional binary sensors for other possible state values. As an example, you can add support for a low battery condition on a sensor.
<pre>
binary_sensor:
  - platform: mqtt
    name: "Kitchen Door Sensor Battery"
    state_topic: "adt/zone/Kitchen Door/state"
    payload_on: "devStatLowBatt"
    payload_off: "devStatOK"
    device_class: battery
</pre>

Note: State topic names come from your Pulse configuration.

The possible state values are:

  * devStatOK (device okay)
  * devStatOpen (door/window opened)
  * devStatMotion (detected motion)
  * devstatLowBatt: (low battery condition)
  * devStatTamper (glass broken or device tamper)
  * devStatAlarm (detected CO/Smoke)
  * devStatUnknown (device offline)

I'm limited with what I have as zones, for different devices please submit your MQTT dump (for the zones) in issues. I'll try to add the support for it.

## Smartthings Support

* In Hassio, setting of the ADT Pulse MQTT set

<pre>
"smartthings": true
</pre>

* In SmartThings IDE,

1. add the following devicehandlers:
https://github.com/haruny/adt-pulse-mqtt/tree/master/devicetypes/haruny/VirtualADTAlarmSystem.src 
1. add the following SmartApp: 
https://github.com/haruny/adt-pulse-mqtt/tree/master/smartapps/haruny/ADTAlarmSmartApp.src
1. Add your devices using SmartThings IDE. You have to name them the same way they appear in ADT Portal.
1. Run the SmartApp in your mobile application. Follow the instructions. Do not rename ADT Alarm System device created by the app. Multiple alarm systems/locations is not supported.
1. In MQTT Bridge app, select all the devices created (Alarm system, contacts, motion etc.)
