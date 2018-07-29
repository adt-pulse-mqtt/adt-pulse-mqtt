// Forked from https://github.com/kevinmhickey/adt-pulse

var tough = require('tough-cookie');
var request = require('request');
var q = require('q');
var cheerio = require('cheerio');

//Cookie jar
var j;

//Request Configs
var ua =  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36';

var sat = '';
var lastsynckey = '';
var deviceUpdateCB = function () {};
var zoneUpdateCB = function () {};
var statusUpdateCB = function () {};

pulse = function(username, password) {

	this.authenticated = false;
	this.isAuthenticating = false;
	this.clients = [];

	this.configure({
		username: username,
		password: password
	});

	/* heartbeat */
	var pulseInterval = setInterval(this.sync.bind(this),5000);
};

module.exports = pulse;

(function() {

	this.config = {
		baseUrl: 'https://portal.adtpulse.com',
		prefix: '/myhome/10.0.0-60',
		initialURI: '/',
		signinURI: '/access/signin.jsp',
		authURI: '/access/signin.jsp?e=n&e=n&&partner=adt',
		sensorURI: '/ajax/homeViewDevAjax.jsp',
		summaryURI: '/summary/summary.jsp',
		statusChangeURI: '/quickcontrol/serv/ChangeVariableServ',
		armURI: '/quickcontrol/serv/RunRRACommand',
		disarmURI: '/quickcontrol/armDisarmRRA.jsp?href=rest/adt/ui/client/security/setArmState',
		otherStatusURI: '/ajax/currentStates.jsp',
		syncURI: '/Ajax/SyncCheckServ',
		logoutURI: '/access/signout.jsp',

		orbUrl: 'https://portal.adtpulse.com/myhome/9.7.0-31/ajax/orb.jsp' // not used
	};

	this.configure = function(options) {
		for(o in options){
			this.config[o] = options[o];
		}
	};

	this.login = function () {

		var deferred = q.defer();
		var that = this;

		if(this.authenticated){
			deferred.resolve()
		} else {
			console.log((new Date()).toLocaleString()+' Pulse: Login called Authenticating');

			j = request.jar();

			that.isAuthenticating = true;
			request(
				{
//					url: this.config.initialurl,
					url: this.config.baseUrl+this.config.initialURI, // call with no prefix to grab the prefix
					jar: j,
					headers: {
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
						'User-Agent': ua
					},
				},
				function(e, hResp, b) {
					// expecting /myhome/VERSION/access/signin.jsp
					console.log((new Date()).toLocaleString() + ' Pulse: Authentication Received Pathname: '+hResp.request.uri.pathname);

					var uriPart = hResp.request.uri.pathname.match(/\/myhome\/(.+?)\/access/)[1];
					console.log((new Date()).toLocaleString() + ' Pulse: Authentication Page Version: '+uriPart);
					that.config.prefix= '/myhome/'+uriPart;
					console.log((new Date()).toLocaleString() + ' Pulse: Authentication New URL Prefix '+ that.config.prefix);
					console.log((new Date()).toLocaleString() + ' Pulse: Authentication  Calling '+ that.config.baseUrl+that.config.prefix+that.config.authURI);
					request.post(that.config.baseUrl+that.config.prefix+that.config.authURI,
						{
							followAllRedirects: true,
							jar: j,
							headers: {
								'Host': 'portal.adtpulse.com',
								'User-Agent': ua
							},
							form:{
								username: that.config.username,
								password: that.config.password
							}
						},
						function(err, httpResponse, body){
							that.isAuthenticating = false;
							if(err || httpResponse.request.path !== that.config.prefix+that.config.summaryURI){
								that.authenticated = false;
								console.log((new Date()).toLocaleString() + ' Pulse: Authentication Failed');
								console.log((new Date()).toLocaleString() + ' Pulse: httpResponse:' + httpResponse);
								//console.log((new Date).toLocaleString() + ' Pulse: body:'+body);
								deferred.reject();
							} else {
								that.authenticated = true;
								console.log((new Date()).toLocaleString() + ' Pulse: Authentication Success');
								deferred.resolve();
								that.updateAll.call(that);
							}
						}
					);


				}
			);
		}



		return deferred.promise
	},

	this.logout = function () {

		var that = this;

		console.log((new Date()).toLocaleString() + ' Pulse: Logout');

		request(
			{
				url: this.config.baseUrl+this.config.prefix+this.config.logoutURI,
				jar: j,
				headers: {
					'User-Agent': ua
				}
			},
			function () {
				that.authenticated = false;
			}
		)
	},

	this.updateAll = function () {
		var that = this;
		console.log((new Date()).toLocaleString() + ' Pulse: updateAll');

		this.getAlarmStatus().then(function(){
			that.getDeviceStatus();
			that.getZoneStatus();
		});
	}


	this.getZoneStatus = function() {
		console.log((new Date()).toLocaleString() + ' Pulse.getZoneStatus: Getting Zone Statuses');
		var deferred = q.defer()

		request(
			{
				url: this.config.baseUrl+this.config.prefix+this.config.sensorURI,
				jar: j,
				headers: {
					'User-Agent': ua
				},
			},
			function(err, httpResponse, body) {
				if(err){
					console.log((new Date()).toLocaleString() + ' Pulse.getZoneStatus: Zone JSON Failed');
				} else {
					try {
						var json = JSON.parse(body.trim());
						json.items.forEach(function(obj){
								o = obj;
								delete o.deprecatedAction;
								o.status = obj.state.icon;
								o.statusTxt = obj.state.statusTxt;
								o.activityTs = obj.state.activityTs;
								delete o.state;
					   		zoneUpdateCB(o);
						})
					} catch(e) {
					   console.log((new Date()).toLocaleString() + ' Pulse: Invalid Zone JSON'+e.stack);
					}
				}

			}
		);

		return deferred.promise;
	},

	this.getDeviceStatus = function() { // not tested
		console.log((new Date()).toLocaleString() + ' Pulse.getDeviceStatus: Getting Device Statuses');

		request(
			{
				url: this.config.baseUrl+this.config.prefix+this.config.otherStatusURI,
				jar: j,
				headers: {
					'User-Agent': ua
				},
			},
			function(err, httpResponse, body) {
				$ = cheerio.load(body);
				$('tr tr.p_listRow').each(function(el){
					try {
						deviceUpdateCB({
							name: $(this).find('td').eq(2).text(),
							serialnumber: $(this).find('td').eq(2).find('a').attr('href').split('\'')[1],
							state: $(this).find('td').eq(3).text().trim().toLowerCase() == 'off' ? 0 : 1
						})
					}
					catch (e) {
						console.log((new Date()).toLocaleString() + ' Pulse.getDeviceStatus No other devices found');
					}
				})
			}
		);
	},

	this.onDeviceUpdate = function (updateCallback) {
		deviceUpdateCB = updateCallback;
	},
	this.onZoneUpdate = function (updateCallback) {
		zoneUpdateCB = updateCallback;
	},
	this.onStatusUpdate = function (updateCallback) {
		statusUpdateCB = updateCallback;
	},

	this.deviceStateChange = function (device) {
		console.log((new Date()).toLocaleString() + ' Pulse.deviceStateChange: Device State Change', device.name, device.state);

		var deferred = q.defer();

		request.post(this.config.baseUrl+this.config.prefix+this.config.statusChangeURI + '?fi='+device.serialnumber+'&vn=level&u=On|Off&ft=light-onoff',

			{
				followAllRedirects: true,
				jar: j,
				headers: {
					'Host': 'portal.adtpulse.com',
					'User-Agent': ua,
					'Referer': this.config.baseUrl+this.config.prefix+this.config.summaryURI
				},
				form:{
					sat: sat,
					value: device.state == 0 ? 'Off' : 'On'
				}
			},
			function(err, request, body){
				if(err){
					console.log((new Date()).toLocaleString() + ' Pulse: Device State Failure');
					deferred.reject()
				} else {
					console.log((new Date()).toLocaleString() + ' Pulse: Device State Success');
					deferred.resolve();
				}
			}
		);

		return deferred.promise;
	},

	this.getAlarmStatus = function () {
		console.log((new Date()).toLocaleString() + ' Pulse.getAlarmStatus: Getting Alarm Statuses');
		var deferred = q.defer();

		request(
			{
				url: this.config.baseUrl+this.config.prefix+this.config.summaryURI,
				jar: j,
				headers: {
					'User-Agent': ua
				},
			},
			function(err, httpResponse, body) {

				//get the sat code
				try{
					// looks like some folks have the sat value displayed differently.
					if (body.includes("setShiftState")){
					  sat = body.match(/sat\=(.+?)\'/)[1];
					}
					else{
					  sat = body.match(/sat.+value=\"(.+?)\"/)[1];
					}
				}
				catch (e){
					console.log((new Date()).toLocaleString() + ' Pulse: error getting sat ::'+ body + '::'+ e);
					deferred.reject();
					return false;
				}

				//parse the html
				$ = cheerio.load(body);
				statusUpdateCB({ status: $('#divOrbTextSummary span').text()});
				deferred.resolve();
			}
		);

		return deferred.promise;

	},

	this.setAlarmState = function (action) {
		// action can be: stay, away, disarm
		// action.newstate
		// action.prev_state

		console.log((new Date()).toLocaleString() + ' Pulse.setAlarmState Setting Alarm Status');

		var deferred = q.defer();
		var that = this;
		var url,ref;

		ref = this.config.baseUrl+this.config.prefix+this.config.summaryURI;

		if (action.newstate!='disarm'){
			// we are arming.
			if(action.isForced==true){
				url= this.config.baseUrl+this.config.prefix+this.config.armURI+'?sat=' + sat + '&href=rest/adt/ui/client/security/setForceArm&armstate=forcearm&arm=' + encodeURIComponent(action.newstate);
				ref= this.config.baseUrl+this.config.prefix+this.config.disarmURI+'&armstate='+ action.prev_state +"&arm="+action.newstate;
			}
				else{
					url= this.config.baseUrl+this.config.prefix+this.config.disarmURI+'&armstate='+ action.prev_state +"&arm="+action.newstate;
				}
		}
		else{ // disarm
			url= this.config.baseUrl+this.config.prefix+this.config.disarmURI+'&armstate='+ action.prev_state +"&arm=off";
		}

		console.log((new Date()).toLocaleString() + ' Pulse.setAlarmState calling the urls');

		request(
			{
				url: url,
				jar: j,
				headers: {
					'User-Agent': ua,
					'Referer': ref
				},
			},
			function(err, httpResponse, body) {
				if(err){
					console.log((new Date()).toLocaleString() + ' Pulse setAlarmState Failed::'+ body + "::");
					deferred.reject();
				} else {
					// when arming check if Some sensors are open or reporting motion
					// need the new sat value;
					if (action.newstate!="disarm" && action.isForced!=true && body.includes("Some sensors are open or reporting motion")){
						console.log((new Date()).toLocaleString() + ' Pulse setAlarmState Some sensors are open. will force the alarm state');

						sat = body.match(/sat\=(.+?)&href/)[1];
						console.log((new Date()).toLocaleString() + ' Pulse setAlarmState New SAT ::'+ sat + "::");
						action.isForced=true;
						that.setAlarmState(action);
						deferred.resolve(body);
					}
					else{
							// we failed?
							// Arming Disarming states are captured. No need to call them failed.
							if(!action.isForced && !body.includes("Disarming") && !body.includes("Arming")){
									console.log((new Date()).toLocaleString() + ' Pulse setAlarmState Forced alarm state failed::'+ body + "::");
									deferred.reject();
							}
					}
					console.log((new Date()).toLocaleString() + ' Pulse setAlarmState Success. Forced?:'+ action.isForced);
					deferred.resolve(body);
				}

			}
		);

		return deferred.promise;

	}

	this.pulse = function(uid) {
		console.log((new Date()).toLocaleString() + ' Pulse.pulse Spanning');

		if(this.clients.indexOf(uid) >= 0){
			console.log((new Date()).toLocaleString() + ' Pulse: Client Lost', uid);
			this.clients.splice(this.clients.indexOf(uid),1)
		} else {
			console.log((new Date()).toLocaleString() + ' Pulse: New Client', uid);
			this.clients.push(uid);
			this.sync();
		}

	}

	this.sync = function () {
		if(this.clients.length && !this.isAuthenticating){
			var that = this;
			this.login().then(function(){
				request({
					url: that.config.baseUrl+that.config.prefix+that.config.syncURI,
					jar: j,
					followAllRedirects: true,
					headers: {
						'User-Agent': ua,
						'Referer': that.config.baseUrl+that.config.prefix+that.config.summaryURI
					},
				},function(err, response, body){
					console.log((new Date()).toLocaleString() + ' Pulse.Sync: Syncing', body);
					if(err || !body || body.indexOf("<html") > -1){
						that.authenticated = false;
						console.log((new Date()).toLocaleString() + ' Pulse.Sync: Sync Failed');
					} else if (lastsynckey != body|| "1-0-0" == body) {
					 	lastsynckey = body;
					 	that.updateAll.call(that);
					 }
				})
			})

		} else {

		}

	}
}).call(pulse.prototype);
