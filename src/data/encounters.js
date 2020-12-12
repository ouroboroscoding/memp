/**
 * Encounters
 *
 * Fetch and return encounter type
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-12-11
 */

// Generic modules
import Events from '../generic/events';
import Rest from '../generic/rest';

// Local modules
import Utils from '../utils';

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
			if(res.error && !Utils.restError(res.error)) {
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

// Export all
export default {
	fetch: fetch
}
