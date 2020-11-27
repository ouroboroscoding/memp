/**
 * Websocket
 *
 * Simplifies using a websocket
 *
 * @author Chris Nasr <ouroboroscode@gmail.com>
 * @copyright OuroborosCoding
 * @created 2017-05-17
 */

// Export the function
export default function(url, conf) {

	// If we can't handle websockets
	if(!('WebSocket' in window)) {
		console.error('websocket: WebSockets not supported');
		return false;
	}

	// If conf is not defined
	if(typeof conf == 'undefined') {
		conf = {}
	}

	// Else, if it's not an object, we have a problem
	else if(typeof conf != 'object') {
		console.error('websocket: second argument must be an object');
		return false;
	}

	// Create the WebSocket
	let oSock = new WebSocket(url);

	// Set the open callback
	oSock.onopen = function() {

		// If an open callback is set
		if('open' in conf) {
			conf['open'](oSock);
		}

		// Else, just log the event
		else {
			console.log('websocket: opened');
		}
	}

	// Set the message callback
	oSock.onmessage	= function(ev) {

		// If a message callback is set
		if('message' in conf) {
			conf['message'](oSock, ev);
		}

		// Else, just log the event
		else {
			console.log('websocket: message received, "' + ev.data + '"');
		}
	}

	// Set the error callback
	oSock.onerror = function(ev) {

		// If an error callback is set
		if('error' in conf) {
			conf['error'](oSock, ev);
		}

		// Else, just log the event
		else {
			console.log('websocket: error, "' + JSON.stringify(ev) + '"');
		}
	}

	// Set the close callback
	oSock.onclose = function() {

		// If a close callback is set
		if('close' in conf) {
			conf['close'](oSock);
		}

		// Else, just log the event
		else {
			console.log('websocket: closed');
		}
	}

	// Return the socket
	return oSock;
}
