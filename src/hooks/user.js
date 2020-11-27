/**
 * User Events
 *
 * Hook to capture and process a user that has signed in or out
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-06-22
 */

// NPM modules
import { useEffect } from 'react';

// Generic modules
import Events from '../generic/events';

// Signed In Hook
export const useSignedIn = callback => {

	// Create the effect
	useEffect(() => {

		// Attach to the event
		Events.add('signedIn', callback);

		// Return the function to remove the event
		return () => Events.remove('signedIn', callback);
	}, [callback]);
}

// Signed out hook
export const useSignedOut = callback => {

	// Create the effect
	useEffect(() => {

		// Attach to the event
		Events.add('signedOut', callback);

		// Return the function to remove the event
		return () => Events.remove('signedOut', callback);
	}, [callback]);
}
