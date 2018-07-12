# adt-pulse-mqtt
ADT Pulse bridge for Home Assistant using MQTT

You'll need an MQTT broker to run this. I'm using Mosquitto broker (https://www.home-assistant.io/addons/mosquitto/)

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

Add the following to the configuration.yaml for each zone:

<pre>
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

