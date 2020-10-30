/**
 * Appointments
 *
 * Displays the provider's upcoming appointments
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-22
 */

// NPM modules
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import { isToday } from '../../generic/tools';

// Local modules
import Utils from '../../utils';

/**
 * Appointments
 *
 * List by day of appointments
 *
 * @name Appointments
 * @access public
 * @param Object props Attributes passed to the component
 * @returns React.Component
 */
export default function Appointments(props) {

	// State
	let [records, recordsSet] = useState([]);

	// Effects
	useEffect(() => {

		// If we have a user
		if(props.user) {
			fetch();
		} else {
			recordsSet([]);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]); // React to user changes

	// Fetch
	function fetch() {

		// Get the appointments from the server
		Rest.read('monolith', 'provider/calendly', {}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Sort into days, then store the appointments
				recordsSet(byDay(res.data));
			}
		});
	}

	// Store by day
	function byDay(l) {

		console.log(l);

		// Results
		let lReturn = [];

		// Current date
		let sDate = null;
		let lDates = null;

		// Go through each appointment found
		for(let o of l) {

			// Split the date/time into date and time
			let lDate = o.start.split(' ');

			console.log(lDate);

			// If the date doesn't match the previous one
			if((lDate[0] + 'T00:00:00') !== sDate) {

				console.log('date changed, was ' + sDate + ', is now ' + lDate[0] + 'T00:00:00');

				// If we have a list
				if(lDates) {
					lReturn.push([sDate, lDates]);
				}

				// Reset the list
				lDates = [];

				// Store the new date
				sDate = lDate[0] + 'T00:00:00';
			}

			// Add the item to the current list
			lDates.push(o);
		}

		// If we have a list
		if(lDates) {
			lReturn.push([sDate, lDates]);
		}

		console.log(lReturn);

		// Return the new list of lists
		return lReturn;
	}

	// Render
	return (
		<Box id="appointments" className="page">
			{records.map(l =>
				<Paper className="padded">
					<Typography variant="h4">{isToday(l[0]) ? 'Today' : Utils.niceDate(l[0])}</Typography>
					{l[1].map((o,i) =>
						<React.Fragment>
							{i !== 0 &&
								<hr />
							}
							<Grid container>
								<Grid item xs={3}>{o.pat_name}</Grid>
								<Grid item xs={3}>{o.event}</Grid>
								<Grid item xs={3}>{o.start.split(' ')[1]}</Grid>
								<Grid item xs={3}>{o.end.split(' ')[1]}</Grid>
							</Grid>
						</React.Fragment>
					)}
				</Paper>
			)}
		</Box>
	);
}
