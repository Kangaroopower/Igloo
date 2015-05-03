/*global mw:true */ 

/**
 * Copyright 2012-2015 Kangaroopower on Wikipedia
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Flash is a library that makes it easier to use the Wikipedia API
 *
 * It can: 
 *	a) gather virtually all tokens (save patrol and perhaps some WMF specific ones) 
 *	b) do virtually any action save WMF ones like pagetriage and articlefeedback
 *	c) Perform queries (limited for now, to be expanded in the next version)
 *
 * DISCLAIMER: BEFORE 1.0 IT CAN AND WILL GO THROUGH CHANGES THAT MAY BREAK THE API
 */

$(function () {
	//Constants
	var QUERY = 1, ACTION = 2, SPECIAL = 3;

	//Version
	var version = "0.95.0.2 Hydra";

	//Holds all the modules
	var modules = {};

	/*** CONSTRUCTORS ***/

	//This is called once, by the Flash variable at the bottom of this script
	//we could technically do everything in the Flash_main class
	//but I prefer to have new instances for each new request
	//we also process version calls in here because version is a static variable
	//and making a new module just for that would waste a bunch of unnecessary memory
	var Flash_main = function () {
		this.go = function (module) { 
			return (module === 'version' ? version : new door(module));
		};
	};

	//door is the class that actually executes the request
	//The reason that we cant do the code in Flash_main is because if we executed the queries
	//there then all the requests would go through one instance of the class because the Flash_main
	//object is only created once. Instead, in Flash_main, all we do is create a new door from which
	//all the code is executed, so there is a new instance of the door class for each request
	var door = function (module) {
		module = (module === 'delete' ? 'del' : module);
		
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
	var ajax = function (type, url, token, cb, onfail, oncomplete, extraInfo) {
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
		}).complete(function (data) {
			oncomplete(data);
		});
	};

	/* Checks for most modern type of storage */
	var storageCheck = function (sStorage) {
		var ret;
 
		sStorage = sStorage || false;

		if (sStorage) {
			if (typeof sessionStorage !== "undefined") {
				ret = 'sessionStorage';
			} else if (typeof globalStorage !== "undefined") {
				ret = 'globalStorage';
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
	var getToken = function(module, url, callback, failure, complete, extra) {
		log("Module:", module);

		module = module.toLowerCase();
		module = module === 'del' ? 'delete' : module;
		module = module === 'preferences' ? 'options' : module;

		// verification
		if (module.match(/(rollback|userrights|undelete)/)) specialToken(module, url, callback, failure, extra);
		if (!module.match(/(edit|delete|protect|move|block|options|unblock|email|import|watch)/)) return false;
		// go
		var tURL = '?action=tokens&type='+module;
		
		ajax("get", tURL, function (data) {
			var token = data.tokens[module+"token"];
			ajax("post", url, token, callback, failure, complete, extra);
		});
	};

	/* This gets tokens not accessible from ?action=tokens */
	var specialToken = function(module, url, callback, failure, complete, extra) {
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
					ajax("post", url, token, callback, failure, complete, extra);
				});
				break;
			case 'undelete':
				var detURL = '?action=query&list=deletedrevs&titles='+targ+'&drprop=token';
				ajax('get', detURL, function (data) {
					token = data.query.deletedrevs[0].token;
					ajax("post", url, token, callback, failure, complete, extra);
				});
					break;
			case 'userrights':
				var urURL = '?action=query&list=users&ustoken=userrights&indexpageids=1&ucusers='+targ;
				ajax('get', urURL, function (data) {
					token = data.query.users[0].userrightstoken;
					ajax("post", url, token, callback, failure, complete, extra);
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

	/* Load failure callback */
	door.prototype.fail = function (cb) {
		var checkedCB = (typeof cb !== "undefined" && typeof cb === "function") ? cb : function () {};
		this.failure = checkedCB;
		return this;
	};

	/* Load complete callback */
	door.prototype.complete = function (cb) {
		var checkedCB = (typeof cb !== "undefined" && typeof cb === "function") ? cb : function () {};
		this.complete = checkedCB;
		return this;
	};

	/* Runs query/action */
	door.prototype.run = function () {
		var rlmodule = this.module === 'delete' ? 'del' : this.module;

		if (this.reqType === ACTION) {
			modules[rlmodule].run(this.params, rlmodule, this.callback, this.failure, this.complete);
		} else if (this.reqType === QUERY || this.reqType === SPECIAL) {
			modules[this.module].run(this.params, this.callback, this.failure, this.complete);
		}
	};

	/*** MODULES BEGIN ***/


	/* Start Action modules */
	modules.edit = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
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
			getToken(module,  eURL, callback, failure, complete, extra);
		}
	};

	modules.rollback = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
			var rbURL = '?action=rollback&title='+params.targ+'&user='+params.user,
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.summary !== "undefined" && params.summary !== false) rbURL += '&summary=' + params.summary;
			rbURL += command;

			//Action
			getToken(module, rbURL, callback, failure, complete);
		}
	};

	modules.del = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
			var deURL = '?action=delete&title='+params.targ+'&reason='+params.summary,
				command = params.command || '';

			if (command !== '') command = '&' + command;
			deURL += command;

			//Action
			getToken(module, deURL, callback, failure, complete);
		}
	};

	modules.protect = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
			var cascade = '',
				exp = 'never',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.cascading !== "undefined" && params.cascading === true) cascade = "&cascade";
			if (typeof params.expiry !== "undefined" && params.expiry !== false) exp = params.expiry;
			
			//Action
			var prURL = '?action=protect&title='+params.targ+'&protections='+params.level+cascade+'&expiry='+exp+'&reason='+params.summary+command;
			getToken(module, prURL, callback, failure, complete);
		}
	};

	modules.move = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
			// params
			var talk = '', 
				sub = '',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.mTalk !== "undefined" && params.mTalk === true) talk = '&movetalk';
			if (typeof params.mSub !== "undefined" && params.mSub === true) sub = '&movesubpages';
			
			//Action
			var mURL = '?action=move&from='+params.targ+'&to='+params.to+'&reason='+params.summary+sub+talk+command;
			getToken(module, mURL, callback, failure, complete);
		}
	};

	modules.userrights = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
			// params
			var add = '',
				rm = '',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.adds !== "undefined" && params.adds !== false) add = '&add='+params.adds;
			if (typeof params.remove !== "undefined" && params.remove !== false) rm = '&remove'+params.remove;
			
			//Action
			var urURL = '?action=userrights&user='+params.targ+add+rm+'&reason='+params.summary+command;
			getToken(module, urURL, callback, failure, complete);
		}
	};

	modules.block = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
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
			getToken(module, blURL, callback, failure, complete);
		}
	};

	modules.email = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
			var emURL = '?action=emailuser&target='+params.targ+'&subject='+params.subject,
				command = params.command || '',
				extra = {};

			if (command !== '') command = '&' + command;
			if (typeof params.ccme !== "undefined" && params.ccme === true) emURL += '&ccme';
			emURL += command;
			
			//Action
			extra.text = params.text;
			getToken(module, emURL, callback, failure, complete, extra);
		}
	};

	modules.unblock = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
			var ubURL = '?action=unblock&user='+params.user+'&reason='+params.summary,
				command = params.command || '';

			if (command !== '') command = '&' + command;
			ubURL += command;

			//Action
			getToken(module, ubURL, callback, failure, complete);
		}
	};

	modules.undelete = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
			//params
			var timestamp = '',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.timestamps !== "undefined" && params.timestamps !== false) timestamp = '&timestamps='+params.timestamps;
			
			//Action
			var udURL = '?action=undelete&title='+params.targ+'&reason='+params.summary+timestamp+command;
			getToken(module, udURL, callback, failure, complete);
		}
	};

	modules.preferences = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
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
			getToken(module, opURL, callback, failure, complete);
		}
	};

	modules.purge = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
			var command = params.command || '',
				titles = '';

			if (command !== '') command = '&' + command;
			if (typeof params.titles !== "undefined") {
				titles = '&titles=';
				if (typeof params.titles === "string") titles = params.titles;
				else if ($.isArray(params.titles)) titles = params.titles.join('|');
			}

			var pURL = '?action=purge'+ titles + command;

			//Action
			getToken(module, pURL, callback, failure, complete);
		}
	};

	modules.watch = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
			var wURL = '?action=watch&titles='+ params.targ,
				command = params.command || '';

			if (params.unwatch !== "undefined" && params.unwatch === true) wURL += '&unwatch';
			if (command !== '') command = '&' + command;
			wURL += command;

			//Action
			getToken(module, wURL, callback, failure, complete);
		}
	};

	modules.unwatch = {
		reqType: ACTION,
		run: function (params, module, callback, failure, complete) {
			params.unwatch = true;
			modules.watch.run(params, 'watch', callback, failure, complete);
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
		run: function (params, module, callback, failure, complete) {
			ajax("post", '?action=logout', false, callback, failure, complete);
		}
	};

	/* Start Special Modules */

	//Store data
	modules.storage = {
		reqType: SPECIAL,
		run: function (params, callback, failure, complete) {
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
				}, function (res) {
					failure(res)
				}, function (res) {
					complete(res);
				});
			}
		}
	};

	/* Start Query Modules */
	modules.exists = {
		reqType: QUERY,
		run: function (params, callback, failure, complete) {
			ajax("get", '?action=query&prop=info&indexpageids=1&titles='+params.targ, function (data) {
				if (data.query.pages[data.query.pageids].missing === '') callback(false);
				else callback(true);
			}, failure, complete);
		}
	};

	modules.getCreator = {
		reqType: QUERY,
		run: function (params, callback, failure, complete) {
			modules.exists.run({targ: params.targ}, function (data) {
				if (data === false) {
					callback(false);
				} else {
					ajax("get", '?action=query&prop=revisions&indexpageids=1&titles='+params.targ+'&rvlimit=1&rvprop=user&rvdir=newer', function (data) {
						var creator = data.query.pages[data.query.pageids[0]].revisions[0].user;
						callback(creator);
					});
				}
			}, failure, complete);
		}
	};

	modules.getUserContribs = {
		reqType: QUERY,
		run: function (params, callback, failure, complete) {
			ajax("get", '?action=query&list=usercontribs&uclimit='+params.number+'&ucuser='+params.user+'&ucprop=ids|title|flags|timestamp|comment', callback, failure, complete);
		}
	};

	modules.getUserGroups = {
		reqType: QUERY,
		run: function (params, callback, failure, complete) {
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
				}, failure, complete);
			}
		}
	};

	modules.getUserLogs = {
		reqType: QUERY,
		run: function (params, callback, failure, complete) {
			var leLimit = params.leLimit || 15,
				lUrl = '?action=query&list=logevents&leuser=' + params.user;

			if (typeof params.leProp !== "undefined") lUrl += '&leprop=' + params.leProp;

			ajax("get", lUrl + '&lelimit=' + params.leLimit, callback, failure, complete);		
		}
	};

	modules.getNotLastUser = {
		reqType: QUERY,
		run: function (params, callback, failure, complete) {
			modules.getPage.run({targ: params.targ, command: 'rvexcludeuser=' + params.user, properties: 'user'}, function (data) {
				calback(res[0].user);
			}, failure, complete);
		}
	};

	modules.getLastUser = {
		reqType: QUERY,
		run: function (params, callback, failure, complete) {
			modules.getPage.run({targ: params.targ, properties: 'user'}, function (data) {
				calback(res[0].user);
			}, failure, complete);
		}
	};

	modules.getPage = {
		reqType: QUERY,
		run: function (params, callback, failure, complete) {
			// verification
			var command = '' || '&' + params.command;

			params.revisions = params.revisions || 1;

			if (params.revisions > 500) params.revisions = 500;
			if (typeof params.properties === "undefined") params.properties = 'user|content|ids|timestamp|comment';
	 
			// go
			ajax("get", '?action=query&prop=revisions&titles='+params.targ+'&rvprop='+params.properties+'&rvlimit='+params.revisions+'&indexpageids=1', function (data) {
				if (data.query.pageids[0] === "-1") { 
					callback(false);
				} else {
					var res = {}, info;

					if (data.query.pageids.length > 1) {
						for (var i = 0; i < data.query.pageids.length; i++) {
							info = data.query.pages[data.query.pageids[i]];
							res[data.query.pageids[i]] = {};

							for (var i = 0; i < info.revisions.length; i++) { // for each revision
								res[data.query.pageids[i]][i] = {};

								// get user
								if (params.properties.match(/user/i) !== null) {
									res[data.query.pageids[i]][i].user = info.revisions[i].user;
								}

								// get content
								if (params.properties.match(/content/i) !== null) {
									res[data.query.pageids[i]][i].content = info.revisions[i]['*'];
								}

								// get timestamp
								if (params.properties.match(/timestamp/i) !== null) {
									res[data.query.pageids[i]][i].timestamp = info.revisions[i].timestamp;
								}

								// get summary
								if (params.properties.match(/comment/i) !== null) {
									res[data.query.pageids[i]][i].summary = info.revisions[i].comment;
								}

								// get size
								if (params.properties.match(/size/i) !== null) {
									res[data.query.pageids[i]][i].size = info.revisions[i].size;
								}

								// get sha1
								if (params.properties.match(/sha1/i) !== null) {
									res[data.query.pageids[i]][i].sha = info.revisions[i]['sha1'];
								}

								//is it a minor edit?
								if (params.properties.match(/minor/i) !== null) {
									res[data.query.pageids[i]][i].minor = (typeof info.revisions[i]['minor'] === "undefined" && info.revisions[i]['minor'] === "");
								}

								// get ids
								if (params.properties.match(/ids/i) !== null) {
									res[data.query.pageids[i]][i].ids = {
										revid: info.revisions[i].revid,
										parentid: info.revisions[i].parentid
									};
								}
							}
						}
					} else {
						info = data.query.pages[data.query.pageids[0]];
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

							// get sha1
							if (params.properties.match(/sha1/i) !== null) {
								res[i].sha = info.revisions[i]['sha1'];
							}

							//is it a minor edit?
							if (params.properties.match(/minor/i) !== null) {
								res[i].minor = (typeof info.revisions[i]['minor'] === "undefined" && info.revisions[i]['minor'] === "");
							}

							// get ids
							if (params.properties.match(/ids/i) !== null) {
								res[i].ids = {
									revid: info.revisions[i].revid,
									parentid: info.revisions[i].parentid
								};
							}
						}
					}
					callback(res);
				}
			}, failure, complete);
		}
	};

	//Meta query. Accepts a url and spits out the output
	modules.question = {
		reqType: QUERY,
		run: function (params, callback, failure, complete) {
			ajax("get", params, callback, failure, complete);
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