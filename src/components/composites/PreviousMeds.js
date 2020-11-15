/**
 * Previous Medications
 *
 * Handles fetching and displaying a patients previous medications
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-11-09
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

// Data modules
import DoseSpot from '../../data/dosespot';

// Generic modules
import Events from '../../generic/events';

/**
 * PreviousMeds
 *
 * Displays patient medications
 *
 * @name PreviousMeds
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function PreviousMeds(props) {

	// State
	let [meds, medsSet] = useState([]);

	// Effects
	useEffect(() => {
		if(props.patientId) {
			fetch();
		} else {
			medsSet([]);
		}
	// eslint-disable-next-line
	}, [props.patientId]);

	// Fetch the meds
	function fetch() {
		DoseSpot.medications(props.patientId).then(res => {
			medsSet(res);
		}, error => {
			Events.trigger('error', JSON.stringify(error));
		});
	}

	// Create the patient in DoseSpot
	function patientCreate() {
		DoseSpot.create(props.customerId).then(res => {
			Events.trigger('patientCreate', res);
		}, error => {
			Events.trigger('error', JSON.stringify(error));
		});
	}

	// Render
	return (
		<Box id="previousMeds" className="section">
			<Typography className="title">Previous Medications</Typography>
			{props.patientId ?
				<React.Fragment>
					{meds.length === 0 ?
						<Typography>None found</Typography>
					:
						<Grid container spacing={1}>
							{meds.map((o,i) =>
								<React.Fragment key={i}>
									<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>{o.DisplayName}</strong></Typography></Grid>
									<Grid item xs={12} sm={8} md={9} lg={10}>
										<Typography>{o.LastFillDate.split('T')[0]} - {o.DaysSupply}</Typography>
										{o.PharmacyNotes &&
											<Typography>{o.PharmacyNotes}</Typography>
										}
									</Grid>
								</React.Fragment>
							)}
						</Grid>
					}
				</React.Fragment>
			:
				<React.Fragment>
					<Typography>No DoseSpot patient account found. Create one and fetch previous medication?</Typography>
					<Button
						color="primary"
						onClick={patientCreate}
						variant="contained"
					>Create</Button>
				</React.Fragment>
			}
		</Box>
	);
}

// Valid props
PreviousMeds.propTypes = {
	customerId: PropTypes.string.isRequired,
	patientId: PropTypes.number.isRequired
}
