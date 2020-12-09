/**
 * Event Hook
 *
 * Hook to capture and process a events
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-12-08
 */

// NPM modules
import { useEffect } from 'react';

// Generic modules
import Events from '../generic/events';

/**
 * Use Event
 *
 * Hook for attaching to events
 *
 * @name useEvent
 * @access public
 * @param String name The name of the event to track
 * @param Function callback The function to call on event trigger
 * @return void
 */
export const useEvent = (name, callback) => {

	// Create the effect
	useEffect(() => {

		// Attach to the event
		Events.add(name, callback);

		// Return a function to detach from the event
		return () => Events.remove(name, callback);
	}, [name, callback]);
}
