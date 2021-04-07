/**
 * Rest Init
 *
 * Handles initialising Rest communication for the entire app
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-04-07
 */

// Local modules
import ActivityWatch from 'activityWatch';

// Components
import { LoaderHide, LoaderShow } from 'components/Loader';

// Data modules
import { add as request } from 'data/requests';

// Error codes/messages
import errors from 'definitions/errors';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

// Init the rest services
Rest.init(process.env.REACT_APP_MEMS_DOMAIN, {

	// Called after a request returns, error or not
	after: (method, url, data, opts) => {

		// If the request is not a background one
		if(!opts.background) {
			LoaderHide();
		}
	},

	// Called before a request is sent out
	before: (method, url, data, opts) => {

		// Track the request (if it's not itself a request track)
		if(opts.session && url.slice(url.length - 18) !== '/providers/request') {
			request(method, url, data, opts);
		}

		// If the request is not a background one
		if(!opts.background) {
			ActivityWatch.reset();
			LoaderShow();
		}
	},

	cookie: process.env.REACT_APP_WS_DOMAIN,

	// Called after a request flat out fails
	error: xhr => {

		// If we got a 401, let everyone know we signed out
		if(xhr.status === 401) {
			Events.trigger('error', 'You have been signed out!');
			Events.trigger('signedOut');
		} else {
			Events.trigger('error',
				'Unable to connect to ' + process.env.REACT_APP_MEMS_DOMAIN +
				': ' + xhr.statusText +
				' (' + xhr.status + ')');
		}
	},

	// Error codes
	errors: errors,

	// Called after a request is successful from an HTTP standpoint
	success: res => {

		// Set the default value of the handled flag
		res._handled = false;

		// If we got an error
		if(res.error) {

			// What error is it?
			switch(res.error.code) {

				// No Session
				case 102:

					// Trigger signout
					Events.trigger("signout");
					res._handled = true;
					break;

				case 207:

					// Notify the user
					Events.trigger('error', 'Request to ' + res.error.msg + ' failed. Please contact support');
					res._handled = true;
					break;

				// Insufficient rights
				case 1000:

					// Notify the user
					Events.trigger('error', 'You lack the necessary rights to do the requested action');
					res._handled = true;
					break;

				// Invalid fields
				case 1001:

					// Rebuild the error message
					res.error.msg = Rest.toTree(res.error.msg);
					break;

				// no default
			}
		}
	}
});

// If we have a session, fetch the user
if(Rest.session()) {
	Rest.read('providers', 'session', {}).done(res => {
		if(res.error) {
			Rest.session(null);
		} else {
			let iAgent = res.data.user.agent;
			Rest.read('monolith', 'user', {}).done(res => {
				res.data.agent = iAgent;
				Events.trigger('signedIn', res.data);
			});
		}
	});
}

// Hide the loader
LoaderHide();
