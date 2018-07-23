/**
 *   Virtual ADT Alarm System
 *
 *  Copyright 2018 Harun Yayli
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License. You may obtain a copy of the License at:
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License
 *  for the specific language governing permissions and limitations under the License.
 *
 */

metadata {
	definition (name: "Virtual ADT Alarm System", namespace: "haruny", author: "Harun Yayli") {
		capability "Alarm"
		capability "Sensor"
		capability "Actuator"
        
        command "stay"
        command "away"
	}

	tiles(scale: 2) {
		multiAttributeTile(name:"alarm", type: "generic", width: 6, height: 4){
            tileAttribute ("device.alarm", key: "PRIMARY_CONTROL") {
                attributeState "off", label:'Off' , icon:"st.security.alarm.off", backgroundColor:"#cccccc" // gray
                attributeState "stay", label:'Stay', icon:"st.Home.home4", backgroundColor:"#00a0dc" // blue
                attributeState "away", label:'Away', icon:"st.security.alarm.on", backgroundColor:"#e86d13" // orange
                attributeState "triggered", label:'Burglar Alarm!', icon:"st.alarm.alarm.alarm", backgroundColor:"#e81323" //red
            }
		}
		// off
		standardTile("off", "device.alarm", inactiveLabel: false, decoration: "flat", width: 2, height: 2) {
            state "default", label:'Off', action:"alarm.off", icon:"st.security.alarm.off", background:"#ffffff", nextState:"pending"
            state "pending", label:'Pending'                , icon:"st.security.alarm.off", nextState:"default"
        }
		// stay
        standardTile("strobe", "device.alarm", inactiveLabel: false, decoration: "flat", width: 2, height: 2) {
           state "default", label:'Stay', action:"alarm.strobe", icon:"st.Home.home4", background:"#ffffff", nextState:"pending"
           state "pending", label:'Pending'                     , icon:"st.Home.home4", nextState:"default"
        }
		//away
        standardTile("siren", "device.alarm", inactiveLabel: false, decoration: "flat", width: 2, height: 2) {
            state "default", label:'Away', action:"alarm.siren", icon:"st.security.alarm.on", background:"#ffffff", nextState:"pending"
            state "pending", label:'Pending'                   , icon:"st.security.alarm.on", nextState:"default"
        }
        
		main "alarm"
        details(["alarm","off","strobe","siren"])
   }
}

// stay
def strobe() {
    stay()
}
// away
def siren() {
	away()
}
// triggerred alarm
def both() {
	alarmTriggered()
}
def stay(){
    sendEvent(name: "alarm", value: "stay")
    log.trace "Device Stay"
}
def away(){
   sendEvent(name: "alarm", value: "away")
   log.trace "Device Away"
}
// off
def off() {
   sendEvent(name: "alarm", value: "off")
   log.trace "Device Off"
}

def alarmTriggered(){
	sendEvent(name: "alarm", value: "triggered")
    log.trace "Alarm Triggered"
}

def parse(String description) {
// no use!
}
