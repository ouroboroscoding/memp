/**
 * Encounters
 *
 * Fetch and return encounter type
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-12-11
 */

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

// Encounter types
const _ENCOUNTER = {
	A:  'Audio',
	AS: 'Asynchronous',
	NA: 'Not Available',
	V:  'Video'
}

/**
 * Fetch
 *
 * Sends a request to get the encounter type by state
 *
 * @name fetch
 * @public
 * @return Promise
 */
export function fetch(state) {

	// Return promise
	return new Promise((resolve, reject) => {

		// Request the encounter type from the server
		Rest.read('monolith', 'encounter', {
			state: state
		}, {background: true, session: false}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				reject(res.error);
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if(res.data) {
				resolve(_ENCOUNTER[res.data]);
			}
		});
	});
}

// Default export
const Encounters = {
	fetch: fetch
}
export default Encounters;
