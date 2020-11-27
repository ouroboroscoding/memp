/**
 * Page Visibility
 *
 * Library/Namespace containing various functions to track page visibility
 *
 * @author Chris Nasr <ouroboroscode@gmail.com>
 * @copyright OuroborosCoding
 * @created 2018-08-01
 */

// Init the visibility property name and event values
var bVis = false;
var dVis = {"callbacks":[]};

// Figure out the name of the visibility property and event
// Valid browser prefixes
var lPrefixes = ['moz', 'ms', 'o', 'webkit'];

// If no prefix is needed
if('hidden' in document) {
	dVis['property'] = 'hidden';
	dVis['event'] = 'visibilitychange';
	dVis['state'] = 'visibilityState';
	bVis = true;
}

// Else, loop through the prefixes
else {
	for(var i = 0; i < lPrefixes.length; ++i) {

		// If the prefixes version exists
		if((lPrefixes[i] + 'Hidden') in document) {
			dVis['property'] = lPrefixes[i] + 'Hidden';
			dVis['event'] = lPrefixes[i] + 'visibilitychange';
			dVis['state'] = lPrefixes[i] + 'VisibilityState';
			bVis = true;
			break;
		}
	}
}

/**
 * Track
 *
 * The actual function passed to the event so that we only have one event listener
 *
 * @name track
 * @access private
 * @return void
 */
function track() {

	// Call the callbacks and pass them bool and state values
	for(var f of dVis['callbacks']) {
		f(document[dVis['property']], document[dVis['state']]);
	}
}

/**
 * Add
 *
 * Track changes on page visibility
 *
 * @name add
 * @access public
 * @param Function callback Function to call on visibility changes
 * @return bool
 */
export function add(callback) {

	// If the Page Visibility  API is not available
	if(bVis === false) {
		console.log('Page Visibility API not available');
		return false;
	}

	// Save the callback for later
	dVis['callbacks'].push(callback);

	// Attach an event listener if this is our first event
	if(dVis['callbacks'].length === 1) {
		document.addEventListener(dVis['event'], track);
	}

	// Return ok
	return true;
}

/**
 * Get
 *
 * Returns the current state of visibility
 *
 * @name get
 * @access public
 * @return object
 */
export function get() {

	// If the library is available
	if(bVis) {
		return {
			"property": document[dVis['property']],
			"state": document[dVis['state']]
		}
	} else {
		console.log('Page Visibility API not available');
		return false;
	}
}

/**
 * Remove
 *
 * Stop tracking changes in page visibility
 *
 * @name remove
 * @access public
 * @param Function callback
 * @return bool
 */
export function remove(callback) {

	// If the Page Visibility  API is not available
	if(bVis === false) {
		console.log('Page Visibility API not available');
		return false;
	}

	// Find the index of the callback
	let iIndex = dVis['callbacks'].indexOf(callback);

	// If it exists
	if(iIndex > -1) {

		// Remove the callback
		dVis['callbacks'].splice(iIndex, 1);

		// Remove event listener if we have no more callbacks
		if(dVis['callbacks'].length === 0) {
			document.removeEventListener(dVis['event'], track);
		}
	}

	// Return ok
	return true;
}

// Default export
export default {
	add: add,
	get: get,
	remove: remove
}
