/**
 * Cookies
 *
 * JS Library to deal with Cookies
 *
 * @author Chris Nasr
 * @copyright OuroborosCoding
 * @created 2018-11-24
 */

/**
 * Get
 *
 * Gets a cookie or returns the default. Set no name to get all
 *
 * @name get
 * @access public
 * @param str name				The name of the cookie to fetch
 * @param str default_			The default value to return if no cookie is found
 * @return str|null
 */
function get(name, default_) {

	// Set the default if no value is passed
	if(typeof default_ == 'undefined') {
		default_ = null;
	}

	// Parse all cookies
	let oCookies = {}
	let lCookies = document.cookie.split(';')
	for(let i = 0; i < lCookies.length; ++i) {
		let l = lCookies[i].split('=');
		oCookies[l[0]] = decodeURIComponent(l[1]);
	}

	// If there's no name, return all
	if(typeof name == 'undefined') {
		return oCookies;
	}

	// If the cookie exists return it, else return the default
	return (name in oCookies) ? oCookies[name] : default_;
}

/**
 * Remove
 *
 * Deletes a cookie
 *
 * @name remove
 * @access public
 * @param str name				The name of the cookie to delete
 * @return void
 */
function remove(name, domain, path) {
	this.set(name, '', -1, domain, path);
}

/**
 * Set
 *
 * Sets a cookie
 *
 * @name set
 * @access public
 * @param str name				The name of the cookie
 * @param str value				The value to store
 * @param int expires			The number of seconds before the cookie expires
 * @param str domain			The optional domain to set the cookie on
 * @param str path				The optional path of the cookie
 * @return null
 */
function set(name, value, expires, domain, path) {

	// Generate the expires time
	let d = new Date();
	d.setTime(d.getTime() + (expires*1000))

	// Generate the cookie string
	let s = name + '=' + encodeURIComponent(value) +
			'; expires=' + d.toGMTString() + ';';
	if(domain) {
		s += ' domain=' + domain + ';';
	}
	if(path) {
		s += ' path=' + path + ';';
	}

	// Set the cookie
	document.cookie = s;
}

// export module
export default {
	get: get,
	remove: remove,
	set: set
}
