/**
 *  ADT Alarm SmartApp
 *
 *  v.0.0.3
 *  Copyright 2018 HARUN YAYLI
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
definition(
    name: "ADT Alarm SmartApp",
    namespace: "haruny",
    author: "Harun Yayli",
    description: "The app creates a virtual ADT alarm panel and allows you to run routines depending on the alarm status.\r\nTo be used in junction with ADT MQTT Bridge.\r\nhttps://github.com/haruny/adt-pulse-mqtt",
    category: "Safety & Security",
    iconUrl: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience.png",
    iconX2Url: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience@2x.png",
    iconX3Url: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience@2x.png")


preferences {
    page(name: "selectActions")
}

def selectActions() {
    dynamicPage(name: "selectActions", title: "Select what happens when the alarm turns into the specified state", install: true, uninstall: true) {
        def actions = location.helloHome?.getPhrases()*.label
		
        section("Select Hub"){
        	input "theHub", "hub", title: "Select the hub for the alarm device to be installed ", multiple: false, required: true
    	}
        if (actions) {
            actions.sort()

            section("Disarm Actions") {
                    input "actionDisarm", "enum", title: "Select a routine to execute when disarm:", options: actions, required: false
            }
            section("Disarm Trigger Routine") {
                    input "triggerDisarm", "enum", title: "Select a routine to disarm the alarm after its triggered:", options: actions, required: false
            }
            section("Stay Actions") {
                    input "actionStay", "enum", title: "Select a routine to execute when armed as Stay:", options: actions, required: false
            }
            section("Stay Trigger Routine") {
                    input "triggerStay", "enum", title: "Select a routine to arm the alarm as stay after its triggered:", options: actions, required: false
            }
            section("Away Actions") {
                 input "actionAway", "enum", title: "Select a routine to execute when armed as Away:", options: actions, required: false
            }

			section("Away Trigger Routine") {
                 input "triggerAway", "enum", title: "Select a routine to arm the alarm as Away after its triggered:", options: actions, required: false
            }
			section("Alarm Actions") {
                 input "actionAlarm", "enum", title: "Select a routine to execute when alarm is triggered", options: actions, required: false
            }
        }
        else{
        	section("No Routines found!"){
	        	paragraph "No Routines found. Create routines and try again."
            }
        }
        
        section("Finally"){
			paragraph "Don't forget to select the alarm device in the MQTT Bridge app. When you remove this app, Virtual ADT device will be removed. Before removing the app, remove the device from MQTT Bridge"
		}
 
   }
}
    
def installed() {
	log.debug "Installed with settings: ${settings}"
    if (getAllChildDevices().size() == 0) {
		def adtDevice = addChildDevice("haruny", "Virtual ADT Alarm System", "adtvas", theHub.id, [completedSetup: true, label: "ADT Alarm System"])
	}
	initialize()
}

def routineChanged(evt) {

	if (settings.triggerStay!=null && settings.triggerStay==evt.displayName){
		    log.debug "ADT Alarm App caught an evt: ${evt.displayName} will push Stay button"
        	getChildDevice("adtvas").stay_push();
    }

	if (settings.triggerDisarm!=null && settings.triggerDisarm==evt.displayName){
		    log.debug "ADT Alarm App caught an evt: ${evt.displayName} will push Disarm button"
        	getChildDevice("adtvas").off_push();
    }

if (settings.triggerAway!=null && settings.triggerAway==evt.displayName){
		    log.debug "ADT Alarm App caught an evt: ${evt.displayName} will push Away button"
        	getChildDevice("adtvas").away_push();
    }


}

def uninstalled() {
    getAllChildDevices().each {
        deleteChildDevice(it.deviceNetworkId)
    }
}

def updated() {
	log.debug "Updated with settings: ${settings}"

	unsubscribe()
	initialize()
}

def adtEventHandlerMethod(evt){
	log.debug "Alarm had an event ${evt.value}"
    
    switch (evt.value){
    	case "off":
        	if (settings.actionDisarm!=null){
            	log.debug "Calling debug routine ${settings.actionDisarm}"
                location.helloHome?.execute(settings.actionDisarm)
            }
        	break;
    	case "stay":
        	if (settings.actionStay!=null){
            	log.debug "Calling debug routine ${settings.actionStay}"
                location.helloHome?.execute(settings.actionStay)
            }
        	break;
       	case "away":
        	if (settings.actionAway!=null){
            	log.debug "Calling debug routine ${settings.actionAway}"
                location.helloHome?.execute(settings.actionAway)
            }
        	break;
    	case "triggered":
           	if (settings.actionAlarm!=null){
            	log.debug "Calling debug routine ${settings.actionAlarm}"
                location.helloHome?.execute(settings.actionAlarm)
            }
    	    break;
        default:
        	log.debug "Unknown event ${evt.value}"
	        break;

    }
    
}
def initialize() {
	if (getAllChildDevices().size() != 0) {
    	getAllChildDevices().each{
        	subscribe(it, "alarm", "adtEventHandlerMethod") 
        }
    }
    subscribe(location, "routineExecuted", routineChanged)

}