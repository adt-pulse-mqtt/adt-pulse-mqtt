# adt-pulse-mqtt
ADT Pulse bridge for Home Assistant using MQTT. 

Integrates ADT Pulse to Home Assistant. You can also choose to add the ADT Pulse alarm system and ADT devices to your SmartThings.
SmartApp allows automatic running our Routines upon alarm changing states.

## Hassio Setup
Add the repository (https://github.com/haruny/adt-pulse-mqtt/) to Hassio.
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

After running the add-on, to list all the zones found, you can call:
<pre>
# mosquitto_sub -h YOUR_MQTT_IP -v -t "adt/zone/#"
</pre>

Add the following to the configuration.yaml for each zone in binary_sensor:

<pre>
binary_sensor:
  - platform: mqtt
    name: "Kitchen Door"
    state_topic: "adt/zone/Kitchen Door/state"
    payload_on: "devStatOpen" # Use devStatTamper for shock devices
    payload_off: "devStatOK" # 
    device_class: door
    retain: true
    value_template: '{{ value_json.status }}' 
</pre>
Note: State topic names come from your Pulse configuration.

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





