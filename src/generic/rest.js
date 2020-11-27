/**
 * Rest
 *
 * Handles connecting to and retrieving data from rest services
 *
 * @author Chris Nasr <ouroboroscode@gmail.com>
 * @copyright OuroborosCoding
 * @created 2018-11-24
 */

// External modules
import $ from '../3rd/jquery.ajax';

// Generic modules
import Cookies from './cookies.js';

// Rest services domain
let _domain = '';

// Default error function
let _error = function() {}

// Before/After callbacks
let _before = null;
let _after = null

/**
 * Clear
 *
 * Clears the session from local storage and cookies
 *
 * @name clear
 * access private
 * @return void
 */
function clear() {

	// Delete from localStorage
	delete localStorage['_session'];

	// Delete the cookie
	Cookies.remove('_session', window.location.hostname, '/');
}

/**
 * Request
 *
 * Handles actual requests
 *
 * @name request
 * @access private
 * @param string method			The method used to send the request
 * @param string url			The full URL to the service/noun
 * @param object data			The data to send to the service
 * @param bool session			Send the session if one exists
 * @return xhr
 */
function request(method, url, data, session) {

	// If we have a before callback
	if(_before) {
		_before(method, url, data);
	}

	// Generate the ajax config
	let oConfig = {

		// Check requests before sending
		"beforeSend": function(xhr, settings) {

			// Add the URL to the request so that on error what failed
			xhr._url = url;

			// If we have a session, add the authorization token
			if(session && '_session' in localStorage) {
				xhr.setRequestHeader('Authorization', localStorage['_session']);
			}
		},

		// Looking for JSON responses
		"contentType": "application/json; charset=utf-8",

		"complete": function(res) {

			// If we have an after callback
			if(_after) {
				_after(method, url, data);
			}
		},

		// On error
		"error": function(xhr, status, error) {

			// If we got an Authorization error
			if(xhr.status === 401) {

				// Clear the current token
				clear();
			}

			// Put the error in the console
			console.error(method + ' ' + xhr._url + ' returned: ' + error);

			// Return the xhr to the error callback
			_error(xhr);
		},

		// Set the method
		"method": method,

		// Set the requested URL
		"url": url
	}

	// If it's a get request
	if(method === 'get') {

		// And data was passed, add it as a param
		if(typeof data !== 'undefined') {
			oConfig['data'] = "d=" + encodeURIComponent(JSON.stringify(data));
		}
	}

	// Else it's any other method, stringify the data
	else {
		oConfig.data = JSON.stringify(data);
	}

	// Make the request and return the xhr
	return $.ajax(oConfig);
}

/**
 * Store
 *
 * Stores the session token in local storage and cookies
 *
 * @name store
 * @access private
 * @param string token
 * @return void
 */
function store(token) {

	// Set the session in localStorage
	localStorage['_session'] = token

	// Set the session in a cookie
	Cookies.set('_session', token, 86400, window.location.hostname, '/');
}

/**
 * Init
 *
 * Initialises the modules
 *
 * @name init
 * @access public
 * @param string domain		The domain rest services can be reached through
 * @param function error	Callback for when http errors occur
 * @param function before	Optional callback to run before any request
 * @param function after	Optional callback to run after any request
 * @return void
 */
function init(domain, error=null, before=null, after=null) {

	// Store the domain
	_domain = 'https://' + domain + '/';

	// Do we have a session in storage
	if('_session' in localStorage && localStorage['_session']) {
		this.session(localStorage['_session'])
	}

	// Else do we have one in a cookie
	else {
		let cookie = Cookies.get('_session');
		if(cookie) {
			this.session(cookie);
		}
	}

	// If an error was passed
	if(typeof error !== 'undefined') {
		_error = error;
	}

	// Store before/after
	if(typeof before === 'function') {
		_before = before;
	} else {
		console.error('Rest.init before param must be a function');
	}
	if(typeof after === 'function') {
		_after = after;
	} else {
		console.error('Rest.init after param must be a function');
	}
}

/**
 * Create
 *
 * Calls the create action on a specific service noune
 *
 * @name create
 * @access public
 * @param string service		The name of the service to call
 * @param string noun			The noun to call on the service
 * @param object data			The data to send to the service
 * @param bool session			Send the session if one exists
 * @return xhr
 */
function create(service, noun, data, session=true) {
	return request('post', _domain + service + '/' + noun, data, session);
}

/**
 * Delete
 *
 * Calls the delete action on a specific service noune
 *
 * @name delete_
 * @access public
 * @param string service		The name of the service to call
 * @param string noun			The noun to call on the service
 * @param object data			The data to send to the service
 * @param bool session			Send the session if one exists
 * @return xhr
 */
function delete_(service, noun, data, session=true) {
	return request('delete', _domain + service + '/' + noun, data, session);
}

/**
 * Read
 *
 * Calls the read action on a specific service noune
 *
 * @name read
 * @access public
 * @param string service		The name of the service to call
 * @param string noun			The noun to call on the service
 * @param object data			The data to send to the service
 * @param bool session			Send the session if one exists
 * @return xhr
 */
function read(service, noun, data, session=true) {
	return request('get', _domain + service + '/' + noun, data, session);
}

/**
 * Session
 *
 * Set or get the session token
 *
 * @name session
 * @access public
 * @param string token			The token to store
 * @return void|str
 */
function session(token) {

	// If we are setting the session
	if(typeof token !== 'undefined') {

		// If null was passed, delete the session
		if(token == null) {
			clear();
		}

		// Else, set the session
		else {
			store(token);
		}
	}

	// Else we are returning the session
	else {
		return ('_session' in localStorage) ?
			localStorage['_session'] :
			'';
	}
}

/**
 * Update
 *
 * Calls the update action on a specific service noune
 *
 * @name update
 * @access public
 * @param string service		The name of the service to call
 * @param string noun			The noun to call on the service
 * @param object data			The data to send to the service
 * @param bool session			Send the session if one exists
 * @return xhr
 */
function update(service, noun, data, session=true) {
	return request('put', _domain + service + '/' + noun, data, session);
}

// export module
export default {
	init: init,
	create: create,
	delete: delete_,
	read: read,
	session: session,
	update: update
}
