/* ======================================================== *\
** 			igloo frontend manager - main
** 
** 	The igloo frontend manager handles the client system,
** displaying information to the user, as well as allowing
** the user to interact with the program, as well as 
** handling connection and authentication with the server. 
** (Server interaction not currently present and may not ever
** be present)
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

var iglooBranch = iglooBranch || 'master';

function iglooImport( page, remote ) {
	var c = new Date ();
	var cachebypass = '&killcache=' + c.getDate () + c.getSeconds () + c.getMilliseconds ();
			
	if ( ( remote == null ) || ( remote == false ) ) {
		var url = wgScript + '?action=raw&ctype=text/javascript' + cachebypass + '&title=' + encodeURIComponent( page.replace( / /g,'_' ) );
	} else {
		var url = page;
	}
			
	var script = document.createElement ( 'script' );
	script.setAttribute ( 'src', url );
	script.setAttribute ( 'type', 'text/javascript' );
	document.getElementsByTagName ( 'head' )[0].appendChild ( script );
			
	return script;
}

iglooImport ('https://raw.github.com/Kangaroopower/Igloo/'+iglooBranch+'/lib/flash.js', true);
iglooImport ('https://raw.github.com/Kangaroopower/Igloo/'+iglooBranch+'/lib/jin.js', true);

iglooImport ('https://raw.github.com/Kangaroopower/Igloo/'+iglooBranch+'/src/glooInterfaceHook.js', true);