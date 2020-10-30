/**
 * Resize Events
 *
 * Hook to capture the screen resizing
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-08-17
 */

// NPM modules
import { useEffect } from 'react';

// Resize hook
export const useResize = callback => {

	// Create the effect
	useEffect(() => {

		// Attach to the event
		window.addEventListener("resize", callback);

		// Return the function to remove the event
		return () => window.removeEventListener("resize", callback);
	}, [callback]);
}
