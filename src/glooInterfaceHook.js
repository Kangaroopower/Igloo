/* ======================================================== *\
** 			igloo frontend manager - interface hook
\* ======================================================== */

// The igloo interface hook is aware of where a user is, and will
// start igloo and perform the required functions on the correct 
// pages. It also powers the 'Start igloo' button functionality.

function iglooHookInterface() {
	this.run = function() {
		// igloo functionality
		var glooPage = 'Wikipedia:Igloo/run';
		if (mw.config.get('wgPageName') === glooPage) {
			// the init page handles starting the program and operating settings.
			// call init.
			iglooImport ('https://raw.github.com/Kangaroopower/Igloo/'+iglooBranch+'/src/glooInit.js', true);
		} else {
			var iglooDivs = document.getElementsByTagName('div'),
				serverBase = mw.config.get('wgServer') + mw.config.get('wgArticlePath').substr(0,(mw.config.get('wgArticlePath').length - 2));
				
			// check for launch buttons
			var iglooLink = document.createElement('li');
			iglooLink.id = 't-igloo';
			iglooLink.innerHTML = '<a id="igloo-goto-menu" target="_blank" href="'+serverBase+'WP:Igloo" title="igloo">igloo<sup>updated</sup></a> | <a id="igloo-do-launch" style="color:red;" target="_blank" href="'+serverBase+glooPage+'" title="launch igloo">(launch)</a>';
					 
			var parent = document.getElementById('p-tb');
			parent.childNodes[3].childNodes[1].insertBefore(iglooLink, parent.childNodes[3].childNodes[1].firstChild);
				
			for ( var i = 0; i < iglooDivs.length; i++ ) {
				if ( iglooDivs[i].className == 'iglooNotInstalled' ) {
					iglooDivs[i].style.display = 'none';
				} else if ( iglooDivs[i].className == 'iglooLaunch' ) {
					// build button
					iglooDivs[i].style.margin = 'auto';
					iglooDivs[i].style.width = '150px';
					iglooDivs[i].style.border = '1px solid ' + jin.Colour.DARK_GREY;
					iglooDivs[i].style.backgroundColor = jin.Colour.LIGHT_GREY;
					iglooDivs[i].style.color = jin.Colour.DARK_GREY;
					iglooDivs[i].style.fontSize = '1.35em';
					iglooDivs[i].style.fontWeight = 'bold';
					iglooDivs[i].style.textAlign = 'center';
					iglooDivs[i].style.cursor = 'pointer';
					iglooDivs[i].innerHTML = '<a target="_blank" href="'+serverBase+glooPage+'">launch igloo</a>';
				}
			}
		}
	}
		
	this.run();
}
	
hookEvent('load', iglooHookInterface);