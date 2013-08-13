/*global mw:true */
/* This is my personal javascript library which I call Flash */
/* It can: 
	a) gather all tokens (save patrol) 
	b) do virtually any action save WMF ones like pagetriage and articlefeedback
	c) Perform queries (limited for now, to be expanded in the next version)
*/

/* DISCLAIMER: BEFORE 1.0 IT CAN AND WILL GO THROUGH CHANGES THAT MAY BREAK THE API */
$(function () {


	//Constants
	var QUERY = 1, ACTION = 2;

	//Holds all the modules
	var modules = {
		version: "0.86 Hydra"
	};

	/*** CONSTRUCTORS ***/

	//This is called once, by the Flash variable at the bottom of this script
	var Flash_main = function () {
		this.go = function (module) {
			//we could technically do everything in the Flash_main class
			//but I prefer to have new instances for each new request
			return new door(module);
		};
	};

	//door is the class that actually executes the request
	//The reason that we cant do the code in Flash_main is because if we executed the queries
	//there then all the requests would go through one instance of the class because the Flash_main
	//object is only created once. Instead, in Flash_main, all we do is create a new door from which
	//all the code is executed, so there is a new instance of the door class for each request
	var door = function (module) {
		this.token = '';
		this.module = module;
		this.reqType = modules[module].reqType;
		this.callback = function () {};
	};

	/*** META FUNCTIONS ***/

	/* Logs stuff */
	var log = (window.console && function () {
		var args = Array.prototype.slice.call(arguments);
		args.unshift('Flash:');
		return window.console.log.apply(window.console, args);
	}) || $.noop;

	/* Does ajax call to API */
	var ajax = function (type, url, token, cb, special, extraInfo) {
		type = type.toLowerCase();
		special = !!special;
		extraInfo = extraInfo || {};

		if (type === "get") {
			var realcb = token;
			$.getJSON(mw.util.wikiScript('api')+url+'&format=json').then(function (data) {
				realcb(data);
			});
		} else if (type === "post") {
			if (special === true) {
				var sptoken = token === false ? '' : '&token=' + token;
				$.post(mw.util.wikiScript('api')+url+sptoken+'&format=json').then(function (data) {
					cb(data);
				});
			} else if (token === false) {
				$.post(mw.util.wikiScript('api')+url+'&format=json').then(function (data) {
					cb(data);
				});
			} else {
				extraInfo.token = token;
				$.ajax({
					url: mw.util.wikiScript('api')+url+'&format=json',
					type: 'POST',
					dataType: 'json',
					data: extraInfo
				}).done (function (data) {
					cb(data);
				}).fail(function (data) {
					cb(data);
				});
			}
		}
	};

	/*** DOOR FUNCTIONS ***/

	/* Load arguments */
	door.prototype.load = function (params) {
		this.params = params;
		return this;
	};

	/* Load callback */
	door.prototype.wait = function (cb) {
		var checkedCB = (typeof cb !== "undefined" && typeof cb === "function") ? cb : function () {};
		this.callback = checkedCB;
		return this;
	};

	/* Start Token calls */

	/* This gets all tokens that are accessible from ?action=tokens */
	door.prototype.getToken = function(token, targ) {
		log("Token:", token);
		// set vars
		var me = this
			module = '';

		token = token.toLowerCase();

		module = token === 'delete' ? 'del' : token;
		token = token === 'preferences' ? 'options' : token;

		// verification
		if (token.match(/(rollback|userrights|undelete)/)) this.specialToken(token, targ);
		if (!token.match(/(edit|delete|protect|move|block|options|unblock|email|import|watch)/)) return false;
		// go
		var tURL = '?action=tokens&type='+token;
		
		ajax("get", tURL, function (data) {
			me.token = data.tokens[token+"token"];
			modules[module].run(me.params, me.token, me.callback);
		});
	};

	/* This gets tokens not accessible from ?action=tokens */
	door.prototype.specialToken = function(token, targ) {
		var me = this;
		// verify
		if (token.match(/(rollback|undelete|userrights)/i) === null) return false;
		//go
		switch (token) {
			case 'rollback':
				var rbtURL = '?action=query&prop=revisions&rvtoken=rollback&indexpageids=1&titles='+targ;
				ajax('get', rbtURL, function (data) {
					me.token = encodeURIComponent(data.query.pages[data.query.pageids[0]].revisions[0].rollbacktoken);
					modules[token].run(me.params, me.token, me.callback);
				});
				break;
			case 'undelete':
				var detURL = '?action=query&list=deletedrevs&titles='+targ+'&drprop=token';
				ajax('get', detURL, function (data) {
					me.token = encodeURIComponent(data.query.deletedrevs[0].token);
					modules[token].run(me.params, me.token, me.callback);
				});
					break;
			case 'userrights':
				var urURL = '?action=query&list=users&ustoken=userrights&indexpageids=1&ucusers='+targ;
				ajax('get', urURL, function (data) {
					me.token = encodeURIComponent(data.query.users[0].userrightstoken);
					modules[token].run(me.params, me.token, me.callback);
				});
				break;
			default:
				me.token = false;
				break;
		}	
	};

	/* Runs query/action */
	door.prototype.run = function () {
		var tokenModule = this.module === 'del' ? 'delete' : this.module,
			targ = typeof this.params.targ !== "undefined" ? this.params.targ : '';

		if (this.reqType === ACTION) {
			this.getToken(tokenModule, targ);
		} else if (this.reqType === QUERY) {
			modules[this.module].run(this.params, this.callback);
		}
	};

	/*** MODULES BEGIN ***/


	/* Start Action modules */
	modules.edit = {
		reqType: ACTION,
		run: function (params, token, callback) {
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
			ajax("post", eURL, token, callback, false, extra);
		}
	};

	modules.rollback = {
		reqType: ACTION,
		run: function (params, token, callback) {
			var rbURL = '?action=rollback&title='+params.targ+'&user='+params.user,
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.summary !== "undefined" && params.summary !== false) rbURL += '&summary=' + params.summary;
			rbURL += command;

			//Action
			ajax("post", rbURL, token, callback, true);
		}
	};

	modules.del = {
		reqType: ACTION,
		run: function (params, token, callback) {
			var deURL = '?action=delete&title='+params.targ+'&reason='+params.summary,
				command = params.command || '';

			if (command !== '') command = '&' + command;
			deURL += command;

			//Action
			ajax("post", deURL, token, callback);
		}
	};

	modules.protect = {
		reqType: ACTION,
		run: function (params, token, callback) {
			var cascade = '',
				exp = 'never',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.expiry !== "undefined" && params.cascading === true) cascade = "&cascade";
			if (typeof params.expiry !== "undefined" && params.expiry !== false) exp = params.expiry;
			
			//Action
			var prURL = '?action=protect&title='+params.targ+'&protections='+params.level+cascade+'&expiry='+exp+'&reason='+params.summary+command;
			ajax("post", prURL, token, callback);	
		}
	};

	modules.move = {
		reqType: ACTION,
		run: function (params, token, callback) {
			// params
			var talk = '', 
				sub = '',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.mTalk !== "undefined" && params.mTalk === true) talk = '&movetalk';
			if (typeof params.mSub !== "undefined" && params.mSub === true) sub = '&movesubpages';
			
			//Action
			var mURL = '?action=move&from='+params.targ+'&to='+params.to+'&reason='+params.summary+sub+talk+command;
			ajax("post", mURL, token, callback);		
		}
	};

	modules.userrights = {
		reqType: ACTION,
		run: function (params, token, callback) {
			// params
			var add = '',
				rm = '',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.adds !== "undefined" && params.adds !== false) add = '&add='+params.adds;
			if (typeof params.remove !== "undefined" && params.remove !== false) rm = '&remove'+params.remove;
			
			//Action
			var urURL = '?action=userrights&user='+params.targ+add+rm+'&reason='+params.summary+command;
			ajax("post", urURL, token, callback, true);
		}
	};

	modules.block = {
		reqType: ACTION,
		run: function (params, token, callback) {
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
			ajax("post", blURL, token, callback);
		}
	};

	modules.email = {
		reqType: ACTION,
		run: function (params, token, callback) {
			var emURL = '?action=emailuser&target='+params.targ+'&subject='+params.subject,
				command = params.command || '',
				extra = {};

			if (command !== '') command = '&' + command;
			if (typeof params.ccme !== "undefined" && params.ccme === true) emURL += '&ccme';
			emURL += command;
			
			//Action
			extra.text = params.text;
			ajax("post", emURL, token, callback, false, extra);
		}
	};

	modules.unblock = {
		reqType: ACTION,
		run: function (params, token, callback) {
			var ubURL = '?action=unblock&user='+params.user+'&reason='+params.summary,
				command = params.command || '';

			if (command !== '') command = '&' + command;
			ubURL += command;

			//Action
			ajax("post", ubURL, token, callback);
		}
	};

	modules.undelete = {
		reqType: ACTION,
		run: function (params, token, callback) {
			//params
			var timestamp = '',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			if (typeof params.timestamps !== "undefined" && params.timestamps !== false) timestamp = '&timestamps='+params.timestamps;
			
			//Action
			var udURL = '?action=undelete&title='+params.targ+'&reason='+params.summary+timestamp+command;
			ajax("post", udURL, token, callback, true);
		}
	};

	modules.preferences = {
		reqType: ACTION,
		run: function (params, token, callback) {
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
			ajax("post", opURL, token, callback);
		}
	}

	modules.purge = {
		reqType: ACTION,
		run: function (params, token, callback) {
			var pURL = '?action=purge&titles='+ params.titles,
				command = params.command || '';

			if (command !== '') command = '&' + command;
			pURL += command;

			//Action
			ajax("post", pURL, false, callback);
		}
	};

	modules.watch = {
		reqType: ACTION,
		run: function (params, token, callback) {
			var wURL = '?action=watch&title='+ params.targ,
				command = params.command || '';

			if (command !== '') command = '&' + command;
			wURL += command;

			//Action
			ajax("post", wURL, token, callback);
		}
	};

	modules.unwatch = {
		reqType: ACTION,
		run: function (params, token, callback) {
			var uwURL = '?action=watch&title='+params.targ+'&unwatch=',
				command = params.command || '';

			if (command !== '') command = '&' + command;
			uwURL += command;

			//Action
			ajax("post", uwURL, token, callback);
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
		run: function (params, token, callback) {
			ajax("post", '?action=logout', false, callback);
		}
	};

	/* Start Query Modules */
	modules.exists = {
		reqType: QUERY,
		run: function (params, callback) {
			ajax("get", '?action=query&prop=info&indexpageids=1&titles='+params.targ, function (data) {
				if (data.query.pages[data.query.pageids].missing === '') callback(false);
				else callback(true);
			});
		}
	};

	modules.getCreator = {
		reqType: QUERY,
		run: function (params, callback) {
			modules.exists.run({targ: params.targ}, function (data) {
				if (data === false) {
					callback(false);
				} else {
					ajax("get", '?action=query&prop=revisions&indexpageids=1&titles='+params.targ+'&rvlimit=1&rvprop=user&rvdir=newer', function (data) {
						var creator = data.query.pages[data.query.pageids[0]].revisions[0].user;
						callback(creator);
					});
				}
			});
		}
	};

	modules.getUserContribs = {
		reqType: QUERY,
		run: function (params, callback) {
			ajax("get", '?action=query&list=usercontribs&uclimit='+params.number+'&ucuser='+params.user+'&ucprop=ids|title|flags|timestamp|comment', callback);
		}
	};

	modules.getUserGroups = {
		reqType: QUERY,
		run: function (params, callback) {
			if (params.user === mw.config.get('wgUserName')) {
				if (typeof params.group !== "undefined") {
					callback(($.inArray(params.group, mw.config.get('wgUserGroups')) !== -1))
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
				});
			}
		}
	};

	modules.getPage = {
		reqType: QUERY,
		run: function (params, callback) {
			// verification
			if (params.revisions > 500) params.revisions = 500;
			if (typeof params.properties === "undefined") params.properties = 'user|content|ids';
	 
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

						if (params.properties.match(/ids/i) !== null) {
							res[i].ids = {
								revid: info.revisions[i].revid,
								parentid: info.revisions[i].parentid
							};
						}
					}
					callback(res);
				}
			});
		}
	};

	//Meta query. Accepts a url and spits out the output
	modules.question = {
		reqType: QUERY,
		run: function (params, callback) {
			ajax("get", params, callback);
		}
	};

	/*** RUN CODE ***/

	//init is the only instance of Flash_main
	//Then Flash becaomes the go function for init
	//When Flash is called it executes the code in Flash_main.prototype.go,
	//which creates a new door as explained earlier in the code
	var init = new Flash_main();
	window.Flash = init.go;

	log('loaded version ' + modules.version);
});