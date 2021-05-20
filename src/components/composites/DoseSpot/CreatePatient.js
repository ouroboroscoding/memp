/**
 * Create Patient
 *
 * Handles displaying the form to create a new DoseSpot account for a customer
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-01-13
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useRef } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

// Composites components
import Pharmacies from 'components/elements/Pharmacies';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared data modules
import DS from 'shared/data/dosespot';

// Shared generic modules
import Events from 'shared/generic/events';

/**
 * Create
 *
 * Displayed when there's no patient ID for the customer
 *
 * @name Create
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Create(props) {

	// Refs
	let refPharmacy = useRef();

	// Create the patient account with DoseSpot
	function patientCreate() {

		// Get the default pharmacy
		let iPharmacy = refPharmacy.current.value;

		// If it's 0
		if(iPharmacy === 0) {
			Events.trigger('error', 'Please select a default pharmacy for the patient');
			return;
		}

		// Create the patient
		DS.create(props.customerId, iPharmacy).then(res => {
			props.onCreated(res);
		}, error => {
			if(error.code === 1602) {
				Events.trigger('error', 'DoseSpot error: "' + error.msg + '"')
			} else {
				Events.trigger('error', Rest.errorMessage(error));
			}
		});
	}

	// If we can't remove
	let iGrid = (props.onRemove) ? 6 : 12

	// Render
	return (
		<Box className="create">
			<Box className="section">
				<Typography>No DoseSpot patient account found. Create one?</Typography>
				<Pharmacies defaultValue={56387} ref={refPharmacy} />&nbsp;
				<Button
					color="primary"
					onClick={patientCreate}
					variant="contained"
				>Create</Button>
			</Box>
			<Grid container spacing={1} className="actions">
				{props.onRemove &&
					<Grid item xs={iGrid}>
						<Button
							color="secondary"
							onClick={props.onRemove}
							variant="contained"
						>Remove Claim</Button>
					</Grid>
				}
				<Grid item xs={iGrid}>
					<Button
						onClick={props.onTransfer}
						variant="contained"
					>Transfer</Button>
				</Grid>
			</Grid>
		</Box>
	);
}

// Valid props
Create.propTypes = {
	customerId: PropTypes.number.isRequired,
	onCreated: PropTypes.func.isRequired,
	onRemove: PropTypes.func.isRequired,
	onTransfer: PropTypes.func.isRequired
}
