/* ======================================================== *\
** 			igloo frontend manager - interface hook
\* ======================================================== */

// The igloo interface hook is aware of where a user is, and will
// start igloo and perform the required functions on the correct 
// pages. It also powers the 'Start igloo' button functionality.
// @author Kangaroopower
// igloo concept and initial code by Alex Barley (User:Ale_jrb on Wikipedia)
// Uses code by Lunarity of Wikia

(function ($, mw, window) {
	"use strict";

	//Determines the skin
	var allowCheck = (function($, mw) {
		var siteSkin = mw.config.get('skin'), ret = {}, glooPage = 'Wikipedia:Igloo/run';
		if (({vector:1, monobook:1, modern:1})[siteSkin] === 1) {
			ret.skin = true;
		} else {
			if (window.console) {
				window.console.log('Igloo: Unsupported skin:', siteSkin);
			}
			ret.skin = false;
		}

		if (mw.config.get('wgPageName') === glooPage) {
			ret.page = true;
		} else {
			ret.page = false;
		}

		return ret;
	})($, mw);

	function iglooHookInterface () {
		//Load stuff
		this.load = function () {
			if (!allowCheck.skin) return false;

			var remote = 'https://raw.github.com/Kangaroopower/Igloo/',
				rank = { lib: 0, core: 1, module: 2},
				me = this,
				toLoad = [
					{ name: 'flash', s: remote + iglooBranch + '/lib/flash.js' , prio: rank.lib, loaded: false },
					{ name: 'jin', s: remote + iglooBranch + '/lib/jin.js', prio: rank.lib, loaded: false }
				];

			if (allowCheck.page) {
				toLoad[toLoad.length] = {
					name: 'init',
					s: remote + iglooBranch + '/src/glooInit.js',
					prio: rank.core
				}
			}

			//load scripts
			for (var i = 0; i < toLoad.length; i++) {
				//if (toLoad[i - 1].loaded = false)	
				iglooImport(toLoad[i].s, true);
			}

			//Make some igloo related elements shine
			if (!allowCheck.page) {
				me.colorify();
			}
		};

		this.colorify = function() {
			var iglooDivs = document.getElementsByTagName('div'),
				glooPage = 'Wikipedia:Igloo/run',
				serverBase = mw.config.get('wgServer') + mw.config.get('wgArticlePath').substr(0,(mw.config.get('wgArticlePath').length - 2));
					
			// check for launch buttons
			var iglooLink = document.createElement('li');
				iglooLink.id = 't-igloo';
				iglooLink.innerHTML = '<a id="igloo-goto-menu" target="_blank" href="'+serverBase+'WP:Igloo" title="igloo">igloo<sup>updated</sup></a> | <a id="igloo-do-launch" style="color:red;" target="_blank" href="'+serverBase+glooPage+'" title="launch igloo">(launch)</a>';
						 
			var parent = document.getElementById('p-tb');
				parent.childNodes[3].childNodes[1].insertBefore(iglooLink, parent.childNodes[3].childNodes[1].firstChild);
					
			for (var i = 0; i < iglooDivs.length; i++) {
				if (iglooDivs[i].className == 'iglooNotInstalled') {
					iglooDivs[i].style.display = 'none';
				} else if (iglooDivs[i].className == 'iglooLaunch') {
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
		};			
	}

	var hook = new iglooHookInterface();
	hook.load();

})(jQuery, mediaWiki, this);