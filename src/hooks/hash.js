/**
 * Hash Events
 *
 * Hook to capture and process hash value changes
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-07-15
 */

// NPM modules
import { useEffect } from 'react';

// Generic modules
import Hash from '../generic/hash';

// Signed In Hook
export default (field, callback) => {

	// Create the effect
	useEffect(() => {

		// Attach to the event
		Hash.watch(field, callback);

		// Return the function to remove the event
		return () => Hash.unwatch(field, callback);
	}, [field, callback]);
}
