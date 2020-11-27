/**
 * Hash
 *
 * JS Library to manage hash values
 *
 * @author Chris Nasr <ouroboroscode@gmail.com>
 * @copyright OuroborosCoding
 * @created 2018-12-09
 */

// Generic modules
const Tools = require('./tools.js');

// name regex
const nameRE = /^[a-zA-Z_]+$/;

// Callbacks
const watches = {};

// Values
let hash = {};

/**
 * Hash Changed
 *
 * Called when the location hash has been altered, notifies any watchers of
 * hash values changing
 *
 * @name _hashChanged
 * @access private
 * @return void
 */
function _hashChanged() {

	// Store the current hash
	let old = Tools.clone(hash);

	// Re-parse the current location hash
	_parseHash();

	// If there are watches
	if(!Tools.empty(watches)) {

		// Check each watch
		for(let name in watches) {

			// If the value didn't exist and now it does, or it did exist
			//	and now it doesn't, or the values don't match
			if((!(name in old) && name in hash) ||
				(name in old && !(name in hash)) ||
				old[name] !== hash[name]) {

				// Go through each callback and call it
				for(let f of watches[name]) {
					f(hash[name] || null);
				}
			}
		}
	}
}

/**
 * Parse Hash
 *
 * Parses the current location hash into an object
 *
 * @name _parseHash
 * @access private
 * @return void
 */
function _parseHash() {

	// Blank out the current values
	hash = {};

	// If there's anything in the hash
	if(window.location.hash.length > 1) {
		let regex = /([^=&]+)=?([^&]*)/g
		let field = null;

		// Go through each part found
		while((field = regex.exec(window.location.hash.substring(1)))) {
			hash[field[1]] = decodeURIComponent(field[2]);
		}
	}
}

/**
 * Init
 *
 * Initialises the internal hash by fetching and parsing the current
 * location hash
 *
 * @name init
 * @access public
 * @static
 * @return void
 */
function init() {

	// Track changes
	window.addEventListener("hashchange", _hashChanged);

	// Parse the current location hash
	_parseHash();
}

/**
 * Get
 *
 * Returns a hash name
 *
 * @name get
 * @access public
 * @static
 * @param string name		The name to look for
 * @param string default_	The value to return if the name isn't found
 * @return str
 */
function get(name, default_=null) {

	// If the name is invalid
	if(!nameRE.test(name)) {
		throw new Error('Invalid Hash name');
	}

	// If there is a value for the name
	if(typeof hash[name] !== 'undefined') {
		return hash[name];
	}

	// Else, return the default
	else {
		return default_;
	}
}

/**
 * Set
 *
 * Sets a specific name
 *
 * @name set
 * @access public
 * @param str|object name	The name to set, or an object of name/value pairs
 * @param str value			The value to set the name to
 */
function set(name, value) {

	// If the name is not an object
	if(!Tools.isObject(name)) {

		// If the value is not defined
		if(typeof value === 'undefined') {
			value = null;
		}

		// Set the value
		name = {[name]: value}
	}

	// Make a copy of the current hash
	let copy = Tools.clone(hash);

	// Go through each name
	for(let n in name) {

		// If the name is invalid
		if(!nameRE.test(n)) {
			throw new Error('Invalid Hash name: ' + n);
		}

		// If we got null, delete the name
		if(name[n] === null) {
			delete copy[n];
		}
		// Else, set the new value
		else {
			copy[n] = name[n];
		}
	}

	// Init an array to store the parts
	let temp = [];

	// Go through each name
	for(let k in copy) {
		temp.push(k + '=' + copy[k]);
	}

	// Reset the window location hash
	window.location.hash = temp.join('&');
}

/**
 * Unwatch
 *
 * Removes a callback from the watches
 *
 * @name unwatch
 * @access public
 * @param string name			The name of the value to stop watching
 * @param function callback		The callback to remove
 * @return void
 */
function unwatch(name, callback) {

	// If we have the name
	if(name in watches) {

		// Go through the callbacks associated with the name
		for(let i = 0; i < watches[name].length; ++i) {

			// If we find the callback
			if(watches[name][i] === callback) {

				// Remove it
				watches[name].splice(i, 1);
				return;
			}
		}
	}
}

/**
 * Watch
 *
 * Adds a callback for a specific name which will be called if the name is
 * added, deleted, or changed
 *
 * @name watch
 * @access public
 * @param string name			The name of the value to watch
 * @param function callback		The function to call when the value changes
 * @return void
 */
function watch(name, callback) {

	// If we already have the name
	if(name in watches) {

		// Go through the callbacks associated with the name
		for(let i = 0; i < watches[name].length; ++i) {

			// If we already have the callback there's no need to store it
			if(watches[name][i] === callback) {
				return;
			}
		}
	}

	// Else if we don't have any callbacks for the name
	else {
		watches[name] = [];
	}

	// Add the callback to the watches
	watches[name].push(callback);
}

// export module
export default {
	init: init,
	get: get,
	set: set,
	unwatch: unwatch,
	watch: watch
}
