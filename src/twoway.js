/**
 * Two Way
 *
 * Allows clients to connect to the backend via websocket so events can be
 * tracked in real time
 *
 * @author Chris Nasr
 * @copyright OuroborosCoding
 * @created 2019-03-29
 */

// Generic modules
import Events from './generic/events.js';
import Rest from './generic/rest.js';
import Tools from './generic/tools.js';
import WSHelper from './generic/websocket.js';

// The ping timer
let __ping = null;

// The valid close flag
let __close = true;

// The websocket
let __socket = null;

/**
 * The service callbacks
 *
 * will contain a string for the service / key with callbacks for those keys,
 * e.g. {
 *	"service1": {
 *		"key1": [function1, function2],
 *		"key2": [function3]
 *	},
 *	"service2": {
 *		"key3": [function4]
 *	}
 * }
 */
let __services = {};

/**
 * Add Track
 *
 * Adds tracking for a specific service key
 *
 * @name _addTrack
 * @access private
 * @param String service The name of the service the key is associated with
 * @param String key The key to track
 * @param Function callback The callback for any messages of the key value
 * @return void
 */
function _addTrack(service, key, callback) {

	// If we don't have the service, add it
	if(!(service in __services)) {
		__services[service] = {}
	}

	// If we don't have the key for the given service, add the list with
	//	the callback
	if(!(key in __services[service])) {
		__services[service][key] = [callback]
	}

	// Else, add the callback, to the given service/key
	else {
		__services[service][key].push(callback);
	}
}

/**
 * Handle Close
 *
 * Checks if it's a legitimate closed socket, or if we need to reconnect to
 * everything
 *
 * @name _handleClose
 * @return void
 */
function _handleClose() {

	// If we have a ping interval
	if(__ping) {
		clearInterval(__ping);
	}

	// If it's a valid close
	if(__close) {
		__socket = null;
	}

	// Else, wait 5 seconds, and reopen the socket
	else {
		__close = true;
		setTimeout(_openSocket, 5000);
	}
}

/**
 * Handle Messages
 *
 * Recieves messages from websockets and directs the data to the appropriate
 * callback
 *
 * @name _handleMessage
 * @access private
 * @param WebSocket sock The socket the message came on
 * @param MessageEvent ev The event message received
 * @return void
 */
function _handleMessage(sock, ev) {

	function stupidBlobs(msg) {

		// If we got an error
		if(msg.error) {
			Events.trigger('error', 'Websocket failed: ' + msg.error.msg + ' (' + msg.error.code + ')');
			return;
		}

		// If we have the service
		if(msg.service in __services) {

			// If we have the key
			if(msg.key in __services[msg.service]) {

				// Call each callback
				for(let f of __services[msg.service][msg.key]) {
					f(msg.data);
				}
			}
		}
	}

	// If we got a string back
	if(typeof ev.data === 'string') {

		console.log(ev.data);

		// If we're authorized
		if(ev.data === 'authorized') {

			// Reset the close flag
			__close = false;
			return;
		}

		// If it's pong
		if(ev.data === 'pong') {
			return;
		}

		// Convert it to JSON
		stupidBlobs(JSON.parse(ev.data));
	}

	// Else we got a blob
	else {

		// Screw you javascript
		let r = new FileReader();
		r.addEventListener("loadend", function() {

			console.log(r.result);

			// Parse the data
			let oMsg = JSON.parse(r.result);

			// Handle it
			stupidBlobs(oMsg);
		});
		r.readAsText(ev.data);
	}
}

/**
 * Open Socket
 *
 * Opens a new websocket by first sending a message to webpoll to start the
 * authentication handshake, then making the connection, and finally sending
 * all the track messages stored
 *
 * @name _openSocket
 * @access private
 * @return void
 */
function _openSocket() {

	// Notify the backend of a new ws connection
	Rest.read('webpoll', 'websocket', {}).done(res => {

		// Create the websocket
		__socket = WSHelper('wss://' + process.env.REACT_APP_MEMS_DOMAIN + '/ws', {
			open: function(sock) {

				// Init the message list
				let lMsgs = [];

				// Add the connect message
				lMsgs.push({
					_type: 'connect',
					key: res.data
				});

				// Add each track message
				for(let s in __services) {
					for(let k in __services[s]) {
						lMsgs.push({
							_type: 'track',
							service: s,
							key: k
						});
					}
				}

				// Send the messages
				sock.send(JSON.stringify(lMsgs))
			},
			message: _handleMessage,
			close: _handleClose
		});

		// If we got false
		if(__socket === false) {
			Events.trigger('error', 'Websockets not supported');
			return;
		}

		// If we haven't already setup the ping interval
		if(__ping === null) {
			__ping = setInterval(_ping, 300000);
		}
	});
}

/**
 * Ping
 *
 * Send a ping to keep the socket alive
 *
 * @name _ping
 * @access private
 * @return void
 */
function _ping() {

	// Send a ping message over the socket to keep it alive
	__socket.send(JSON.stringify({
		_type: 'ping'
	}));
}

/**
 * Track
 *
 * Takes a URL and an event type and a) opens a new websocket or uses an
 * existing one, then b) sends a tracking message through the websocket so the
 * backend knowsn to send the key type to us
 *
 * @name track
 * @access public
 * @param String service The name of the service the key is associated with
 * @param String key The key to track
 * @param Function callback The callback for any messages of the key value
 * @return void
 */
export function track(service, key, callback) {

	// Add the tracking callback
	_addTrack(service, key, callback);

	// If we have no socket
	if(!__socket) {

		// If it's null
		if(__socket === null) {

			// Set socket to false so we don't try to re-open
			__socket = false;

			// Open a new one
			_openSocket();
		}
	}

	// Else if it's open
	else if(__socket.readyState === 1) {

		// Send the tracking message through the websocket
		__socket.send(JSON.stringify({
			_type: 'track',
			service: service,
			key: key
		}));
	}

	// If we have no socket, or it's opening, then upon opening all services/
	//	keys in the tracking list will be sent as messages
}

/**
 * Untrack
 *
 * Removes a callback and notifies the websocket we are not tracking anymore
 *
 * @name _untrack
 * @access public
 * @param String service The name of the service the key is associated with
 * @param String key The key to untrack
 * @param Function callback The callback associated with the track
 * @return bool
 */
export function untrack(service, key, callback) {

	// If we have the service
	if(service in __services) {

		// If we have the key
		if(key in __services[service]) {

			// Go through each callback
			for(let i = 0; i < __services[service][key].length; ++i) {

				// If the callback matches
				if(callback === __services[service][key][i]) {

					// Remove the callback
					__services[service][key].splice(i, 1);

					// If we have no more callbacks
					if(__services[service][key].length === 0) {

						// Notify the websocket we aren't tracking the key
						//	anymore
						__socket.send(JSON.stringify({
							"_type": "untrack",
							"service": service,
							"key": key
						}));

						// Remove the key
						delete __services[service][key];

						// If we have no more keys in the service
						if(Tools.empty(__services[service])) {

							// Remove the service
							delete __services[service];

							// If there's no more services
							if(Tools.empty(__services)) {

								// Turn off the ping interval
								clearInterval(__ping);
								__ping = null;

								// Close the socket
								__close = true;
								__socket.close(1000, 'nothing else to track');
							}
						}
					}

					// Callback found and removed
					return true;
				}
			}
		}
	}

	// Callback not found
	return false;
}

// export the module
export default {
	track: track,
	untrack: untrack
}
