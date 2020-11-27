/**
 * TwoWay hook
 *
 * Hook to track two way (websocket) events
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-09-14
 */

// NPM modules
import { useEffect } from 'react';

// Generic modules
import TwoWay from '../twoway';

// Event Hook
export const useTwoWay = (service, key, callback) => {

	// Create the effect
	useEffect(() => {

		// Attach to the event
		TwoWay.track(service, key, callback);

		// Return the function to remove the event
		return () => TwoWay.untrack(service, key, callback);
	}, [service, key, callback]);
}
