/* ======================================================== *\
** 			igloo frontend manager - init
** 			@author Kangaroopower
**			igloo concept and initial code by Alex Barley (User:Ale_jrb on Wikipedia)
\* ======================================================== */

function iglooInitControl() {
	var iglooInit = this;
		
	// initialisation sequence
	this.init = function(callback) {
		switch (callback) {
			default:
				document.title = 'igloo is loading - please wait';
				launcher.runIglooInterface.startInterface();
				break;
			case '1':
				launcher.runIglooInterface.addStatus('- Checking for usergroups...');
				var groups = mw.config.get('wgUserGroups');

				for ( var i = 0; i < groups.length; i ++ ) {
					if ( (groups[i] === 'rollbacker') || (groups[i] === 'sysop') || (groups[i] === 'steward') ) { 
						launcher.runIglooInterface.addStatus('- Usergroup OK!'); 
						setTimeout(function() { 
							iglooInit.init('2'); 
						}, 500); 
						return true; 
					}
				}

				launcher.runIglooInterface.addStatus('<div style="color: #dd6666;">- Warning: rollback rights are required to use igloo. Loading stopped.</div>', true);
				break;
			case '2':
				launcher.runIglooInterface.addStatus('- Checking read API...');

				if (wgEnableAPI === true) { 
					launcher.runIglooInterface.addStatus('- Read API OK!'); 
				} else { 
					launcher.runIglooInterface.addStatus('<div style="color: #dd6666;">- Warning: read API access is requried for igloo for run. Loading stopped.</div>', true); 
					return false; 
				}

				launcher.runIglooInterface.addStatus('- Checking write API...');
					
				if (wgEnableWriteAPI === true) { 
					launcher.runIglooInterface.addStatus('- Write API OK!'); 
				} else { 
					launcher.runIglooInterface.addStatus('<div style="color: #dd6666;">- Warning: write API access is requried for igloo for run. Loading stopped.</div>', true); 
					return false; 
				}

				setTimeout(function() { 
					iglooInit.init('3'); 
				}, 500);
				break;
			case '3':
				launcher.runIglooInterface.addStatus('');
				launcher.runIglooInterface.addStatus('Loading complete! igloo will launch in a few seconds...');
				var timer = setTimeout(function() { 
					iglooImport ( 'https://raw.github.com/Kangaroopower/Igloo/'+ iglooBranch +'/src/glooMain.js', true);
					timer = false;
				}, 2000);
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
		this.initInterface.setSize(650, 350);
		this.initInterface.setColour(jin.Colour.LIGHT_GREY);
			
		//Status Window	
		this.initInterfaceStatus = new jin.Panel();
		this.initInterfaceStatus.setPosition(100, 17);
		this.initInterfaceStatus.setSize(450, 300);
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
			launcher.runIglooInit.init('1'); 
		}, 500);
	};
		
	this.addStatus = function(message, noEndline) {
		// add a message to the status output, and display it.
		if (this.iglooStatus.length > 15) this.iglooStatus.splice(0, 1);
			
		if ( (noEndline == null) || (noEndline === false) ) { message += '<br />'; }
			
		this.iglooStatus.push(message);			
			
		var echoString = '';
		for (var i = 0; i < this.iglooStatus.length; i ++) {
			echoString += this.iglooStatus[i];
		}
			
		if (document.getElementById('iglooStatusContent') != null) {
			document.getElementById('iglooStatusContent').innerHTML = echoString;
			return true;
		} else { 
			return false;
		}
	};

	this.center = function (el, offset) {
		// center - places the window in the centre of the user's screen. set maintainCenter to true and this position will be kept even if
		// the window is resized.
	 
		var screenWidth = parseInt(this.canvas.canvasBase.children[0].style.width);
		var screenHeight = parseInt(this.canvas.canvasBase.children[0].style.height);
		var myWidth = el.offsetWidth;
		var myHeight = el.offsetHeight;
	 
		var leftPos	= ((screenWidth / 2) - (myWidth / 2));
		var topPos	= ((screenHeight / 2) - (myHeight / 2));
	 
		if (typeof offset == 'object') {
			leftPos += offset[0];
			topPos	+= offset[1];
		}

		$(el).css({
			'left': leftPos + 'px',
			'top':  topPos + 'px'
		});
	 
		var me = this;
		if (window.addEventListener) {
			window.addEventListener('resize', function() {  
				me.center(el, offset);
			}, false);
		} else {
			window.attachEvent('onresize', function() {  
				me.center(el, offset);
			});
		}

		return true;
	};
}
	

function iglooInit () {
	//Perform page checks
	this.runIglooInterface = new iglooInitInterface();
	this.runIglooInit = new iglooInitControl();

	this.launch = function () {
		if (mw.config.get('wgPageName') !== 'Wikipedia:Igloo/run') return;
		if (mw.config.get('wgAction') !== 'view') return;
		this.runIglooInit.init();
	};
}

var launcher = new iglooInit();
launcher.launch();