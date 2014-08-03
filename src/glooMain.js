/*global mw:true, jin:true, Flash:true, iglooImport:true, Mousetrap:true */

// INCLUDES
function iglooViewable () {

}
var _iglooViewable = new iglooViewable();



// iglooMain alpha copy by Kangaroopower
// igloo concept and initial code by Alex Barley (User:Ale_jrb on Wikipedia)
// requires jQuery 1.7.*, jin 1.04a+, Flash 0.93.4+, Mediawiki 1.20+, Mousetrap 1.4.5+

/******
	==========================
	CLASSES
	==========================
******/

//igloo meta variables used in many other places
var glooLocalBase = 'Wikipedia:Igloo',
	glooSig = '([['+ glooLocalBase +'|GLOO]])',
	//the instance of iglooMain that's actually used. Starts off with only one function, extendProto, that's needed for compile
	igloo = {
		extendProto: function (func, extendWith) {
			func.prototype = $.extend(extendWith(), func.prototype);
		}
	},
	iglooF;

// Class iglooConfiguration
	/*
	** iglooConfiguration exists to hold variables that are
	** the same for all users and are subject to change 
	** so that in the case that variable needs an update, 
	** you only need to change that variable in one spot
	**
	** It is written here in simplified object form to ensure
	** it can be parsed as expected.
	*/
var iglooConfiguration = {
	api: mw.util.wikiScript('api'),
	defaultContentScore: 20,
	fileHost: window.glooBase + '/', //Holds resources
	remoteHost: '', //Actual remote server
	version: "0.9 " + (typeof iglooBranch !== "undefined"? (iglooBranch === "dev" ? "Phoenix" : "Beta") : "Beta"),
	limitRequests: 5,
	flagColours: ['#ff8888', '#ffbbbb', '#ffffff', '#bbffbb', '#88ff88'],

	// Modules

	//Rollback Module
	vandalTemplate: {
		vandalism: 'vandalism',
		spam: 'spam',
		rmcontent: 'delete',
		attacks: 'defam',
		errors: 'error',
		custom: 'disruptive'
	},
	warningMessage: '{'+'{subst:uw-%MESSAGE%%LEVEL%|%PAGE%|2=The reverted edit can be found <span class="plainlinks">[%DIFF% here]</span>.}'+'}<!'+'-- igloo:%MESSAGE%%LEVEL% --'+'> ~~'+'~~',
	warningSummary: {
		vandalism: 'Level %LEVEL% warning re. vandalism on [[%PAGE%]] ' + glooSig,
		spam: 'Level %LEVEL% warning re. spam on [[%PAGE%]] ' + glooSig,
		rmcontent: 'Level %LEVEL% warning re. removal of content on [[%PAGE%]] ' + glooSig,
		attacks: 'Level %LEVEL% warning re. personal attacks on [[%PAGE%]] ' + glooSig,
		errors: 'Level %LEVEL% warning re. factual errors on [[%PAGE%]] ' + glooSig,
		custom: 'Level %LEVEL% warning on [[%PAGE%]] ' + glooSig
	},
	rollbackSummary: {
		vandalism: 'Reverted edits by [[Special:Contributions/$2|$2]] to last version by $1 ' + glooSig,
		spam: 'Reverted edits by [[Special:Contributions/$2|$2]] which violate the external links policy by ' + glooSig,
		rmcontent: 'Reverted unexplained removal of content by [[Special:Contributions/$2|$2]]  ' + glooSig,
		attacks: 'Reverted addition of [[WP:BLP|unsourced negative content]] to a biographical article by [[Special:Contributions/$2|$2]]  ' + glooSig,
		errors: 'Reverted addition of dubious unsourced content by [[Special:Contributions/$2|$2]]  ' + glooSig,
		agf: 'Reverted good faith edits by [[Special:Contributions/$2|$2]] to last version by $1 ' + glooSig
	},
	rollbackReasons: {
		vandalism: 'vandalism',
		spam: 'spam',
		rmcontent: 'removal of content',
		attacks: 'Personal Attacks',
		errors: 'factual errors',
		agf: 'good faith edits',
		custom: 'a custom reason'
	},
	warningsOldAfter: 2, // days after which warnings are considered irrelevant
	aiv: 'Wikipedia:Administrator intervention against vandalism',
	aivWhere: 'appendtext',
	aivIp: 'IPvandal',
	aivUser: 'vandal',
	aivMessage: '* {'+'{%TEMPLATE%|%USER%}'+'} - vandalism after final warning. ~~'+'~~',
	aivSummary: 'Reporting [[Special:Contributions/%USER%|%USER%]] - vandalism after final warning ',

	//CSD Module
	csdTemplate: '{'+'{Db-%CSDTYPE%}'+'}',
	csdSummary: {
		admin: '%CSDTYPE%: Deleting page according to CSD criteria ' + glooSig,
		user: 'Tagging page for CSD ' + glooSig,
		notify: 'Notifying %CSDUSER% about csd tag on %CSDPAGE% ' + glooSig,
		log: 'Logging speedy deletion nomination of [[%CSDPAGE%]] ' + glooSig
	},
	csdHeader:  '== ' + 'CSD Tag on %CSDPAGE% ==',
	csdMessage:  '\n\n{' + '{subst:Db-notice|target=%CSDPAGE%|text= Hello. This page has been tagged for speedy deletion under the %CSDTYPE% criteria.}' + '} Best, --~~' + '~~',
	csdLogPage: 'User:' + mw.config.get('wgUserName') + '/iglooCSD',

	//Block Module
	blockTypes: {'default' : 'subst:uw-vblock|time=%DURATION%|sig=yes', 'sharedipedu' : 'schoolblock|1=Blocked for %DURATION%.|sig=~~'+'~~', 'sharedippublic' : 'anonblock|1=Blocked for %DURATION%.|sig=~~'+'~~', 'sharedip' : 'anonblock|1=Blocked for %DURATION%.|sig=~~'+'~~'}, // if detected on the talk page, the autoblocker will try to use this template
	blockIncrement: ['indefinite', '1 hour', '3 hours', '6 hours', '12 hours', '24 hours', '31 hours', '48 hours', '72 hours', '1 week', '2 weeks', '1 month', '3 months', '6 months', '1 year'], // recognised block length
	blockDefault: 6, // the above block length to issue by default
	blockSpecTemp: '1 month', // non-default templates above will only be used when handling blocks greater than or equal to this setting
	anonBlockSettings: '&anononly=&nocreate=&allowusertalk=', // this should take the form of an API block settings string, and will be attached to the api request (default string)
	userBlockSettings: '&autoblock=&nocreate=&allowusertalk=', // this should take the form of an API block settings string, and will be attached to the api request (default string)

	//Warns w/o reverts
	warnSummaries: { //Credit to Twinkle for compiling these
		"Common warnings": {
			"vandalism": "Vandalism",
			"disruptive": "Disruptive editing",
			"test": "Editing tests",
			"delete": "Removal of content, blanking"
		},
		"Behavior in articles": {
			"biog": "Adding unreferenced controversial information about living persons",
			"defam": "Addition of defamatory content",
			"error": "Introducing deliberate factual errors",
			"genre": "Frequent or mass changes to genres without consensus or references",
			"image": "Image-related vandalism in articles",
			"joke": "Using improper humor in articles",
			"nor": "Adding original research, including unpublished syntheses of sources",
			"notcensored": "Censorship of material",
			"own": "Ownership of articles",
			"tdel": "Removal of maintenance templates",
			"unsourced": "Addition of unsourced or improperly cited material"
		},
		"Promotions and spam": {
			"advert": "Using Wikipedia for advertising or promotion",
			"npov": "Not adhering to neutral point of view",
			"spam": "Adding spam links"
		},
		"Behavior towards other editors": {
			"agf": "Not assuming good faith",
			"harass": "Harassment of other users",
			"npa": "Personal attack directed at a specific editor",
			"tempabuse": "Improper use of warning or blocking template"
		},
		"Removal of deletion tags": {
			"afd": "Removing {{afd}} templates",
			"blpprod": "Removing {{blp prod}} templates",
			"idt": "Removing file deletion tags",
			"speedy": "Removing speedy deletion tags"
		},
		"Other": {
			"chat": "Using talk page as forum",
			"create": "Creating inappropriate pages",
			"mos": "Manual of style",
			"move": "Page moves against naming conventions or consensus",
			"tpv": "Refactoring others' talk page comments",
			"upload": "Uploading unencyclopedic images"
		}
	}
};

	
// Class iglooUserSettings
	/*
	** iglooUserSettings is the class that holds the settings
	** for a particular user. The settings for a session can
	** be stored in JSON format for a particular user and then
	** parsed into the program to provide saving and loading.
	**
	** If no settings are loaded, the defaults specified in the
	** class itself will simply apply.
	**
	** It is written here in simplified object form to ensure
	** it can be parsed as expected.
	*/
var iglooUserSettings = {

	// Ticker
	updateTime: 3,
	hideOwn: false,
	enableFeedColour: true,
	updateQuantity: 10,
	hideBot: false,

	// Misc
	maxContentSize: 50,
	mesysop: false,

	//Diffs
	profFilter: true,
	diffFontSize: 13,

	//Keys
	useKeys: true,
	upDownKeys: false,

	// Modules

	//Rollback
	promptRevertSelf: true,
	watchRollbacked: false,

	//Block
	blockAction: 'prompt',

	//Dropdowns
	dropdownWinTimeout: 0.8,

	//Archive Module
	maxArchives: 20,

	//CSD Module
	logCSD: false,
	watchTagged: true
};

function getp (obj) {
	if (Object.getPrototypeOf) {
		return Object.getPrototypeOf(obj);
	} else if (obj.__proto__) {
		return obj.__proto__;
	} else return false;
}

// Class iglooMain
	/*
	** iglooMain is the running class for igloo. It handles:
	** - Building the core interface and starting daemons
	** - Loading external modules
	** - Hooking modules into the correct place
	*/
function iglooMain () {
	var me = this;
	
	// Define state
	this.canvas = null; // igloo exposes its primary canvas to modules for use.
	this.toolPane = null; // igloo exposes its primary toolpane to modules for use.
	this.content = null; // igloo exposes the content panel for convenience.
	this.diffContainer = null; // igloo exposes the diff container for convenience.
	this.ticker = null; // igloo exposes its ticker panel for convenience.

	this.currentView = null;
	
	this.listeners = {};
	this.modules = {};

	//igloo's logger
	this.log = (window.console && function () {
		var args = Array.prototype.slice.call(arguments);
		args.unshift('Igloo:');
		//because apparently IE8 console functions don't extend Function
		return Function.prototype.apply.call(console.log, console, args);
	}) || $.noop;

	this.load = function (initData) {
		var groups = mw.config.get('wgUserGroups');

		document.title = 'igloo - ' + iglooConfiguration.version;

		this.remoteConnect = initData.doRemoteConnect;
		this.firstRun = initData.isFirstRun;
		this.sessionKey = initData.sessionId;
		this.connectLocal = initData.isDown;

		for (var i = 0; i < groups.length; i++) {
			if (groups[i] === 'steward' || groups[i] === 'sysop') { 
				iglooUserSettings.mesysop = true;
			}
		}

		//Settings
		this.registerModule('cogs', new iglooSettings());
		iglooF('cogs').retrieve();

		//Launch
		this.launch();
	};

	this.launch = function () {
		this.buildInterface();

		this.currentView = new iglooView();
		this.registerModule([
			{name: 'recentChanges', obj: new iglooRecentChanges()},
			{name: 'contentManager', obj: new iglooContentManager()},
			{name: 'statusLog', obj: new iglooStatus()},
			{name: 'actions', obj: new iglooActions()},
			{name: 'dropManager', obj: new iglooDropdownManager()},
			{name: 'piano', obj: new iglooKeys()}
		]);

		iglooF('recentChanges').update();
		iglooF('recentChanges').setTickTime(iglooUserSettings.updateTime * 1000);
		iglooF('statusLog').buildInterface();
		this.currentView.displayWelcome();
		iglooF('cogs').buildInterface();

		this.announce('actions');
		this.announce('settings');

		this.loadModules(); 
	};

	this.buildInterface = function () {
		try {
			// Create drawing canvas
			this.canvas = new jin.Canvas();
			this.canvas.setFullScreen(true);
			
			// Create base splitter.
			var mainPanel = new jin.SplitterPanel();
			mainPanel.setPosition(0, 0);
			mainPanel.setSize(0, 0);
			mainPanel.setInitialDrag(260);
			mainPanel.setColour(jin.Colour.DARK_GREY);
			mainPanel.dragWidth = 1;
			
			mainPanel.left.setColour(jin.Colour.DARK_GREY);
			mainPanel.right.setColour(jin.Colour.WHITE);
			
			// Expose recent changes panel.
			this.ticker = mainPanel.left;
			
			// Create toolbar pane.
			this.toolPane = new jin.Panel();
			this.toolPane.setPosition(0, 0);
			this.toolPane.setSize(0, 100);
			this.toolPane.setColour(jin.Colour.WHITE);
			
			// Create toolbar border.
			var toolBorder = new jin.Panel();
			toolBorder.setPosition(0, 100);
			toolBorder.setSize(0, 1);
			toolBorder.setColour(jin.Colour.DARK_GREY);
			
			// Create content panel.
			this.content = new jin.Panel();
			this.content.setPosition(0, 101);
			this.content.setSize(0, 0);
			this.content.setColour(jin.Colour.WHITE);

			//filter bar
			this.filterBar = new jin.Panel();
			this.filterBar.setPosition(0, 0);
			this.filterBar.setSize(0, 11);
			this.filterBar.setColour(jin.Colour.GREY);

			//statusBorder
			var filterBorder = new jin.Panel();
			filterBorder.setPosition(0, 11);
			filterBorder.setSize(0, 1);
			filterBorder.setColour(jin.Colour.DARK_GREY);

			// Create diff container.
			this.diffContainer = new jin.Panel();
			this.diffContainer.setPosition(0, 13);
			this.diffContainer.setSize(0, (mainPanel.right.getHeight() - 160));
			this.diffContainer.setColour(jin.Colour.WHITE);
			this.diffContainer.setOverflow('auto');
			
			// Combine interface elements.
			this.content.add(this.filterBar);
			this.content.add(filterBorder);
			this.content.add(this.diffContainer);
			mainPanel.right.add(this.toolPane);
			mainPanel.right.add(toolBorder);
			mainPanel.right.add(this.content);
			this.canvas.add(mainPanel);
			
			// Do initial render.
			this.canvas.render(jin.getDocument());

			this.fireEvent('core','interface-rendered', true);
		} catch (e) {
			jin.handleException(e);
		}
	};


	/*
		UI ======================
		*/
	this.getCurrentView = function () {
		return this.currentView;
	};


	/*
		EVENTS ==================
		*/
	this.announce = function (moduleName) {
		if (!this.listeners[moduleName]) this.listeners[moduleName] = {};
		this.listeners[moduleName]['exists'] = true;
		this.listeners[moduleName]['ready'] = true;
	};

	this.isModuleReady = function (moduleName) {
		if (!this.listeners[moduleName]) return false;
		return this.listeners[moduleName]['ready'];
	};

	this.hookEvent = function (moduleName, hookName, func) {
		var me = this;

		if (hookName === 'exists' || hookName === 'ready') return 1;

		if ($.isArray(hookName)) {
			for (var hook = 0; hook < hookName.length; hook++) {
				me.hookEvent(moduleName, hookName[hook], func);
			}
		} else {
			if (!this.listeners[moduleName]) { 
				this.listeners[moduleName] = {};
				this.listeners[moduleName]['exists'] = true;
				this.listeners[moduleName]['ready'] = false; 
			}

			if (!this.listeners[moduleName][hookName]) {
				this.listeners[moduleName][hookName] = [func];
			} else {
				this.listeners[moduleName][hookName].push(func);
			}

			return 0;
		}
	};

	this.unhookEvent = function (moduleName, hookName, func) {
		if (this.listeners[moduleName]) {
			if (this.listeners[moduleName][hookName]) {
				for (var i = 0; i < this.listeners[moduleName][hookName].length; i++) {
					if (this.listeners[moduleName][hookName][i] === func)
						this.listeners[moduleName][hookName][i] = null;
				}
			}
		}
	};

	this.fireEvent = function (moduleName, hookName, data) {
		var me = this;
		if ($.isArray(moduleName)) {
			for (var module = 0; module < moduleName.length; module++) {
				me.fireEvent(moduleName[module], hookName, data);
			}
		} else {
			if (this.listeners[moduleName]) {
				if (this.listeners[moduleName][hookName]) {
					for (var i = 0; i < this.listeners[moduleName][hookName].length; i++) {
						if (this.listeners[moduleName][hookName][i] !== null)
							this.listeners[moduleName][hookName][i](data, hookName);
					}
				}
			}
		}
	};

	this.loadModules = function () {
		this.registerModule('justice', new iglooReversion());
		iglooF('justice').buildInterface();
		this.announce('rollback');

		this.registerModule('trash', new iglooDelete());
		iglooF('trash').buildInterface();
		this.announce('csd');

		this.registerModule('archives', new iglooArchive());
		iglooF('archives').buildInterface();
		this.announce('archives');

		this.registerModule('detective', new iglooSearch());
		iglooF('detective').buildInterface();
		this.announce('search');

		this.registerModule('hammer', new iglooBan());
		iglooF('hammer').buildInterface();
		this.announce('block');

		this.registerModule('past', new iglooPast());
		iglooF('past').buildInterface();
		this.announce('hist');

		this.bindKeys();
		this.fireEvent('core', 'modules-loaded', true);
	};

	this.extendProto = function (func, extendWith) {
		func.prototype = $.extend(extendWith(), func.prototype);
	};

	this.registerModule = function (module, obj) {
		if (typeof obj === 'undefined') {
			if (typeof module === 'object') {
				if ($.isArray(module)) {
					for (var i = 0; i < module.length; i++) this.registerModule(module[i].name, module[i].obj);
				} else {
					this.registerModule(module.name, module.obj);
				}
			}
		} else {
			this.modules[module] = obj;
		}
	};

	this.fetchModule = function (module) {
		return igloo.modules[module];
	};

	this.bindKeys = function () {
		if (iglooUserSettings.upDownKeys) {
			iglooF('piano').register('up', 'default', function () {
				iglooF('recentChanges').browseFeed(-1);
			});

			iglooF('piano').register('down', 'default', function () {
				iglooF('recentChanges').browseFeed(1);
			});
		}

		iglooF('piano').register('backspace', 'default', function () {
			iglooF('archives').goBack(1);
		});

		iglooF('piano').register('f5', 'default', function () {
			var keyCheck = confirm('You just pressed the F5 key. By default, this causes the page to refresh in most browsers. To prevent you losing your work, igloo therefore agressively blocks this key. Do you wish to reload the page?');
			if (keyCheck === true) {
				window.location.reload(true);
			}
		});
	};
}



// Class iglooContentManager
	/*
	** iglooContentManager keeps track of iglooPage items
	** that are loaded by the recent changes ticker or at
	** the user request. Because igloo cannot store all
	** changes for the duration of the program, it must
	** decide when to discard the page item to save memory.
	** The content manager uses a relevance score to track
	** items. This score is created when the manager first
	** sees the page and decreases when the content manager
	** sees activity. When an item reaches 0, it is open
	** to be discarded. If an item sees further actions, its
	** score can be refreshed, preventing it from being
	** discarded for longer.
	*/
function iglooContentManager () {
	this.contentSize = 0;
	this.discardable = 0;
	this.content = {};

	this.add = function (page) {
		this.decrementScores();
		this.contentSize++;
		this.content[page.info.pageTitle] = {
			exists: true,
			page: page,
			hold: true,
			timeAdded: new Date(),
			timeTouched: new Date(),
			score: iglooConfiguration.defaultContentScore
		};

		igloo.log("Added a page to the content manager. Size: " + this.contentSize);
		this.gc();

		return this.content[page.info.pageTitle];
	};

	this.getPage = function (title) {
		if (this.content[title]) {
			return this.content[title].page;
		} else {
			return false;
		}
	};

	this.decrementScores = function () {
		var s = "CSCORE: ";
		for (var i in this.content) {
			if (this.content[i].score > 0) {
				s += this.content[i].score + ", ";
				if (--this.content[i].score === 0) {
					igloo.log("an item reached a score of 0 and is ready for discard!");
					this.discardable++;
				}
			}
		}
		igloo.log(s);
	};

	this.gc = function () {
		igloo.log("Running GC");
		if (this.discardable === 0) return;
		if (this.contentSize > iglooUserSettings.maxContentSize) {
			igloo.log("GC removing items to fit limit (" + this.contentSize + "/" + iglooUserSettings.maxContentSize + ")");
			var j = 0, lastZeroScore = null, gcVal = 0.3, gcStep = 0.05;
			for (var i in this.content) {
				if (this.content[i].score !== 0 || this.content[i].isRecent !== false || this.content[i].page.displaying !== false) {
					j++;
					gcVal += gcStep;
					continue;
				} else {
					lastZeroScore = i;
				}

				if (j === this.contentSize - 1) {
					if (lastZeroScore !== null) {
						igloo.log("failed to randomly select item, discarding the last one seen");
						this.content[lastZeroScore] = undefined;
						this.contentSize--;
						this.discardable--;
						break;
					}
				}

				if (this.content[i].score === 0 && this.content[i].isRecent === false && Math.random() < gcVal && this.content[i].page.displaying === false) {
					igloo.log("selected an item suitable for discard, discarding");
					this.content[i] = undefined;
					this.contentSize--;
					this.discardable--;
					break;
				} else {
					j++;
					gcVal += gcStep;
				}
			}
		}
	};
}


// Class iglooRecentChanges
	/*
	** iglooRecentChanges is the ticker class for igloo.
	** With no modules loaded, igloo simply acts as a recent
	** changes viewer. This class maintains the list of 
	** iglooPage elements that represent wiki pages that have
	** recently changed. Each pages contains many diffs. Once
	** created, this class will tick in the background and
	** update itself. It can be queried and then rendered at
	** any point.
	*/
function iglooRecentChanges () {
	var me = this;
	
	igloo.log('generated RC ticker');
	
	this.tick = null;
	this.loadUrl = iglooConfiguration.api;
	this.tickTime = 4000;
	this.recentChanges = [];
	this.viewed = [];
	this.botList = [];
	this.currentRev = -1;
	this.currentPage = null;

	// Methods
	this.setTickTime = function (newTime) {
		this.tickTime = newTime;
		clearInterval(this.tick);
		this.tick = setInterval(function () { me.update.apply(me); }, this.tickTime);
	};
	
	// Constructor
	this.renderResult = document.createElement('ul'); // this is the output panel
	$(this.renderResult).css({
		'position': 'absolute',
		'top': '0px',
		'left': '0px',
		'padding': '0px',
		'margin': '0px',
		'width': '100%',
		'height': '100%',
		'list-style': 'none inherit none',
		'overflow': 'auto',
		'color': jin.Colour.WHITE,
		'cursor': 'pointer'
	});
	$(me.renderResult).on ({
		mouseover: function () { $(this).css('backgroundColor', jin.Colour.GREY); },
		mouseout: function () { $(this).css('backgroundColor', jin.Colour.DARK_GREY); },
		click: function () { me.show.apply(me, [$(this).data('elId')]) ; }
	}, 'li');
	igloo.ticker.panel.appendChild(this.renderResult);
	
}

igloo.extendProto(iglooRecentChanges, function () {
	return {
		update: function () {
			var me = this;
			
			var rcFetch = new iglooRequest({
				url: me.loadUrl,
				data: { format: 'json', action: 'query', list: 'recentchanges', rcprop: 'title|user|ids|comment|timestamp|flags', rclimit: iglooUserSettings.updateQuantity },
				dataType: 'json',
				context: me,
				success: function (data) {
					me.loadChanges.apply(me, [data]);
				}
			}, 0, false);
			rcFetch.run();
		},

		loadChanges: function (changeSet) {
			var data = changeSet.query.recentchanges;
			
			// For each change, add it to the changeset.
			var l = data.length;
			for (var i = 0; i < l; i++) {
				var exclude = false, l2 = this.recentChanges.length, exists = false, p;

				//Check if we've already seen this revision
				for (var k = 0; k < this.viewed.length; k++) {
					if (data[i].revid === this.viewed[k].revId) {
						this.viewed[k].stillHere = true;
						exclude = true;
						break;
					}
				}

				//Hide if hideown is set to true
				if (iglooUserSettings.hideOwn === true) {
					if (data[i].user === mw.config.get('wgUserName')) {
						exclude = true;
					}
				}

				//Hide bot edits
				if (iglooUserSettings.hideBot === true) {
					if (typeof data[i].bot !== "undefined") exclude = true;
				}
				
				if (exclude === true) {
					continue; //skip this revision if if its marked as exclude
				}

				// Check if we already have information about this page.
				for (var j = 0; j < l2; j++) {
					if (data[i].title === this.recentChanges[j].info.pageTitle) {
						p = iglooF('contentManager').getPage(data[i].title);
						p.addRevision(new iglooRevision(data[i]));
						p.hold = true;
						exists = true;
						break;
					}
				}

				if (!exists) {
					p = new iglooPage(new iglooRevision(data[i]));
					iglooF('contentManager').add(p);
					this.recentChanges.push(p);
				}
			}
			this.recentChanges.sort(function (a, b) { return b.lastRevision - a.lastRevision; });

			// Truncate the recent changes list to the correct length
			if (this.recentChanges.length > 30) {
				// Objects that are being removed from the recent changes list are freed in the
				// content manager for discard.
				for (var x = 30; x < this.recentChanges.length; x++) {
					if (this.recentChanges[x] === this.currentPage) continue;

					igloo.log("Status change. " + this.recentChanges[x].info.pageTitle + " is no longer hold");
					var page = iglooF('contentManager').getPage(this.recentChanges[x].info.pageTitle);
					page.hold = false;
				}
				this.recentChanges = this.recentChanges.slice(0, 30);
			}
			
			// Render the result
			this.render();
		},

		//Don't show revisions that you've already seen in the feed any more
		markViewed: function (revId) {
			var me = this;
			for (var change = 0; change < this.recentChanges.length; change++) {
				if (me.recentChanges[change].revisions.iglast().revId === revId) {
					me.recentChanges.splice(change, 1);
					me.render();
					me.viewed.push({
						revId: revId,
						stillHere: false
					});
					break;
				}
			}

			for (var i = 0; i < this.viewed.length; i++) {
				if (!me.viewed[i].stillHere) {
					me.viewed.splice(change, 1);
				}
			}
		},

		//Browse feed- used by keyboard shortcuts
		browseFeed: function (number) {
			number = number || 1;

			if ((this.currentRev + number) >= 0 && (this.currentRev + number) < this.recentChanges.length) {
				this.show(this.currentRev + number);
			}
		},

		// ask a diff to show its changes
		show: function (elementId) {
			var me = this;
			if (iglooF('actions').stopActions) return false;
			this.currentRev = elementId;
			this.recentChanges[elementId].display();
			var pause = setTimeout(function () {
				var page = me.recentChanges[elementId];
				me.markViewed(page.revisions.iglast().revId);
				pause = false;
			}, 500);

			return this;
		},

		//render RC
		render: function () {
			this.renderResult.innerHTML = '';
			for (var i = 0; i < this.recentChanges.length; i++) {
				// Create each element
				var t = document.createElement('li');
				
				// Styling
				$(t).css ({
					'padding': '0px 0px 0px 10px',
					'borderBottom': '1px solid #000000',
					'list-style-type': 'none',
					'list-style-image': 'none',
					'marker-offset': '0px',
					'margin': '0px'
				});
				
				// Finish
				if (this.recentChanges[i].isNewPage) {
					t.innerHTML = "<strong>N</strong> " + this.recentChanges[i].info.pageTitle;
				} else {
					t.innerHTML = this.recentChanges[i].info.pageTitle;
				}
				$(t).data("elId", i);
				this.renderResult.appendChild(t);
			}
			igloo.log("Rendered " + i + " recent changes.");
			
			return this;
		}
	};
});


// Class iglooView
	// iglooView represents a content view. There could be
	// multiple views, each showing their own bit of content.
	// iglooView can support viewing anything that inherits
	// from iglooViewable.

function iglooView () {
	var me = this;

	// State
	this.displaying = null;
	this.changedSinceDisplay = false;

	// Hook to relevant events
	igloo.hookEvent('core', 'displayed-page-changed', function (data) {
		if (me.displaying) {
			if (data.page === me.displaying.page && !iglooF('actions').stopActions) {
				me.changedSinceDisplay = true;
				me.displaying = data;
				me.displaying.show();
			}
		}
	});
}

igloo.extendProto(iglooView, function () {
	return {
		//Displays a revision
		display: function (revision) {
			// If a revision is being displayed, set the displaying
			// flag for the page to false.
			if (iglooF('actions').stopActions) return false;

			if (this.displaying) {
				this.displaying.page.displaying = false;
				this.displaying.page.changedSinceDisplay = false;
			}

			// Set the new revision into the page, then show it.
			this.displaying = revision;
			this.displaying.show();
		},

		//Display the welcome message
		displayWelcome: function () {
			// this function specifically displays the welcome message in the diff window
			var welcomeRequest = new iglooRequest({
				module: 'getPage',
				params: { targ: glooLocalBase + '/config', revisions: 1, properties: 'content' },
				callback: function (data) {
					//Perform regex
					var regTest, o, regResult;

					if (igloo.firstRun === true) {
						regTest = /firstrun:(.+?);;/i;
					} else {
						regTest = /welcome:(.+?);;/i;
					}

					//get Regex
					regResult = regTest.exec(data[0].content);
					o = regResult[1].replace('%CURRENTVERSION%', iglooConfiguration.version);
					o = o.replace('%CURRENTUSER%', mw.config.get('wgUserName'));

					// Clear current display.
					$(igloo.diffContainer.panel).find('*').remove();
						
					// Append new content.
					$(igloo.diffContainer.panel).append(o);

				}
			}, 0, true, true);
			welcomeRequest.run();
		}
	};
});

// Class iglooPage
function iglooPage () {
	// Details
	this.info = {
		pageTitle: '',
		namespace: 0
	};
	this.lastRevision = 0;
	this.revisions = [];
	
	// State
	this.displaying = false; // currently displaying
	this.changedSinceDisplay = false; // the data of this page has changed since it was first displayed
	this.isNewPage = false; // whether this page currently only contains the page creation
	this.isRecent = false;
	
	// Methods
	
	// Revisions can be added to a page either by a history lookup, or 
	// by the recent changes ticker. The 'diff' attached to a revision
	// is always the diff of this revision with the previous one, though
	// other diffs can be loaded as requested (as can the particular 
	// content at any particular revision).
	
	// Constructor
	if (arguments[0]) {
		this.info.pageTitle = arguments[0].pageTitle;
		this.addRevision(arguments[0]);
	}
}

igloo.extendProto(iglooPage, function () {
	return {
		addRevision: function (newRev) {
			// Check if this is a duplicate revision.
			for (var i = 0; i < this.revisions.length; i++) {
				if (newRev.revId === this.revisions[i].revId) return;
			}

			if (this.isNewPage) {
				this.isNewPage = false;
			} else if (newRev.type === 'new') {
				this.isNewPage = true;
			}

			newRev.page = this;
			this.revisions.push(newRev);
			this.revisions.sort(function (a, b) { return a.revId - b.revId; });
			
			if (newRev.revId > this.lastRevision) this.lastRevision = newRev.revId;
			if (this.displaying && newRev.revId > this.lastRevision) {
				alert('update');
				igloo.fireEvent('core', 'displayed-page-changed', newRev);
				this.changedSinceDisplay = true;
			}
		},

		display: function () {
			// Calling display on a page will invoke the display
			// method for the current view, and pass it the relevant
			// revision object.
			var currentView = igloo.getCurrentView(),
				toShow = -1;

			iglooF('recentChanges').currentPage = this;

			if (arguments[0]) {
				for (var x = 0; x < this.revisions.length; x++) {
					if (arguments[0] === this.revisions[x].revId) toShow = x;
				}

				if (toShow !== -1) {
					currentView.display(this.revisions[x]);
				} else {
					currentView.display(this.revisions.iglast());
				}
			} else {
				currentView.display(this.revisions.iglast());
			}

			this.displaying = true;
			this.changedSinceDisplay = false;
		}
	};
});

// Class iglooRevision
	/*
	** iglooRevision represents a revision and associated diff
	** on the wiki. It may simply represent the metadata of a
	** change, or it may represent the change in full.
	*/
function iglooRevision () {
	// Content detail
	this.user = ''; // the user who made this revision
	this.page = ''; // the page title that this revision belongs to
	this.pageTitle = ''; // also the page title that this revision belongs to
	this.namespace = 0;
	this.revId = 0; // the ID of this revision (the diff is between this and oldId)
	this.oldId = 0; // the ID of the revision from which this was created
	this.type = 'edit';
	
	this.revisionContent = ''; // the content of the revision
	this.diffContent = ''; // the HTML content of the diff
	this.revisionRequest = null; // the content request for this revision.
	this.diffRequest = null; // the diff request for this revision
	this.revisionLoaded = false; // there is content stored for this revision
	this.diffLoaded = false; // there is content stored for this diff
	
	this.displayRequest = false; // diff should be displayed when its content next changes
	this.page = null; // the iglooPage object to which this revision belongs
	
	// Constructor
	if (arguments[0]) {
		this.setMetaData(arguments[0]);
	}
}

igloo.extendProto(iglooRevision, function () {
	return {
		//Sets the data of this revision
		setMetaData: function (newData) {
			this.page = newData.title;
			this.pageTitle = newData.title;
			this.namespace = newData.ns;
			this.oldId = newData.old_revid;
			this.revId = newData.revid;
			this.type = newData.type;
			this.user = newData.user;
			this.summary = newData.comment;
			this.timestamp = new Date(newData.timestamp);
			this.minor = "";//(newData.minor != "undefined") === true ? 'm' : '';
		},

		loadRevision: function () {
			var me = this;

			iglooF('justice').reversionEnabled = 'pause';

			if (this.revisionRequest === null) {
				this.revisionRequest = new iglooRequest({
					url: iglooConfiguration.api,
					data: { format: 'json', action: 'query', prop: 'revisions', revids: '' + me.revId, rvprop: 'content', rvparse: 'true' },
					dataType: 'json',
					context: me,
					success: function (data) {
						for (var i in data.query.pages) {
							this.revisionContent = data.query.pages[i].revisions[0]['*'];
						}
						this.revisionLoaded = true;
						if (this.displayRequest === 'revision') this.display('revision');
						this.revisionRequest = null;
					}
				}, 0, true);
				this.revisionRequest.run();
			}
		},

		loadDiff: function () {
			var me = this;

			iglooF('justice').reversionEnabled = 'pause';

			if (this.diffRequest === null) {
				igloo.log('Attempted to show a diff, but we had no data so has to load it.');
				this.diffRequest = new iglooRequest({
					url: iglooConfiguration.api,
					data: { format: 'json', action: 'compare', fromrev: '' + me.oldId, torev: '' + me.revId },
					dataType: 'json',
					context: me,
					success: function (data) {
						this.diffContent = data.compare['*'];
						this.diffLoaded = true;
						if (this.displayRequest === 'diff') this.display('diff');
						this.diffRequest = null;
					}
				}, 0, true);
				this.diffRequest.run();
			}
		},

		//Actually displays the diff in the diffContainer
		display: function () {
			// Determine what should be displayed.
			var displayWhat,
				me = this,
				h2,
				months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

			if (!arguments[0]) {
				displayWhat = 'diff';
			} else {
				displayWhat = arguments[0];
			}

			// If this was fired as a result of a display request, clear the flag.
			if (this.displayRequest) this.displayRequest = false;
			
			// Mark as displaying, and fire the displaying event.
			this.displaying = true;
			igloo.fireEvent('core', 'displaying-change', this);

			// Add to archives
			iglooF('archives').manageHist(this.pageTitle, this.user, this.revId);

			//Clear search error tag
			$('#igloo-search-error').html('');

			//You can get the pageHistory/csd of new pages and diffs
			igloo.fireEvent(['csd', 'history', 'block', 'actions'], 'new-diff', {
				pageTitle: me.pageTitle,
				revId: me.revId,
				user: me.user
			});

			// Create display element.
			if (displayWhat === 'revision' || this.type === 'new') {
				var div = document.createElement('div');

				h2 = document.createElement('h2');
				h2.id = 'iglooPageTitle';

				// Append new content.
				h2.innerHTML = this.pageTitle;
				div.innerHTML = this.revisionContent;
				
				// Style display element.
				$(div).find('a').each(function () {
					$(this).prop('target', '_blank');
				});
				$(h2).css({'font-size' : '18px', 'margin-bottom': '5px', 'margin-top': '5px'});
				
				// Clear current display.
				$(igloo.diffContainer.panel).find('*').remove();

				//Append delete module
				iglooF('trash').dropdown.loadModule();

				//Append history module
				iglooF('past').dropdown.loadModule();

				//Append quick actions module
				iglooF('cogs').dropdown.loadModule();
				
				// Append new content.
				igloo.diffContainer.panel.appendChild(h2);
				igloo.diffContainer.panel.appendChild(div);

				//You can't rollback new pages
				igloo.fireEvent('rollback','new-diff', {
					pageTitle: '',
					revId: -1,
					user: ''
				});

			} else if (displayWhat === 'diff') {
				var table = document.createElement('table'), 
					same = document.createElement('div'),
					ts = this.timestamp,
					old = {},
					ots = null,
					dispWhat;

				iglooF('actions').getRevInfo(this.pageTitle, this.oldId, function (data) {
					old = data;
					ots = new Date(data.timestamp);
				
					h2 = document.createElement('h2');
					h2.id = 'iglooPageTitle';

					table.innerHTML = '<tr style="vertical-align: top;"><td colspan="2" style="text-align: center;"><div><strong>Revision as of ' + ots.getUTCHours() + ':' + ots.getUTCMinutes() + ', ' + ots.getUTCDate() + ' ' + months[ots.getUTCMonth()] + ' ' + ots.getFullYear() + '</strong></div><div>'+ old.user +'</div><div><strong title="This is a minor edit">'+ old.minor + '</strong>&nbsp;<span>('+ old.comment +')</span></div></td><td colspan="2" style="text-align: center;"><div><strong>Revision as of ' + ts.getUTCHours() + ':' + ts.getUTCMinutes() + ', ' + ts.getUTCDate() + ' ' + months[ts.getUTCMonth()] + ' ' + ts.getFullYear() + '</strong></div><div>' + me.user + '</div><div><strong title="This is a minor edit">'+ me.minor + '</strong>&nbsp;<span>('+ me.summary +')</span></div></td></tr><tr><td id="iglooDiffCol1" colspan="2"> </td><td id="iglooDiffCol2" colspan="2"> </td></tr>' + me.diffContent;
					h2.innerHTML = me.pageTitle;
					same.innerHTML = '<br/><span style="text-align:center">(No Change)</span><br/>';

					//Style stuff
					$(h2).css({'font-size' : '18px', 'margin-bottom': '5px', 'margin-top': '5px'});

					$(table).css({ 'width': '100%', 'overflow': 'auto', 'font-size': iglooUserSettings.diffFontSize + 'px'});
					$(table).find('#iglooDiffCol1').css({ 'width': '50%' });
					$(table).find('#iglooDiffCol2').css({ 'width': '50%' });

					$(table).find('.diff-empty').css('');
					$(table).find('.diff-addedline').css({ 'background-color': '#ccffcc' });
					$(table).find('.diff-marker').css({ 'text-align': 'right' });
					$(table).find('.diff-lineno').css({ 'font-weight': 'bold' });
					$(table).find('.diff-deletedline').css({ 'background-color': '#ffffaa' });
					$(table).find('.diff-context').css({ 'background-color': '#eeeeee' });
					$(table).find('.diffchange').css({ 'color': 'red' });

					//flag Profanity
					table.innerHTML = me.flagProfanity(table.innerHTML);
					
					// Clear current display.
					$(igloo.diffContainer.panel).find('*').remove();
					
					//Append rollback module
					iglooF('justice').dropdown.loadModule();

					//Append csd module
					iglooF('trash').dropdown.loadModule();

					//Append history module
					iglooF('past').dropdown.loadModule();

					//Append Quick Actions module
					iglooF('cogs').dropdown.loadModule();

					// Append new content.
					dispWhat = (this.diffContent === "") ? same : table;
					
					igloo.diffContainer.panel.appendChild(h2);
					igloo.diffContainer.panel.appendChild(dispWhat);

					//Alert rollback as to page info
					igloo.fireEvent('rollback','new-diff', {
						pageTitle: me.pageTitle,
						revId: me.revId,
						user: me.user
					});

					// we can now revert this edit
					if (iglooF('justice').reversionEnabled === 'pause') iglooF('justice').reversionEnabled = 'yes';
				});
			}
		},

		//Called from iglooView/iglooPage- determines what to display
		show: function () {
			// Determine what to show.
			var displayWhat;
		  
			if (!arguments[0]) {
				displayWhat = 'diff';
			} else {
				displayWhat = arguments[0];
			}

			if (displayWhat === 'diff' && this.type === 'edit') {
				igloo.log('diff display requested, page: ' + this.page.info.pageTitle);
				
				if ((!this.diffLoaded) && (!this.diffRequest)) {
					this.displayRequest = 'diff';
					this.loadDiff();
				} else {
					this.display('diff');
				}
			} else {
				igloo.log('revision display requested, page: ' + this.page.info.pageTitle);
				
				if ((!this.revisionLoaded) && (!this.revisionRequest)) {
					this.displayRequest = 'revision';
					this.loadRevision();
				} else {
					this.display('revision');
				}
			}
		},

		//Flags profanity in the diff
		flagProfanity: function(html) {
			// this function flags profanity in the diff window
			if (iglooUserSettings.profFilter !== true) return html;
		 
			var profanity = new Array(
											/\b((?:moth[era]*)?[ -]*f+(?:u|oo)[ck]{2,}(?:ing?|er|hole)?s*|s[e3]+x+[iey]*|r[a4]p(?:e+d*|i+s+t+s*)|su[ck]+(?:s+|ed+|i+n+g+)?|gang[- ]?bang(?:er|ing)?|(?:(?:t+h+|f+)r[e3]{2,}|four)+s[o0]+me+)\b/ig, 
											/\b(h[o0]+m[o0]+(?:sexual(?:it(?:y|e)+)?)?|(?:is +)?ga+[iy]+|lesb(?:ian|[o0]*))\b/ig,
									 
											/\b([ck][o0]+[ck]{2,}(?:head|face|(?:su[ck]{2,}(?:er|ing)?))?|d[o0]+n+g|p[3e]+n[iu]+s+[3e]*s*|p+[3e]{2,}|d[i1]+[ck]{2,}s*(?:su[ck]{2,}(?:er|ing)?)?|manh(?:[o0]{2,}|u+)d+|b[o0]+n+e*r+s*|ball[sz]+(?:a[ck]{2,})?)\b/ig, 
											/\b(cun+(?:t|[iey]+)s*|vag(?:ina)?s*|puss+[yie]+s*|fann+[yie]+s*)\b/ig, 
											/\b(t+i+t+(?:s*|[iey]+[sz]*)|breasts*|b+[o0]{2,}b+[ieys]*)\b/ig, 
											/\b(anal+|ar*ss+e*|ar*se+s+|(?:bum+|butt+) ?(?:h[o0]+le|cr+a[ck]+|o(?:[ck]+s|x+))?)\b/ig,
									 
											/\b((?:bull)?(?:s+hite*|ass+)(?:holes?|he[a4]+d+s*)?|cr[a4*]+p+[iy]*|cru+d+|poo+)\b/ig,
											/\b(w*h+[o0]+r*e+s*|prostitutes*|s+l+u+t+s*|slags*|cu+m+(?:ing)?|d[il]{2,}d[o0]+[o0e]*s*|(?:b+l+[o0]+w+|h+[a4]+n+d+|t[i1]+t+[iey]*)j+[o0]+b+[sz]*|c[o0]+ndom[sz]*|p[o0]+rn)\b/ig,
											/\b(nigg+(?:er|a+)s*|naz+i+[sz]+|ped[o0]+(?:[phf]+ile)?[sz]*)\b/ig,
											/\b(ret[a4]+r+d+(?:ed|s)?|f+[a4]+g+([o0]+t+)?s*|d[ou]+che?(ba+g)?s*|bast[ea]rds*|bit*ch[iey]*|[you]*r+ ?m+[ou]+m+)\b/ig,
									 
											/('{3,}bold text'{3,}|'{2,}italic text'{2,}|\[{2,}link title\]{2,}|\[http:\/\/www\.example\.com link title\]|={2,} *headline text *={2,})/ig,
											/\b(q[qwerty]{5,}|[asdf]{8,}|[ghjkl]{8,}|[uiop]{8,})\b/ig,
											/\b(lol(?:l*ol|cat[sz]*)*|li+e+k)\b/ig,
											/\b(ha?i+(?=\/)|he+ll+o+|(?:ha+|hee+|ho+)+|l[ou]+v+|ya|ye+h+)\b/ig,
											/([!?;]{3,}|[.|]{4,}|={6,}|([a-z0-9])\2{6,})/ig
			);
		 
			for (var i = 0; i < profanity.length; i++) {
				html = html.replace(profanity[i], '<span style="background-color: #ff99ff; font-weight: bold; text-decoration: underline;">$1</span>');
			}
		 
			return html;
		}
	};
});


// Class iglooKeys
	/*
	** iglooKeys manages all the key actions for igloo.
	** There are multiple modes to iglooKeys and for each
	** mode, there are different key shortcuts. Modules
	** can register keystrokes to modes from their own classes,
	** although they can't create modes of their own yet
	** Creds to Mousetrap for being an awesome library
	*/
function iglooKeys () {
	this.mode = 'default';
	this.keys = ['default', 'search', 'settings'];
	this.cbs = {
		'default': {},
		'search': {
			noDefault: true
		},
		'settings': {}
	};

	//This registers a new keybinding for use in igloo
	//And then executes the function under the right circumstances
	this.register = function (combo, mode, func) {
		var me = this;
		if ($.inArray(mode, this.keys) !== -1 && iglooUserSettings.useKeys === true) {
			this.cbs[mode][combo] = func;

			Mousetrap.bind(combo, function(e, input) {
				if (!me.cbs[iglooF('piano').mode].noDefault || input === 'f5') {
					if (e.preventDefault) {
						e.preventDefault();
					} else {
						// internet explorer
						e.returnValue = false;
					}
				}

				if (typeof me.cbs[iglooF('piano').mode][input] !== 'undefined') {
					me.cbs[iglooF('piano').mode][input]();
				}
			});
			return true;
		} else {
			return false;
		}
	};
}


//Class iglooSettings- builds settings interface and manages settings storage/handling
function iglooSettings () {
	this.popup = null;
	this.dialogs = {
		warn: null
	};
	this.settingsEnabled = true;
	this.isOpen = false;
}

igloo.extendProto(iglooSettings, function () {
	return {
		retrieve: function () {
			if (igloo.remoteConnect && !igloo.connectLocal) {
				iglooImport(iglooConfiguration.remoteHost + 'main.php?action=settings&me=' + encodeURIComponent(mw.config.get('wgUserName')) + '&do=get&session=' + igloo.sessionKey, true).onload = function () {
					if (typeof iglooNetSettings !== "undefined") {
						iglooUserSettings.firstRun = false;
						$.extend(iglooUserSettings, iglooNetSettings);	
						
						for (var defaultSetting in iglooUserSettings) {
							iglooImport(iglooConfiguration.remoteHost + 'main.php?action=settings&me=' + encodeURIComponent(mw.config.get('wgUserName')) + '&do=set&setting=' + encodeURIComponent(defaultSetting) + '&value=' + encodeURIComponent(iglooUserSettings[defaultSetting]) + '&session=' + igloo.sessionKey, true);
						}
					} else {
						if (mw.user.options.get('userjs-igloo') !== null) {
							$.extend(iglooUserSettings, JSON.parse(mw.user.options.get('userjs-igloo')));
						}

						for (var origSetting in iglooUserSettings) {
							iglooImport(iglooConfiguration.remoteHost + 'main.php?action=settings&me=' + encodeURIComponent(mw.config.get('wgUserName')) + '&do=set&setting=' + encodeURIComponent(origSetting) + '&value=' + encodeURIComponent(iglooUserSettings[origSetting]) + '&session=' + igloo.sessionKey, true);
						}
					}
				};
			}

			var setIglooPrefs;
			if (mw.user.options.get('userjs-igloo') === null) {
				setIglooPrefs = new iglooRequest({
					module: 'preferences',
					params: { key: 'userjs-igloo', value: JSON.stringify(iglooUserSettings) },
					callback: function (data) {
						igloo.launch();
					}
				}, 0, true, true);
				setIglooPrefs.run();
			} else {
				var stored = JSON.parse(mw.user.options.get('userjs-igloo'));
				igloo.firstRun = false;
				$.extend(iglooUserSettings, stored);
				//and then if there's settings in iglooUserSettings that aren't in the stored settings
				//merge them. This happens when we add a new key.
				$.extend(stored, iglooUserSettings);

				setIglooPrefs = new iglooRequest({
					module: 'preferences',
					params: { key: 'userjs-igloo', value: JSON.stringify(stored) },
					callback: function (data) {
						igloo.launch();
					}
				}, 0, true, true);
				setIglooPrefs.run();
			}

			igloo.launch();
		},

		set: function (setting, value, cb) {
			var me = this,
				storedSettings = JSON.parse(mw.user.options.get('userjs-igloo')),
				key = (setting === "remoteConnect") ? 'userjs-iglooRemoteConnect' : 'userjs-igloo';

			cb = (typeof cb !== "undefined" || typeof cb === "function") ? cb : function () {};

			if (this.settingsEnabled !== true) cb(false);

			this.settingsEnabled = false;

			if (igloo.remoteConnect && setting !== "remoteConnect" && !igloo.connectLocal) { //It'd be useless to query remotely to see if we're allowed to connect remotely
				//settingEnabled isn't made true for this because we still need to use the API.
				iglooImport(iglooConfiguration.remoteHost + 'main.php?action=settings&me=' + encodeURIComponent(mw.config.get('wgUserName')) + '&do=set&setting=' + encodeURIComponent(setting) + '&value=' + encodeURIComponent(value) + '&session=' + igloo.sessionKey, true);
			}

			storedSettings[setting] = value;

			var setIglooSetting = new iglooRequest({
				module: 'preferences',
				params: { key: key, value: JSON.stringify(storedSettings) },
				callback: function (data) {
					var success = data.options === "success";
					cb(success);
					me.settingsEnabled = true;
				}
			}, 0, true, true);
			setIglooSetting.run();
		},

		buildInterface: function () {
			var settingsButton = document.createElement('div'),
				qActions = {
					warn: "Warn User (no revert)",
					report: "Report User",
					talk: ["Go to talk page on Wikipedia", mw.util.wikiScript('index') + "?title=Talk:", "actions", "currentPage", ""],
					diff: ["View diff on Wikipedia", mw.util.wikiScript('index') + "?diff=", "actions", "currentRev", ""],
					stats: "View basic user info"
				},
				me = this;

			settingsButton.id = 'igloo-settings';
			settingsButton.innerHTML = '<img title="Modify Igloo Settings" src= "' + iglooConfiguration.fileHost + 'images/igloo-settings.png">';
			
			this.dropdown = new iglooDropdown('igloo-settings', "cogs", qActions, 'igQActions',  {
				top: 113,
				right: '5px',
				where: 'right'
			}, '');

			$(settingsButton).click(function () {
				me.show();
			});

			$(settingsButton).css({
				'position': 'relative',
				'float': 'right',
				'width': '73px',
				'height': '73px',
				'padding-left': '-1px',
				'padding-top': '-1px',
				'margin-top': '17px',
				'margin-left': '5px',
				'margin-right': '5px',
				'cursor': 'pointer'
			});

			this.popup = new iglooPopup('<div id="igloo-settings-tabs" style="width: 790px; height: 14px; padding-left: 10px; "></div><div id="igloo-settings-content" style="width: 800px; height: 385px; border-top: 1px solid #000;"></div>');
			this.popup.buildInterface();

			// add tabs
			this.addtab('info', 'user info');
			this.addtab('general', 'general');
			this.addtab('interface', 'interface');
			this.addtab('close', 'close');

			igloo.toolPane.panel.appendChild(settingsButton);

			//dropdown
			this.dropdown.buildInterface();

			iglooF('piano').register('f5', 'settings', function () {
				var keyCheck = confirm('You just pressed the F5 key. By default, this causes the page to refresh in most browsers. To prevent you losing your work, igloo therefore agressively blocks this key. Do you wish to reload the page?');
				if (keyCheck === true) {
					window.location.reload(true);
				}
			});

			igloo.log('igloo: prepped settings main');
		},

		go: function (action) {
			/*qActions = {
					warn: "Warn User (no revert)",
					report: "Report User", //done
					talk: "Go to page talk on Wikipedia", //dont need function
					diff: "View diff on Wikipedia", //dont need function
					stats: "View basic user info"
				},*/
			var me = this;
			switch (action) {
				case 'warn':
					var wdText = '<div style="text-align:center; margin-bottom:10px;">Please select what you would like to warn the user for:</div><div><center><select id="glooWarn">';

					for (var og in iglooConfiguration.warnSummaries) {
						var optgroup = '<optgroup label="' + og + '">';
						for (var opt in iglooConfiguration.warnSummaries[og]) {
							optgroup += '<option value="' + opt + '">' + iglooConfiguration.warnSummaries[og][opt] + '</option>';
						}

						wdText += optgroup;
					}

					wdText += '</center></select><br/><div style="text-align:center;">--<a style="cursor:pointer;" id="glooWarnClick">Warn User</a>--</div>';

					me.dialogs.warn = new iglooPopup(wdText, 500, 70);
					me.dialogs.warn.buildInterface();
					me.dialogs.warn.show();

					$('#glooWarnClick').click(function () {
						var conf = true,
							wReason = $('#glooWarn')[0].options[$('#glooWarn')[0].selectedIndex].text,
							wTemplate = $('#glooWarn')[0].options[$('#glooWarn')[0].selectedIndex].value;

						if (iglooF('actions').currentUser === mw.config.get('wgUserName')) {
							conf = confirm("You seem to be warning yourself. Are you sure you want to do this?");

							if (conf === false) return false;
						}

						iglooF('cogs').dialogs.warn.hide();

						iglooF('actions').warnUser({
							reason: wReason,
							shouldWarn: conf,
							isCustom: false,
							template: wTemplate
						}, false);
					});

					break;
				case 'report':
					var makeSure = confirm('Are you sure you want to report this user to ARV');
					if (makeSure) {
						iglooF('actions').reportUser();
					}
					break;
				case 'stats':
					break;
			}
		},
				
		show: function () {
			var tabcont = document.getElementById('igloo-settings-content'), 
				me = this;

			if (tabcont === null) {
				me.popup = new iglooPopup('<div id="igloo-settings-tabs" style="width: 790px; height: 14px; padding-left: 10px; "></div><div id="igloo-settings-content" style="width: 800px; height: 385px; border-top: 1px solid #000;"></div>');
				me.popup.buildInterface();
				// add tabs
				me.addtab('info', 'user info');
				me.addtab('general', 'general');
				me.addtab('interface', 'interface');
				me.addtab('close', 'close');
			}

			this.popup.show();

			//Set isOpen variable
			this.isOpen = true;

			//Set key mode
			iglooF('piano').mode = 'settings';
		 
			// default tab
			this.switchtab('info');
		},
				
		hidedisplay: function () {
			this.popup.hide();
			this.isOpen = false;
			iglooF('piano').mode = 'default';
		},
				
		addtab: function ( tabid, tabtext ) {
			if (!tabid || !tabtext) return false;
			var tabscont = document.getElementById( 'igloo-settings-tabs' );
					
			tabscont.innerHTML += '<div id="igloo-settings-tab-' + tabid + '" style="float: left; position: relative; top: 1px; font-size: 10px; height: 12px; width: 50px; border: 1px solid #000; text-align: center; cursor: pointer; margin-right: 10px;" onclick="iglooF(\'cogs\').switchtab (\'' + tabid + '\');"> ' + tabtext + '</div>';
				
			return tabscont;
		},
				
		switchtab: function ( tabid ) {
			if (!tabid) {
				igloo.log('igloo: unexpected settings call, tab is missing');
				return false;
			}

			var tabcont = document.getElementById('igloo-settings-content'), cont, me = this;
					
			switch ( tabid ) {
				case 'info':
					tabcont.innerHTML = ''; // blank
					tabcont.innerHTML += '<div style="padding: 10px;">Welcome to the igloo settings panel. From here, you can update your igloo settings - there is no need to save your changes or restart igloo as any alterations will take place immediately. igloo currently has the following data regarding your account:<br /><br />- username: ' + mw.config.get('wgUserName') + '<br />- is an admin: ' + iglooUserSettings.mesysop + '<br /></div>';
					break;

				case 'general':
					cont = document.createElement('div');
					tabcont.innerHTML = ''; // blank
						
					cont.style.padding = '10px';
					cont.innerHTML = '';
					cont.innerHTML += '<div style="padding: 10px;">';
					cont.innerHTML += 'Change general igloo settings here.<br /><table style="background-color: #ccccff; border: none; margin-top: 5px; margin-left: 15px; width: 550px;">';

						$(cont).append(me.createOption('<b>Connect to Remote Server <span style="border-bottom: 1px dotted" title="igloo only stores settings and a session key- No IP adresses/personal info">?</a></b>', 'remoteConnect', {
							type: "checkbox",
							checked: igloo.remoteConnect ? true : false,
							onchange: function () {
								var el = $(this);
								iglooF('cogs').set("remoteConnect", el.prop('checked'), function (res) {
									if (!res) {
										el.attr('checked', !el.prop('checked'));
										alert('It seems like igloo is still processing your last settings change. Please wait a moment and then try again.');
									}
								});
							}
						}));

						cont.innerHTML += "<br/>";

						$(cont).append(me.createOption('RC Ticker Update Time', 'updateTime', {
							type: "text",
							value: iglooUserSettings.updateTime,
							onchange: function () {
								var el = $(this);
								if (isNaN(parseInt(el.val(), 10))) {
									el.val(iglooUserSettings.updateTime);
								} else {
									iglooF('cogs').set("updateTime", el.val(), function (res) {
										if (res) {
											iglooUserSettings.updateTime = parseInt(el.val(), 10);
										} else {
											el.val(iglooUserSettings.updateTime);
										}
									});
								}
							}
						}));

						cont.innerHTML += "<br/>";

						$(cont).append(me.createOption('Update Quantity', 'updateQuantity', {
							type: "text",
							value: iglooUserSettings.updateQuantity,
							onchange: function () {
								var el = $(this);
								if (isNaN(parseInt(el.val(), 10))) {
									el.val(iglooUserSettings.updateQuantity);
								} else {
									iglooF('cogs').set("updateQuantity", el.val(), function (res) {
										if (res) {
											iglooUserSettings.updateQuantity = parseInt(el.val(), 10);
										} else {
											el.val(iglooUserSettings.updateQuantity);
										}
									});
								}
							}
						}));

						cont.innerHTML += "<br/>";

						$(cont).append(me.createOption('Prompt on self revert', 'promptRevertSelf', {
							type: "checkbox",
							checked: iglooUserSettings.promptRevertSelf ? true : false,
							onchange: function () {
								var el = $(this);
								iglooF('cogs').set("promptRevertSelf", el.prop('checked'), function (res) {
									if (res) {
										iglooUserSettings.promptRevertSelf = el.prop('checked');
									} else {
										el.attr('checked', !el.prop('checked'));
									}
								});
							}
						}));

						cont.innerHTML += "<br/>";

						$(cont).append(me.createOption('Enable profanity highlighting', 'profFilter', {
							type: "checkbox",
							checked: iglooUserSettings.profFilter ? true : false,
							onchange: function () {
								var el = $(this);
								iglooF('cogs').set("profFilter", el.prop('checked'), function (res) {
									if (res) {
										iglooUserSettings.profFilter = el.prop('checked');
									} else {
										el.attr('checked', !el.prop('checked'));
									}
								});
							}
						}));

						cont.innerHTML += "<br/>";

						$(cont).append(me.createOption('Use keyboard shortcuts', 'useKeys', {
							type: "checkbox",
							checked: iglooUserSettings.useKeys ? true : false,
							onchange: function () {
								var el = $(this);
								iglooF('cogs').set("useKeys", el.prop('checked'), function (res) {
									if (res) {
										iglooUserSettings.useKeys = el.prop('checked');
									} else {
										el.attr('checked', !el.prop('checked'));
									}
								});
							}
						}));

						cont.innerHTML += "<br/>";

						$(cont).append(me.createOption('Hide Own edits from the RC Feed', 'hideOwn', {
							type: "checkbox",
							checked: iglooUserSettings.hideOwn ? true : false,
							onchange: function () {
								var el = $(this);
								iglooF('cogs').set("hideOwn", el.prop('checked'), function (res) {
									if (res) {
										iglooUserSettings.hideOwn = el.prop('checked');
									} else {
										el.attr('checked', !el.prop('checked'));
									}
								});
							}
						}));

						cont.innerHTML += "<br/>";

						$(cont).append(me.createOption('Log CSD tags (not deletes)', 'logCSD', {
							type: "checkbox",
							checked: iglooUserSettings.logCSD ? true : false,
							onchange: function () {
								var el = $(this);
								iglooF('cogs').set("logCSD", el.prop('checked'), function (res) {
									if (res) {
										iglooUserSettings.logCSD = el.prop('checked');
									} else {
										el.attr('checked', !el.prop('checked'));
									}
								});
							}
						}));

						cont.innerHTML += "<br/>";

						$(cont).append(me.createOption('Use the up and down arrow keys to browse the RC ticker', 'upDownKeys', {
							type: "checkbox",
							checked: iglooUserSettings.upDownKeys ? true : false,
							onchange: function () {
								var el = $(this);
								iglooF('cogs').set("upDownKeys", el.prop('checked'), function (res) {
									if (res) {
										iglooUserSettings.upDownKeys = el.prop('checked');
									} else {
										el.attr('checked', !el.prop('checked'));
									}
								});
							}
						}));

						cont.innerHTML += "<br/>";

						$(cont).append(me.createOption('Hide Bot edits', 'hideBot', {
							type: "checkbox",
							checked: iglooUserSettings.hideBot ? true : false,
							onchange: function () {
								var el = $(this);
								iglooF('cogs').set("hideBot", el.prop('checked'), function (res) {
									if (res) {
										iglooUserSettings.hideBot = el.prop('checked');
									} else {
										el.attr('checked', !el.prop('checked'));
									}
								});
							}
						}));

						cont.innerHTML += "<br/>";

						$(cont).append(me.createOption('Watch pages whose edits you revert', 'watchRollbacked', {
							type: "checkbox",
							checked: iglooUserSettings.watchRollbacked ? true : false,
							onchange: function () {
								var el = $(this);
								iglooF('cogs').set("watchRollbacked", el.prop('checked'), function (res) {
									if (res) {
										iglooUserSettings.watchRollbacked = el.prop('checked');
									} else {
										el.attr('checked', !el.prop('checked'));
									}
								});
							}
						}));

						cont.innerHTML += "<br/>";

						$(cont).append(me.createOption('Watch pages you tag for deletion', 'watchTagged', {
							type: "checkbox",
							checked: iglooUserSettings.watchTagged ? true : false,
							onchange: function () {
								var el = $(this);
								iglooF('cogs').set("watchTagged", el.prop('checked'), function (res) {
									if (res) {
										iglooUserSettings.watchTagged = el.prop('checked');
									} else {
										el.attr('checked', !el.prop('checked'));
									}
								});
							}
						}));

					cont.innerHTML += '</table></div>';
					
					tabcont.appendChild(cont);
					break;
							
				case 'interface':
					cont = document.createElement('div');
					tabcont.innerHTML = ''; // blank
						
					cont.style.padding = '10px';
					cont.innerHTML = '';
					cont.innerHTML += '<div style="padding: 10px;">';
					cont.innerHTML += 'Change igloo interface settings here.<br /><table style="background-color: #ccccff; border: none; margin-top: 5px; margin-left: 15px; width: 550px;">';

						$(cont).append(me.createOption('Diff font size (px)', 'diffFontSize', {
							type: "text",
							value: iglooUserSettings.diffFontSize,
							onchange: function () {
								var el = $(this);
								if (isNaN(parseInt(el.val(), 10))) {
									el.val(iglooUserSettings.diffFontSize);
								} else {
									iglooF('cogs').set("diffFontSize", el.val(), function (res) {
										if (res) {
											iglooUserSettings.diffFontSize = parseInt(el.val(), 10);
										} else {
											el.val(iglooUserSettings.diffFontSize);
										}
									});
								}
							}
			
						}));

						cont.innerHTML += "<br/>";

						$(cont).append(me.createOption('Dropdown window timeout (seconds)', 'dropdownWinTimeout', {
							type: "text",
							value: iglooUserSettings.dropdownWinTimeout,
							onchange: function () {
								var el = this;
								if (isNaN(parseFloat(el.value, 10))) {
									el.value = iglooUserSettings.dropdownWinTimeout;
								} else {
									iglooF('cogs').set("dropdownWinTimeout", el.value, function (res) {
										if (res) {
											iglooUserSettings.dropdownWinTimeout = parseFloat(el.value, 10);
										} else {
											el.value = iglooUserSettings.dropdownWinTimeout;
										}
									});
								}
							}
						}));
					cont.innerHTML += '</table></div>';
					
					tabcont.appendChild(cont);
					break;
							
				case 'close':
					me.hidedisplay();
					break;
						
				default:
					igloo.log('igloo: unexpected settings call, tab content undefined');
					break;
			}
		},

		createOption: function (description, id, properties) {
			var opt = document.createElement('tr'),
				main = document.createElement('td'),
				change = document.createElement('input');
			
			opt.style.marginLeft = '15px';
			opt.innerHTML = '';
			if (properties.type === "text") opt.innerHTML += '<td>'+ description + '</td>';

			for (var i in properties) {
				if (i === "onchange") {
					var strfunc = '' + properties[i];
					$(change).attr(i,  strfunc.substring(13, strfunc.length - 1));
				} else {
					$(change).attr(i, properties[i]);
				}
			}

			main.appendChild(change);
			opt.appendChild(main);
			if (properties.type !== "text") opt.innerHTML += '<td>'+ description + '</td>';

			return opt;
		}

	};
});

//Class iglooActions- misc actions
function iglooActions () {
	//we should have the current page here
	this.stopActions = false;
	this.currentPage = '';
	this.currentUser = '';
	this.currentRev = -1;
	this.isIp = false;
	this.checked = {};

	var me = this;
	igloo.hookEvent('actions', 'new-diff', function (data) {
		me.currentPage = data.pageTitle;
		me.currentRev = data.revId;
		me.currentUser = data.user;
		
		// check whether this user is an IP address, or a registered user
		if (data.user.match (/^[0-9]+\.[0-9]+\.[0-9]+\.?[0-9]*$/i) !== null) { 
			me.isIp = true; 
			me.checked = { 'auto': '','talk': '','anon': 'checked','email': '','create': 'checked' }; 
		} else { 
			me.isIp = false; 
			me.checked = { 'auto': 'checked','talk': '','anon': '','email': '','create': 'checked' }; 
		}
	});
}

iglooActions.prototype.getRevInfo = function (page, revId, cb) {
	var me = this;
	revId = parseInt(revId, 10);
	var getRev = new iglooRequest({
		url: iglooConfiguration.api,
		data: { format: 'json', action: 'query', prop: 'revisions', revids: revId, indexpageids: 1},
		dataType: 'json',
		context: me,
		success: function (data) {
			var info = data.query.pages[data.query.pageids[0]], res = {};
			res.title = page;
			res.ns = info.ns;
			res.timestamp = info.revisions[0].timestamp;
			res.user = info.revisions[0].user;
			res.comment = info.revisions[0].comment;
			res.minor = "";//info.revisions[0].minor;
			res.old_revid = info.revisions[0].parentid;
			res.revid = revId;
			if (info.revisions[0].parentid === 0) {
				res.type = 'new';
			} else {
				res.type = 'edit';
			}

			cb(res);
		}
	}, 0, true);
	getRev.run();
};

//Loads a page
iglooActions.prototype.loadPage = function (page, revId) {
	if (iglooF('actions').stopActions) return false;

	this.getRevInfo(page, revId, function (data) {
		var p = new iglooPage(new iglooRevision(data));
		p.display();
	});
};

//Warn a user w/o reverting them
iglooActions.prototype.warnUser = function(details, withrevert, res, callback) {
	var me = this;
	//details {reason: something, template: something, isCustom: something, shouldWarn: something}

	if (iglooF('actions').stopActions) return false;

	switch (callback) {
		default: case 0:
			var warnReason;

			// don't warn self/on agf
			if (details.shouldWarn === false || details.reason === 'agf') {
				document.getElementById('iglooPageTitle').innerHTML = me.currentPage;
				break;
			}

			document.getElementById('iglooPageTitle').innerHTML = me.currentPage + ' - warning user';
			withrevert = typeof withrevert == 'undefined' ? true : withrevert;

			// notify user
			if (withrevert) {
				warnReason = details.isCustom === true ? iglooConfiguration.rollbackReasons.custom : iglooConfiguration.rollbackReasons[details.reason];					
			} else {
				warnReason = details.reason;
			}

			iglooF('statusLog').addStatus('Attempting to warn <strong>' + me.currentUser + '</strong> for ' + warnReason + ' on <strong>' + me.currentPage + '</strong>...');

			// get the user talk page
			var getUserPage = new iglooRequest({
				module: 'getPage',
				params: { targ: 'User_talk:' + me.currentUser, revisions: 1, properties: 'content' },
				callback: function (data) { me.warnUser(details, withrevert, data, 1); }
			}, 0, true, true);
			getUserPage.run();
					
			break;

		case 1:
			// set up the time management systems
			var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				currentDate = new Date(),
				currentMonth = currentDate.getMonth(),
				currentYear = currentDate.getFullYear(),
				currentTime = currentDate.getTime(),
				warningLevel,
				header;
							
			// check for warnings on the user's talk page
			var warnings = [], useWarning;

			// if the page already exists, we must analyse it for warnings
			if (res !== false) {
				var pageData = res[0].content,
					regTest = /<!-- ?(?:template:?)?uw-([a-z]+?)([0-9](?:im)?)? ?-->(?:.+?([0-9]{2}):([0-9]{2}), ([0-9]{1,2}) ([a-z]+?) ([0-9]{4}))?/gi,
					i = 0;

				// get all the warnings on the page
				while (true) {
					var t = regTest.exec(pageData);
							
					if (t === null) break;
	
					warnings[i] = [
						t[1], //template
						t[2], //level
						t[3], //hour
						t[4], //minute
						t[5], //day
						t[6], //month
						t[7] //year
					];

					i++;
				}

				// we are only interested in the latest one
				if (typeof warnings[0] === 'undefined') { 
					warnings[0] = []; 
					warnings[0][0] = false; 
					warnings[0][1] = 0; 
				}

				useWarning = warnings.length - 1;

				if (typeof warnings[useWarning][0] === 'string') {
					var tmplate = warnings[useWarning][0];
					if (tmplate.indexOf('block') > -1) {
						useWarning--; 
						warnings[useWarning][1] = 0; 
					}
				}
								
				// check when this warning was given
				for (var compareMonth = 0; compareMonth < months.length; compareMonth++) {
					if (months[compareMonth] === warnings[useWarning][5]) break;
				}

				var compareDate = new Date();
					compareDate.setFullYear(parseInt(warnings[useWarning][6], 10), compareMonth, parseInt(warnings[useWarning][4], 10));
					compareDate.setHours(parseInt(warnings[useWarning][2], 10));
					compareDate.setMinutes(parseInt(warnings[useWarning][3], 10));
								
				var compareTime = compareDate.getTime();
								
				// check if it is old enough to ignore for the purposes of incremental warnings
				var timeDiff = (currentTime + (currentDate.getTimezoneOffset () * 60 * 1000)) - compareTime;
				if (timeDiff > (iglooConfiguration.warningsOldAfter * 24 * 60 * 60 * 1000)) { 
					warnings[useWarning][1] = 0;
				}
							
				// check whether a header already exists for the current month. if not, create one
				var currentHeader = new RegExp('={2,4} *' + months[currentMonth] + ' *' + currentYear + ' *={2,4}', 'gi');
				if (currentHeader.test(pageData) !== true) { 
					header = '== '+months[currentMonth]+' '+currentYear+' =='; 
				} else { 
					header = false; 
				}
			} else {
				// if the page does not  exist, we can simply set warnings at the default (lowest) levels
				// set up the warning and date header for addition to the user's page
				warnings[0] = []; 
				warnings[0][0] = false; 
				warnings[0][1] = 0;
				useWarning = 0;
				header = '== '+months[currentMonth]+' '+currentYear+' ==';
			}
							
			// decide upon which warning level to issue
			var currentWarning = parseInt(warnings[useWarning][1], 10);
			if (currentWarning === 4) {
				iglooF('statusLog').addStatus('Will not warn <strong>' + me.currentUser + '</strong> because they have already recieved a final warning.');
				iglooF('justice').rollback.handleFinalWarning();
				warningLevel = false;
			} else if (currentWarning < 4 && currentWarning > 0) {
				warningLevel = currentWarning + 1;
			} else {
				warningLevel = 1;
			}
							
			// add the message to their talk page... or don't if we're gonna report them to AIV
			if (warningLevel === false) return false;
							
			var userPage = 'User_talk:' + me.currentUser, summary;
			var message = '\n\n' + iglooConfiguration.warningMessage;
				message = message.replace (/%LEVEL%/g, warningLevel);
				message = message.replace (/%PAGE%/g, me.currentPage);
				message = message.replace (/%DIFF%/g, mw.config.get('wgServer') + mw.config.get('wgScript') + '?diff=' + me.currentRev + '');

			if (withrevert) {
				if (details.isCustom === true) {
					message = message.replace (/%MESSAGE%/g, iglooConfiguration.vandalTemplate.custom);
					summary = iglooConfiguration.warningSummary.custom;
				} else {
					message = message.replace (/%MESSAGE%/g, iglooConfiguration.vandalTemplate[details.reason]);
					summary = iglooConfiguration.warningSummary[details.reason];
				}
			} else {
				message = message.replace(/%MESSAGE%/g, details.template);
				summary = details.reason
			}

			summary = summary.replace (/%LEVEL%/g, warningLevel);
			summary = summary.replace (/%PAGE%/g, me.currentPage);
						
			if (header !== false) message = '\n\n' + header + message;

			var userReport = new iglooRequest({
				module: 'edit',
				params: { targ: userPage, isMinor: false, text: message, summary: summary, where: 'appendtext' },
				callback: function (data) {
					var revertReason;

					if (withrevert) {
						details.isCustom === true ? iglooConfiguration.rollbackReasons.custom : iglooConfiguration.rollbackReasons[details.reason];
					} else {
						revertReason = details.reason;
					}

					iglooF('statusLog').addStatus('Successfully issued a level <strong>' + warningLevel + '</strong> warning to <strong>' + me.currentUser + '</strong> for ' + revertReason + ' on <strong>' + me.currentPage + '</strong>!');
				}
			}, 0, true, true);
			userReport.run();
			document.getElementById('iglooPageTitle').innerHTML = me.currentPage;

			break;
	}
};

//Reports a user to AIV or whatever
iglooActions.prototype.reportUser = function(callback, details) {
	var me = this;

	if (iglooF('actions').stopActions) return false;

	// handle reporting of the user to AIV
	switch (callback) {
		default: case 0:
			document.getElementById('iglooPageTitle').innerHTML = me.currentPage + ' - warning user';

			// notify user
			iglooF('statusLog').addStatus('Attempting to report <strong>' + me.currentUser + '</strong> to <strong>' + iglooConfiguration.aiv + '</strong> for vandalism after final warning...');
				
			// get the aiv page
			var getAivPage = new iglooRequest({
				module: 'getPage',
				params: { targ: iglooConfiguration.aiv.replace(/ /g, '_'), revisions: 1, properties: 'content' },
				callback: function (data) { me.reportUser(1, data); }
			}, 0, true, true);
			getAivPage.run();

			break;
							
		case 1:
			var pageData = details[0].content,
				template = iglooF('actions').isIp ? iglooConfiguration.aivIp : iglooConfiguration.aivUser,
				aivLink,
				myReport,
				mySummary;

			//check if page for AIV exists
			if (details === false) {
				iglooF('statusLog').addStatus('Will not report <strong>' + me.currentUser + '</strong> because the report page does not appear to exist.');
				return false; // error
			}

			// check whether they are already reported
			if (pageData.indexOf ('|' + me.currentUser + '}}') > -1) {
				iglooF('statusLog').addStatus('Will not report <strong>' + me.currentUser + '</strong> because they have already been reported.');
				return false; // error
			}
							
			// build page link
			aivLink = iglooConfiguration.aiv.replace (/ /g, '_');
							
			// build the report
			myReport = iglooConfiguration.aivMessage;
			myReport = myReport.replace(/%TEMPLATE%/g, template); 
			myReport = myReport.replace(/%USER%/g, me.currentUser);
							
			// build the summary
			mySummary = iglooConfiguration.aivSummary.replace(/%USER%/g, me.currentUser);
							
			// perform the edit
			var userReport = new iglooRequest({
				module: 'edit',
				params: { targ: aivLink, isMinor: false, text: myReport, summary: mySummary, where: iglooConfiguration.aivWhere },
				callback: function (data) { iglooF('statusLog').addStatus('Successfully reported <strong>' + me.currentUser + '</strong> to AIV!'); }
			}, 0, true, true);
			userReport.run();

			document.getElementById('iglooPageTitle').innerHTML = me.currentPage;

			break;
	}
};


// Class iglooArchive
	/*
	** iglooArchive is equivalent of a browser history, but for igloo.
	** Every new diff you go to is added to igloo's history and then
	** you can go back and forth between the pages you've already viewed
	** This is useful if you accidentally went off a diff you didn't mean to
	** and want to go back, even if you don't know the name of that revision.
	** Also, iglooArchive, is revision specific, so it takes you back to the exact
	** revision you were viewing- not the latest one
	*/
function iglooArchive () {
	this.archives = [];
	this.archivePosition = 0;
	this.canAddtoArchives = true;

	this.buildInterface = function () {
		var backButton = document.createElement('div'),
			forwardButton = document.createElement('div'),
			me = this;

		backButton.innerHTML = '<img id="igloo-buttons-back-b" src="' + iglooConfiguration.fileHost + 'images/igloo-back-grey.png" />';
		forwardButton.innerHTML = '<img id="igloo-buttons-forward-b" src="' + iglooConfiguration.fileHost + 'images/igloo-forward-grey.png" />';
		
		$(backButton).click(function () {
			me.goBack(1);
		});

		$(forwardButton).click(function () {
			me.goForward(1);
		});

		$(backButton).css({
			'position': 'relative',
			'float': 'left',
			'width': '50px',
			'height': '50px',
			'margin-top': '7px',
			'margin-left': '20px',
			'cursor': 'pointer'
		});

		$(forwardButton).css({
			'position': 'relative',
			'float': 'left',
			'width': '50px',
			'height': '50px',
			'margin-top': '7px',
			'margin-left': '10px',
			'cursor': 'pointer'
		});

		igloo.toolPane.panel.appendChild(backButton);
		igloo.toolPane.panel.appendChild(forwardButton);
	};

	//creates history and handles pages getting added to it
	this.manageHist = function (page, user, revId) {
		// add the PREVIOUS page to the display history.
		if (page && user && revId) {
			if (this.canAddtoArchives === true) {
				// first, remove any history between the current position and 0.
				if (this.archivePosition >= 0) {
					this.archives = this.archives.slice(0, (this.archivePosition + 1));
				}

				// then add the page
				var histEntry = {
					title: page,
					user: user,
					revId: revId
				};

				this.archives.push(histEntry);
				if (this.archives.length > iglooUserSettings.maxArchives) {
					var toSlice = (this.archives.length - iglooUserSettings.maxArchives) - 1;
					this.archives = this.archives.slice(0, toSlice);
				}
				this.archivePosition = (this.archives.length - 1);
			}
		}

		this.canAddtoArchives = true;
 
		// handle greying of invalid options
		var backButton = document.getElementById('igloo-buttons-back-b'),
			forwardButton = document.getElementById('igloo-buttons-forward-b'),
			backUrl = iglooConfiguration.fileHost + 'images/igloo-back',
			forwardUrl = iglooConfiguration.fileHost + 'images/igloo-forward',
			grey = '-grey',
			filetype = '.png';
 
		if (this.archives.length <= 1) { 
			backButton.src = backUrl + grey + filetype; 
			forwardButton.src = forwardUrl + grey + filetype; 
		} else {
			if (this.archivePosition === 0) { 
				backButton.src = backUrl + grey + filetype; 
				forwardButton.src = forwardUrl + filetype; 
			} else if (this.archivePosition === (this.archives.length - 1)) { 
				backButton.src = backUrl + filetype; 
				forwardButton.src = forwardUrl + grey + filetype; 
			} else { 
				backButton.src = backUrl + filetype; 
				forwardButton.src = forwardUrl + filetype; 
			}
		}
	};

	//go back in history
	this.goBack = function (count) {
		var doView;

		if (this.archives.length <= 0 || iglooF('actions').stopActions) return false;

		if (!count) count = 1;

		this.archivePosition -= count;

		if (this.archivePosition < 0) { 
			this.archivePosition = 0; 
		}
 
		doView = this.archives[this.archivePosition];
		this.canAddtoArchives = false;
		iglooF('actions').loadPage(doView.title, doView.revId);

		return true;
	};
 
	//go forward in history
	this.goForward = function(count) {
		var doView;

		if (this.archivePosition < 0 || iglooF('actions').stopActions) return false;

		if (!count) count = 1;

		this.archivePosition += count;
 
		if (this.archivePosition > (this.archives.length - 1)) {
			this.archivePosition = this.archives.length - 1;
		}

		doView = this.archives[this.archivePosition];

		this.canAddtoArchives = false;
		iglooF('actions').loadPage(doView.title, doView.revId);

		return true;
	};
}

//Class iglooSearch- brings up a requested, specific page
function iglooSearch () {
	iglooF('piano').register('enter', 'search', function () {
		iglooF('detective').search();
	});

	iglooF('piano').register('f5', 'search', function () {
		var keyCheck = confirm('You just pressed the F5 key. By default, this causes the page to refresh in most browsers. To prevent you losing your work, igloo therefore agressively blocks this key. Do you wish to reload the page?');
		if (keyCheck === true) {
			window.location.reload(true);
		}
	});
}

igloo.extendProto(iglooSearch, function () {
	return {
		buildInterface: function () {
			var search = document.createElement('div'), 
				browsePos = (62 * 2) - 15,
				error = document.createElement('div');

			search.innerHTML = '<input placeholder="Search" id="igloo-search-to" class="mousetrap" type="text" style="width: 200px; height: 14px;" /><img style="position: relative; top: -3px; cursor: pointer;" src="' + iglooConfiguration.fileHost + 'images/igloo-go.png" onclick="iglooF(\'detective\').search();" />';
			error.innerHTML = '';

			error.id = 'igloo-search-error';

			$(search).css({
				'position': 'relative',
				'float': 'left',
				'height': '20px',
				'left': '-' + browsePos + 'px',
				'margin-top': '60px',
				'margin-left': '5px',
				'cursor': 'pointer'
			});

			$(error).css({
				'font-size': '14px',
				'color': 'red',
				'cursor': 'auto'
			});

			igloo.toolPane.panel.appendChild(search);
			search.appendChild(error);

			$('#igloo-search-to').focus(function() {
				iglooF('piano').mode = 'search';
			});

			$('#igloo-search-to').blur(function() {
				if (iglooF('cogs').isOpen) {
					iglooF('piano').mode = 'settings';
				} else {
					iglooF('piano').mode = 'default';
				}
			});
		},

		search: function () {
			var browseTo = $('#igloo-search-to').val();

			$('#igloo-search-to').val('');
			$('#igloo-search-error').html('');

			if (browseTo.toLowerCase().indexOf('special:') === 0) {
				$('#igloo-search-error').html('Error: You can\'t open special pages in Igloo');
				return;
			}

			var search = new iglooRequest({
				module: 'getPage',
				params: { targ: browseTo, revisions: 1, properties: 'ids|user' },
				callback: function (data) {
					if (data !== false) {
						iglooF('justice').reversionEnabled = 'pause';
						iglooF('actions').loadPage(browseTo, data[0].ids.revid);
					} else {
						$('#igloo-search-error').html('Error: '+ browseTo + ' doesn\'t exist');
					}
				}
			}, 0, true, true);
			search.run();
		}
	};
});

//Class iglooDelete- sets up iglooCSD
function iglooDelete () {
	//Temporary- overwritten on a new diff load
	this.pageTitle = '';
	this.csd = null;

	//Receives info for new diff
	var me = this;
	igloo.hookEvent('csd', 'new-diff', function (data) {
		me.pageTitle = data.pageTitle;
	});
}

igloo.extendProto(iglooDelete, function () {
	return {
		buildInterface: function () {
			var deleteButton = document.createElement('div'),
				reasons = {
					"g1": "Patent Nonsense",
					"g2": "Test Page",
					"g3": "Vandalism",
					"g4": "Recreation of Deleted Content",
					"g5": "Created by banned user",
					"g6": "Maintenence",
					"g7": "Blanked or requested by creator",
					"g10": "Attack Page",
					"g11": "Advertising",
					"g12": "Copyvio",
					"a1": "No context",
					"a2": "Wrong Project",
					"a3": "No Content",
					"a5": "Transwikied Article",
					"a7": "Importance not asserted",
					"a9": "Song/Music Article Lacking Artist's article",
					"r3": "Implausible typos in redirect"
				};

			deleteButton.id = 'igloo-delete';
			deleteButton.innerHTML = '<img title="Tag page for CSD" style="margin-left:7px; width:63px; height:63px;" src= "' + iglooConfiguration.fileHost + 'images/igloo-delete.png">';

			this.dropdown = new iglooDropdown('igloo-delete', "trash", reasons, 'igDel',  {
				top: 113,
				left: '335px',
				where: 'left'
			}, '');

			$(deleteButton).css({
				'position': 'relative',
				'float': 'left',
				'width': '73px',
				'height': '73px',
				'margin-top': '17px',
				'margin-left': '5px',
				'cursor': 'pointer'
			});

			igloo.toolPane.panel.appendChild(deleteButton);
			this.dropdown.buildInterface();
		},

		go: function (csdtype) {
			var me = this;

			if (me.pageTitle !== '') {
				//If the page has at least 10 revisions, we shouldnt be tagging it for csd
				var getPageRevisions = new iglooRequest({
					module: 'getPage',
					params: { targ: me.pageTitle, revisions: 10 },
					callback: function (data) {
						var revs = 1;
						for (var key in data) {
							if (data.hasOwnProperty(key)) revs++;
						}
						
						if (revs >= 9) {
							//We shouldn't be tagging this for deletion
							iglooF('statusLog').addStatus('This page has at least 10 revisions. Please consider submitting a PROD request outside of igloo instead');
						} else {
							me.csd = new iglooCSD(me.pageTitle, csdtype);
							me.csd.doCSD();
						}
					}
				}, 0, true, true);
				getPageRevisions.run();
			}
		}
	};
});

//iglooCSD- tags page for CSD or deletes page under csd criteria
function iglooCSD (page, csdtype) {
	this.pageTitle = page;
	this.csdtype = csdtype;
}

igloo.extendProto(iglooCSD, function () {
	return {
		doCSD: function (callback) {
			var me = this;
			switch (callback) {
				default: case 0:
					var csdsummary;
					if(iglooUserSettings.mesysop === true) {
						csdsummary = iglooConfiguration.csdSummary.admin;
						csdsummary = csdsummary.replace('%CSDTYPE%', me.csdtype);

						var deleteConfirm = confirm('Are you sure you wish to delete ' + me.pageTitle + ' ?');

						if (deleteConfirm !== true) return;

						var deletePage = new iglooRequest({
							module: 'delete',
							params: { targ: me.pageTitle, summary: csdsummary },
							callback: function (data) { 
								iglooF('statusLog').addStatus('Successfully deleted <strong>' + me.pageTitle + '</strong>!');
							}
						}, 0, true, true);
						deletePage.run();
					} else {
						var csdmessage = iglooConfiguration.csdTemplate.replace('%CSDTYPE%', me.csdtype) + '\n\n';
						
						csdsummary = iglooConfiguration.csdSummary.user;

						var tagCSD = new iglooRequest({
							module: 'edit',
							params: { targ: me.pageTitle, isMinor: false, text: csdmessage, summary: csdsummary, where: 'prependtext' },
							callback: function (data) {
								iglooF('statusLog').addStatus('Successfully issued a csd tag on <strong>' + me.pageTitle + '</strong>!');
								if (iglooUserSettings.watchTagged) {
									me.doCSD(1);
								} else {
									iglooF('statusLog').addStatus('Notifying page creator...');
									me.notifyUser();
								}			
							}
						}, 0, true, true);
						tagCSD.run();
					}
					break;

				case 1:
					iglooF('statusLog').addStatus('Adding <strong>' + me.pageTitle + '</strong> to watchlist...');
					// watch tagged page
					var watchCSD = new iglooRequest({
						module: 'watch',
						params: { targ: me.pageTitle },
						callback: function (data) {
							iglooF('statusLog').addStatus('Added <strong>' + me.pageTitle + '</strong> to watchlist!');
							me.notifyUser();
						}
					}, 0, true, true);
					watchCSD.run();
					break;
			}
		},
		 
		notifyUser: function () {
			var me = this;
			var getPageCreator = new iglooRequest({
				module: 'getCreator',
				params: { targ: me.pageTitle },
				callback: function (data) {
					var csduser = data;
					if (csduser !== false) {
						var csdMessage = iglooConfiguration.csdMessage,
							csdSummary = iglooConfiguration.csdSummary.notify;

						csdMessage = csdMessage.replace('%CSDPAGE%', me.pageTitle);
						csdMessage = csdMessage.replace('%CSDTYPE%', me.csdtype);

						csdSummary = csdSummary.replace('%CSDPAGE%', me.pageTitle);
						csdSummary = csdSummary.replace('%CSDUSER%', csduser);

						var alertUser = new iglooRequest({
							module: 'edit',
							params: { targ: 'User_Talk:'+csduser, isMinor: false, text: csdMessage, summary: csdSummary, where: 'appendtext' },
							callback: function (data) {
								iglooF('statusLog').addStatus('Successfully notified '+ csduser +' about the csd tag on <strong>'+ me.pageTitle +'</strong>!');
								if (iglooUserSettings.logCSD && !iglooUserSettings.mesysop && me.csdtype !== 'g7') {
									iglooF('statusLog').addStatus('Adding tag to csd log...');
									me.saveLog(csduser);
								}
							}
						}, 0, true, true);
						alertUser.run();
					} else {
						iglooF('statusLog').addStatus('Could not notify user because igloo could not find the page creator');
					}
				}
			}, 0, true, true);
			getPageCreator.run();
		},
		 
		saveLog: function(csduser) {
			/* Credit for pretty much the entire concept of this goes to Twinkle */
			/* Converted to work for igloo by Kangaroopower */
			var me = this;
			var isPageCreated = new iglooRequest({
				module: 'exists',
				params: { targ: iglooConfiguration.csdLogPage },
				callback: function (data) {
					var text = '',
						csdlogSummary = iglooConfiguration.csdSummary.log.replace('%CSDPAGE%', me.pageTitle),
						date = new Date(),
						exists = data,
						headerRe = new RegExp("^==+\\s*" + date.getUTCMonthName() + "\\s+" + date.getUTCFullYear() + "\\s*==+", "m");

					if (exists === false) {
						text += "This is a log of all [[WP:CSD|speedy deletion]] nominations made by this user using [[WP:GLOO|Igloo]]'s CSD module. \n\nIf you no longer wish to keep this log, you can turn it off in igloo settings and request it deleted under CSD U1.";
					}

					var getLogText = new iglooRequest({
						module: 'getPage',
						params: { targ: iglooConfiguration.csdLogPage, revisions: 1 },
						callback: function (data) {
							var logContent = exists === false ? text : data[0].content;
							if (!headerRe.exec(logContent)) text += "\n\n=== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ===\n\n";

							text += "# [[:" + me.pageTitle + "]]: [[WP:CSD#" + me.csdtype.toUpperCase() + "|CSD " + me.csdtype.toUpperCase() + "]] ({" + "{tl|db-" + me.csdtype + "}" + "}); notified {" + "{user|" + csduser + "}" + "}";

							var logCSD = new iglooRequest({
								module: 'edit',
								params: { targ: iglooConfiguration.csdLogPage, isMinor: false, text: text, summary: csdlogSummary, where: 'appendtext' },
								callback: function (data) {
									iglooF('statusLog').addStatus('Successfully logged csd tagging on <strong>' + me.pageTitle + '</strong>!');
								}
							}, 0, true, true);
							logCSD.run();
						}
					}, 0, true, true);
					getLogText.run();
				}
			}, 0, true, true);
			isPageCreated.run();
		}
	};
});

//Class iglooPast- sets up iglooHist
function iglooPast () {
	//Temporary- overwritten on a new diff load
	this.pageTitle = '';
	this.hist = null;

	//Receives info for new diff
	var me = this;
	igloo.hookEvent('history', 'new-diff', function (data) {
		me.pageTitle = data.pageTitle;
		me.hist = new iglooHist(data.pageTitle);
	});

	this.buildInterface = function () {
		var histButton = document.createElement('div'), me = this;

		histButton.id = "igloo-hist";
		histButton.innerHTML = '<img title="Page History" src= "' + iglooConfiguration.fileHost + 'images/igloo-hist.png">';

		this.dropdown = new iglooDropdown('igloo-hist', "past", {}, 'igPast',  {
			top: 113,
			right: '35px',
			where: 'right'
		}, '', 'loading page history - wait...', true);

		$(histButton).css({
			'position': 'relative',
			'float': 'right',
			'width': '73px',
			'height': '73px',
			'margin-top': '17px',
			'margin-left': '5px',
			'right': '10px',
			'padding-left': '-1px',
			'padding-top': '-1px',
			'cursor': 'pointer'
		});

		igloo.toolPane.panel.appendChild(histButton);
		this.dropdown.buildInterface();
	};

	this.reloadData = function () {
		this.hist.getHistory();
	};
}

// Class iglooHist object handles the retrieval and display of the history of a page
function iglooHist (pageTitle) { 
	// timer var
	this.timer = null;
	this.pageTitle = pageTitle;
}

igloo.extendProto(iglooHist, function () {
	return {
		getHistory: function (callback, data) {
			// the get history module retrieves a page history and displays it to the user
			var me = this;

			switch (callback) {
				default: case 0:
					$(iglooF('past').dropdown.dropDisplay).css('display', 'block');
					$(iglooF('past').dropdown.name + '-note').css('display', 'block');

					// get the page history
					var pageHist = new iglooRequest({
						module: 'getPage',
						params: { targ: me.pageTitle, revisions: 15, properties: 'ids|user' },
						callback: function (data) {  me.getHistory (1, data); }
					}, 0, true, true);
					pageHist.run();

					break;
		 
				case 1:
					$(iglooF('past').dropdown.name + '-note').css('display', 'none');
		 
					var pageHistory = '';
					for (var i in data) {
						if (i === "title") continue;

						var rev = data[i];
		 
						pageHistory += '<li id="iglooF(\'past\').dropdown.itemPrefix'+rev.ids.revid+'" onclick="iglooF(\'actions\').loadPage(\''+me.pageTitle.replace('\'', '\\\'')+'\',  \''+rev.ids.revid+'\');" onmouseover="this.style.backgroundColor = \''+jin.Colour.LIGHT_GREY+'\';" onmouseout="this.style.backgroundColor = \''+jin.Colour.WHITE+'\';" style="cursor: pointer; width: 186px; padding: 2px; border-bottom: 1px solid #000000; list-style-type: none; list-style-image: none; marker-offset: 0px; background-color: '+jin.Colour.WHITE+';">'+rev.user+'</li>';
					}
					
					pageHistory += '<li style="width: 100%; list-style-type: none; list-style-image: none; text-align: center;"><a style="target="_blank" href="'+ mw.util.wikiScript('index') +'?title=' + me.pageTitle + '&action=history">- full history -</a></li>';
					$(iglooF('past').dropdown.dropCont).html(pageHistory);
		 
					break;
			}
		}
	};
});

//Class iglooBan- sets up iglooBlock
function iglooBan () {
	//Temporary- overwritten on a new diff load
	this.pageTitle = '';
	this.revId = -2;
	this.user = '';
	this.block = null;

	//Receives info for new diff
	var me = this;
	igloo.hookEvent('block', 'new-diff', function (data) {
		me.pageTitle = data.pageTitle;
		me.revId = data.revId;
		me.user = data.user;
		me.block = new iglooBlock(data.user);
	});
}

igloo.extendProto(iglooBan, function () {
	return {
		buildInterface: function () {
			var banButton = document.createElement('div'),
				me = this;

			banButton.id = 'igloo-block';
			banButton.innerHTML = '<img title="Block User whose edit you\'re currently viewing" style="margin-left:7px; width:63px; height:63px;" src= "' + iglooConfiguration.fileHost + 'images/igloo-block.png">';
			
			$(banButton).click(function () {
				if (me.pageTitle !== '') {
					me.go();
				}
			});

			$(banButton).css({
				'position': 'relative',
				'float': 'left',
				'width': '73px',
				'height': '73px',
				'left': '-109px',
				'margin-top': '17px',
				'margin-left': '5px',
				'cursor': 'pointer'
			});

			igloo.toolPane.panel.appendChild(banButton);
		},

		go: function (callback, data) {
			var me = this;

			// this helper function is called when a user who already has a final warning is reverted. It decides what to do based on the user settings, and
			// is able to prompt for input if it is unsure.
			switch (callback) {
				default: case 0:
					// If we reach a final warning, remember that no further action is required if the user is already blocked!
					var blockCheck = new iglooRequest({
						module: 'question',
						params: '?action=query&list=blocks&bkusers=' + me.user,
						callback: function (data) {
							me.go(1, data);
						}
					}, 0, true, true);
					blockCheck.run();
					break;
					
				case 1:
					// If already blocked, tell and exit.
					if (data.query.blocks.length !== 0) {
						iglooF('statusLog').addStatus( 'igloo will take no further action because <strong>' + me.user + '</strong> is currently blocked.' );
						return false;
					}

					me.block.setUpBlock();
					break;
			}
		}
	};
});

//Class iglooBlock- blocks users
function iglooBlock (user) {
	this.user = user;
	this.customsettings = {};
	this.checked = {};
}

igloo.extendProto(iglooBlock, function () {
	return {
		startBlock: function (callback, details) {
			var me = this;

			// handle blocking of users
			if (iglooUserSettings.mesysop === false) return false;
			
			switch (callback) {
				default: case 0:
					// notify user
					iglooF('statusLog').addStatus('Attempting to block <strong>' + me.currentUser + '</strong> for vandalism after final warning...');
					
					// analyze user
					var getBlocks = new iglooRequest({
						module: 'question',
						params: '?action=query&list=logevents&letype=block&letitle=User:' + me.currentUser,
						callback: function (data) {
							me.startBlock(1, data);
						}
					}, 0, true, true);
					getBlocks.run();
					break;
					
				case 1:
					// we now have access to the talk page data and the block log - redirect depending on whether we're autoblocking or not.
					if (iglooUserSettings.blockAction === 'standard') {
						me.setUpBlock('userlock'); 
						break;
					}
					
					if (iglooF('actions').isIp !== true) {
						me.checked = {'auto': 'checked ','talk': '','anon': '','email': '','create': 'checked '};
						me.useduration = 'indefinite';
						me.usetemplate = 'subst:uw-voablock|time=%DURATION%|sig=yes';
						me.blockReason = '[[WP:Vandalism-only account|Vandalism-only account]]';
						me.setUpBlock('userlock');
						break;
					}
					me.autoBlock(details);
					break;
			}
		},
					
		autoBlock: function (details) {
			// autoblocking - decide on the best warning
			// pick the best warning length
			var lastlength = 'neverblocked', me = this;
			me.useduration = iglooConfiguration.blockIncrement[iglooConfiguration.blockDefault];
			if (details.query.logevents !== null) {
				if (details.query.logevents.length === 1) {
					// one result
					if (details.query.logevents[0].action === 'block') {
						lastlength = details.query.logevents[0].block.duration;
					}
				} else {
					// many results
					for (var i = 0, l = details.query.logevents.length; i < l; i++) {
						if (details.query.logevents[i].action === 'block') break;
					}

					if (i === l) { 
						me.setUpBlock('error');
						return;
					}

					lastlength = details.query.logevents[i].block.duration;
				}
			}
			
			if (lastlength !== 'neverblocked') {
				var u = iglooConfiguration.blockIncrement.getPosition(lastlength);
				if (u !== false) {
					if (u < iglooConfiguration.blockDefault) { 
						me.useduration = iglooConfiguration.blockIncrement[iglooConfiguration.blockDefault];
					} else {
						if (u >= (iglooConfiguration.blockIncrement.length - 1)) u = iglooConfiguration.blockIncrement.length - 2;
							me.useduration = iglooConfiguration.blockIncrement[++u];
					}
				} else {
					me.setUpBlock('error');
					return;
				}
			}

			// check for relevant templates on the user page
			me.usetemplate = iglooConfiguration.blockTypes['default'];
			me.lastlength = lastlength;
			me.blockReason = '[[WP:Vandalism|Vandalism]]';
			
			for (var i in iglooConfiguration.blockTypes) {
				if (typeof i !== 'string') continue;
				
				var regTest = new RegExp ('{{ *' + i, 'ig');
				if (typeof me.userTalk !== 'undefined' && regTest.test(me.userTalk) === true && (i !== 'default' /* just in case there's a weird default template O_o */)) {
					// show an error is misconfigured OR if the duration doesn't exist and hasn't caused an error yet
					if (iglooConfiguration.blockIncrement.getPosition(me.useduration) === false || iglooConfiguration.blockIncrement.getPosition(iglooConfiguration.blockSpecTemp) === false) {
						me.setUpBlock('error');
						return;
					}

					if (iglooConfiguration.blockIncrement.getPosition(me.useduration) >= iglooConfiguration.blockIncrement.getPosition(iglooConfiguration.blockSpecTemp)) {
						me.usetemplate = iglooConfiguration.blockTypes[i]; 
						if (me.usetemplate.indexOf('|') > -1)  {
							me.blockReason = '{{' + me.usetemplate.substr(0, me.usetemplate.indexOf('|')) + '}}';
						} else {
							me.blockReason = '{{' + me.usetemplate + '}}';
						}
						break;
					}
				}
			}
				
			// manage the prompt
			var message = 'This user has already received a final warning. igloo intends to block the user with the following settings:<br /><br /> ' +
					'<span style="padding-left: 10px;">user: ' + me.currentUser + '<br />duration: ' + me.useduration + ' (last blocked for: ' + lastlength + ')<br />block template: ' + me.usetemplate +
					'</span><br /><br /><span id="igloo-just-do-block" style="cursor: pointer;">perform this block (recommended)</span> | <span id="igloo-adjust-block" style="cursor: pointer;">adjust block settings</span> | <span id="igloo-abort-block" style="cursor: pointer;">abort block (report user)</span>',
				autoBlockPopup = new iglooPopup('<div><span style="width: 100%; border-bottom: 1px solid #000;"><strong>igloo needs your permission to continue...</strong></span><br /><div style="text-align: left; margin-left: 10px; width: 90%; color: #222222;">' + message + '</div></div>', 500, 130);
			
			autoBlockPopup.buildInterface();
			autoBlockPopup.show();
			iglooF('actions').stopActions = true;
			
			// set the functions
			document.getElementById('igloo-just-do-block').onclick = function () {
				iglooF('actions').stopActions = false;
				autoBlockPopup.hide();
				me.doBlock();
			};
			document.getElementById('igloo-adjust-block').onclick = function () {
				iglooF('actions').stopActions = false;
				autoBlockPopup.hide();
				me.setUpBlock('adjusting');
				iglooF('statusLog').addStatus('Adjusting block of <strong>' + me.currentUser + '</strong>: launching block interface...');
			};
			document.getElementById('igloo-abort-block').onclick = function () {
				iglooF('actions').stopActions = false;
				autoBlockPopup.hide();
				iglooF('actions').reportUser();
				iglooF('statusLog').addStatus('Aborted block of <strong>' + me.currentUser + '</strong>: user aborted! Will now report...');
			};
		},

		setUpBlock: function (details) {
			var me = this;

			if (details === 'error') {
				// something went wrong. Abort and report user.
				iglooF('statusLog').addStatus('Aborted block of <strong>' + me.currentUser + '</strong>: an error occurred! Will now report...');
				iglooF('actions').reportUser(); 
				return;
			}
			
			// nothing went wrong. Display the adjust block system.
			// generate the dipaly elements
			var disabled = '',
				duration = '',
				lastlength = '';

			if (details === 'adjusting') {
				disabled = 'disabled';
				lastlength = ' (last blocked for <strong>' + me.lastlength + '</strong>)';
				me.checked = { 'auto': '','talk': '','anon': 'checked','email': '','create': 'checked' };
			} else {
				if (typeof me.useduration === 'undefined') me.useduration = '';
				if (typeof me.usetemplate === 'undefined') me.usetemplate = 'subst:uw-block|time=%DURATION%|sig=yes';
				if (typeof me.blockReason === 'undefined') me.blockReason = '[[WP:Vandalism|Vandalism]]';
			}
			if (details === 'userlock') disabled = 'disabled';
			
			var t = '', t2; // duration select
			for (var i = 0; i < iglooConfiguration.blockIncrement.length; i ++) {
				t += '<option ';
				if (iglooConfiguration.blockIncrement [i] === me.useduration) t += 'selected ';
				t += 'value="' + iglooConfiguration.blockIncrement [i] + '">' + iglooConfiguration.blockIncrement [i] + '</option>';
			}

			if (typeof me.checked === 'undefined') {
				me.checked = { 'auto': '','talk': '','anon': '','email': '','create': '' };
			}
			
			// output the display
			var content = '';
			content += '<div style="padding-left: 15px;"><span style="width: 100%; border-bottom: 1px solid #000; font-size: 16px; font-weight: bold;">Block user</span><br />You are blocking a user - select the block options from below. Remember that you are responsible for all blocks made using your account.';
			content += '<br /><br />';
			//content += '<div style="float: right; width: 200px; height: 100px;">' + t2 + '</div>';
			content += '<table style="border: none; width: 700px;>';
			content += '<tr><td width="140px">Username:</td><td><input id="iglooBlock-username" style="width: 200px;" type="text" ' + disabled + ' value="' + me.user + '" />' + lastlength + '</td></tr>';
			content += '<tr><td width="140px">Duration:</td><td><select style="width: 205px;" id="iglooBlock-duration-a">' + t + '</select> (or type) <input id="iglooBlock-duration-b" style="width: 200px;" type="text" /></td></tr>';
			content += '<tr><td width="140px">Reason:</td><td><input id="iglooBlock-reason" style="width: 200px;" type="text" value="' + me.blockReason + '" /></td></tr>';
			content += '<tr><td width="140px">Notify with template (igloo will automatically add \'{{\' and \'}}\'): </td><td><input id="iglooBlock-template" style="width: 200px;" type="text" value="' + me.usetemplate + '" /></td></tr>';
			content += '<tr><td colspan="2" height="30px" style="margin-top: 30px; font-weight: bold;">Details:</td></tr>';
			content += '<tr><td colspan="2">';
				content += '<table width="150px" style="margin-left: 10px;"><tr>';
				content += '<td width="120px">Autoblock: </td><td><input  ' + me.checked.auto + ' id="iglooBlock-autoblock" type="checkbox" /></td></tr><tr><td width="120px">Anon only: </td><td><input  ' + me.checked.anon + ' id="iglooBlock-anononly" type="checkbox" /></td></tr><tr><td width="120px">Block acc create: </td><td><input  ' + me.checked.create + ' id="iglooBlock-blockcreate" type="checkbox" /></td></tr><tr>';
				content += '<td width="120px">Block talk: </td><td><input  ' + me.checked.talk + ' id="iglooBlock-blocktalk" type="checkbox" /></td></tr><tr><td width="120px">Block email: </td><td><input  ' + me.checked.email + ' id="iglooBlock-blockemail" type="checkbox" /></td>';
				content += '</tr></table>';
			content += '</td></tr>';
			content += '<tr><td colspan="2" height="50px" style="margin-top: 50px; font-weight: bold;"><input id="igloo-finish-block" type="button" value="Block" /> | <input id="igloo-block-cancel" type="button" value="Cancel" /></td></tr>';
			content += '</table></span>';

			var blockInfoPopup = new iglooPopup(content);
				blockInfoPopup.buildInterface();
				blockInfoPopup.show();

			$('#igloo-block-cancel').click(function () {
				blockInfoPopup.hide();
				iglooF('piano').mode = 'default';
			});
			
			$('#igloo-finish-block').click(function () { 
				// set settings
				if (document.getElementById ('iglooBlock-duration-b').value === '') {
					me.useduration = document.getElementById ('iglooBlock-duration-a').value;
				} else {
					me.useduration = document.getElementById ('iglooBlock-duration-b').value;
				}
				me.currentUser = document.getElementById ('iglooBlock-username').value;
				me.usetemplate = document.getElementById ('iglooBlock-template').value;
				me.blockReason = document.getElementById ('iglooBlock-reason').value;
				
				me.customsettings = {};
				if (document.getElementById ('iglooBlock-autoblock').checked === true) me.customsettings.autoblock = true;
				if (document.getElementById ('iglooBlock-blocktalk').checked !== true) me.customsettings.allowTalk = true ;
				if (document.getElementById ('iglooBlock-anononly').checked === true) me.customsettings.onlyanon = true;
				if (document.getElementById ('iglooBlock-blockemail').checked === true) me.customsettings.noemail = true;
				if (document.getElementById ('iglooBlock-blockcreate').checked === true) me.customsettings.nocreate = true;

				blockInfoPopup.hide();
				iglooF('piano').mode = 'default';
				
				me.doBlock();
				return; // done!
			});	
		},
					
		doBlock: function () {
			// DO THE BLOCK! Note that this function can be called even without reverting any page.
			var me = this;
			if (!me.useduration || !me.usetemplate || !me.currentUser) {
				if (!me.currentUser) me.currentUser = 'no user supplied';
				iglooF('statusLog').addStatus('Aborted block of <strong>' + me.currentUser + '</strong>: an error occurred!'); 
				return;
			}

			if ($.isEmptyObject(me.customsettings)) { // the block 'settings' haven't been altered (e.g. autoblock, block talk etc.), so use the default block settings.
				me.customsettings = (iglooF('actions').isIp === true) ? iglooConfiguration.anonBlockSettings : iglooConfiguration.userBlockSettings;
			}
					
			// do the actual block!
			iglooF('statusLog').addStatus('Performing block of <strong>' + me.currentUser + '</strong>...');
			var blockParams = $.extend({targ: me.currentUser, expire: me.useduration, summary: me.blockReason}, me.customsettings),
				doBlock = new iglooRequest({
					module: 'block',
					params: blockParams,
					callback: function (data) {
						if (typeof data.error === 'undefined') { // success
							iglooF('statusLog').addStatus('Successfully blocked <strong>' + me.currentUser + '</strong>!');
							me.notifyUser(); //notify user
						} else { // failure
							iglooF('statusLog').addStatus('Failed to block <strong>' + me.currentUser + '</strong> - reason: ' + data.error.info);
						}
					}
				}, 0, true, true);
				doBlock.run();			
		},

		notifyUser: function () {
			var me = this,
				summary = 'Notifying user of block ' + glooSig,
				message = me.usetemplate;
				message = message.replace(/%DURATION%/g, me.useduration);			
				message = '\n\n{{' + message + '}}';

			iglooF('statusLog').addStatus ( 'Notifying <strong>' + me.currentUser + '</strong> of block (duration: ' + me.useduration + ')...' );

			var notifyBlock = new iglooRequest({
				module: 'edit',
				params: { targ: 'User_talk:' + me.currentUser, isMinor: false, text: message, summary: summary, where: 'appendtext' },
				callback: function (data) {
					iglooF('statusLog').addStatus ( 'Successfully notified <strong>' + me.currentUser + '</strong> of block!' );
				}
			}, 0, true, true);
			notifyBlock.run();
		}
	};
});

//Class iglooReversion- sets up iglooRollback
function iglooReversion () {
	//Temporary- overwritten on a new diff load
	this.pageTitle = '';
	this.revId = -2;
	this.user = '';
	this.rollback = null;
	this.reversionEnabled = 'yes';

	//Receives info for new diff
	var me = this;
	igloo.hookEvent('rollback', 'new-diff', function (data) {
		me.pageTitle = data.pageTitle;
		me.revId = data.revId;
		me.user = data.user;
		me.reversionEnabled = 'yes';
		me.rollback = new iglooRollback(data.pageTitle, data.user, data.revId);
	});

	iglooF('piano').register('q', 'default', function () {
		if (me.pageTitle !== '') {
			me.rollback.go();
		}
	});

	iglooF('piano').register('g', 'default', function () {
		if (me.pageTitle !== '') {
			me.rollback.go('agf', false);
		}
	});	
}

igloo.extendProto(iglooReversion, function () {
	return {
		buildInterface: function () {
			var revertButton = document.createElement('div'),
				me = this,
				summaries = {
					'vandalism': 'Vandalism',
					'spam': 'Spam',
					'rmcontent': 'Removal of Content',
					'attacks': 'Personal Attacks',
					'errors': 'Factual Errors',
					'agf': 'AGF',
					'custom': 'Custom Summary'
				};

			revertButton.id = 'igloo-revert';
			revertButton.innerHTML = '<img title="Revert Edit" src= "' + iglooConfiguration.fileHost + 'images/igloo-revert.png">';

			this.dropdown = new iglooDropdown('igloo-revert', "justice", summaries, 'igRevert',  {
				top: 113,
				left: '265px',
				where: 'left'
			}, '');
			
			$(revertButton).click(function () {
				if (me.pageTitle !== '') {
					me.rollback.go();
				}
			});

			$(revertButton).css({
				'position': 'relative',
				'float': 'left',
				'width': '73px',
				'height': '73px',
				'margin-top': '17px',
				'margin-left': '5px',
				'cursor': 'pointer'
			});

			igloo.toolPane.panel.appendChild(revertButton);
			this.dropdown.buildInterface();
		},

		go: function (summary) {
			var me = this;

			if (iglooF('actions').stopActions) return false;

			var userGroupCheck = new iglooRequest({
				module: 'getUserGroups',
				params: { user: me.user, groups: 'sysop' },
				callback: function (data) {
					var confirmRevert = true;

					if (data === true) {
						confirmRevert = confirm('The edit you are about to revert was made by an admin. Do you wish to continue?');
					}

					if (confirmRevert === true) {
						if (me.pageTitle !== '') {
							if (summary === 'custom') {
								var customSummary = prompt('What\'s your custom sumary (A summary is required)?');
								if (customSummary !== null || customSummary !== "") {
									me.rollback.go(customSummary.toLowerCase(), true);
								}
							} else {
								me.rollback.go('' + summary.toLowerCase(), false);
							}
						}
					} else {
						iglooF('statusLog').addStatus('Rollback aborted');
					}
				}
			}, 0, true, true);
			userGroupCheck.run();
		}
	};
});

//class iglooRollback - does Rollback
function iglooRollback (page, user, revId) {
	this.pageTitle = page;
	this.revId = revId;
	this.revertUser = user;
	this.revType = '';
	this.isCustom = false;

	this.shouldWarn = true;
}

igloo.extendProto(iglooRollback, function () {
	return {
		go: function (type, isCustom) {
			var me = this;

			this.revType = type || 'vandalism';
			this.isCustom = isCustom;

			// checks
			if (this.pageTitle === '') {
				return;
			} else if (this.revertUser === mw.config.get('wgUserName') && iglooUserSettings.promptRevertSelf) {
				var sameUserCheck = confirm('You are attempting to revert yourself. Ensure you wish to perform this action. igloo will not warn or report users who are reverting themselves.');
				if (sameUserCheck === true) {
					me.shouldWarn = false;
					me.performRollback();
				} else {
					iglooF('statusLog').addStatus('Rollback aborted');
				}
			} else if (igloo.currentView.changedSinceDisplay === true) {
				var alreadyRevertedCheck = confirm('The page you are viewing has changed since it was first loaded. Ensure that the change you were reverting has not already been fixed.');
				if (alreadyRevertedCheck === true) {
					me.performRollback();
				} else {
					iglooF('statusLog').addStatus('Rollback aborted');
				}
			} else { 
				this.performRollback(); 
			}
		},

		performRollback: function (callback, details) {
			var thisRevert = this;

			switch (callback) {
				default: case 0: 
					var noMessage = 'You cannot revert this edit to ' + this.pageTitle + ', ',
						summary = '';

					// check that reversion is switched on
					if (iglooF('justice').reversionEnabled === 'no') { 
						alert(noMessage + 'because you made it using igloo');  
						return false; 
					}

					if (iglooF('justice').reversionEnabled === 'pause') { 
						alert(noMessage + 'because a diff is still loading'); 
						return false; 
					}

					// notify user
					iglooF('statusLog').addStatus('Attempting to revert the change to <strong>' + thisRevert.pageTitle + '</strong> made by <strong>' + thisRevert.revertUser + '</strong>...');

					// prevent interference with this page while we are reverting it
					iglooF('justice').reversionEnabled = 'pause';
									
					// let the user know we're working...
					document.getElementById('iglooPageTitle').innerHTML = document.getElementById('iglooPageTitle').innerHTML + ' - reverting edit...';

					// build the reversion summary
					summary = (thisRevert.isCustom === true) ? (thisRevert.revType + ' ' + glooSig) : iglooConfiguration.rollbackSummary[thisRevert.revType];
									
					// attempt the actual rollback
					var thisReversion = new iglooRequest({
						module: 'rollback',
						params: { targ: thisRevert.pageTitle, user: thisRevert.revertUser, summary: summary },
						callback: function (data) {
							if (typeof data.error !== "undefined") {
								iglooF('statusLog').addStatus('Will not revert the edit to <strong>' + thisRevert.pageTitle + '</strong> by <strong>' + thisRevert.revertUser + '</strong> because another user has already done so.');
								if (thisRevert.pageTitle === iglooF('justice').pageTitle) {
									iglooF('justice').reversionEnabled = 'no';
								}
							} else {
								iglooF('statusLog').addStatus('Successfully reverted the change to <strong>' + thisRevert.pageTitle + '</strong> made by <strong>' + thisRevert.revertUser + '</strong>!');
								thisRevert.performRollback(1);
							}
						}
					}, 0, true, true);
					thisReversion.run();

					break;

				case 1:
					if (iglooUserSettings.watchRollbacked) {
						// watch rollbacked page
						var pageWatch = new iglooRequest({
							module: 'watch',
							params: { targ: thisRevert.pageTitle },
							callback: function (data) {
								iglooF('statusLog').addStatus('Added <strong>' + thisRevert.pageTitle + '</strong> to watchlist!');
								thisRevert.warnUser({
									shouldWarn: thisRevert.shouldWarn,
									reason: thisRevert.revType,
									isCustom: thisRevert.isCustom
								});
							}
						}, 0, true, true);
						pageWatch.run();
					} else {
						thisRevert.warnUser({
							shouldWarn: thisRevert.shouldWarn,
							reason: thisRevert.revType,
							isCustom: thisRevert.isCustom
						});
					}

					break;
			}
		},

		handleFinalWarning: function (callback, data) {
			var thisRevert = this;

			// this helper function is called when a user who already has a final warning is reverted. It decides what to do based on the user settings, and
			// is able to prompt for input if it is unsure.
			switch (callback) {
				default: case 0:
					// If you're not an admin, igloo won't let you choose. :) Also report if that's the preferred setting.
					if (!iglooUserSettings.mesysop || iglooUserSettings.blockAction === 'report') {
						iglooF('actions').reportUser();
						return true;
					}

					// If we reach a final warning, remember that no further action is required if the user is already blocked!
					var blockCheck = new iglooRequest({
						module: 'question',
						params: '?action=query&list=blocks&bkusers=' + thisRevert.revertUser,
						callback: function (data) {
							thisRevert.handleFinalWarning(1, data);
						}
					}, 0, true, true);
					blockCheck.run();
					break;
					
				case 1:
					// If already blocked, tell and exit.
					if (data.query.blocks[0] !== "undefined") {
						iglooF('statusLog').addStatus( 'igloo will take no further action because <strong>' + thisRevert.revertUser + '</strong> is currently blocked.' );
						return false;
					}

					// handle settings
					if (iglooUserSettings.blockAction === 'prompt') {
						iglooUserSettings.blockAction = 'report'; // temporarily, so we don't see this screen again this session

						// manage the prompt
						var title = 'igloo needs you to choose your block settings',
							message = 'Because you are an administrator, igloo can automatically block users on your behalf when you revert someone who has received a final warning. ' +
							'The igloo autoblocker will automatically choose and block with the most appropriate settings based on the user in question (you will still be prompted for permission to continue). ' +
							'If you want more control, the standard block setting will show you relevant data about the user and allow you to make the block yourself. Alternatively, igloo can simply report the user to AIV. What do you want to do?<br /><br />' +
							'&gt;&gt; <span id="igloo-set-block-auto" style="cursor: pointer;">igloo autoblock (recommended)</span> | <span id="igloo-set-block-standard" style="cursor: pointer;">standard block</span> | <span id="igloo-set-block-report" style="cursor: pointer;">report</span>',
							blockPopup = new iglooPopup('<div><span style="width: 100%; border-bottom: 1px solid #000;"><strong>' + title + '</strong></span><br /><div style="text-align: left; margin-left: 10px; width: 90%; color: #222222;">' + message + '</div></div>', 500, 130);
						
						blockPopup.show();

						iglooF('actions').stopActions = true;

						// set the functions
						document.getElementById('igloo-set-block-auto').onclick = function () {
							iglooF('actions').stopActions = false;
							blockPopup.hide();
							iglooF('cogs').set('blockAction', 'auto', function (res) {
								iglooUserSettings.blockAction = 'auto';
								iglooF('hammer').startBlock();
							});
						};

						document.getElementById('igloo-set-block-standard').onclick = function () {
							iglooF('actions').stopActions = false;
							blockPopup.hide();
							iglooF('cogs').set('blockAction', 'standard', function (res) {
								iglooUserSettings.blockAction = 'standard';
								iglooF('hammer').startBlock(0, 'standard');
							});
						};

						document.getElementById('igloo-set-block-report').onclick = function () {
							iglooF('actions').stopActions = false;
							blockPopup.hide();
							iglooF('cogs').set('blockAction', 'report', function (res) {
								iglooUserSettings.blockAction = 'report';
								iglooF('actions').reportUser();
							});
						};		
					} else if (iglooUserSettings.blockAction === 'standard') {
						iglooF('hammer').startBlock(0, 'standard');
						return true;
					} else if (iglooUserSettings.blockAction === 'auto') {
						iglooF('hammer').startBlock();
						return true;
					}

					return false;
			}
		}
	};
});

//iglooStatus- Displays and maintains a log of igloo's actions
function iglooStatus () {
	this.idCounter = 1;
 
	this.buildInterface = function() {
		this.display = document.createElement('div');

		this.display.innerHTML = '<div id="iglooStatusDisplay" style="width: 100%; height: 100%; overflow: auto; font-size: 12px;"><div id="statusObj_0" class="statusObj">Welcome to igloo! This is your status window, where you see the actions that igloo is taking on your behalf.<br /></div>';

		$(this.display).css({
			'left': '0px',
			'top': (parseInt(igloo.canvas.canvasBase.children[0].style.height, 10) - 252) + 'px',	
			'width': '100%',
			'height': '140px',
			'background-color': jin.Colour.LIGHT_GREY,
			'border-top': '1px solid #000000',
			'padding': '5px',
			'overflow': 'visible',
			'z-index': 99997,
			'display': 'block',
			'position': 'absolute'
		});

		igloo.content.panel.appendChild(this.display);
	};

	this.addStatus = function(message) {
		var curDate = new Date(),
			statusId = this.idCounter,
			sec,
			mins,
			hours,
			dateString;
				
		sec = curDate.getSeconds();
		mins = curDate.getMinutes();
		hours = curDate.getHours();

		if (sec < 10) sec = '0' + sec;
		if (mins < 10) mins = '0' + mins;
		if (hours < 10) hours = '0' + hours;
			
		dateString = hours + ':' + mins + ':' + sec;
 
		this.idCounter++;
 
		var newStatus = document.createElement('div');
			newStatus.id = 'statusObj_' + statusId;
			newStatus.className = 'statusObj';
			newStatus.innerHTML = '<span>' + dateString + ' - ' + message + '</span>';
 
		var statusObj = document.getElementById('iglooStatusDisplay');
			statusObj.insertBefore(newStatus, statusObj.firstChild);
 
		return statusId;
	};
}

//Static Class iglooDropdownManager- make sure only one iglooDropdown is open at a time
function iglooDropdownManager () {
	this.dropdowns = [];

	this.add = function (dropdown) {
		this.dropdowns.push(dropdown);
	};

	this.opened = function (name) {
		var drops = this.dropdowns;

		for (var i = 0; i < drops.length; i++) {
			if (drops[i].name !== name) drops[i].close();
		}
	};
}

//Class iglooDropdown- handles dropdowns
function iglooDropdown (name, module, list, prefix, position, endtext, loadText, reload) {
	this.name = name; //name of dropdown
	this.module = module; //igloo module that this dropdown will be used on
	this.list = list; //list of dropdown options
	this.itemPrefix = prefix; //prefix of the item
	this.position = position; //some css
	this.endText = endtext; //text to add after dropdown
	this.loadText = loadText || ''; //text that'll be shown while loading the dropdodown
	this.reloadList = reload;
	this.dropdownClosed = true;
	this.timer = null;

	iglooF('dropManager').add(this);
}

igloo.extendProto(iglooDropdown, function () {
	return {
		buildInterface: function () {
			var me = this;

			this.dropDisplay = document.createElement('div');
			this.dropCont = document.createElement('ul');

			this.dropDisplay.id = this.name + "-display";
			this.dropCont.id = this.name + "-cont";
			

			$(this.dropDisplay).css({
				top: me.position.top + 'px',
				width: '170px',
				backgroundColor: '' +jin.Colour.GREY,
				border: '1px solid '+ jin.Colour.BLACK,
				padding: '2px',
				'font-size': '10px',
				cursor: 'pointer',
				display: 'none',
				'float': me.position.where,
				'position':'fixed',
				'z-index': 999999999999
			});

			$(this.dropDisplay).css(me.position.where, me.position[me.position.where]);

			$(this.dropCont).css({
				top: '9px',
				width: '100%',
				height: '100%',
				margin: '0px',
				padding: '0px',
				'overflow-x': 'hidden',
				'overflow-y': 'auto',
				display: 'none',
				'float': me.position.where
			});

			$(this.dropDisplay).html('<div id="'+ me.name + '-note" style="width: 100%;">' + me.loadText + '</div>');

			$('#' + me.name).mouseover(function () {
				if (iglooF(me.module).pageTitle !== '') {
					if (me.reloadList === true && me.dropdownClosed === true) {
						iglooF(me.module).reloadData();
					}
					if (Boolean(me.timer) === true) { 
						clearTimeout(me.timer); 
						me.timer = false; 
					} else {
						me.dropdownClosed = false;
						iglooF('dropManager').opened(me.name);
						$('#' + me.name + '-cont').css('display', 'block');
						$('#' + me.name + '-display').css('display', 'block');
					}
				}
			});

			$('#' + me.name).mouseout(function () {
				if (iglooF(me.module).pageTitle !== '') {
					me.timer = setTimeout(function() {
						$('#' + me.name + '-display').css('display', 'none');
						me.dropdownClosed = true;
						me.timer = false; 
					}, iglooUserSettings.dropdownWinTimeout * 1000);
				}
			});
		},

		loadModule: function () {
			var me = this,
				dropHtml = '';

			for (var item in me.list) {
				if (!$.isArray(me.list[item])) {
					dropHtml += '<li id="'+me.itemPrefix+'_'+item+'" class="igDropdownLink" onclick="iglooF(\''+me.module+'\').go(\'' + item + '\')">'+ me.list[item] + '</li>';
				} else {
					dropHtml += '<li id="'+me.itemPrefix+'_'+item+'" class="igDropdownLink"><a class="igDropdownHref" target="_blank" href="' + me.list[item][1] + iglooF(me.list[item][2])[me.list[item][3]] + me.list[item][4] + '">'+ me.list[item][0] + '</a></li>';
				}
			}

			$(me.dropCont).append(dropHtml);
			this.dropDisplay.innerHTML = '';

			$(this.dropDisplay).mouseover(function () {
				if (iglooF(me.module).pageTitle !== '') {
					if (me.reloadList === true && me.dropdownClosed === true) {
						iglooF(me.module).reloadData();
					}
					if (Boolean(me.timer) === true) { 
						clearTimeout(me.timer); 
						me.timer = false; 
					} else {
						me.dropdownClosed = false;
						iglooF('dropManager').opened(me.name);
						$('#' + me.name + '-cont').css('display', 'block');
						$('#' + me.name + '-display').css('display', 'block');
					}
				}
			});

			$(this.dropDisplay).mouseout(function () {
				if (iglooF(me.module).pageTitle !== '') {
					me.timer = setTimeout(function() {
						$('#' + me.name + '-display').css('display', 'none');
						me.dropdownClosed = true;
						me.timer = false; 
					}, iglooUserSettings.dropdownWinTimeout * 1000);
				}
			});

			$(this.dropDisplay).append(this.dropCont);

			igloo.diffContainer.panel.appendChild(this.dropDisplay);

			$('.igDropdownLink').mouseover(function () {
				$(this).css({backgroundColor: jin.Colour.LIGHT_GREY});
			}).mouseout(function () {
				$(this).css({backgroundColor: jin.Colour.WHITE});
			});

			$('.igDropdownLink').css({
				color: jin.Colour.BLACK,
				cursor: 'pointer',
				width: '186px',
				padding: '2px',
				'border-bottom': '1px solid #000000',
				'list-style-type': 'none',
				'marker-offset': '0px',
				'background-color': jin.Colour.WHITE
			});

			$('.igDropdownHref').css({
				color: jin.Colour.BLACK,
				'text-decoration': 'none'
			});
		},

		close: function () {
			var me = this;
			if (iglooF(me.module).pageTitle !== '') {
				$('#' + me.name + '-display').css('display', 'none');
				me.dropdownClosed = true;
				me.timer = false; 
			}
		}
	};
});
 
//iglooPopup - creates a Popup
function iglooPopup (content, width, height) {
	this.popupMenu = document.createElement('div');
	this.popupMenuContent = document.createElement('div');

	this.width = width || 800;
	this.height = height || 400;


	this.buildInterface = function () {
		$(this.popupMenu).css({
			'opacity' : 0.7,
			'background-color': jin.Colour.BLACK,
			'display': 'none',
			'position': 'fixed',
			'top': '0px',
			'left': '0px',
			'cursor': 'auto',
			'z-index': 99998
		});

		$(this.popupMenuContent).css({
			'background-color': jin.Colour.LIGHT_GREY,
			'position': 'absolute',
			'width': width + 'px',
			'height': height + 'px',
			'padding': '0px',
			'display': 'none',
			'border': '1px solid rgb(0, 0, 0)',
			'z-index': 99999
		});

		this.popupMenuContent.innerHTML = '<div>' + content + '</div>';
		this.center();

		igloo.canvas.canvasBase.children[0].appendChild(this.popupMenuContent);
		igloo.canvas.canvasBase.children[0].appendChild(this.popupMenu);
	};

	this.center = function () {
		var screenWidth = parseInt(igloo.canvas.canvasBase.children[0].style.width, 10),
			screenHeight = parseInt(igloo.canvas.canvasBase.children[0].style.height, 10),
			leftPos	= ((screenWidth / 2) - (this.width / 2)),
			topPos = ((screenHeight / 2) - (this.height / 2)),
			me = this;

		$(this.popupMenuContent).css({
			'left': leftPos + 'px',
			'top':  topPos + 'px'
		});
	 
		$(window).resize(function() {
			me.center();
		});
	};

	this.show = function () {
		$(this.popupMenu).css({'display': 'block'});
		$(this.popupMenuContent).css({'display': 'block'});
	};

	this.hide = function () {
		$(this.popupMenu).remove();
		$(this.popupMenuContent).remove();
	};
}

//Class iglooRequest- sends a request to API
function iglooRequest (request, priority, important, flash) {	
	// Statics
	getp(this).requests = [];
	getp(this).queuedRequests = 0;
	getp(this).runningRequests = 0;

	// Constructor
	this.request = request;
	this.priority = priority;
	this.important = important;
	this.requestItem = null;

	if (typeof flash != "undefined" && flash === true) {
		this.flash = true;
	} else {
		this.flash = false;
	}
}

iglooRequest.prototype.run = function () {
	var me = this;

	if (this.important === true) {
		// If important, execute immediately.
		if (this.flash === true) {
			Flash(this.request.module).load(this.request.params).wait(this.request.callback).fail(function () {
				iglooF('statusLog').addStatus('<strong><span style="color:darkred;">Igloo was unable to connect with Wikipedia\'s servers. Please repeat your action. If you are seeing this more than once, please check your internet connection</span></strong>');
			}).run();
		}
		this.requestItem = $.ajax(this.request);
		return this.requestItem;
	} else {
		// If not important, attach our callback to its complete function.
		if (this.request.complete) {
			var f = this.request['complete'];
			this.request['complete'] = function (data) { me.callback(); f(data); };
		} else {
			this.request['complete'] = function (data) { me.callback(); };
		}
		
		// If we have enough requests, just run, otherwise hold.
		if (getp(this).runningRequests >= iglooConfiguration.limitRequests) {
			igloo.log('queuing a request because ' + getp(this).runningRequests + '/' + iglooUserSettings.limitRequests + ' are running');
			
			getp(this).requests.push(this.request);
			getp(this).requests.sort(function (a, b) { return a.priority - b.priority; });
			
			if (getp(this).queuedRequests > 20) {
				igloo.log('pruned an old request because the queue contains 20 items');
				getp(this).requests = getp(this).requests.slice(1);
			} else {
				getp(this).queuedRequests++;
			}
		} else {
			igloo.log('running a request because ' + getp(this).runningRequests + '/' + iglooUserSettings.limitRequests + ' are running');
			getp(this).runningRequests++;
			this.requestItem = $.ajax(this.request);
			return this.requestItem;
		}
	}
};

iglooRequest.prototype.abort = function () {
	if (this.requestItem !== null) {
		this.requestItem.abort();
		this.requestItem = null;
	} else {
		this.requestItem = null;
	}
};

iglooRequest.prototype.callback = function () {
	getp(this).runningRequests--;
	
	if (getp(this).queuedRequests > 0) {
		igloo.log('non-important request completed, running another request, remaining: ' + getp(this).queuedRequests);
		
		var request = null;
		while (request === null) {
			request = getp(this).requests.pop();
			getp(this).queuedRequests--;
		}

		if (typeof request !== "undefined") {
			getp(this).runningRequests++;
			$.ajax(request);
		}
	} else {		
		igloo.log('non-important request completed, but none remain queued to run');
	}
};

Array.prototype.iglast = function () {
	return this[this.length - 1];
};

/*
	COMPLETE ==========================
	*/

// MAIN
function iglooHandleLaunch (data) {
	this.data = data || {};

	this.run  = function () {
		if (typeof igloo !== 'function') {
			igloo = new iglooMain();
			iglooF = igloo.fetchModule;
		}

		igloo.load(data);
		igloo.announce('core');
	};
}