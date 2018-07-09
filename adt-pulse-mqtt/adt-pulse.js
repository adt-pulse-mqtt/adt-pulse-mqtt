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
		initialurl: 'https://portal.adtpulse.com/myhome/9.7.0-31/access/signin.jsp',
		authUrl: 'https://portal.adtpulse.com/myhome/9.7.0-31/access/signin.jsp?e=n&e=n&&partner=adt',
		sensorUrl: 'https://portal.adtpulse.com/myhome/9.7.0-31/ajax/homeViewDevAjax.jsp',
		orbUrl: 'https://portal.adtpulse.com/myhome/9.7.0-31/ajax/orb.jsp',
		summaryUrl: 'https://portal.adtpulse.com/myhome/9.7.0-31/summary/summary.jsp',
		statusChangeUrl: 'https://portal.adtpulse.com/myhome/9.7.0-31/quickcontrol/serv/ChangeVariableServ',
		otherStatusUrl: 'https://portal.adtpulse.com/myhome/9.7.0-31/ajax/currentStates.jsp',
		syncUrl: 'https://portal.adtpulse.com/myhome/9.7.0-31/Ajax/SyncCheckServ',
		logoutUrl: 'https://portal.adtpulse.com/myhome/9.7.0-31/access/signout.jsp'
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
			console.log('Pulse: Authenticating');

			j = request.jar();

			that.isAuthenticating = true;
			request(
				{
					url: this.config.initialurl,
					jar: j,
					headers: {
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
						'User-Agent': ua
					},
				},
				function() {
					request.post(that.config.authUrl,
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
							if(err || httpResponse.req.path !== '/myhome/9.7.0-31/summary/summary.jsp'){
								that.authenticated = false;
								console.log('Pulse: Authentication Failed');
								console.log('Pulse: httpResponse:' + httpResponse);
								console.log('Pulse: body:'+body);
								deferred.reject()
							} else {
								that.authenticated = true;
								console.log('Pulse: Authentication Success');
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

		request(
			{
				url: this.config.logoutUrl,
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
		this.getAlarmStatus().then(function(){
			that.getDeviceStatus();
			that.getZoneStatus();
		});
	}


	this.getZoneStatus = function() {
		console.log('Pulse: Getting Zone Statuses');
		var deferred = q.defer()

		request(
			{
				url: this.config.sensorUrl,
				jar: j,
				headers: {
					'User-Agent': ua
				},
			},
			function(err, httpResponse, body) {
				if(err){
					console.log('Pulse: Zone JSON Failed');
				} else {
					try {
						var json = JSON.parse(body.trim());
						json.items.forEach(function(zone){
							zone.status = zone.state.icon;
							zone.activityTs = zone.state.activityTs;
							zone.statusTxt = zone.state.statusTxt;
							delete zone.deprecatedAction;
							delete zone.devIndex;
							delete zone.state;
					   		zoneUpdateCB(zone);
						})
					} catch(e) {
					   console.log('Pulse: Invalid Zone JSON');
					}
				}

			}
		);

		return deferred.promise;
	},

	this.getDeviceStatus = function() {
		console.log('Pulse: Getting Device Statuses');

		request(
			{
				url: this.config.otherStatusUrl,
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
						console.log("No other devices found");
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
		console.log('Pulse: Device State Change', device.name, device.state);

		var deferred = q.defer();

		request.post(this.config.statusChangeUrl + '?fi='+device.serialnumber+'&vn=level&u=On|Off&ft=light-onoff',

			{
				followAllRedirects: true,
				jar: j,
				headers: {
					'Host': 'portal.adtpulse.com',
					'User-Agent': ua,
					'Referer': this.config.summaryUrl
				},
				form:{
					sat: sat,
					value: device.state == 0 ? 'Off' : 'On'
				}
			},
			function(err, request, body){
				if(err){
					console.log('Pulse: Device State Failure');
					deferred.reject()
				} else {
					console.log('Pulse: Device State Success');
					deferred.resolve();
				}
			}
		);

		return deferred.promise;
	}

	this.getAlarmStatus = function () {
		console.log('Pulse: Getting Alarm Statuses');
		var deferred = q.defer();

		request(
			{
				//url: this.config.orbUrl,
				url: this.config.summaryUrl,
				jar: j,
				headers: {
					'User-Agent': ua
				},
			},
			function(err, httpResponse, body) {

				var actions = [];

				//get the sat code
				try{
					sat = body.match(/sat.+value=\"(.+)\"/)[1];
				}
				catch (e){
					console.log('error getting sat ::'+ body + '::');
				}
				
				//parse the html
				$ = cheerio.load(body);

				//grab the action buttons
				$('#divOrbSecurityButtons input').each(function(el){

					//get the args from the onclick
					var matches = $(this).attr('onclick').match(/'([^']*)'/g);

					//remove the singl quotes
					matches.forEach(function(obj, index, arr){
						arr[index] = obj.replace(/'/gi,'');
					});

					//populate the values
					var values = {
						instance: matches[0],
						newstate:matches[1],
						units: matches[2]
					}

					//push the action
					actions.push({
						label: $(this).val(),
						values: values
					})
				})

				statusUpdateCB({
					status: $('#divOrbTextSummary span').text(),
					actions: actions
				})


				deferred.resolve();
			}
		);

		return deferred.promise;

	},



	this.setAlarmState = function (action) {

		var deferred = q.defer();

		var url = this.config.statusChangeUrl+'?rtn=xml&fi='+encodeURIComponent(action.instance)+'&vn=arm-state&u='+encodeURIComponent(action.units)+'&ft=security-panel&sat=' + sat + '&value=' + encodeURIComponent(action.newstate);

		request(
			{
				url: url,
				jar: j,
				headers: {
					'User-Agent': ua,
					'Referer': 'https://portal.adtpulse.com/myhome/9.7.0-31/summary/summary.jsp'
				},
			},
			function(err, httpResponse, body) {
				if(err){
					onsole.log('Pulse setAlarmState Failed');
					deferred.reject()
				} else {
					console.log('Pulse setAlarmState Success');
					console.log(body);
					deferred.resolve(body);
				}

			}
		);

		console.log(action);

		return deferred.promise;

	}

	this.pulse = function(uid) {
		if(this.clients.indexOf(uid) >= 0){
			console.log('Pulse: Client Lost', uid);
			this.clients.splice(this.clients.indexOf(uid),1)
		} else {
			console.log('Pulse: New Client', uid);
			this.clients.push(uid);
			this.sync();
		}

	}

	this.sync = function () {
		if(this.clients.length && !this.isAuthenticating){
			var that = this;
			this.login().then(function(){
				request({
					url: that.config.syncUrl,
					jar: j,
					followAllRedirects: true,
					headers: {
						'User-Agent': ua,
						'Referer': 'https://portal.adtpulse.com/myhome/9.7.0-31/summary/summary.jsp'
					},
				},function(err, response, body){
					console.log('Pulse: Syncing', body);
					if(err || !body || body.indexOf("<html") > -1){
						that.authenticated = false;
						console.log('Pulse: Sync Failed');
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
