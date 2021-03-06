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
	var baseURL = 'https://raw.github.com/Kangaroopower/Igloo/' + iglooBranch + '/lib/';

	function getScriptURL (page, remote) {
		var c = new Date(),
			cachebypass = '&killcache=' + c.getDate() + c.getSeconds() + c.getMilliseconds(),
			url;
		
		if (!remote) {
			url = mw.config.get('wgScript') + '?action=raw&ctype=text/javascript' + cachebypass + '&title=' + encodeURIComponent(page.replace( / /g,'_' ));
		} else {
			url = page;
		}

		return url;
	}

	function iglooImport (page, remote) {
		var script = document.createElement('script');
			script.setAttribute('src', getScriptURL(page, remote));
			script.setAttribute('type', 'text/javascript');
		document.getElementsByTagName('head')[0].appendChild(script);

		return script;
	}
  
	window.iglooImport = iglooImport;

	mw.loader.implement('igloo.lib', [
		getScriptURL(baseURL + 'flash.js', true),
		getScriptURL(baseURL + 'jin.js', true),
		getScriptURL(baseURL + 'mousetrap.js', true)
	], {}, {});

	mw.loader.using(['igloo.lib'], function () {
		iglooImport('https://raw.github.com/Kangaroopower/Igloo/'+iglooBranch+'/src/glooInterfaceHook.js', true).onload = function () {
			iglooHookInterface();
		};
	});
});