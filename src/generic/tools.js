/**
 * Tools
 *
 * Useful functions that belong to any specific module
 *
 * @author Chris Nasr <ouroboroscode@gmail.com>
 * @copyright OuroborosCoding
 * @created 2018-11-25
 */

/**
 * Array Find Index
 *
 * Finds a specific object in an array based on key name and value and
 * returns its index
 *
 * @name afindi
 * @param array a				The value to look through
 * @param str k					The name of the key to check
 * @param mixed v				The value to check against
 * @return object
 */
export function afindi(a, k, v) {
	for(let i = 0; i < a.length; ++i) {
		if(a[i][k] === v) {
			return i;
		}
	}
	return -1;
}

/**
 * Array Find Object
 *
 * Finds a specific object in an array based on key name and value and
 * returns it
 *
 * @name afindo
 * @param array a				The value to look through
 * @param str k					The name of the key to check
 * @param mixed v				The value to check against
 * @return object
 */
export function afindo(a, k, v) {
	for(let i = 0; i < a.length; ++i) {
		if(a[i][k] === v) {
			return a[i];
		}
	}
	return null;
}

/**
 * Clone
 *
 * Deep clone any type of object, returning a new one
 *
 * @name clone
 * @param mixed o				The variable to clone
 * @return mixed
 */
export function clone(o) {
	// New var
	let n = null;

	// If it's an array
	if(Array.isArray(o)) {
		n = [];
		for(let i in o) {
			n.push(clone(o[i]));
		}
	}

	// Else if the value is an object
	else if(isObject(o)) {
		n = {}
		for(let k in o) {
			n[k] = clone(o[k]);
		}
	}

	// Else, copy as is
	else {
		n = o;
	}

	// Return the new var
	return n;
}

/**
 * Compare
 *
 * Compares two values of any type to see if they contain the same
 * data or not
 *
 * @name compare
 * @access public
 * @param mixed v1				The first value
 * @param mixed v2				The second value
 * @return bool
 */
export function compare(v1, v2) {

	// If they're both arrays
	if(Array.isArray(v1) && Array.isArray(v2)) {

		// If they don't have the same length
		if(v1.length !== v2.length) {
			return false;
		}

		// Compare the values
		for(let i = 0; i < v1.length; ++i) {
			if(!compare(v1[i], v2[i])) {
				return false;
			}
		}
	}

	// Else if they're both objects
	else if(isObject(v1) && isObject(v2)) {

		// If they don't have the same keys
		if(!compare(Object.keys(v1).sort(), Object.keys(v2).sort())) {
			return false;
		}

		// Compare each key
		for(let k in v1) {
			if(!compare(v1[k], v2[k])) {
				return false;
			}
		}
	}

	// Else, compare as is
	else {
		if(v1 !== v2) {
			return false;
		}
	}

	// Return equal
	return true;
}

/**
 * Date Increment
 *
 * Returns a date incremented by the given days. Use negative to decrement
 *
 * @name dateInc
 * @access public
 * @param uint days The number of days to increment by
 * @return Date
 */
export function dateInc(days=1) {
	let date = new Date();
	date.setDate(date.getDate() + days);
	return date;
}

/**
 * Empty
 *
 * Returns true if the value type is empty
 *
 * @name empty
 * @access public
 * @param mixed m				The value to check, can be object, array, string, etc
 * @return bool
 */
export function empty(m) {

	// If it's an object
	if(isObject(m)) {
		for(let p in m) {
			return false;
		}
		return true;
	}

	// Else if it's an array or a string
	else if(Array.isArray(m) || typeof m == 'string') {
		return m.length === 0;
	}

	// Else
	else {

		// If it's null or undefined
		if(typeof m == 'undefined' || m == null) {
			return true;
		}

		// Else return false
		return false;
	}
}

/**
 * Is Decimal
 *
 * Returns true if the variable is a number
 *
 * @name isDecimal
 * @access public
 * @param mixed m				The variable to test
 * @return bool
 */
export function isDecimal(m) {
	return typeof m == 'number';
}

/**
 * Is Integer
 *
 * Returns true if the variable is a true integer
 *
 * @name isInteger
 * @access public
 * @param mixed m				The variable to test
 * @return bool
 */
export function isInteger(m) {
	return m === +m && m === (m|0);
}

/**
 * Is Object
 *
 * Returns true if the variable is a true object
 *
 * @name isObject
 * @access public
 * @param mixed m				The variable to test
 * @return bool
 */
export function isObject(m) {
	if(m === null) return false;
	if(typeof m != 'object') return false;
	if(Array.isArray(m)) return false;
	return true;
}

/**
 * Is Today
 *
 * Returns true if the passed date corresponds to the current date
 *
 * @name isToday
 * @access public
 * @param Date|String|Number d A date object or a string/int that can be
 *                             converted to a Date
 * @return bool
 */
export function isToday(d) {

	// Today's date
	const oToday = new Date();

	// Convert if not a date
	if(typeof d === 'number') {
		d = new Date(d*1000);
	}
	else if(typeof d === 'string') {
		d = new Date(d);
	}

	// Compare date, month, and year
	return d.getDate() === oToday.getDate() &&
			d.getMonth() === oToday.getMonth() &&
			d.getFullYear() === oToday.getFullYear();
}

/**
 * Object Map
 *
 * Works like map for arrays, but iterates over an object
 *
 * @name omap
 * @access public
 * @param Object o				The object to map
 * @param Function callback		The function to call each iteration
 * @return Array
 */
export function omap(o, callback) {
	let ret = [];
	for(let k in o) {
		ret.push(callback(o[k], k));
	}
	return ret;
}

/**
 * Safe Local Storage
 *
 * Fetches a value from local storage or returns the default if no value is
 * found
 *
 * safeLocalStorage
 * @access public
 * @param String name			The name of the local var to fetch
 * @param String default_		The value to return if the var is not found
 * @return String
 */
export function safeLocalStorage(name, default_) {
	let value = localStorage.getItem(name);
	return value === null ? default_ : value;
}

/**
 * Safe Local Storage JSON
 *
 * Fetches a value from local storage or returns the default if no value is
 * found. Assumes data is stored in JSON
 *
 * safeLocalStorageJSON
 * @access public
 * @param String name			The name of the local var to fetch
 * @param String default_		The value to return if the var is not found
 * @return String
 */
export function safeLocalStorageJSON(name, default_) {
	let value = localStorage.getItem(name);
	return value === null ? default_ : JSON.parse(value);
}

/**
 * Sort By Key
 *
 * Returns a callback function that will compare two objects by the key name
 * pass
 *
 * @name sortByKey
 * @access public
 * @param string key The name of the key to sort by
 * @return Function
 */
export function sortByKey(key) {
	return (a, b) => {
		if(a[key] === b[key]) return 0;
		else return (a[key] < b[key]) ? -1 : 1;
	}
}

/**
 * UCFirst
 *
 * Makes the first character of each word in the text upper case
 *
 * @name ucfirst
 * @access public
 * @param String text			The text to convert
 * @return String
 */
export function ucfirst(text) {
	let lParts = text.split(' ');
	return lParts.map(s =>
		s.charAt(0).toUpperCase() + s.slice(1)
	).join(' ');
}

/**
 * UUID v4
 *
 * Returns a psuedo random string in UUID format (NOT ACTUALLY A UUID)
 *
 * @name uuidv4
 * @access public
 * @return str
 */
export function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		// eslint-disable-next-line
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}

// export module
export default {
	afindi: afindi,
	afindo: afindo,
	clone: clone,
	compare: compare,
	dateInc: dateInc,
	empty: empty,
	isDecimal: isDecimal,
	isInteger: isInteger,
	isObject: isObject,
	omap: omap,
	safeLocalStorage: safeLocalStorage,
	safeLocalStorageJSON: safeLocalStorageJSON,
	sortByKey: sortByKey,
	ucfirst: ucfirst,
	uuidv4: uuidv4
}
