/**
 * Claimed Events
 *
 * Hook to capture and process a claimed records
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-06-22
 */

// NPM modules
import { useEffect } from 'react';

// Shared generic modules
import Events from 'shared/generic/events';

// Claimed Add Hook
export const useClaimedAdd = callback => {

	// Create the effect
	useEffect(() => {

		// Attach to the event
		Events.add('claimedAdd', callback);

		// Return the function to remove the event
		return () => Events.remove('claimedAdd', callback);
	}, [callback]);
}

// Claimed Remove Hook
export const useClaimedRemove = callback => {

	// Create the effect
	useEffect(() => {

		// Attach to the event
		Events.add('claimedRemove', callback);

		// Return the function to remove the event
		return () => Events.remove('claimedRemove', callback);
	}, [callback]);
}
