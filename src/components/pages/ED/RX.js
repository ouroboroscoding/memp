/**
 * ED RX
 *
 * Handles creating, fetching, selecting and entering prescriptions for the
 * patient based on an approved order
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-11-12
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';

// Element components
import { GreenButton } from '../../elements/Buttons';

// Data modules
import DoseSpot from '../../../data/dosespot';

// Generic modules
import Events from '../../../generic/events';
import { dateInc } from '../../../generic/tools';

/**
 * RX
 *
 * Displays a RX based on its current state
 *
 * @name RX
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function RX(props) {

	// State
	let [prescriptions, prescriptionsSet] = useState([]);
	let [sso, ssoSet] = useState(false);

	// Patient ID effect
	useEffect(() => {

		// If we have an ID
		if(props.patientId) {
			rxFetch();
		} else {
			prescriptionsSet([]);
		}

	// eslint-disable-next-line
	}, [props.patientId]);

	// Create the patient account with DoseSpot
	function patientCreate() {
		DoseSpot.create(props.customerId).then(res => {
			ssoFetch();
			Events.trigger('patientCreate', res);
		}, error => {
			Events.trigger('error', JSON.stringify(error));
		});
	}

	// Confirm the rx associated with each item
	function rxConfirm() {

	}

	// Get all prescriptions
	function rxFetch(fromClose = false) {
		DoseSpot.prescriptions(props.patientId).then(res => {

			console.log(res);

			// If there's none
			if(!res || !res.length) {

				// If we requested a re-fetch
				if(fromClose) {
					Events.trigger('error', 'No RX found, re-opening DoseSpot.');
				}

				// Fetch SSO
				ssoFetch();
				return;
			}

			// Set the state by filtering out inactive and expired rx
			res.filter(rx => {

				// If the status is invalid
				if([6,7,8].indexOf(rx.Status) > -1) {
					return false;
				}

				// If the medication status is invalid
				if([2,3,4].indexOf(rx.MedicationStatus) > -1) {
					return false;
				}

				// If it's expired
				let oDate = new Date(rx.EffectiveDate ? rx.EffectiveDate : rx.WrittenDate);
				if(oDate < dateInc(-365)) {
					return false;
				}

				// OK
				return true;
			});
		}, error => {
			Events.trigger('error', JSON.stringify(error));
		});
	}

	// Close the SSO iframe and fetch prescriptions
	function ssoClose() {
		ssoSet(false);
		rxFetch(true);
	}

	// Fetch the single sign-on link for DoseSpot
	function ssoFetch() {
		console.log('ssoFetch() called');
		DoseSpot.sso(props.patientId).then(res => {
			console.log('result:', res)
			ssoSet(res);
		}, error => {
			console.error('error:', error)
			Events.trigger('error', JSON.stringify(error));
		});
	}

	// Prescription options
	let lRxOptions = [];
	for(let o of prescriptions) {
		lRxOptions.push(
			<option value={o.PrescriptionId}>{o.DisplayName}</option>
		)
	}

	// Render
	return (
		<Box className="rxCurrent">
			{props.patientId ?
				<React.Fragment>
					{sso ?
						<Box className="sso">
							<iframe src={sso} />
							<Box className="close">
								<Button
									color="primary"
									onClick={ssoClose}
									variant="contained"
								>Close DoseSpot and reload RX</Button>
							</Box>
						</Box>
					:
						<Box className="matchUp">
							{props.order.items.map((o,i) =>
								<Box key={o.itemId} className="section">
									<Grid container spacing={1}>
										<Grid item xs={12} sm={6}>{o.description}</Grid>
										<Grid item xs={12} sm={6}>
											<Select
												className='select'
												defaultValue={prescriptions[i] && prescriptions[i].PrescriptionId || '0'}
												native
												variant="outlined"
											>{lRxOptions}</Select>
										</Grid>
										<hr />
									</Grid>
								</Box>
							)}
							<Grid container spacing={1}>
								<Grid item xs={6} className="left">
									<Button
										onClick={ssoFetch}
										variant="contained"
									>Open DoseSpot</Button>
								</Grid>
								<Grid item xs={6} className="right">
									<GreenButton
										onClick={rxConfirm}
										variant="contained"
									>Confirm</GreenButton>
								</Grid>
							</Grid>
						</Box>
					}
				</React.Fragment>
			:
				<Box className="create">
					<Box className="section">
						<Typography>No DoseSpot patient account found. Create one and open DoseSpot page?</Typography>
						<Button
							color="primary"
							onClick={patientCreate}
							variant="contained"
						>Create</Button>
					</Box>
				</Box>
			}
		</Box>
	)
}

// Valid props
RX.propTypes = {
	customerId: PropTypes.string.isRequired,
	order: PropTypes.object.isRequired,
	patientId: PropTypes.number.isRequired
}
