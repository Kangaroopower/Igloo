/* ======================================================== *\
**			igloo frontend manager - init
**			@author Kangaroopower
**			igloo concept and initial code by Alex Barley (User:Ale_jrb on Wikipedia)
\* ======================================================== */

function iglooInitControl() {
	var iglooInit = this,
		remoteConnect = false,
		firstRun = false,
		connectLocal = false, //this is never used except when iglooNet is down
		sessionKey;
		
	// initialisation sequence
	this.init = function(callback) {
		switch (callback) {
			default:
				document.title = 'igloo is loading - please wait';
				igLauncher.runIglooInterface.startInterface();
				break;
			case '1':
				igLauncher.runIglooInterface.addStatus('- Checking for usergroups...');
				var groups = mw.config.get('wgUserGroups');

				for ( var i = 0; i < groups.length; i ++ ) {
					if ( (groups[i] === 'rollbacker') || (groups[i] === 'sysop') || (groups[i] === 'steward') ) { 
						igLauncher.runIglooInterface.addStatus('- Usergroup OK!'); 
						setTimeout(function() { 
							igLauncher.runIglooInit.init('2'); 
						}, 500); 
						return true; 
					}
				}

				igLauncher.runIglooInterface.addStatus('<div style="color: #dd6666;">- Warning: rollback rights are required to use igloo. Loading stopped.</div>', true);
				break;
			case '2':
				igLauncher.runIglooInterface.addStatus('- Checking read API...');

				if (mw.config.get('wgEnableAPI') === true) { 
					igLauncher.runIglooInterface.addStatus('- Read API OK!'); 
				} else { 
					igLauncher.runIglooInterface.addStatus('<div style="color: #dd6666;">- Warning: read API access is requried for igloo for run. Loading stopped.</div>', true); 
					return false; 
				}

				igLauncher.runIglooInterface.addStatus('- Checking write API...');
					
				if (mw.config.get('wgEnableWriteAPI') === true) { 
					igLauncher.runIglooInterface.addStatus('- Write API OK!'); 
				} else { 
					igLauncher.runIglooInterface.addStatus('<div style="color: #dd6666;">- Warning: write API access is requried for igloo for run. Loading stopped.</div>', true); 
					return false; 
				}

				setTimeout(function() { 
					igLauncher.runIglooInit.init('3'); 
				}, 500);
				break;
			case '3':
				igLauncher.runIglooInterface.addStatus('');
				igLauncher.runIglooInterface.addStatus('- Retrieving resources...');
				
				iglooImport(window.glooBase +'/src/glooMain.js', true).onload = function () {
					igLauncher.runIglooInterface.addStatus('- Retrieved Resources!');
					setTimeout(function() {
						igLauncher.runIglooInit.init('4'); 
					}, 500);
				};

				break;
			case '4':
				igLauncher.runIglooInterface.addStatus('');
				igLauncher.runIglooInterface.addStatus('- Retrieving settings...');
				
				if (mw.user.options.get('userjs-iglooFirstRun') === null) {
					firstRun = true;
					Flash('preferences').load({key: 'userjs-iglooFirstRun', value: 'false'}).wait(function (data) {
						setTimeout(function() {
							igLauncher.runIglooInit.init('5'); 
						}, 500);
					}).run();
				} else {
					setTimeout(function() {
						igLauncher.runIglooInit.init('5'); 
					}, 500);
				}

				break;
			case '5':
				if (/*mw.user.options.get('userjs-iglooRemoteConnect') === null ||*/ firstRun === true) {
					var remoteClick = false;
					firstRun = true;

					/*igLauncher.runIglooInterface.addStatus('Note: This appears to be your first time connecting to igloo');
					igLauncher.runIglooInterface.addStatus('<span style="font-color:red">You should no that there are two ways to store data in igloo- iglooNet and locally</span>');
					igLauncher.runIglooInterface.addStatus('');
					igLauncher.runIglooInterface.addStatus('iglooNet is a remote server hosted on Wikimedia Labs, but run by igloo developers.');
					igLauncher.runIglooInterface.addStatus('<span style="color:red">We don\'t collect IP adresses or any other personal info, just user defined settings and a session key tied to your account</span>'); 
					igLauncher.runIglooInterface.addStatus('');
					igLauncher.runIglooInterface.addStatus('Connecting locally means that your settings are stored on Wikipedia.');
					igLauncher.runIglooInterface.addStatus('<span style="font-color:red">This is less reliable, and settings may vanish, but it also means that nobody else (except the WMF) can see your settings.</span>');
					igLauncher.runIglooInterface.addStatus('');
					igLauncher.runIglooInterface.addStatus('Before we proceed further, igloo will require you to choose a method of connection');
					igLauncher.runIglooInterface.addStatus('You will always be allowed to reset your method of storage later through the settings module in igloo.');
					igLauncher.runIglooInterface.addStatus('');
					igLauncher.runIglooInterface.addStatus('One last note: If you choose to connect to iglooNet, igloo still stores settings locally as a backup in case iglooNet is down.');
					igLauncher.runIglooInterface.addStatus('However, if you store settings only locally and they are lost, there is no way to retrieve them.');
					igLauncher.runIglooInterface.addStatus('');
					igLauncher.runIglooInterface.addStatus('<center><span id="ig-remoteConnect" style="margin:auto; width: 170px; border: 1px solid rgb(68, 68, 68); background-color: rgb(241, 241, 241); color: #0b0080; font-size: 1.35em; font-weight: bold; text-align: center; cursor: pointer;">Connect Remotely</span>&nbsp;<span id="ig-localConnect" style="margin:auto; width: 170px; border: 1px solid rgb(68, 68, 68); background-color: rgb(241, 241, 241); color: #0b0080; font-size: 1.35em; font-weight: bold; text-align: center; cursor: pointer;">Connect Locally</span></center>');
					igLauncher.runIglooInterface.addStatus(''); */

					igLauncher.runIglooInterface.addStatus('Note: This appears to be your first time connecting to igloo');
					igLauncher.runIglooInterface.addStatus('Please note that Igloo stores your settings on Wikipedia\'s servers and has no access to it');

					/* $('#ig-remoteConnect').click(function () {
						remoteClick = true;
						Flash('preferences').load({key: 'userjs-iglooRemoteConnect', value: 'true'}).wait(function (data) {
							igLauncher.runIglooInterface.addStatus('You have decided to store settings remotely. You can change this later in igloo settings.');
							remoteConnect = true;

							//connect to server here and retrieve session key

							setTimeout(function() {
								igLauncher.runIglooInit.init('6'); 
							}, 500);
						}).run();
					}); */

					//$('#ig-localConnect').click(function () {
					//	if (remoteClick) return;
						
						Flash('preferences').load({key: 'userjs-iglooRemoteConnect', value: 'false'}).wait(function (data) {
							igLauncher.runIglooInterface.addStatus('You have decided to store settings locally. You can change this later in igloo settings.');
							remoteConnect = false;
							sessionKey = null;

							setTimeout(function() {
								igLauncher.runIglooInit.init('6'); 
							}, 500);
						}).run();
					//});

				} /*else if (mw.user.options.get('userjs-iglooRemoteConnect') === "true" && connectLocal !== true) {
					firstRun = false;
					remoteConnect = true;

					igLauncher.runIglooInterface.addStatus('<span style="font-color:red">At some time in the past, you decided to connect to iglooNet.</span>'); 
					igLauncher.runIglooInterface.addStatus('If you wish to connect locally instead, please change this in your igloo settings.');
					igLauncher.runIglooInterface.addStatus('Remember, igloo only stores settings and a session id- no IP adresses or personal info.');
					igLauncher.runIglooInterface.addStatus('');

					//Connect to server here
					//include way to see if server is online, and if not, redo iglooInit step 5
					//except with the way to connect locally instead

					setTimeout(function() {
						igLauncher.runIglooInit.init('6'); 
					}, 500);
				} */else {
					remoteConnect = false;
					firstRun = false;
					sessionKey = null;

					/*igLauncher.runIglooInterface.addStatus('You have decided to connect locally, hosting your settings on Wikipedia servers'); 
					igLauncher.runIglooInterface.addStatus('This means igloo does not host any info on you, but your info can also be lost more easily.');
					igLauncher.runIglooInterface.addStatus('If you wish to change and connect to iglooNet, you may do so in iglooSettings');
					igLauncher.runIglooInterface.addStatus('');*/

					setTimeout(function() {
						igLauncher.runIglooInit.init('6'); 
					}, 500);
				}

				break;
			case '6':
				igLauncher.runIglooInterface.addStatus('Loading complete! igloo will launch in a few seconds...');
				setTimeout(function() {
					iglooHandleLaunch({
						isFirstRun: firstRun,
						doRemoteConnect: remoteConnect,
						sessionId: sessionKey,
						isDown: connectLocal
					});
				}, 1000);

				break;
		}
	};
}
	
function iglooInitInterface() {
	var iglooInterface	= this;
	this.iglooStatus = [];
		
	this.startInterface = function() {
		// blank page, generate interface object to work with.
		this.canvas = new jin.Canvas();
		this.canvas.setFullScreen(true);

		// Create Background
		this.iglooBack = new jin.Panel();
		this.iglooBack.setPosition(0, 0);
		this.iglooBack.setSize(0, 0);
		this.iglooBack.setColour(jin.Colour.LIGHT_GREY);
			
		//Secondary Background
		this.initInterface = new jin.Panel();
		this.initInterface.setPosition(0, 0);
		this.initInterface.setSize(650, 400);
		this.initInterface.setColour(jin.Colour.LIGHT_GREY);
			
		//Status Window	
		this.initInterfaceStatus = new jin.Panel();
		this.initInterfaceStatus.setPosition(100, 17);
		this.initInterfaceStatus.setSize(450, 350);
		this.initInterfaceStatus.setColour(jin.Colour.WHITE);
			
		// Combine interface elements.
		this.initInterface.add(this.initInterfaceStatus);
		this.canvas.add(this.iglooBack);
		this.canvas.add(this.initInterface);
			
		// Do initial render.
		this.canvas.render(jin.getDocument());

		//Content and extra css
		this.center(this.initInterface.panel, [0, -50]);

		$(this.initInterfaceStatus.panel).css({
			padding: '7px',
			border: '1px solid '+ jin.Colour.DARK_GREY,
			'font-size': '10px'
		});

		$(this.initInterfaceStatus.panel).append('<div style="padding-top: 9px;">Welcome to igloo! Please be patient while igloo starts up, as this can take some time.<div id="iglooStatusContent" style="padding-top: 6px;"></div></div>');
			
			
		setTimeout(function() { 
			igLauncher.runIglooInit.init('1'); 
		}, 500);
	};
		
	this.addStatus = function(message, noEndline) {
		// add a message to the status output, and display it.
		if (this.iglooStatus.length > 20) this.iglooStatus.splice(0, 1);
			
		if (!noEndline) {
			message += '<br />';
		}
			
		this.iglooStatus.push(message);			
		
		if (document.getElementById('iglooStatusContent') !== null) {
			document.getElementById('iglooStatusContent').innerHTML = this.iglooStatus.join('');
			return true;
		} else { 
			return false;
		}
	};

	this.center = function (el, offset) {
		// center - places the window in the centre of the user's screen. set maintainCenter to true and this position will be kept even if
		// the window is resized.
	 
		var screenWidth = parseInt(this.canvas.canvasBase.children[0].style.width, 10),
			screenHeight = parseInt(this.canvas.canvasBase.children[0].style.height, 10),
			myWidth = el.offsetWidth,
			myHeight = el.offsetHeight,
			leftPos	= ((screenWidth / 2) - (myWidth / 2)),
			topPos	= ((screenHeight / 2) - (myHeight / 2)),
			me = this;
	 
		if ($.isArray(offset)) {
			leftPos += offset[0];
			topPos	+= offset[1];
		}

		$(el).css({
			'left': leftPos + 'px',
			'top':  topPos + 'px'
		});

		$(window).resize(function() {
			me.center(el, offset);
		});

		return true;
	};
}
	

function iglooInit () {
	//Perform page checks
	this.runIglooInterface = new iglooInitInterface();
	this.runIglooInit = new iglooInitControl();

	this.launch = function () {
		if (mw.config.get('wgPageName') !== 'Wikipedia:Igloo/run' || mw.config.get('wgAction') !== 'view') return;
		this.runIglooInit.init();
	};
}

var igLauncher = new iglooInit();
igLauncher.launch();