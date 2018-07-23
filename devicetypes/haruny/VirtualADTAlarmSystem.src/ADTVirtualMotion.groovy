/**
 *   Virtual ADT Motion Sensor
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
	definition(name: "Virtual ADT Motion Sensor", namespace: "haruny", author: "Harun Yayli") {
		capability "Motion Sensor"
        capability "Sensor"
        
        command "active"
        command "inactive"
    }

	simulator {
		status "active": "active"
		status "inactive": "inactive"

	}

	tiles(scale: 2) {
		multiAttributeTile(name:"motion", type: "generic", width: 6, height: 4){
			tileAttribute("device.motion", key: "PRIMARY_CONTROL") {
				attributeState("active", label:'${name}', icon:"st.motion.motion.active", backgroundColor:"#00A0DC")
				attributeState("inactive", label:'${name}', icon:"st.motion.motion.inactive", backgroundColor:"#CCCCCC")
			}
 		}
		main "motion"
		details "motion"
	}
}

def parse(String description) {
	log.debug "description: $description"

	if (description.startsWith("active")){
		return createEvent(name:"motion", value:"active")
    }

	if (description.startsWith("inactive")){
		return createEvent(name:"motion", value:"inactive")
    }

return result
}

def active(){
	parse("active")
    sendEvent(name:"motion", value:"active")
}

def inactive(){
	parse("inactive")
    sendEvent(name:"motion", value:"inactive")
}
