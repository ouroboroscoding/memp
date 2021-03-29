/**
 * Activity
 *
 * Tracks user activity on the page and calls signout if nothing is happening
 * for a while
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-12-08
 */

// Shared generic modules
import { isInteger, isObject } from 'shared/generic/tools';

// Init module vars
let miMinutes = null;
let moCallbacks = null;
let mrActivity = null;
let mrSignout = null;

// Debugging
const DEBUG = false;

/**
 * Activity Timeout
 *
 * Called when the activity timer goes off
 *
 * @name activityTimeout
 * @access private
 * @return void
 */
function _activityTimeout() {

	// Let the system know to show whatever is used to notify of a
	//	signout
	if('warning' in moCallbacks &&
		typeof moCallbacks['warning'] === 'function') {
		moCallbacks['warning']();
	}

	// Start the signout timeout
	mrSignout = setTimeout(_signoutTimeout, 60000);
}

/**
 * Logout Timeout
 *
 * Called when the signout timer goes off
 *
 * @name signoutTimeout
 * @access private
 * @return void
 */
function _signoutTimeout() {

	// Let the system know to signout
	if('signout' in moCallbacks &&
		typeof moCallbacks['signout'] === 'function') {
		moCallbacks['signout'](miMinutes);
	}
}

/**
 * Initialise
 *
 * Initialises the module
 *
 * @name init
 * @access public
 * @param Number minutes The minutes to track for inactivity
 * @param Object callbacks 'warning', 'signout'
 * @return void
 */
function init(minutes, callbacks) {

	if(DEBUG) console.log('ActivityWatch: init(' + minutes + ')');

	// Verify params
	if(!isInteger(minutes) || minutes < 1) {
		throw new Error('ActivityWatch minutes must be an unsigned integer');
	}
	if(!isObject(callbacks)) {
		throw new Error('ActivityWatch callbacks must be an object. Valid keys are "warning" and "signout"');
	}

	// Init class vars
	miMinutes = minutes;
	moCallbacks = callbacks;
	mrActivity = null;
	mrSignout = null;
}

/**
 * Reset
 *
 * Called whenever there is activity in order to reset the timer
 *
 * @name resetActivity
 * @access public
 * @param bool force Force starting the activity timer even if none was found
 * @return void
 */
function reset(force=false) {

	if(DEBUG) console.log('ActivityWatch: reset(' + force + ')');

	// Keep track of any existing timers (unless we want to force it)
	let bSetNew = force;

	// If we have a signout timer
	if(mrSignout) {

		// Clear it
		clearTimeout(mrSignout);
		bSetNew = true;
	}

	// If we have an activity timer
	if(mrActivity) {

		// Clear it
		clearTimeout(mrActivity);
		bSetNew = true;
	}

	// Start a new timeout if we need one
	if(bSetNew) {
		mrActivity = setTimeout(
			_activityTimeout,
			60000 * (miMinutes - 1)
		);
	}
}

/**
 * Start
 *
 * Starts the timer that will eventually notify of the need to signout
 *
 * @name start
 * @access public
 * @return void
 */
function start() {

	if(DEBUG) console.log('ActivityWatch: start()');

	// If we already have a timer
	if(mrActivity || mrSignout) {
		console.error('ActivityWatch timer already started');
		return;
	}

	// Start the timer
	mrActivity = setTimeout(
		_activityTimeout,
		60000 * (miMinutes - 1)
	);
}

/**
 * Stop
 *
 * Stops all timers
 *
 * @name stop
 * @access public
 * @return void
 */
function stop() {

	if(DEBUG) console.log('ActivityWatch: stop()');

	// If we have a signout timer
	if(mrSignout) {

		// Clear it
		clearTimeout(mrSignout);
		mrSignout = null;
	}

	// If we have an activity timer
	if(mrActivity) {

		// Clear it
		clearTimeout(mrActivity);
		mrActivity = null;
	}
}

// Default export
const ActivityWatch = {
	init: init,
	reset: reset,
	start: start,
	stop: stop
};
export default ActivityWatch;
