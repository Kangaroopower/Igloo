/* ======================================================== *\
** 			igloo frontend manager - main
** 
** 	The igloo frontend manager handles the client system,
** displaying information to the user, as well as allowing
** the user to interact with the program, as well as 
** handling connection and authentication with the server.
** Note that igloo CAN be used without connection to a
** remote server.
**
**  ======================================================  **
**	igloo anti-vandalism tool for Wikipedia
**		based off of the script igloo by Alex Barley
**  By: User:Kangaroopower
**
**	For instructions, see [[Wikipedia:Igloo]]
**  ======================================================  **
**
**	You may copy, modify and distribute this software as
** desired, providing that all previous contributors retain
** correct attribution.
**
**  ======================================================  **
**			tracker: [[Wikipedia:Igloo]]
\* ======================================================== */

//Due to how github handles pull requests, you should NOT import this unless you want to be on the dev
//branch all the time. Instead, go to http://en.wikipedia.org/wiki/WP:Igloo and follow the instructions
//there. Once this gets to a general release (1.0), this will no longer be a problem as I'll have deleted the
//dev branch, moved all the code to Wikipedia, and retained this Github repo for development, not production

var iglooBranch = window.iglooBranch || 'dev';

$(function () {
	var baseURL = 'https://rawgithub.com/Kangaroopower/Igloo/' + iglooBranch;

	function updateQueryStringParameter(url, key, value) {
		var separator = url.indexOf('?') !== -1 ? "&" : "?";
		return url + separator + key + "=" + value;
	}

	function getScriptURL (page, remote) {
		var c = new Date(),
			cachebypass = c.getDate() + c.getSeconds() + c.getMilliseconds(),
			url;
		
		if (!remote) {
			url = mw.config.get('wgScript') + '?action=raw&ctype=text/javascript&title=' + encodeURIComponent(page.replace( / /g,'_' ));
		} else {
			url = page;
		}

		return updateQueryStringParameter(url, "killcache", cachebypass);
	}

	function iglooImport (page, remote) {
		var script = document.createElement('script');
			script.setAttribute('src', getScriptURL(page, remote));
			script.setAttribute('type', 'text/javascript');
		document.getElementsByTagName('head')[0].appendChild(script);

		return script;
	}

	mw.loader.implement('igloo.lib', [
		getScriptURL(baseURL + '/lib/flash.js', true),
		getScriptURL(baseURL + '/lib/jin.js', true),
		getScriptURL(baseURL + '/lib/mousetrap.js', true)
	], {}, {});

	mw.loader.using(['igloo.lib'], function () {
		// igloo page
		var glooPage = 'Wikipedia:Igloo/run';

		if (mw.config.get('wgPageName') === glooPage) {
			// the init page handles starting the program and operating settings.
			// call init.
			iglooImport (window.glooBase + '/src/glooInit.js', true);
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
	});

	window.iglooImport = iglooImport;
	window.glooBase = baseURL;
});
