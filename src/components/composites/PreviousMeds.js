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
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

// Element components
import Pharmacies from 'components/elements/Pharmacies';

// Shared data modules
import DoseSpot from 'shared/data/dosespot';

// Generic modules
import Events from 'shared/generic/events';

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
	let [meds, medsSet] = useState(0);

	// Refs
	let refPharmacy = useRef();

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
			if(error.code === 1602) {
				let sMsg = 'DoseSpot error: "' + error.msg + '"'
				Events.trigger('error', sMsg)
				medsSet(sMsg);
			} else {
				Events.trigger('error', JSON.stringify(error));
			}
		});
	}

	// Create the patient in DoseSpot
	function patientCreate() {

		// Get the default pharmacy
		let iPharmacy = refPharmacy.current.value;

		// If it's 0
		if(iPharmacy === 0) {
			Events.trigger('error', 'Please select a default pharmacy for the patient');
			return;
		}

		// Create the patient
		DoseSpot.create(props.customerId, iPharmacy).then(res => {
			Events.trigger('patientCreate', res);
		}, error => {
			if(error.code === 1602) {
				Events.trigger('error', 'DoseSpot error: "' + error.msg + '"');
			} else {
				Events.trigger('error', JSON.stringify(error));
			}
		});
	}

	// Inner HTML
	let inner = null;

	// If we have no patient ID
	if(!props.patientId) {
		inner = (
			<React.Fragment>
				<Typography>No DoseSpot patient account found. Create one and fetch previous medication?</Typography>
				<Pharmacies defaultValue={props.pharmacyId} ref={refPharmacy} />&nbsp;
				<Button color="primary" onClick={patientCreate} variant="contained">Create</Button>
			</React.Fragment>
		);
	}

	// Else, if we have a patient
	else {

		// Get the type of meds
		let sType = typeof meds;

		// Was there an error?
		if(sType === 'string') {
			inner = <Typography>{meds}</Typography>
		}

		else if(sType === 'number') {
			inner = <Typography>Loading...</Typography>
		}

		// Else, we have medications
		else {

			// If we got a result, but it's empty
			if(meds.length === 0) {
				inner = <Typography>None found</Typography>
			} else {
				inner = (
					<Grid container spacing={1}>
						{meds.map((o,i) =>
							<React.Fragment key={i}>
								<Grid item xs={12} sm={4}><Typography><strong>{o.DisplayName}</strong></Typography></Grid>
								<Grid item xs={12} sm={8}>
									<Typography>{o.LastFillDate.split('T')[0]} - {o.DaysSupply}</Typography>
									{o.PharmacyNotes &&
										<Typography>{o.PharmacyNotes}</Typography>
									}
								</Grid>
							</React.Fragment>
						)}
					</Grid>
				);
			}
		}
	}

	// Render
	return (
		<Box id="previousMeds" className="section">
			<Typography className="title">Previous Medications</Typography>
			{inner}
		</Box>
	);
}

// Valid props
PreviousMeds.propTypes = {
	customerId: PropTypes.string.isRequired,
	patientId: PropTypes.number.isRequired,
	pharmacyId: PropTypes.number
}
