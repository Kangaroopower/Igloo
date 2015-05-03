/*
	* JIN - JavaScript Interface library
	* 		by Alex Barley
	*
	* You are free to reuse, modify and redistribute this
	* code providing that attribution remains fully intact.
	*
*/

/*
cl:

1.06a:
- added ability for buttons to inherit their colour from their
parent toolbar.

1.05c:
- fixed a bug where Firefox would not correctly resize splitter 
panels if the overflow parameter was set.
- fixed a bug where the wrong event id would be returned when
adding a listener to the mouseover event.

1.05b:
- fixed a bug where inserting content into an element would
result in the element ordering being changed upon re-rendering.

1.05a:
- added ability to inject HTML directly into elements
- this should deprecate external uses of this.panel
- injection occurs before children are rendered on all
elements. This sets priorities correctly.

1.04a:
- added ability to fill up to a specified distance from the 
right/bottom edge.
- altered notation for sizing - 0 now completely fills, a
negative value now fills up to that distance from the other edge.

1.03c:
- added preference for hiding buttons from the left or right
as the parent panel becomes too small for the toolbar to display
them.

1.03b:
- fixed a bug where Toolbar buttons disappeared on screen resize.

1.03a:
- added Toolbar

1.02c:
- added performance mode for resize-rendering for slower computers
and browsers. Consider activating by default in poor browsers 
(current Safari/old IE)?

1.02b:
- fixed a bug where the SplitterPanel drag handle could become
invisible if the screen is resized over it. It will now be pushed
by the screen edge according to the set tolerance.

1.02a:
- added screen-match resizing. A full-screen canvas will now re-render
all elements as required to match a changing screensize.

1.01a:
- added SplitterPanel

1.00a:
created

*/

// MAIN
if ( ! jin )
	var jin = new Jin ();


// Class Jin - expects global instance
function Jin () {
	// Define state
	var me = this;
	var version = "1.06a";
	var authors = "Alex Barley";
	var zTicket = 0;
	
	this.globalSettings = {
		'allowOverflow' : false
	};
	
	
	// Define info methods
	this.getVersion = function () {
		return version;
	}
	
	this.getAuthors = function () {
		return authors;
	}
	
	// Define general helper methods
	this.getDocument = function () {
		return document.getElementsByTagName ( "body" )[0];
	}
	
	this.handleException = function ( exception ) {
		try { 
			var temp = exception.getMessage ();
		} catch ( e ) {
			throw exception;
		}
		
		throw temp;
		return exception.id;
	}
	
	this.elementEvent = function ( element, eventType, eventAction ) {
		if ( eventType.indexOf ( 'on' ) == 0 ) eventType = eventType.substr ( 2 );
		
		$ ( element ).on ( eventType + '.iglooEvent', eventAction );
		
		return this;
	}
	
	this.z = function () {
		return zTicket ++;
	}
	
	this.zIndex = function () {
		return zTicket;
	}
	
	this.forceZ = function ( newZ, doForce ) {
		if ( doForce === true ) {
			zTicket = newZ;
		}
	}
	
	// Run contructor
	console.log ( "JIN: initialised (version: " + this.getVersion () + ", authors: " + this.getAuthors () + ")" );
	return this;
}

// Class ElementEvents [static]
	// prototyped -> Jin
function Settings () {
	this.performance_livePreview = false;
}
Jin.prototype.Settings = new Settings ();


/*
	GENERAL ==========================
	*/
	
// Class ElementEvents
	// prototyped -> Jin
	
function ElementEvents () {
	var me = this;
	
	// State
	this.eventsEnabled = true;
	this.eventsAllowed = false;
	
	this.mouseMoveCount = 0;
	this.performanceCap = 4;
	
	this.mouseover = new Array ();
	this.mouseout = new Array ();
	this.click = new Array ();
	this.mousedown = new Array ();
	this.mouseup = new Array ();
	this.mousemove = new Array ();
	
	// Methods
	this.add = function ( eventType, eventAction ) {
		if ( typeof eventType != "string" ) throw new InvalidTypeException ( "Expecting: string, Found: " + typeof eventType );
		
		if ( eventType.indexOf ( 'on' ) == 0 ) eventType = eventType.substr ( 2 );
		
		switch ( eventType ) {
			case 'mouseover':
				return this.mouseover.push ( eventAction ) - 1;
				break;
				
			case 'mouseout':
				return this.mouseout.push ( eventAction ) - 1;
				break;
				
			case 'click':
				return this.click.push ( eventAction ) - 1;
				break;
			
			case 'mousedown':
				return this.mousedown.push ( eventAction ) - 1;
				break;
			
			case 'mouseup':
				return this.mouseup.push ( eventAction ) - 1;
				break;
			
			case 'mousemove':
				return this.mousemove.push ( eventAction ) - 1;
				break;
		}
	}
	
	this.bind = function ( bindTo ) {
		// Bind each function to the element in turn
		// Temporarily disable events
		this.eventsAllowed = false;
		
		// Run attach
		var attachMouseOver = function ( e ) {
			if ( ( ! me.eventsEnabled ) || ( ! me.eventsAllowed ) ) return;
			for ( var i = 0; i < me.mouseover.length; i ++ ) {
				if ( me.mouseover[i] == null ) continue;
				me.mouseover[i] ( e, bindTo, me );
			}
		}
		var attachMouseOut = function ( e ) {
			if ( ( ! me.eventsEnabled ) || ( ! me.eventsAllowed ) ) return;
			for ( var i = 0; i < me.mouseout.length; i ++ ) {
				if ( me.mouseout[i] == null ) continue;
				me.mouseout[i] ( e, bindTo, me );
			}
		}
		var attachClick = function ( e ) {
			if ( ( ! me.eventsEnabled ) || ( ! me.eventsAllowed ) ) return;
			for ( var i = 0; i < me.click.length; i ++ ) {
				if ( me.click[i] == null ) continue;
				me.click[i] ( e, bindTo, me );
			}
		}
		var attachMouseDown = function  e () {
			if ( ( ! me.eventsEnabled ) || ( ! me.eventsAllowed ) ) return;
			for ( var i = 0; i < me.mousedown.length; i ++ ) {
				if ( me.mousedown[i] == null ) continue;
				me.mousedown[i] ( e, bindTo, me );
			}
		}
		var attachMouseUp = function ( e ) {
			if ( ( ! me.eventsEnabled ) || ( ! me.eventsAllowed ) ) return;
			for ( var i = 0; i < me.mouseup.length; i ++ ) {
				if ( me.mouseup[i] == null ) continue;
				me.mouseup[i] ( e, bindTo, me );
			}
		}
		var attachMouseMove = function ( e ) {
			if ( ( ! me.eventsEnabled ) || ( ! me.eventsAllowed ) ) return;
			if ( me.mouseMoveCount ++ < me.performanceCap ) { return; } else {
				me.mouseMoveCount = 0;
				for ( var i = 0; i < me.mousemove.length; i ++ ) {
					if ( me.mousemove[i] == null ) continue;
					me.mousemove[i] ( e, bindTo, me );
				}
			}
		}
		
		
		jin.elementEvent ( bindTo, 'mouseover', attachMouseOver );
		jin.elementEvent ( bindTo, 'mouseout', attachMouseOut );
		jin.elementEvent ( bindTo, 'click', attachClick );
		jin.elementEvent ( bindTo, 'mousedown', attachMouseDown );
		jin.elementEvent ( bindTo, 'mouseup', attachMouseUp );
		jin.elementEvent ( bindTo, 'mousemove', attachMouseMove );
		this.eventsAllowed = true;
		
		return 1;
	}
	
	this.allowEvents = function () {
		this.eventsAllowed = true;
	}
	
	this.remove = function ( eventType, eventId ) {
		if ( typeof eventType != "string" ) throw new InvalidTypeException ( "Expecting: string, Found: " + typeof eventType );
		if ( typeof eventId != "number" ) throw new InvalidTypeException ( "Expecting: number, Found: " + typeof eventId );
		
		if ( eventType.indexOf ( 'on' ) == 0 ) eventType = eventType.substr ( 2 );
		
		switch ( eventType ) {
			case 'mouseover':
				this.mouseover[eventId] = null;
				break;
				
			case 'mouseout':
				this.mouseout[eventId] = null;
				break;
				
			case 'click':
				this.click[eventId] = null;
				break;
			
			case 'mousedown':
				this.mousedown[eventId] = null;
				break;
			
			case 'mouseup':
				this.mouseup[eventId] = null;
				break;
			
			case 'mousemove':
				//alert('removing mousemove event');
				this.mousemove[eventId] = null;
				break;
		}
		
		return this;
	}
	
	return this;
}
Jin.prototype.ElementEvents = ElementEvents;


/*
	ELEMENTS ==========================
	*/

// Class Canvas
	// prototyped -> Jin
	// SET methods for this Class are chainable
	
function Canvas () {
	// Define state
	var me = this;
	this.type = 'canvas';
	
	this.height = 0;
	this.width = 0;
	this.colour = jin.Colour.BLACK;
	this.alpha = 1;
	this.fullScreen = false;
	this.overflow = false;
	this.canvasBase = null;
	
	this.rendered = false;
	this.canvasEl = false;
	this.liveResize = null;
		
	this.canvasElements = new Array ();
	
	// Define methods
	this.setWidth = function ( newWidth ) {
		this.width = newWidth;
		
		return this;
	}
	
	this.setHeight = function ( newHeight ) {
		this.height = newHeight;
		
		return this;
	}
	
	this.setSize = function ( newWidth, newHeight ) {
		this.setWidth ( newWidth );
		this.setHeight ( newHeight );
		
		return this;
	}
	
	this.setAlpha = function ( newAlpha ) {
		this.alpha = newAlpha;
		
		return this;
	}
	
	this.setColour = function ( newColour ) {
		if ( typeof newColour != "string" ) throw new InvalidTypeException ( "Expecting: string, Found: " + typeof newColour );
		this.colour = newColour;
		
		return this;
	}
	
	this.onWindowResize = function ( e ) {
		if ( me.fullScreen ) {
			if ( jin.Settings.performance_livePreview ) {
				me.render ();
			} else {
				if ( me.liveReisze !== null ) clearTimeout ( me.liveResize );
				me.liveResize = setTimeout ( function () { me.render (); }, 70 );
			}
		}
	}
	
	this.setFullScreen = function ( setTo ) {
		if ( typeof setTo != "boolean" ) throw new InvalidTypeException ( "Expecting: boolean, Found: " + typeof setTo );
		this.fullScreen = setTo;
		
		return this;
	}
	
	this.setOverflow = function ( setTo ) {
		if ( typeof setTo != 'boolean' ) throw new InvalidTypeException ( 'Expecting: boolean, Found: ' + typeof setTo );
		this.overflow = setTo;
		
		return this;
	}
	
	this.add = function ( addItem ) {
		if ( addItem.setCanvas ) addItem.setCanvas ( this );
		this.canvasElements.push ( addItem );
		return this.canvasElements.length - 1;
	}
	
	this.render = function () {
		if ( ( arguments.length == 0 ) && ( this.canvasBase == null ) ) throw new NullValueException ( "Objects of type Canvas cannot render to null parent" );
				
		if ( typeof arguments [0] == "object" ) this.canvasBase = arguments [0];
		if ( this.canvasBase == null ) throw new NullValueException ( "Objects of type Canvas cannot render to null parent" );
		if ( typeof this.canvasBase != "object" ) throw new InvalidTypeException ( "Expecting: object, Found: " + typeof this.canvasBase );
		if ( typeof this.canvasBase.childNodes == "undefined" ) throw new InvalidTypeException ( "Expecting: DOM Element" );
		
		if ( ! this.rendered ) {
			this.rendered = true;
			
			// Create the drawing canvas
			this.canvasEl = document.createElement ( 'div' );
			
			// Handle sizing, including stretching to parent
			if ( this.width == 0 ) { this.canvasEl.style.width = parent.offsetWidth + 'px'; } else if ( this.width < 0 ) { this.canvasEl.style.width = ( parent.offsetWidth - this.getWidth () ) + 'px'; } else { this.canvasEl.style.width = this.getWidth () + 'px'; }
			if ( this.height == 0 ) { this.canvasEl.style.height = parent.offsetHeight + 'px'; } else if ( this.height < 0 ) { this.canvasEl.style.height = ( parent.offsetHeight - this.getHeight () ) + 'px'; } else { this.canvasEl.style.height = this.getHeight () + 'px'; }
			
			// Handle other styles
			this.canvasEl.style.position = 'relative';
			this.canvasEl.style.backgroundColor = this.getColour ();
			this.canvasEl.style.opacity = this.alpha;
			this.canvasEl.style.filter = 'alpha(opacity=' + this.alpha * 100 + ')';
			if ( ( this.overflow != true ) || ( jin.globalSettings.allowOverflow == false ) ) this.canvasEl.style.overflow = 'hidden';
			
			// Handle fullscreen
			if ( this.getFullScreen () == true ) {
				this.canvasEl.style.position = 'fixed';
				this.canvasEl.style.top = '0px';
				this.canvasEl.style.left = '0px';
				this.canvasEl.style.width = document.documentElement.clientWidth + 'px';
				this.canvasEl.style.height = document.documentElement.clientHeight + 'px';
			}
					
			// Render elements onto the canvas
			for ( var i = 0; i < this.canvasElements.length; i ++ ) {
				if ( ! this.canvasElements[i].render ) continue;
				this.canvasElements[i].render ( this.canvasEl );
			}
			
			// Remove elements from the parent
			while ( this.canvasBase.childNodes.length > 0 ) {
				this.canvasBase.removeChild ( this.canvasBase.firstChild );
			}
			
			// Attach drawing canvas to the parent
			this.canvasBase.appendChild ( this.canvasEl );
		} else {
			// Handle sizing, including stretching to parent
			if ( this.width == 0 ) { this.canvasEl.style.width = parent.offsetWidth + 'px'; } else if ( this.width < 0 ) { this.canvasEl.style.width = ( parent.offsetWidth - this.getWidth () ) + 'px'; } else { this.canvasEl.style.width = this.getWidth () + 'px'; }
			if ( this.height == 0 ) { this.canvasEl.style.height = parent.offsetHeight + 'px'; } else if ( this.height < 0 ) { this.canvasEl.style.height = ( parent.offsetHeight - this.getHeight () ) + 'px'; } else { this.canvasEl.style.height = this.getHeight () + 'px'; }
			
			// Handle other styles
			this.canvasEl.style.position = 'relative';
			this.canvasEl.style.backgroundColor = this.getColour ();
			this.canvasEl.style.opacity = this.alpha;
			this.canvasEl.style.filter = 'alpha(opacity=' + this.alpha * 100 + ')';
			if ( ( this.overflow != true ) || ( jin.globalSettings.allowOverflow == false ) ) this.canvasEl.style.overflow = 'hidden';
			
			// Handle fullscreen
			if ( this.getFullScreen () == true ) {
				this.canvasEl.style.position = 'fixed';
				this.canvasEl.style.top = '0px';
				this.canvasEl.style.left = '0px';
				this.canvasEl.style.width = document.documentElement.clientWidth + 'px';
				this.canvasEl.style.height = document.documentElement.clientHeight + 'px';
			}
			
			// Render elements onto the canvas
			for ( var i = 0; i < this.canvasElements.length; i ++ ) {
				if ( ! this.canvasElements[i].render ) continue;
				this.canvasElements[i].render ( this.canvasEl );
			}
		}
	}
	
	
	this.getWidth = function () {
		return this.width;
	}
	
	this.getHeight = function () {
		return this.height;
	}
	
	this.getAlpha = function () {
		return this.alpha;
	}
	
	this.getColour = function () {
		return this.colour;
	}
	
	this.getFullScreen = function () {
		return this.fullScreen;
	}
	
	this.getParent = function () {
		if ( this.canvasBase == null ) throw new NullValueException ( "Instance of Canvas has null parent" );
	}
	
	this.getOverflow = function () {
		return this.overflow;
	}
	
	this.getMousePosition = function ( firingEvent ) {
		var mouse = new Array ( firingEvent.pageX, firingEvent.pageY );
		// update relative to the canvas
		mouse[0] -= this.getLeft ();
		mouse[1] -= this.getTop ();
		
		return mouse;
	}
	
	// Run constructor
		// Register interest in resizing
		$ ( window ).on ( 'resize.iglooEvent', me.onWindowResize );
		
		// Log canvas
		console.log ( "JIN: canvas created successfully, ready for drawing" );
	return this;
}
Jin.prototype.Canvas = Canvas;



// Class Panel
	// prototyped -> Jin
	// SET methods for this Class are chainable
	// Provides a standard mini-canvas within a canvas; negative dimensions will fill
	// in that direction
function Panel () {
	// Define state
	var me = this;
	this.type = 'panel';
	
	this.top = 0;
	this.left = 0;
	this.width = 0;
	this.height = 0;
	this.colour = jin.Colour.DARK_GREY;
	this.alpha = 1;
	this.overflow = 'hidden';
	var z = jin.z ();
	this.cursor = 'auto';
	this.content = '';
	
	this.parent = null;
	this.rendered = false;
	this.panelParent = null;
	this.panel = null;
	this.canvas = null;
	
	this.panelEvents = new jin.ElementEvents (); //new Array ();
	this.panelElements = new Array ();
	
	// Define methods
	this.setCanvas = function ( newCanvas ) {
		this.canvas = newCanvas;
		
		return this;
	}
	
	this.setLeft = function ( fromLeft ) {
		this.left = fromLeft;
		
		return this;
	}
	
	this.setTop = function ( fromTop ) {
		this.top = fromTop;
		
		return this;
	}
	
	this.setPosition = function ( fromLeft, fromTop ) {
		this.setLeft ( fromLeft );
		this.setTop ( fromTop );
		
		return this;
	}
	
	this.setWidth = function ( newWidth ) {
		this.width = newWidth;
		
		return this;
	}
	
	this.setHeight = function ( newHeight ) {
		this.height = newHeight;
		
		return this;
	}
	
	this.setSize = function ( newWidth, newHeight ) {
		this.setWidth ( newWidth );
		this.setHeight ( newHeight );
		
		return this;
	}
	
	this.setAlpha = function ( newAlpha ) {
		this.alpha = newAlpha;
		
		return this;
	}
	
	this.setColour = function ( newColour ) {
		if ( typeof newColour != "string" ) throw new InvalidTypeException ( "Expecting: string, Found: " + typeof newColour );
		this.colour = newColour;
		
		return this;
	}
	
	this.setCursor = function ( newCursor ) {
		if ( typeof newCursor != "string" ) throw new InvalidTypeException ( "Expecting: string, Found: " + typeof newCursor );
		this.cursor = newCursor;
		
		return this;
	}
	
	this.setOverflow = function ( newOverflow ) {
		if ( typeof newOverflow != "string" ) throw new InvalidTypeException ( "Expecting: string, Found: " + typeof newOverflow );
		this.overflow = newOverflow;
		
		return this;
	}
	
	this.setZ = function ( newZ ) {
		if ( newZ > jin.zIndex () ) jin.forceZ ( newZ + 1, true );
		z = newZ;
		
		return this;
	}
	
	this.setContent = function () {
		if ( arguments.length == 1 ) {
			this.content = arguments[0];
		} else if ( arguments.length == 2 ) {
			this.content = arguments[0];
			if ( arguments[1] == true ) {
				this.reRender ( true );
			}
		} else {
			throw new BadArgumentsException ( "Expecting: 1 or 2 arguments, Found: " + arguments.length );
		}
		
		return this;
	}
	
	this.setParent = function ( newParent ) {
		this.parent = newParent;
		
		return this;
	}
	
	this.addEvent = function ( eventType, eventAction ) {
		this.panelEvents.add ( eventType, eventAction );
		return 1;
	}
	
	this.removeEvent = function ( id ) {
		if ( this.panelEvents[id] ) this.panelEvents[id] = null;
		return id;
	}
	
	this.add = function ( addItem ) {
		if ( addItem.setParent ) addItem.setParent ( this );
		if ( addItem.setCanvas ) addItem.setCanvas ( this.getCanvas () );
		if ( addItem.getZ ) addItem.setZ ( addItem.getZ () + this.getZ () );
		
		return this.panelElements.push ( addItem ) - 1;
	}
	
	this.render = function () {
		// All 'childen' of Canvas must expose a method called render. This method
		// takes a document element and appends the created object onto it.
		
		if ( ( arguments.length == 0 ) && ( this.panelParent == null ) ) throw new NullValueException ( "Objects of type Panel cannot render to null parent" );
				
		if ( typeof arguments [0] == "object" ) this.panelParent = arguments [0];
		if ( this.panelParent == null ) throw new NullValueException ( "Objects of type Panel cannot render to null parent" );
		if ( typeof this.panelParent != "object" ) throw new InvalidTypeException ( "Expecting: object, Found: " + typeof this.panelParent );
		if ( typeof this.panelParent.childNodes == "undefined" ) throw new InvalidTypeException ( "Expecting: DOM Element, not found" );
		
		
		if ( ! this.rendered ) {
			this.rendered = true;
			
			// Create the panel
			this.panel = document.createElement ( 'div' );
			this.panel.innerHTML = this.getContent ();
			
			// Handle sizing, including stretching out to parent where necessary
			if ( this.width == 0 ) { this.panel.style.width = ( parseInt ( this.panelParent.style.width ) - this.getLeft () ) + 'px'; } else 
			if ( this.width < 0 ) { this.panel.style.width = ( parseInt ( this.panelParent.style.width ) + this.getWidth () - this.getLeft () ) + 'px'; } else
				{ this.panel.style.width = this.getWidth () + 'px'; }
			if ( this.height == 0 ) { this.panel.style.height = ( parseInt ( this.panelParent.style.height ) - this.getTop () ) + 'px'; } else 
			if ( this.height < 0 ) { this.panel.style.height = ( parseInt ( this.panelParent.style.height ) + this.getHeight () - this.getTop () ) + 'px'; } else
				{ this.panel.style.height = this.getHeight () + 'px'; }
			
			// Handle other styles
			this.panel.style.position = 'absolute';
			this.panel.style.left = this.getLeft () + 'px';
			this.panel.style.top = this.getTop () + 'px';
			this.panel.style.backgroundColor = this.getColour ();
			this.panel.style.opacity = this.getAlpha ();
			this.panel.style.filter = 'alpha(opacity=' + this.getAlpha () * 100 + ')';
			this.panel.style.cursor = this.getCursor ();
			this.panel.style.overflow = this.getOverflow ();
			this.panel.style.zIndex = z;
			
			// Connect events to this panel
			this.panelEvents.bind ( this.panel );
			
			// Render children onto the panel
			for ( var i = 0; i < this.panelElements.length; i ++ ) {
				if ( ! this.panelElements[i].render ) continue;
				this.panelElements[i].render ( this.panel );
			}

			this.panelParent.appendChild ( this.panel );
		} else {
			// Handle sizing, including stretching out to parent where necessary
			if ( this.width == 0 ) { this.panel.style.width = ( parseInt ( this.panelParent.style.width ) - this.getLeft () ) + 'px'; } else 
			if ( this.width < 0 ) { this.panel.style.width = ( parseInt ( this.panelParent.style.width ) + this.getWidth () - this.getLeft () ) + 'px'; } else
				{ this.panel.style.width = this.getWidth () + 'px'; }
			if ( this.height == 0 ) { this.panel.style.height = ( parseInt ( this.panelParent.style.height ) - this.getTop () ) + 'px'; } else 
			if ( this.height < 0 ) { this.panel.style.height = ( parseInt ( this.panelParent.style.height ) + this.getHeight () - this.getTop () ) + 'px'; } else
				{ this.panel.style.height = this.getHeight () + 'px'; }
			
			// Handle other styles
			this.panel.style.position = 'absolute';
			this.panel.style.left = this.getLeft () + 'px';
			this.panel.style.top = this.getTop () + 'px';
			this.panel.style.backgroundColor = this.getColour ();
			this.panel.style.opacity = this.getAlpha ();
			this.panel.style.filter = 'alpha(opacity=' + this.getAlpha () * 100 + ')';
			this.panel.style.cursor = this.getCursor ();
			this.panel.style.zIndex = z;
			
			// Hide if we have no size
			if ( ( this.getActualWidth () <= 0 ) || ( this.getActualHeight <= 0 ) ) { this.panel.style.display = 'none'; } else {
				this.panel.style.display = 'block';
			}
			
			// Render children onto the panel
			for ( var i = 0; i < this.panelElements.length; i ++ ) {
				if ( ! this.panelElements[i].render ) continue;
				this.panelElements[i].render ( this.panel );
			}
		}
	}
	
	// reRender requests that this, and all children, remove themselves
	// and restart the rendering process from scratch with their current
	// settings. If this is an initialCall [true], then this object is
	// responsible for re-calling 'render' on the drawing tree.
	this.reRender = function ( initialCall ) {
		// Remove us from the parent, if we exist.
		if ( this.panel != null ) {
			if ( this.panelParent == this.panel.parentNode ) {
				this.panelParent.removeChild ( this.panel );
			}
		}
		
		// Request for all children.
		for ( var i = 0; i < this.panelElements.length; i ++ ) {
			if ( ! this.panelElements[i].reRender ) continue;
			this.panelElements[i].reRender ( false );
		}
		
		this.rendered = false;
		
		// If this is the initial (highest) call, then it is 
		// at the base of the drawing tree and responsible for
		// calling render.
		if ( initialCall ) {
			this.render ();
		}
	}
	
	this.clear = function () {
		for ( var i = 0; i < this.panelElements.length; i ++ ) {
			if ( ! this.panelElements[i].destroy ) continue;
			this.panelElements[i].destroy ();
		}
		this.panelElements = new Array ();
		
		return this;
	}
	
	// destroy permanently removes this, and all children, from the 
	// drawing tree.
	this.destroy = function () {
		for ( var i = 0; i < this.panelElements.length; i ++ ) {
			if ( ! this.panelElements[i].destroy ) continue;
			this.panelElements[i].destroy ();
		}
		this.panelElements = new Array ();
		
		if ( this.panel != null ) {
			if ( this.panelParent == this.panel.parentNode ) {
				this.panelParent.removeChild ( this.panel );
			}
		}
		
		this.rendered = false;
		
		return this;
	}
	
	this.getCanvas = function () {
		return this.canvas;
	}
	
	this.getWidth = function () {
		return this.width;
	}
	
	this.getOverflow = function () {
		return this.overflow;
	}
	
	this.getZ = function () {
		return z;
	}
	
	this.getActualWidth = function () {
		if ( this.width == 0 ) { return parseInt ( this.panelParent.style.width, 10 ) - this.getLeft (); } else if ( this.width < 0 ) { return parseInt ( this.panelParent.style.width, 10 ) + this.getWidth () - this.getLeft (); } else { return this.width; }
	}
	
	this.getHeight = function () {
		return this.height;
	}
	
	this.getActualHeight = function () {
		if ( this.height == 0 ) { return parseInt ( this.panelParent.style.height, 10 ) - this.getTop (); } else if ( this.height < 0 ) { return parseInt ( this.panelParent.style.height, 10 ) + this.getHeight () - this.getTop (); } else { return this.height; }
	}
	
	this.getTop = function () {
		return this.top;
	}
	
	this.getLeft = function () {
		return this.left;
	}
	
	this.getAlpha = function () {
		return this.alpha;
	}
	
	this.getColour = function () {
		return this.colour;
	}
	
	this.getContent = function () {
		return this.content;
	}
	
	this.getCursor = function () {
		return this.cursor;
	}
	
	this.getParent = function () {
		return this.parent;
	}
	
	// Run constructor
	return this;
}
Jin.prototype.Panel = Panel;


// Class SplitterPanel
	// prototyped -> Jin
	// SplitterPanel allows the creation of a panel split into
	// two parts that can be resized by dragging in the cetnre.
	// It exposes a .right and .left content panel for which
	// the .add method can be called. Calling .add directly on
	// instances of this class will add them to the .right panel
	// which is assumed to be the content panel.
function SplitterPanel () {
	var me = this;
	this.type = 'splitterPanel';
	
	if ( arguments.length == 0 ) {
		this.splitterType = 'horizontal';
	} else {
		if ( typeof arguments[0] != 'string' ) throw new InvalidTypeException ( "Expecting: string, Found: " + typeof arguments[0] );
		if ( ( arguments[0] != 'vertical' ) && ( arguments[0] != 'horizontal' ) ) throw new BadArgumentsException ( "Expecting [vertical/horizontal], Found: " + arguments[0] );
		this.splitterType = arguments[0];
	}
	
	this.topPos = 0;
	this.leftPos = 0;
	this.width = 0;
	this.height = 0;
	this.padding = 0;
	this.colour = jin.Colour.DARK_GREY;
	this.alpha = 1;
	var z = jin.z ();
	
	this.dragWidth = 8;
	this.dragPosition = 100;
	this.dragTolerance = 20;
	this.dragEvent = null;
	this.doDrag = false;
	this.dragCount = 0;
	this.dragLimit = 4;
	
	this.rendered = false;
	this.backingPanel = null;
	this.a = this.top = this.left = new jin.Panel ();
	this.b = this.bottom = this.right = new jin.Panel ();
	this.draggerBar = new jin.Panel ();
	this.panelParent = null;
	this.canvas = null;
	
	this.panelEvents = new jin.ElementEvents (); //new Array ();
	
	// Define methods
	this.setCanvas = function ( newCanvas ) {
		this.canvas = newCanvas;
		
		return this;
	}
	
	this.setLeft = function ( fromLeft ) {
		this.leftPos = fromLeft;
		
		return this;
	}
	
	this.setTop = function ( fromTop ) {
		this.topPos = fromTop;
		
		return this;
	}
	
	this.setPosition = function ( fromLeft, fromTop ) {
		this.setLeft ( fromLeft );
		this.setTop ( fromTop );
		
		return this;
	}
	
	this.setWidth = function ( newWidth ) {
		this.width = newWidth;
		
		return this;
	}
	
	this.setHeight = function ( newHeight ) {
		this.height = newHeight;
		
		return this;
	}
	
	this.setSize = function ( newWidth, newHeight ) {
		this.setWidth ( newWidth );
		this.setHeight ( newHeight );
		
		return this;
	}
	
	this.setAlpha = function ( newAlpha ) {
		this.alpha = newAlpha;
		
		return this;
	}
	
	this.setColour = function ( newColour ) {
		if ( typeof newColour != "string" ) throw new InvalidTypeException ( "Expecting: string, Found: " + typeof newColour );
		this.colour = newColour;
		
		return this;
	}
	
	this.setZ = function ( newZ ) {
		if ( newZ > jin.zIndex () ) jin.forceZ ( newZ + 1, true );
		difference = newZ - this.getZ ();
		
		z = newZ;
		this.a.setZ ( this.a.getZ () + difference );
		this.b.setZ ( this.b.getZ () + difference );
		
		return this;
	}
	
	this.setInitialDrag = function ( newDrag ) {
		this.dragPosition = newDrag;
	}
	
	this.setDrag = function ( newDrag ) {
		
		if ( newDrag < this.dragTolerance ) newDrag = this.dragTolerance;
		if ( this.getType () == 'horizontal' ) {
			if ( newDrag > this.getActualWidth () - this.dragTolerance ) newDrag = this.getActualWidth () - this.dragTolerance;
			this.dragPosition = newDrag;
		} else {
			if ( newDrag > this.getActualHeight () - this.dragTolerance ) newDrag = this.getActualHeight () - this.dragTolerance;
			this.dragPosition = newDrag;
		}
		
		return this;
	}
	
	this.addEvent = function ( eventType, eventAction ) {
		return this.panelEvents.add ( eventType, eventAction );
	}
	
	this.removeEvent = function ( id ) {
		if ( this.panelEvents[id] ) this.panelEvents[id] = null;
		return id;
	}
	
	this.add = function ( addItem ) {
		if ( addItem.setCanvas ) addItem.setCanvas ( this.getCanvas () );
		return this.right.add ( addItem );
	}
	
	this.render = function () {
		// All 'childen' of Canvas must expose a method called render. This method
		// takes a document element and appends the created object onto it.
		
		if ( ( arguments.length == 0 ) && ( this.panelParent == null ) ) throw new NullValueException ( "Objects of type SplitterPanel cannot render to null parent" );
				
		if ( typeof arguments [0] == "object" ) this.panelParent = arguments [0];
		if ( this.panelParent == null ) throw new NullValueException ( "Objects of type SplitterPanel cannot render to null parent" );
		if ( typeof this.panelParent != "object" ) throw new InvalidTypeException ( "Expecting: object, Found: " + typeof this.panelParent );
		if ( typeof this.panelParent.childNodes == "undefined" ) throw new InvalidTypeException ( "Expecting: DOM Element, not found" );
		
		if ( ! this.rendered ) {
			this.rendered = true;
			
			// Create the backing panel
			this.backingPanel = document.createElement ( 'div' );
			
			// Handle sizing, including stretching out to parent where necessary
			if ( this.width == 0 ) { this.backingPanel.style.width = ( parseInt ( this.panelParent.style.width ) - this.getLeft () ) + 'px'; } else 
			if ( this.width < 0 ) { this.backingPanel.style.width = ( parseInt ( this.panelParent.style.width ) + this.getWidth () - this.getLeft () ) + 'px'; } else
				{ this.backingPanel.style.width = this.getWidth () + 'px'; }
			if ( this.height == 0 ) { this.backingPanel.style.height = ( parseInt ( this.panelParent.style.height ) - this.getTop () ) + 'px'; } else 
			if ( this.height < 0 ) { this.backingPanel.style.height = ( parseInt ( this.panelParent.style.height ) + this.getHeight () - this.getTop () ) + 'px'; } else
				{ this.backingPanel.style.height = this.getHeight () + 'px'; }
			
			// Handle other styles
			this.backingPanel.style.position = 'absolute';
			this.backingPanel.style.left = this.getLeft () + 'px';
			this.backingPanel.style.top = this.getTop () + 'px';
			this.backingPanel.style.backgroundColor = this.getColour ();
			this.backingPanel.style.opacity = this.getAlpha ();
			this.backingPanel.style.filter = 'alpha(opacity=' + this.getAlpha () * 100 + ')';
			this.backingPanel.style.zIndex = z;
			
			// Connect events to this backingPanel
			this.panelEvents.bind ( this.backingPanel );
			
			// We've created the backing panel itself. Now manage the
			// actual panel elements that we will use to manage the
			// splitter.
			if ( this.splitterType == 'horizontal' ) {
				this.a.setSize ( this.getDrag (), 0 ).setPosition ( 0, 0 );
				this.draggerBar.setSize ( this.dragWidth, 0 ).setPosition ( this.getDrag (), 0 ).setColour ( this.getColour () ).setCursor ( 'w-resize' ).setOverflow ( 'visible' );
				this.b.setSize ( 0, 0 ).setPosition ( this.getDrag () + this.dragWidth, 0 );
			} else {
				this.a.setSize ( 0, this.getDrag () ).setPosition ( 0, 0 );
				this.draggerBar.setSize ( 0, this.dragWidth ).setPosition ( 0, this.getDrag () ).setColour ( this.getColour () ).setCursor ( 's-resize' ).setOverflow ( 'visible' );
				this.b.setSize ( 0, 0 ).setPosition ( 0, this.getDrag () + this.dragWidth );
			}
			
			// Render  'children'. SplitterPanel does not actually
			// support children of its own (they can never be added
			// to it) - instead, it calls the render methods of its
			// two child panels.
			this.a.render ( this.backingPanel );
			this.draggerBar.render ( this.backingPanel );
			this.b.render ( this.backingPanel );
			
			this.draggerBar.addEvent ( 'mousedown', function () { 
				// Create a dragger panel with the correct dimensions.
				console.log ( "JIN: splitter starting " + me.getType () + " drag" );
				
				var dPanel = document.createElement ( 'div' );
				dPanel.style.position = 'absolute';
				dPanel.style.width = me.getActualWidth () + 'px';
				dPanel.style.height = me.getActualHeight () + 'px';
				dPanel.style.backgroundColor = '#000000';
				dPanel.style.cursor = 'w-resize';
				dPanel.style.zIndex = jin.z ();
				if ( me.getType () == 'vertical' ) dPanel.style.cursor = 's-resize';
				dPanel.style.opacity = 0;
				dPanel.style.filter = 'alpha(opacity=0)';
				
				if ( me.getType () == 'horizontal' ) {
					dPanel.onmousemove = function (e) {
						if ( me.dragCount ++ < me.dragLimit ) { return; } else {
							me.dragCount = 0;
							me.setDrag ( e.pageX - me.getLeft () ); 
							me.render ();
						}
					};
				} else {
					dPanel.onmousemove = function (e) {
						if ( me.dragCount ++ < me.dragLimit ) { return; } else {
							me.dragCount = 0;
							me.setDrag ( e.pageY - me.getTop () ); 
							me.render ();
						}
					};
				}
								
				dPanel.onmouseup = function (e) {
					console.log ( "JIN: splitter stopping " + me.getType () + " drag" );
					
					dPanel.parentNode.removeChild ( dPanel );
					if ( window.getSelection )
						window.getSelection().removeAllRanges(); // for Firefox
				};
				
				me.backingPanel.appendChild ( dPanel );
				//alert('backadd ' + me.getType ());
			} );

			// Append the backingPanel to the parent as usual.
			this.panelParent.appendChild ( this.backingPanel );
		} else {
			// Handle sizing, including stretching out to parent where necessary
			if ( this.width == 0 ) { this.backingPanel.style.width = ( parseInt ( this.panelParent.style.width ) - this.getLeft () ) + 'px'; } else 
			if ( this.width < 0 ) { this.backingPanel.style.width = ( parseInt ( this.panelParent.style.width ) + this.getWidth () - this.getLeft () ) + 'px'; } else
				{ this.backingPanel.style.width = this.getWidth () + 'px'; }
			if ( this.height == 0 ) { this.backingPanel.style.height = ( parseInt ( this.panelParent.style.height ) - this.getTop () ) + 'px'; } else 
			if ( this.height < 0 ) { this.backingPanel.style.height = ( parseInt ( this.panelParent.style.height ) + this.getHeight () - this.getTop () ) + 'px'; } else
				{ this.backingPanel.style.height = this.getHeight () + 'px'; }
			
			// Handle other styles
			this.backingPanel.style.position = 'absolute';
			this.backingPanel.style.left = this.getLeft () + 'px';
			this.backingPanel.style.top = this.getTop () + 'px';
			this.backingPanel.style.backgroundColor = this.getColour ();
			this.backingPanel.style.opacity = this.getAlpha ();
			this.backingPanel.style.filter = 'alpha(opacity=' + this.getAlpha () * 100 + ')';
			this.backingPanel.style.zIndex = z;
			
			if ( this.splitterType == 'horizontal' ) {
				this.a.setSize ( this.getDrag (), 0 ).setPosition ( 0, 0 );
				this.draggerBar.setSize ( this.dragWidth, 0 ).setPosition ( this.getDrag (), 0 ).setColour ( this.getColour () ).setCursor ( 'w-resize' );
				this.b.setSize ( 0, 0 ).setPosition ( this.getDrag () + this.dragWidth, 0 );
			} else {
				this.a.setSize ( 0, this.getDrag () ).setPosition ( 0, 0 );
				this.draggerBar.setSize ( 0, this.dragWidth ).setPosition ( 0, this.getDrag () ).setColour ( this.getColour () ).setCursor ( 's-resize' );
				this.b.setSize ( 0, 0 ).setPosition ( 0, this.getDrag () + this.dragWidth );
			}
			
			// Hide if we have no size
			if ( ( this.getActualWidth () <= 0 ) || ( this.getActualHeight <= 0 ) ) { this.backingPanel.style.display = 'none'; } else {
				this.backingPanel.style.display = 'block';
			}
			
			// Render  'children'. SplitterPanel does not actually
			// support children of its own (they can never be added
			// to it) - instead, it calls the render methods of its
			// two child panels.
			this.left.render ( this.backingPanel );
			this.draggerBar.render ( this.backingPanel );
			this.right.render ( this.backingPanel );
		}
	}
	
	// reRender requests that this, and all children, remove themselves
	// and restart the rendering process from scratch with their current
	// settings. If this is an initialCall [true], then this object is
	// responsible for re-calling 'render' on the drawing tree.
	this.reRender = function ( initialCall ) {
		// Remove us from the parent, if we exist.
		if ( this.backingPanel != null ) {
			if ( this.panelParent == this.backingPanel.parentNode ) {
				this.panelParent.removeChild ( this.backingPanel );
			}
		}
		
		// Request for all children.
		this.a.reRender ( false );
		this.b.reRender ( false );
		
		this.rendered = false;
		
		// If this is the initial (highest) call, then it is 
		// at the base of the drawing tree and responsible for
		// calling render.
		if ( initialCall ) {
			this.render ();
		}
	}
	
	this.getCanvas = function () {
		return this.canvas;
	}
	
	this.getWidth = function () {
		return this.width;
	}
	
	this.getActualWidth = function () {
		if ( this.width == 0 ) { return parseInt ( this.panelParent.style.width, 10 ) - this.getLeft (); } else if ( this.width < 0 ) { return parseInt ( this.panelParent.style.width, 10 ) + this.getWidth () - this.getLeft (); } else { return this.width; }
	}
	
	this.getHeight = function () {
		return this.height;
	}
	
	this.getActualHeight = function () {
		if ( this.height == 0 ) { return parseInt ( this.panelParent.style.height, 10 ) - this.getTop (); } else if ( this.height < 0 ) { return parseInt ( this.panelParent.style.height, 10 ) + this.getHeight () - this.getTop (); } else { return this.height; }
	}
	
	this.getTop = function () {
		return this.topPos;
	}
	
	this.getLeft = function () {
		return this.leftPos;
	}
	
	this.getAlpha = function () {
		return this.alpha;
	}
	
	this.getColour = function () {
		return this.colour;
	}
	
	this.getZ = function () {
		return z;
	}
	
	this.getDrag = function () {
		
		if ( this.getType () == 'horizontal' ) {
			if ( this.dragPosition > this.getActualWidth () - this.dragTolerance ) this.dragPosition = this.getActualWidth () - this.dragTolerance;
		} else {
			if ( this.dragPosition > this.getActualHeight () - this.dragTolerance ) this.dragPosition = this.getActualHeight () - this.dragTolerance;
		}
		
		return this.dragPosition;
	}
	
	this.getType = function () {
		return this.splitterType;
	}
		
	return this;
}
Jin.prototype.SplitterPanel = SplitterPanel;


// Class BorderPanel
	// prototyped -> Jin
	// Border panel mimics the tendancy of OS based interfaces
	// to have a padded area with a faint border around many
	// program elements.
function BorderPanel () {
	// Define state
	var me = this;
	
	this.top = 0;
	this.left = 0;
	this.width = 0;
	this.height = 0;
	this.padding = 8;
	this.colour = jin.Colour.DARK_GREY;
	this.alpha = 1;
	this.content = '';
	
	this.exposeElement = null;
	this.panelParent = null;
	
	this.panelElements = new Array ();
	this.panelEvents = new Array ();
	
	// Define methods
	this.setLeft = function ( fromLeft ) {
		this.left = fromLeft;
		
		return this;
	}
	
	this.setTop = function ( fromTop ) {
		this.top = fromTop;
		
		return this;
	}
	
	this.setPosition = function ( fromLeft, fromTop ) {
		this.setLeft ( fromLeft);
		this.setTop ( fromTop );
		
		return this;
	}
	
	this.setWidth = function ( newWidth ) {
		this.width = newWidth;
		
		return this;
	}
	
	this.setHeight = function ( newHeight ) {
		this.height = newHeight;
		
		return this;
	}
	
	this.setSize = function ( newWidth, newHeight ) {
		this.setWidth ( newWidth );
		this.setHeight ( newHeight );
		
		return this;
	}
	
	this.setAlpha = function ( newAlpha ) {
		this.alpha = newAlpha;
		
		return this;
	}
	
	this.setContent = function ( newContent ) {
		this.content = newContent;
		
		return this;
	}
	
	this.setColour = function ( newColour ) {
		if ( typeof newColour != "string" ) throw new InvalidTypeException ( "Expecting: string, Found: " + typeof newColour );
		this.colour = newColour;
		
		return this;
	}
	
	this.setPadding = function ( newPadding ) {
		this.padding = newPadding;
		
		return this;
	}
	
	this.addEvent = function ( eventType, eventAction ) {
		var tempEvent = new Array ( eventType, eventAction );
		return this.panelEvents.push ( tempEvent ) - 1;
	}
	
	this.removeEvent = function ( id ) {
		if ( this.panelEvents[id] ) this.panelEvents[id] = null;
		return id;
	}
	
	this.add = function ( addItem ) {
		return this.panelElements.push ( addItem ) - 1;
	}
	
	this.render = function () {
		// All 'childen' of Canvas must expose a method called render. This method
		// takes a document element and appends the created object onto it.
		
		if ( ( arguments.length == 0 ) && ( this.panelParent == null ) ) throw new NullValueException ( "Objects of type Panel cannot render to null parent" );
				
		if ( typeof arguments [0] == "object" ) this.panelParent = arguments [0];
		if ( this.panelParent == null ) throw new NullValueException ( "Objects of type Panel cannot render to null parent" );
		if ( typeof this.panelParent != "object" ) throw new InvalidTypeException ( "Expecting: object, Found: " + typeof this.panelParent );
		if ( typeof this.panelParent.childNodes == "undefined" ) throw new InvalidTypeException ( "Expecting: DOM Element" );
		
		// Create the panel
		var panelBack = document.createElement ( 'div' );
		
		// Handle sizing, including stretching out to parent where necessary
		if ( this.width == 0 ) { this.panelBack.style.width = ( parseInt ( this.panelParent.style.width ) - this.getLeft () ) + 'px'; } else 
		if ( this.width < 0 ) { this.panelBack.style.width = ( parseInt ( this.panelParent.style.width ) + this.getWidth () - this.getLeft () ) + 'px'; } else
			{ this.panelBack.style.width = this.getWidth () + 'px'; }
		if ( this.height == 0 ) { this.panelBack.style.height = ( parseInt ( this.panelParent.style.height ) - this.getTop () ) + 'px'; } else 
		if ( this.height < 0 ) { this.panelBack.style.height = ( parseInt ( this.panelParent.style.height ) + this.getHeight () - this.getTop () ) + 'px'; } else
			{ this.panelBack.style.height = this.getHeight () + 'px'; }
			
		// Handle other styles
		panelBack.style.position = 'absolute';
		panelBack.style.left = this.getLeft () + 'px';
		panelBack.style.top = this.getTop () + 'px';
		panelBack.style.backgroundColor = this.getColour ();
		panelBack.style.opacity = this.getAlpha ();
		panelBack.style.filter = 'alpha(opacity=' + this.getAlpha () * 100 + ')';
		
		// Create the border panel
		var panelBorder = document.createElement ( 'div' );
		
		// Handle sizing & position
		panelBorder.style.position = 'absolute';
		panelBorder.style.left = Math.floor ( this.getPadding () / 2 ) + 'px';
		panelBorder.style.top = Math.floor ( this.getPadding () / 2 ) + 'px';
		panelBorder.style.width = Math.floor ( parseInt ( panelBack.style.width ) - ( this.getPadding () + 1 ) ) + 'px';
		panelBorder.style.height = Math.floor ( parseInt ( panelBack.style.height ) - ( this.getPadding () + 1 ) ) + 'px';
		panelBorder.style.backgroundColor = this.getColour ();
		panelBorder.style.opacity = this.getAlpha ();
		panelBorder.style.filter = 'alpha(opacity=' + this.getAlpha () * 100 + ')';
		
		// Handle colouring
		try {
			var colour = jin.Colour.toRgb ( this.getColour () );
		} catch ( e ) {
			// already an rgb.
			var colour = this.getColour ();
		}
		
		for ( var i = 0; i < colour.length; i ++ ) {
			colour [i] -= 90;
			if ( colour [i] < 0 ) colour[i] = 0;
		}
		
		panelBorder.style.borderColor = jin.Colour.toHex ( colour );
		panelBorder.style.borderWidth = '1px';
		panelBorder.style.borderStyle = 'solid';
		
		// Create the content panel
		var panelMain = document.createElement ( 'div' );
		panelMain.innerHTML = this.getContent ();
		
		// Handle sizing & position
		panelMain.style.position = 'absolute';
		panelMain.style.left = Math.floor ( this.getPadding () / 2 ) + 'px';
		panelMain.style.top = Math.floor ( this.getPadding () / 2 ) + 'px';
		panelMain.style.width = Math.floor ( parseInt ( panelBorder.style.width ) - ( this.getPadding () ) ) + 'px';
		panelMain.style.height = Math.floor ( parseInt ( panelBorder.style.height ) - ( this.getPadding () ) ) + 'px';
		panelMain.style.backgroundColor = this.getColour ();
		panelMain.style.opacity = this.getAlpha ();
		panelMain.style.filter = 'alpha(opacity=' + this.getAlpha () * 100 + ')';
		
		// Connect events to this panel
		for ( var i = 0; i < this.panelEvents.length; i ++ ) {
			if ( this.panelEvents[i] == null ) continue;
			jin.elementEvent ( panelMain, this.panelEvents[i][0], this.panelEvents[i][1] );
		}
		
		// Render children onto the panel
		for ( var i = 0; i < this.panelElements.length; i ++ ) {
			if ( ! this.panelElements[i].render ) continue;
			this.panelElements[i].render ( panelMain );
		}
		
		// Render
			// Remove self from parent
			if ( this.exposeElement != null ) {
				if ( this.panelParent == this.exposeElement.parentNode ) {
					this.panelParent.removeChild ( this.exposeElement );
				}
			}
			// Attach new self to parent
			this.exposeElement = panelBack;
			panelBorder.appendChild ( panelMain );
			this.exposeElement.appendChild ( panelBorder );
			this.panelParent.appendChild ( this.exposeElement );
	}
	
	this.getWidth = function () {
		return this.width;
	}
	
	this.getHeight = function () {
		return this.height;
	}
	
	this.getTop = function () {
		return this.top;
	}
	
	this.getLeft = function () {
		return this.left;
	}
	
	this.getAlpha = function () {
		return this.alpha;
	}
	
	this.getColour = function () {
		return this.colour;
	}
	
	this.getPadding = function () {
		return this.padding;
	}
	
	// Run constructor
	return this;
}
Jin.prototype.BorderPanel = BorderPanel;

// Class Toolbar
	// prototyped -> Jin
	// A toolbar provides a panel like experience that lays
	// out buttons in a horizontal format.
	// manipulate it.
function Toolbar () {
	// Define state
	var me = this;
	this.type = 'toolbar';
	
	this.buttonSpacing = 20;
	this.buttonPreference = 'left';
	this.alignSpacing = 10;
	this.verticalAlign = 'center';
	
	this.rendered = false;
	this.buttons = new Array ();
	this.toolbar = new jin.Panel ();
	
	this.toolbarParent = null;
	
	// Define methods
	this.setCanvas = function ( newCanvas ) {
		this.toolbar.setCanvas ( newCanvas );
		
		return this;
	}
	
	this.setLeft = function ( fromLeft ) {
		this.toolbar.setLeft ( fromLeft );
		
		return this;
	}
	
	this.setTop = function ( fromTop ) {
		this.toolbar.setTop ( fromTop );
		
		return this;
	}
	
	this.setPosition = function ( fromLeft, fromTop ) {
		this.toolbar.setPosition ( fromLeft, fromTop );
		
		return this;
	}
	
	this.setWidth = function ( newWidth ) {
		this.toolbar.setWidth ( newWidth );
		
		return this;
	}
	
	this.setHeight = function ( newHeight ) {
		this.toolbar.setHeight ( newHeight );
		
		return this;
	}
	
	this.setSize = function ( newWidth, newHeight ) {
		this.toolbar.setSize ( newWidth, newHeight );
		
		return this;
	}
	
	this.setAlpha = function ( newAlpha ) {
		this.toolbar.setAlpha ( newAlpha );
		
		return this;
	}
	
	this.setColour = function ( newColour ) {
		this.toolbar.setColour ( newColour );
		
		return this;
	}
	
	this.setCursor = function ( newCursor ) {
		this.toolbar.setCursor ( newCursor );
		
		return this;
	}
	
	this.setSpacing = function ( newSpacing ) {
		this.buttonSpacing = newSpacing;
		
		return this;
	}
	
	this.setVerticalAlign = function ( newAlign ) {
		this.verticalAlign = newAlign;
		
		return this;
	}
	
	this.setAlignSpace = function ( newAlign ) {
		this.alignSpacing = newAlign;
		
		return this;
	}
	
	this.setPreference = function ( newPreference ) {
		this.buttonPreference = newPreference;
		
		return this;
	}
	
	this.setParent = function ( newParent ) {
		this.toolbar.setParent ( newParent );
		
		return this;
	}
	
	this.add = function ( newButton ) {
		if ( typeof newButton != "object" ) throw new InvalidTypeException ( "Expecting: object//button, Found: " + typeof newButton );
		if ( typeof newButton.type == "undefined" ) throw new InvalidTypeException ( "Expecting: object//button, Found: " + typeof newButton );
		this.buttons.push ( newButton );
		
		return this;
	}
	
	this.render = function () {
		/* 
		** A toolbar contains an array of buttons and consists of a panel. It,
		** works by assigning positions to its buttons, adding them to its 
		** internal panel, and then rendering that panel onto the parent of
		** the toolbar. Importantly, there is no externally provided method of
		** adding directly to the internal panel.
		**
		** Because the internal panel is provided to the buttons as the parent,
		** they can simply render to it as they would any other panel, but their
		** positions will be internally adjusted.
		*/
		
		if ( ( arguments.length == 0 ) && ( this.toolbarParent == null ) ) throw new NullValueException ( "Objects of type Toolbar cannot render to null parent" );
				
		if ( typeof arguments [0] == "object" ) { this.toolbarParent = arguments [0]; this.toolbar.panelParent = this.toolbarParent; }
		if ( this.toolbarParent == null ) throw new NullValueException ( "Objects of type Toolbar cannot render to null parent" );
		if ( typeof this.toolbarParent != "object" ) throw new InvalidTypeException ( "Expecting: object, Found: " + typeof this.toolbarParent );
		if ( typeof this.toolbarParent.childNodes == "undefined" ) throw new InvalidTypeException ( "Expecting: DOM Element, not found" );
		
		if ( this.rendered ) {
			this.toolbar.clear ();
		} else {
			this.rendered = true;
		}
			
		var left = new Array ();
		var right = new Array ();
		
		// Split buttons into relevant sides.
		for ( i = 0; i < this.buttons.length; i ++ ) {
			if ( this.buttons[i].getAlignment () == 'left' ) {
				left.push ( this.buttons[i] );
			} else {
				right.push ( this.buttons[i] );
			}
		}
		
		// Handle vertical alignment.
		switch ( this.getVerticalAlign () ) {
			default:
			case 'top':
				for ( i = 0; i < this.buttons.length; i ++ ) {
					this.buttons[i].setTop ( this.getAlignSpace () );
				}
				break;
				
			case 'center':
				for ( i = 0; i < this.buttons.length; i ++ ) {
					this.buttons[i].setTop ( ( this.getActualHeight () / 2 ) - ( this.buttons[i].getHeight () / 2 ) );
				}
				break;
				
			case 'bottom':
				for ( i = 0; i < this.buttons.length; i ++ ) {
					this.buttons[i].setTop ( this.getActualHeight () - ( this.getAlignSpace () + this.buttons[i].getHeight () ) );
				}
				break;
		}
		
		// Render each button to the panel.
		if ( this.getPreference () != 'left' ) {
			var rightPos = leftPos = spacing = this.getSpacing ();
			for ( var i = 0; i < right.length; i ++ ) {
				var t = right[i];
				
				if ( ( rightPos + t.getWidth () + spacing ) > this.getActualWidth () ) {
					break;
				}
				
				t.setLeft ( this.getActualWidth () - ( rightPos + t.getWidth () ) );
				this.toolbar.add ( t );
				
				rightPos += spacing + t.getWidth ();
			}
			
			for ( var i = 0; i < left.length; i ++ ) {
				var t = left[i];
				
				if ( ( rightPos + leftPos + t.getWidth () ) > this.getActualWidth () ) {
					break;
				}
				
				t.setLeft ( leftPos );
				this.toolbar.add ( t );
				
				leftPos += spacing + t.getWidth ();
			}
		} else {
			var rightPos = leftPos = spacing = this.getSpacing ();
			for ( var i = 0; i < left.length; i ++ ) {
				var t = left[i];
				
				if ( ( leftPos + t.getWidth () + spacing ) > this.getActualWidth ()  ) {
					break;
				}
				
				t.setLeft ( leftPos );
				this.toolbar.add ( t );
				
				leftPos += spacing + t.getWidth ();
			}
			
			for ( var i = 0; i < right.length; i ++ ) {
				var t = right[i];
				
				if ( this.getActualWidth () < ( leftPos + rightPos + t.getWidth () ) ) {
					break;
				}
				
				t.setLeft ( this.getActualWidth () - ( rightPos + t.getWidth () ) );
				this.toolbar.add ( t );
				
				rightPos += spacing + t.getWidth ();
			}
		}
		
		this.toolbar.render ( this.toolbarParent );
	}
	
	// reRender requests that this, and all children, remove themselves
	// and restart the rendering process from scratch with their current
	// settings. If this is an initialCall [true], then this object is
	// responsible for re-calling 'render' on the drawing tree.
	this.reRender = function ( initialCall ) {
		// Remove us from the parent, if we exist.
		if ( this.panel != null ) {
			if ( this.panelParent == this.panel.parentNode ) {
				this.panelParent.removeChild ( this.panel );
			}
		}
		
		// Request for all children.
		for ( var i = 0; i < this.panelElements.length; i ++ ) {
			if ( ! this.panelElements[i].reRender ) continue;
			this.panelElements[i].reRender ( false );
		}
		
		this.rendered = false;
		
		// If this is the initial (highest) call, then it is 
		// at the base of the drawing tree and responsible for
		// calling render.
		if ( initialCall ) {
			this.render ();
		}
	}
	
	this.destroy = function () {
		return this.toolbar.destroy ();
	}
	
	this.getCanvas = function () {
		return this.toolbar.getCanvas ();
	}
	
	this.getWidth = function () {
		return this.toolbar.getWidth ();
	}
	
	this.getActualWidth = function () {
		return this.toolbar.getActualWidth ();
	}
	
	this.getHeight = function () {
		return this.toolbar.getHeight ();
	}
	
	this.getActualHeight = function () {
		return this.toolbar.getActualHeight ();
	}
	
	this.getTop = function () {
		return this.toolbar.getTop ();
	}
	
	this.getLeft = function () {
		return this.toolbar.getLeft ();
	}
	
	this.getAlpha = function () {
		return this.toolbar.getAlpha ();
	}
	
	this.getColour = function () {
		return this.toolbar.getColour ();
	}
	
	this.getCursor = function () {
		return this.toolbar.getCursor ();
	}
	
	this.getSpacing = function () {
		return this.buttonSpacing;
	}
	
	this.getVerticalAlign = function () {
		return this.verticalAlign;
	}
	
	this.getAlignSpace = function () {
		return this.alignSpacing;
	}
	
	this.getPreference = function () {
		return this.buttonPreference;
	}
	
	this.getParent = function () {
		return this.toolbar.getParent ();
	}
	
	// Run constructor
	return this
}
Jin.prototype.Toolbar = Toolbar;

// Class Button
	// prototyped -> Jin
	// The button gives a resizable, colourable button element
	// that can take text, an image or both; cannot be selected;
	// and uses the browser button as its base. This simply provides
	// a standard way for other elements and the programmer to 
	// manipulate it.
function Button () {
	var me = this;
	
	this.type = '';
	if ( arguments.length == 0 ) {
		this.type = 'button';
	} else if ( typeof arguments[0] == 'string' ) {
		this.type = arguments[0];
	} else this.type = 'button';
	
	this.top = 0;
	this.left = 0;
	this.width = 50;
	this.height = 30;
	this.colour = jin.Colour.DARK_GREY;
	this.alpha = 1;
	this.z = jin.z ();
	this.cursor = 'auto';
	this.alignment = 'left';
	
	this.image = '';
	this.text = '';
	
	this.parent = null;
	this.rendered = false;
	this.panelParent = null;
	this.button = null;
	this.canvas = null;
	
	this.buttonEvents = new jin.ElementEvents (); //new Array ();
	
	this.setAlignment = function ( newAlign ) {
		this.alignment = newAlign;
		
		return this;
	}
	
	this.setCanvas = function ( newCanvas ) {
		this.canvas = newCanvas;
		
		return this;
	}
	
	this.setLeft = function ( fromLeft ) {
		this.left = fromLeft;
		
		return this;
	}
	
	this.setTop = function ( fromTop ) {
		this.top = fromTop;
		
		return this;
	}
	
	this.setPosition = function ( fromLeft, fromTop ) {
		this.setLeft ( fromLeft );
		this.setTop ( fromTop );
		
		return this;
	}
	
	this.setWidth = function ( newWidth ) {
		this.width = newWidth;
		
		return this;
	}
	
	this.setHeight = function ( newHeight ) {
		this.height = newHeight;
		
		return this;
	}
	
	this.setSize = function ( newWidth, newHeight ) {
		this.setWidth ( newWidth );
		this.setHeight ( newHeight );
		
		return this;
	}
	
	this.setAlpha = function ( newAlpha ) {
		this.alpha = newAlpha;
		
		return this;
	}
	
	this.setText = function ( newText ) {
		if ( typeof newText != "string" ) throw new InvalidTypeException ( "Expecting: string, Found: " + typeof newText );
		this.text = newText;
		
		return this;
	}
	
	this.setImage = function ( newImage ) {
		if ( typeof newImage != "string" ) throw new InvalidTypeException ( "Expecting: string, Found: " + typeof newImage );
		this.image = newImage;
		
		return this;
	}
	
	this.setColour = function ( newColour ) {
		if ( typeof newColour != "string" ) throw new InvalidTypeException ( "Expecting: string, Found: " + typeof newColour );
		this.colour = newColour;
		
		return this;
	}
	
	this.setCursor = function ( newCursor ) {
		if ( typeof newCursor != "string" ) throw new InvalidTypeException ( "Expecting: string, Found: " + typeof newursor );
		this.cursor = newCursor;
		
		return this;
	}
	
	this.setParent = function ( newParent ) {
		this.parent = newParent;
		
		return this;
	}
	
	this.addEvent = function ( eventType, eventAction ) {
		this.buttonEvents.add ( eventType, eventAction );
		return 1;
	}
	
	this.removeEvent = function ( id ) {
		if ( this.buttonEvents[id] ) this.buttonEvents[id] = null;
		return id;
	}
	
	this.render = function () {
		if ( ( arguments.length == 0 ) && ( this.buttonParent == null ) ) throw new NullValueException ( "Objects of type Button cannot render to null parent" );
				
		if ( typeof arguments [0] == "object" ) this.buttonParent = arguments [0];
		if ( this.buttonParent == null ) throw new NullValueException ( "Objects of type Button cannot render to null parent" );
		if ( typeof this.buttonParent != "object" ) throw new InvalidTypeException ( "Expecting: object, Found: " + typeof this.buttonParent );
		if ( typeof this.buttonParent.childNodes == "undefined" ) throw new InvalidTypeException ( "Expecting: DOM Element, not found" );
		
		if ( ! this.rendered ) {
			this.rendered = true;
			
			// Create the button
			if ( this.type == 'flat' ) {
				this.button = document.createElement ( 'div' );
			} else {
				this.button = document.createElement ( 'input' );
				this.button.type = 'button';
			}
			
			// Handle sizing. Buttons are always a fixed size.
			this.button.style.width = this.getWidth () + 'px';
			this.button.style.height = this.getHeight () + 'px';
			
			// Handle other styles
			this.button.style.position = 'absolute';
			this.button.style.left = this.getLeft () + 'px';
			this.button.style.top = this.getTop () + 'px';
			if ( this.getColour () == 'inherit' ) { this.button.style.backgroundColor = this.getParent ().getColour (); } else { this.button.style.backgroundColor = this.getColour (); }
			this.button.style.opacity = this.getAlpha ();
			this.button.style.filter = 'alpha(opacity=' + this.getAlpha () * 100 + ')';
			this.button.style.cursor = this.getCursor ();
			this.button.style.zIndex = this.z;
			
			// Handle text
			this.button.value = this.getText ();
			
			// Handle image
			if ( this.getImage () !== '' ) { this.button.style.backgroundImage = 'url('+this.getImage ()+')'; } else { this.button.style.backgroundImage = 'none'; }
			
			// Connect events to this panel
			this.buttonEvents.bind ( this.button );
			
			this.buttonParent.appendChild ( this.button );
		} else {
			// Handle sizing.
			this.button.style.width = this.getWidth () + 'px';
			this.button.style.height = this.getHeight () + 'px';
			
			// Handle other styles
			this.button.style.position = 'absolute';
			this.button.style.left = this.getLeft () + 'px';
			this.button.style.top = this.getTop () + 'px';
			if ( this.getColour () == 'inherit' ) { this.button.style.backgroundColor = this.getParent ().getColour (); } else { this.button.style.backgroundColor = this.getColour (); }
			this.button.style.opacity = this.getAlpha ();
			this.button.style.filter = 'alpha(opacity=' + this.getAlpha () * 100 + ')';
			this.button.style.cursor = this.getCursor ();
			
			// Handle text
			this.button.value = this.getText ();
			
			// Handle image
			if ( this.getImage () !== '' ) { this.button.style.backgroundImage = 'url('+this.getImage ()+')'; } else { this.button.style.backgroundImage = 'none'; }
		}
	}
	
	// The opposite of render - destroy me and all children.
	this.destroy = function () {
		if ( this.button != null ) {
			if ( this.buttonParent == this.button.parentNode ) {
				this.buttonParent.removeChild ( this.button );
			}
		}
		
		this.rendered = false;
		
		return this;
	}
	
	this.getAlignment = function () {
		return this.alignment;
	}
	
	this.getCanvas = function () {
		return this.canvas;
	}
	
	this.getWidth = function () {
		return this.width;
	}
	
	this.getHeight = function () {
		return this.height;
	}
	
	this.getTop = function () {
		return this.top;
	}
	
	this.getLeft = function () {
		return this.left;
	}
	
	this.getAlpha = function () {
		return this.alpha;
	}
	
	this.getImage = function () {
		return this.image;
	}
	
	this.getText = function () {
		return this.text;
	}
	
	this.getColour = function () {
		return this.colour;
	}
	
	this.getCursor = function () {
		return this.cursor;
	}
	
	this.getParent = function () {
		return this.parent;
	}
	
	// Run constructor
	return this;
}
Jin.prototype.Button = Button;
	
	
/*
	STATICS ==========================
	*/


// Class Colour [static]
	// prototyped -> Jin

function Colour () {
	// Define state
	var me = this;
	
	this.WHITE = '#ffffff';
	this.LIGHT_GREY = '#dddddd';
	this.DARKER_LIGHTGREY = '#666666';
	this.GREY = '#aaaaaa';
	this.DARK_GREY = '#444444';
	this.DARKER_GREY = '#212121';
	this.BLACK = '#000000';
	
	this.RED = '#ff0000';
	this.GREEN = '#00ff00';
	this.BLUE = '#0000ff';
	
	// Define methods
	this.toRgb = function ( hex ) {
		if ( typeof hex != 'string' ) throw new InvalidTypeException ();
		if ( hex.indexOf ( '#' ) == 0 ) hex = hex.substr ( 1 );
		if ( hex.length != 6 ) throw new BadArgumentsException ();
		
		var rgb = new Array ( parseInt ( hex.substr ( 0, 2 ), 16 ), parseInt ( hex.substr ( 2, 2 ), 16 ), parseInt ( hex.substr ( 4, 2 ), 16 ) );
		return rgb;
	}
	
	this.toHex = function () {
		var hex = '#';
		
		if ( arguments.length == 1 ) {
			for ( var i = 0; i < arguments[0].length; i ++ ) {
				if ( arguments[0][i] == 0 ) { hex += '00'; } else {
					hex += arguments[0][i].toString ( 16 );
				}
			}
		} else if ( arguments.length == 3 ) {
			for ( var i = 0; i < arguments.length; i ++ ) {
				if ( arguments[i] == 0 ) { hex += '00'; } else {
					hex += arguments[i].toString ( 16 );
				}
			}
		} else throw new BadArgumentsException ();
		
		return hex;
	}
	
	// Run constructor
	return this;
}
Jin.prototype.Colour = new Colour ();


// === EXCEPTIONS ==========
function NullValueException () {
	// Define state
	var me = this;
	var message = "";
	this.id = "NullValueException";
	
	// Define methods
	this.getId = function () {
		return this.id;
	}
	
	this.getMessage = function () {
		return this.id + ( ( message != "" ) ? ( ": " + message ) : "" );
	}
	
	// Run constructor
	if ( typeof arguments [0] == "string" ) {
		message = arguments [0];
	}
	
	return this.getMessage ();
}

function InvalidTypeException () {
	// Define state
	var me = this;
	var message = "";
	this.id = "InvalidTypeException";
	
	// Define methods
	this.getId = function () {
		return this.id;
	}
	
	this.getMessage = function () {
		return this.id + ( ( message != "" ) ? ( ": " + message ) : "" );
	}
	
	// Run constructor
	if ( typeof arguments [0] == "string" ) {
		message = arguments [0];
	}
	
	return this.getMessage ();
}

function BadArgumentsException () {
	// Define state
	var me = this;
	var message = "";
	this.id = "BadArgumentsException";
	
	// Define methods
	this.getId = function () {
		return this.id;
	}
	
	this.getMessage = function () {
		return this.id + ( ( message != "" ) ? ( ": " + message ) : "" );
	}
	
	// Run constructor
	if ( typeof arguments [0] == "string" ) {
		message = arguments [0];
	}
	
	return this.getMessage ();
}