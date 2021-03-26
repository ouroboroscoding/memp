/**
 * Requests
 *
 * Track every request for debugging
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-03-25
 */

// Shared communication modules
import Rest from 'shared/communication/rest';

/**
 * Add
 *
 * Sends request data to be logged
 *
 * @name add
 * @public
 * @param String method The method used for the request
 * @param String url The url requested
 * @param Object data The data sent with the request
 * @param Object opts The options in the request
 * @return void
 */
export function add(method, url, data, opts) {

	// Send the data to the server
	Rest.create('providers', 'request', {
		method: method,
		url: url,
		data: JSON.stringify(data),
		opts: JSON.stringify(opts)
	}, {background: true}).done(res => {
		if(res.error) {
			console.error(res.error);
		}
	});
}
