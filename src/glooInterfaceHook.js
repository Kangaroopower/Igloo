/* ======================================================== *\
**		igloo frontend manager - interface hook
\* ======================================================== */

// The igloo interface hook is aware of where a user is, and will
// start igloo and perform the required functions on the correct 
// pages. It also powers the 'Start igloo' button functionality.
// @author Kangaroopower
// igloo concept and initial code by Alex Barley (User:Ale_jrb on Wikipedia)


function iglooHookInterface() {
	this.run = function() {
		// igloo functionality
		var glooPage = 'Wikipedia:Igloo/run';

		if (mw.config.get('wgPageName') === glooPage) {
			// the init page handles starting the program and operating settings.
			// call init.
			iglooImport ('https://raw.github.com/Kangaroopower/Igloo/' + iglooBranch + '/src/glooInit.js', true);
		} else {
			var serverBase = mw.config.get('wgServer') + mw.config.get('wgArticlePath').substr(0,(mw.config.get('wgArticlePath').length - 2)),
				iglooLink = document.createElement('li'),
				parent = document.getElementById('p-tb');
				
			//insert toolbar links
			iglooLink.id = 't-igloo';
			iglooLink.innerHTML = '<a id="igloo-goto-menu" target="_blank" href="'+serverBase+'WP:Igloo" title="igloo">igloo<sup>updated</sup></a> | <a id="igloo-do-launch" style="color:red;" target="_blank" href="'+serverBase+glooPage+'" title="launch igloo">(launch)</a>';
					 
			parent.childNodes[3].childNodes[1].insertBefore(iglooLink, parent.childNodes[3].childNodes[1].firstChild);
				
			// check for launch buttons
			$('div').each(function(i) {
				if ($(this).prop('class') === 'iglooNotInstalled') {
					$(this).css('display', 'none');
				} else if ($(this).prop('class') === 'iglooLaunch') {
					// build button
					$(this).css({
						'margin': 'auto',
						'width': '150px',
						'border': '1px solid ' + jin.Colour.DARK_GREY,
						'backgroundColor': jin.Colour.LIGHT_GREY,
						'color': jin.Colour.DARK_GREY,
						'fontSize': '1.35em',
						'fontWeight': 'bold',
						'textAlign': 'center',
						'cursor': 'pointer'
					});

					$(this).html('<a target="_blank" href="'+serverBase+glooPage+'">launch igloo</a>');
				}
			});
		}
	};
		
	this.run();
}