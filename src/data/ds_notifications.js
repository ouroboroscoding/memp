/**
 * DoseSpot Notifications
 *
 * Functions to keep track and report notification count
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-30
 */

// Shared data modules
import DS from 'shared/data/dosespot';

// Shared generic modules
import Events from 'shared/generic/events';

// Global variables
let _callbacks = [];
let _count = null;
let _timer = null;

// Defines
const FETCH_INTERVAL = 300000;

// Track sign in/out
Events.add('dosespotInit', clinician_id => {
	if(clinician_id === 0) {
		_count = 0;
		clear();
		notify();
	} else {
		fetchCount();
	}
});

/**
 * Clear
 *
 * Clears the timeout so we don't fetch the data again
 *
 * @name clear
 * @access private
 * @return void
 */
function clear() {
	if(_timer) {
		clearTimeout(_timer);
		_timer = null;
	}
}

/**
 * Fetch Count
 *
 * Gets the count of unresolved
 *
 * @name fetchCount
 * @access private
 * @return void
 */
function fetchCount() {

	// Fetch the data from the server
	DS.providerNotifications().then(res => {

		// Store the data
		_count = res;

		// Clear the timeout if we have one
		clear();

		// Set a new timeout in an hour
		_timer = setTimeout(fetchCount, FETCH_INTERVAL);

		// Trigger all callbacks
		notify();

	}, error => {
		Events.trigger('error', JSON.stringify(error));
	});
}

/**
 * Notify
 *
 * Calls all the callbacks with the current data
 *
 * @name notify
 * @access private
 * @return void
 */
function notify() {

	// Pass the count to everyone tracking
	for(let f of _callbacks) {
		f(_count);
	}
}

/**
 * Subscribe
 *
 * Subscribes to locale changes and returns the current data
 *
 * @name subscribe
 * @access public
 * @param Function callback The callback to register for future updates
 * @return Array
 */
function subscribe(callback) {

	// Add the callback to the list
	_callbacks.push(callback);
}

/**
 * Ubsubscribe
 *
 * Removes a callback from the list of who gets notified on changes
 *
 * @name ubsubscribe
 * @access public
 * @param Function callback The callback to remove
 * @return void
 */
function unsubscribe(callback) {
	let i = _callbacks.indexOf(callback);
	if(i > -1) {
		_callbacks.splice(i, 1);
	}
}

/**
 * Update
 *
 * force an update of the count
 *
 * @name update
 * @access public
 * @return void
 */
function update() {
	fetchCount();
}

// Default export
const ds_notifications = {
	subscribe: subscribe,
	unsubscribe: unsubscribe,
	update: update
}
export default ds_notifications;
