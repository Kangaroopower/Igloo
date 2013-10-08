/*global mw:true */
/* This is my personal javascript library which I call Flash */
/* Copyright (c) 2012-2013 Kangaroopower under the MIT License */
/* It can: 
	a) gather virtually all tokens (save patrol and perhaps some WMF specific ones) 
	b) do virtually any action save WMF ones like pagetriage and articlefeedback
	c) Perform queries (limited for now, to be expanded in the next version)
*/

/* DISCLAIMER: BEFORE 1.0 IT CAN AND WILL GO THROUGH CHANGES THAT MAY BREAK THE API */
$(function () {


	//Constants
	var QUERY = 1, ACTION = 2, SPECIAL = 3;

	//Version
	var version = "0.93.2 Hydra";

	//Holds all the modules
	var modules = {};

	/*** CONSTRUCTORS ***/

	//This is called once, by the Flash variable at the bottom of this script
	var Flash_main = function () {
		this.go = function (module, ret) {
			//getting the version is a special request that we do here to save memory
			if (module === 'version') {
				return version;
			} else {
				//Otherwise...
				//we could technically do everything in the Flash_main class
				//but I prefer to have new instances for each new request
				return new door(module);
			}
		};
	};

	//door is the class that actually executes the request
	//The reason that we cant do the code in Flash_main is because if we executed the queries
	//there then all the requests would go through one instance of the class because the Flash_main
	//object is only created once. Instead, in Flash_main, all we do is create a new door from which
	//all the code is executed, so there is a new instance of the door class for each request
	var door = function (module) {
		module = module === 'delete' ? 'del' : module;

		this.token = '';
		this.module = module;
		this.reqType = modules[module].reqType;
		this.params = {};
		this.callback = function () {};
		this.failure = function () {};
	};

	/*** PRIVATE FUNCTIONS ***/

	/* Logs stuff */
	var log = (window.console && function () {
		var args = Array.prototype.slice.call(arguments);
		args.unshift('Flash:');
		return window.console.log.apply(window.console, args);
	}) || $.noop;

	/* Does ajax call to API */
	var ajax = function (type, url, token, cb, onfail, extraInfo) {
		var realcb;

		type = type.toLowerCase();
		extraInfo = extraInfo || {};
		onfail = onfail || function () {};

		if (type === "get") {
			realcb = token;
		} else if (type === "post") {
			realcb =  cb;

			if (token !== false) {
				extraInfo.token = token;
			}
		}

		$.ajax({
			url: mw.util.wikiScript('api')+url+'&format=json',
			type: type.toUpperCase(),
			dataType: 'json',
			data: extraInfo
		}).done(function (data) {
			realcb(data);
		}).fail(function (data) {
			onfail(data);
		});
	};

	/* Checks for most modern type of storage */
	var storageCheck = function (sStorage) {
		var ret;

		sStorage = sStorage || false;

		if (sStorage) {
			if (typeof sessionStorage !== "undefined") {
				if (typeof globalStorage !== "undefined") {
					ret = 'globalStorage';
				} else {
					ret = 'sessionStorage';
				}
			} else {
				ret = false;
			}
		} else {
			if (typeof localStorage !== "undefined") {
				ret = 'localStorage';
			} else if (typeof globalStorage !== "undefined") {
				ret = 'globalStorage';
			} else {
				ret = 'cookie';
			}
		}

		return ret;
	};

	/* Start Token calls */

	/* This gets all tokens that are accessible from ?action=tokens */
	var getToken = function(module, targ, url, callback, failure, extra) {
		log("Module:", module);

		module = module.toLowerCase();

		module = module === 'del' ? 'delete' : module;
		module = module === 'preferences' ? 'options' : module;

		// verification
		if (module.match(/(rollback|userrights|undelete)/)) specialToken(module, targ, url, callback, failure, extra);
		if (!module.match(/(edit|delete|protect|move|block|options|unblock|email|import|watch)/)) return false;
		// go
		var tURL = '?action=tokens&type='+module;
		
		ajax("get", tURL, function (data) {
			var token = data.tokens[module+"token"];
			ajax("post", url, token, callback, failure, extra);
		});
	};

	/* This gets tokens not accessible from ?action=tokens */
	var specialToken = function(module, targ, url, callback, failure, extra) {
		var token;
		
		extra = extra || {};

		// verify
		if (module.match(/(rollback|undelete|userrights)/i) === null) return false;
		
		//go
		switch (module) {
			case 'rollback':
				var rbtURL = '?action=query&prop=revisions&rvtoken=rollback&indexpageids=1&titles='+targ;
				ajax('get', rbtURL, function (data) {
					token = data.query.pages[data.query.pageids[0]].revisions[0].rollbacktoken;
					ajax("post", url, token, callback, failure, extra);
				});
				break;
			case 'undelete':
				var detURL = '?action=query&list=deletedrevs&titles='+targ+'&drprop=token';
				ajax('get', detURL, function (data) {
					token = data.query.deletedrevs[0].token;
					ajax("post", url, token, callback, failure, extra);
				});
					break;
			case 'userrights':
				var urURL = '?action=query&list=users&ustoken=userrights&indexpageids=1&ucusers='+targ;
				ajax('get', urURL, function (data) {
					token = data.query.users[0].userrightstoken;
					ajax("post", url, token, callback, failure, extra);
				});
				break;
			default:
				token = false;
				break;
		}	
	};

	/*** DOOR FUNCTIONS ***/

	/* Load arguments */
	door.prototype.load = function (params) {
		this.params = params;
		return this;
	};

	/* Load success callback */
	door.prototype.wait = function (cb) {
		var checkedCB = (typeof cb !== "undefined" && typeof cb === "function") ? cb : function () {};
		this.callback = checkedCB;
		return this;
	};

	/* Load callback */
	door.prototype.collapse = function (cb) {
		var checkedCB = (typeof cb !== "undefined" && typeof cb === "function") ? cb : function () {};
		this.failure = checkedCB;
		return this;
	};

	/* Runs query/action */
	door.prototype.run = function () {
		var targ = typeof this.params.targ !== "undefined" ? this.params.targ : '',
			rlmodule = this.module === 'delete' ? 'del' : this.module;

		if (this.reqType === ACTION) {
			modules[rlmodule].run(this.params, rlmodule, this.callback, this.failure, targ);
		} else if (this.reqType === QUERY || this.reqType === SPECIAL) {
			modules[this.module].run(this.params, this.callback, this.failure);
		}
	};

	/*** MODULES BEGIN ***/


	/* Start Action modules */
	modules.edit = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			var minor = 'notminor=true', 
				twhere = 'text',
				command = params.command || '',
				extra = {};

			if (command !== '') command = '&' + command;
			if (typeof params.isMinor !== "undefined" && params.isMinor === true) minor = 'minor=true';
			if (typeof params.where !== "undefined" && (params.where === "appendtext" || params.where ===  "prependtext")) twhere = params.where;
			
			//Action
			var eURL = '?action=edit&title='+params.targ+'&summary='+params.summary+'&'+minor+command;
			extra[twhere] = params.text;
			getToken(module, targ,  eURL, callback, failure, extra);
		}
	};

	modules.rollback = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			var rbURL = '?action=rollback&title='+params.targ+'&user='+params.user,
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.summary !== "undefined" && params.summary !== false) rbURL += '&summary=' + params.summary;
			rbURL += command;

			//Action
			getToken(module, targ, rbURL, callback, failure);
		}
	};

	modules.del = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			var deURL = '?action=delete&title='+params.targ+'&reason='+params.summary,
				command = params.command || '';

			if (command !== '') command = '&' + command;
			deURL += command;

			//Action
			getToken(module, targ, deURL, callback, failure);
		}
	};

	modules.protect = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			var cascade = '',
				exp = 'never',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.expiry !== "undefined" && params.cascading === true) cascade = "&cascade";
			if (typeof params.expiry !== "undefined" && params.expiry !== false) exp = params.expiry;
			
			//Action
			var prURL = '?action=protect&title='+params.targ+'&protections='+params.level+cascade+'&expiry='+exp+'&reason='+params.summary+command;
			getToken(module, targ, prURL, callback, failure);
		}
	};

	modules.move = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			// params
			var talk = '', 
				sub = '',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.mTalk !== "undefined" && params.mTalk === true) talk = '&movetalk';
			if (typeof params.mSub !== "undefined" && params.mSub === true) sub = '&movesubpages';
			
			//Action
			var mURL = '?action=move&from='+params.targ+'&to='+params.to+'&reason='+params.summary+sub+talk+command;
			getToken(module, targ, mURL, callback, failure);
		}
	};

	modules.userrights = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			// params
			var add = '',
				rm = '',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.adds !== "undefined" && params.adds !== false) add = '&add='+params.adds;
			if (typeof params.remove !== "undefined" && params.remove !== false) rm = '&remove'+params.remove;
			
			//Action
			var urURL = '?action=userrights&user='+params.targ+add+rm+'&reason='+params.summary+command;
			getToken(module, targ, urURL, callback, failure);
		}
	};

	modules.block = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			//params
			var expiry = 'never',
				nemail = '',
				ablock = '',
				atalk = '',
				ncreate = '',
				anononly = '',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.expire !== "undefined" && params.expire !== false) expiry = params.expire;
			if (typeof params.noemail !== "undefined" && params.noemail === true) nemail = '&noemail';
			if (typeof params.autoblock !== "undefined" && params.autoblock === true) ablock = '&autoblock';
			if (typeof params.allowtalk !== "undefined" && params.allowtalk === true) atalk = '&allowusertalk';
			if (typeof params.nocreate !== "undefined" && params.nocreate === true) ncreate = '&nocreate';
			if (typeof params.onlyanon !== "undefined" && params.onlyanon === true) anononly = '&anononly';
			
			//Action
			var blURL = '?action=block&user='+params.targ+'&expiry='+expiry+'&reason='+params.summary+nemail+ablock+atalk+ncreate+anononly+command;
			getToken(module, targ, blURL, callback, failure);
		}
	};

	modules.email = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			var emURL = '?action=emailuser&target='+params.targ+'&subject='+params.subject,
				command = params.command || '',
				extra = {};

			if (command !== '') command = '&' + command;
			if (typeof params.ccme !== "undefined" && params.ccme === true) emURL += '&ccme';
			emURL += command;
			
			//Action
			extra.text = params.text;
			getToken(module, targ, emURL, callback, failure, extra);
		}
	};

	modules.unblock = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			var ubURL = '?action=unblock&user='+params.user+'&reason='+params.summary,
				command = params.command || '';

			if (command !== '') command = '&' + command;
			ubURL += command;

			//Action
			getToken(module, targ, ubURL, callback, failure);
		}
	};

	modules.undelete = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			//params
			var timestamp = '',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.timestamps !== "undefined" && params.timestamps !== false) timestamp = '&timestamps='+params.timestamps;
			
			//Action
			var udURL = '?action=undelete&title='+params.targ+'&reason='+params.summary+timestamp+command;
			getToken(module, targ, udURL, callback, failure);
		}
	};

	modules.preferences = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			//params
			var reset = '',
				keyValue = '',
				change = '',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.reset !== "undefined") {
				if (params.reset === true) reset = '&reset';
				else reset = '&resetkinds=' + params.reset;
			}
			if (typeof params.change !== "undefined") change = '&change='+params.change;
			if (typeof params.key !== "undefined" && typeof params.value !== "undefined") keyValue = '&optionname='+params.key+'&optionvalue='+params.value;
			
			//Action
			var opURL = '?action=options'+reset+keyValue+change+command;
			getToken(module, targ, opURL, callback, failure);
		}
	};

	modules.purge = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			var pURL = '?action=purge&titles='+ params.titles,
				command = params.command || '';

			if (command !== '') command = '&' + command;
			pURL += command;

			//Action
			getToken(module, targ, pURL, callback, failure);
		}
	};

	modules.watch = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			var wURL = '?action=watch&title='+ params.targ,
				command = params.command || '';

			if (params.unwatch !== "undefined" && params.unwatch === true) wURL += '&unwatch';
			if (command !== '') command = '&' + command;
			wURL += command;

			//Action
			getToken(module, targ, wURL, callback, failure);
		}
	};

	modules.unwatch = {
		reqType: ACTION,
		run: function (params, module, callback, failure, targ) {
			params.unwatch = true;
			modules.watch.run(params, 'watch', callback, failure, targ);
		}
	};

	modules.login = {
		reqType: ACTION,
		run: function (params) {
			//NOTE: Flash DOES NOT SAVE EITHER YOUR USERNAME OR PASSWORD
			//For script developers- Flash doesn't allow for a callback argument on this 
			ajax("post", '?action=login&lgname='+params.username+'&lgpassword='+params.password, false, function (data) {
				ajax("post", '?action=login&lgtoken='+data.login.token+'&lgname='+params.username+'&lgpassword='+params.password, false, document.location.reload());
			});
		}
	};

	modules.logout = {
		reqType: ACTION,
		run: function (params, module, callback, failure) {
			ajax("post", '?action=logout', false, callback, failure);
		}
	};

	/* Start Special Modules */

	//Store data
	modules.storage = {
		reqType: SPECIAL,
		run: function (params, callback) {
			var type, sStorage = params.sessionOnly || false, goodModes = ['get', 'set', 'remove'], res;

			type = storageCheck(sStorage);

			if ($.inArray(params.mode, goodModes) <= -1) {
				callback(false);
				return;
			}

			if (type === 'localStorage' || type === 'sessionStorage') {
				res = window[type][params.mode + 'Item'](params.key, params.value);
				callback(res || true);
			} else if (type === 'globalStorage') {
				res = window.globalStorage[window.location.hostname][params.mode + 'Item'](params.key, params.value);
				callback(res || true);
			} else if (type === 'cookie') {
				//Cookie stuff is from quirksmode
				if (params.mode === 'set') {
					var expires;

					if (typeof params.days !== undefined) {
						var date = new Date();
						
						date.setTime(date.getTime() + (params.days*24*60*60*1000));
						expires = "; expires=" + date.toGMTString();
					} else {
						expires = "";
					}
					document.cookie = params.key + "=" + params.value + expires + "; path=/";
					callback(true);
				} else if (params.mode === 'get') {
					var nameEQ = params.name + "=", ca = document.cookie.split(';');
					for(var i = 0; i < ca.length; i++) {
						var c = ca[i];
						while (c.charAt(0) === ' ') c = c.substring(1, c.length);
						if (c.indexOf(nameEQ) === 0) {
							callback(c.substring(nameEQ.length, c.length));
							break;
						}
					}
					callback(false);
				} else if (params.mode !== 'remove') {
					var expires, date = new Date();
					
					date.setTime(date.getTime()+(-1*24*60*60*1000));
					expires = "; expires="+date.toGMTString();

					document.cookie = params.key + "=" + params.value + expires + "; path=/";
					callback(true);
				}
			} else {
				callback(false);
			}

			if (params.server !== "undefined" && params.server === true) {
				modules.preferences({key: params.key, value: params.value}, 'preferences', function (res) {
					callback(res);
				}, function () {});
			}
		}
	};

	/* Start Query Modules */
	modules.exists = {
		reqType: QUERY,
		run: function (params, callback, failure) {
			ajax("get", '?action=query&prop=info&indexpageids=1&titles='+params.targ, function (data) {
				if (data.query.pages[data.query.pageids].missing === '') callback(false);
				else callback(true);
			}, failure);
		}
	};

	modules.getCreator = {
		reqType: QUERY,
		run: function (params, callback, failure) {
			modules.exists.run({targ: params.targ}, function (data) {
				if (data === false) {
					callback(false);
				} else {
					ajax("get", '?action=query&prop=revisions&indexpageids=1&titles='+params.targ+'&rvlimit=1&rvprop=user&rvdir=newer', function (data) {
						var creator = data.query.pages[data.query.pageids[0]].revisions[0].user;
						callback(creator);
					});
				}
			}, failure);
		}
	};

	modules.getUserContribs = {
		reqType: QUERY,
		run: function (params, callback, failure) {
			ajax("get", '?action=query&list=usercontribs&uclimit='+params.number+'&ucuser='+params.user+'&ucprop=ids|title|flags|timestamp|comment', callback, failure);
		}
	};

	modules.getUserGroups = {
		reqType: QUERY,
		run: function (params, callback, failure) {
			if (params.user === mw.config.get('wgUserName')) {
				if (typeof params.group !== "undefined") {
					callback(($.inArray(params.group, mw.config.get('wgUserGroups')) !== -1));
				} else {
					callback(mw.config.get('wgUserGroups'));
				}
			} else {
				ajax("get", '?action=query&list=users&usprop=groups&ususers=' + encodeURIComponent(params.user), function (data) {
					if (typeof params.group !== "undefined") {
						callback(($.inArray(params.group, data.query.users[0].groups) !== -1));
					} else {
						callback(data.query.users[0].groups);
					}
				}, failure);
			}
		}
	};

	modules.getPage = {
		reqType: QUERY,
		run: function (params, callback, failure) {
			// verification
			if (params.revisions > 500) params.revisions = 500;
			if (typeof params.properties === "undefined") params.properties = 'user|content|ids|timestamp|comment';
	 
			// go
			ajax("get", '?action=query&prop=revisions&titles='+params.targ+'&rvprop='+params.properties+'&rvlimit='+params.revisions+'&indexpageids=1', function (data) {
				if (data.query.pageids[0] === "-1") { 
					callback(false);
				} else {
					var info = data.query.pages[data.query.pageids[0]], res = {};
	 
					for (var i = 0; i < info.revisions.length; i++) { // for each revision
						res[i] = {};

						// get user
						if (params.properties.match(/user/i) !== null) {
							res[i].user = info.revisions[i].user;
						}

						// get content
						if (params.properties.match(/content/i) !== null) {
							res[i].content = info.revisions[i]['*'];
						}

						// get timestamp
						if (params.properties.match(/timestamp/i) !== null) {
							res[i].timestamp = info.revisions[i].timestamp;
						}

						// get summary
						if (params.properties.match(/comment/i) !== null) {
							res[i].summary = info.revisions[i].comment;
						}

						// get size
						if (params.properties.match(/size/i) !== null) {
							res[i].size = info.revisions[i].size;
						}

						// get ids
						if (params.properties.match(/ids/i) !== null) {
							res[i].ids = {
								revid: info.revisions[i].revid,
								parentid: info.revisions[i].parentid
							};
						}
					}
					callback(res);
				}
			}, failure);
		}
	};

	//Meta query. Accepts a url and spits out the output
	modules.question = {
		reqType: QUERY,
		run: function (params, callback, failure) {
			ajax("get", params, callback, failure);
		}
	};

	/*** RUN CODE ***/

	//init is the only instance of Flash_main
	//Then Flash becaomes the go function for init
	//When Flash is called it executes the code in Flash_main.prototype.go,
	//which creates a new door as explained earlier in the code
	var init = new Flash_main();
	window.Flash = init.go;

	log('loaded version ' + version);
});