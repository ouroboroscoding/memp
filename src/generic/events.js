/**
 * Events
 *
 * Event model for non UI events
 *
 * @author Chris Nasr <ouroboroscode@gmail.com>
 * @copyright OuroborosCoding
 * @created 2018-11-24
 */

// Init the callbacks object
const _callbacks = {};

/**
 * Add
 *
 * Adds a callback to an event
 *
 * @name add
 * @access public
 * @param str event				The name of the event
 * @param function callback		The callback to attach to the event
 * @return bool
 */
function add(event, callback) {

	// If the event doesn't exist yet
	if(!(event in _callbacks)) {
		_callbacks[event] = []
	}

	// Add the callback to the list
	_callbacks[event].push(callback);
	return true;
}

/**
 * Remove
 *
 * Removes a callback from a specific event
 *
 * @name remove
 * @access public
 * @param str event				The name of the event to remove the callback from
 * @param function callback		The exact same callback that was added to the event
 * @return
 */
function remove(event, callback) {

	// If the name exists in the object
	if(event in _callbacks) {

		// If the callback exists in the list
		let i = _callbacks[event].indexOf(callback);
		if(i > -1) {
			_callbacks[event].splice(i,1);
			return true;
		}
	}

	// Nothing found, return false
	return false;
}

/**
 * Trigger
 *
 * Triggers a specific event and calls all callbacks associated
 *
 * @name trigger
 * @access public
 * @param str event				The name of the event to trigger
 * @return void
 */
export function trigger(event) {

	// If we have callbacks for the event
	if(event in _callbacks) {

		// Check for additional arguments that will be passed to the
		//	callbacks
		let args = [];
		if(arguments.length > 1) {
			args = Array.apply(null, arguments).slice(1);
		}

		// If there's any callbacks, call them one by one
		for(let i in _callbacks[event]) {
			try {
				let b = _callbacks[event][i].apply(null, args);

				// If we got false back, stop calling the callbacks
				if(b === false) {
					break;
				}
			} catch(err) {
				console.error(event + ' callback ' + i + ' threw exception: ' + err);
				break
			}
		}
	}

	// No callbacks asscocited with the event
	else {
		console.error('event value "' + event + '" returned, and no callbacks were found to handle it');
	}
}

// export module
export default {
	add: add,
	remove: remove,
	trigger: trigger
}
