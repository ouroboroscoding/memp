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
import Claimed from '../../../data/claimed';
import DoseSpot from '../../../data/dosespot';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';
import { afindi, dateInc } from '../../../generic/tools';

// Site modules
import Utils from '../../../utils';

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
	let [matches, matchesSet] = useState({})
	let [prescriptions, prescriptionsSet] = useState([]);
	let [sso, ssoSet] = useState(false);

	// Refs
	let refItems = useRef(props.order.items.reduce((r,o) => ({...r, [o.itemId]: React.createRef()}), {}));

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

	// Component load effect
	useEffect(() => {
		matchesFetch();
	// eslint-disable-next-line
	}, []);

	// Fetch matches of order items to
	function matchesFetch() {
		Rest.read('providers', 'order/to/rx', {
			order_id: props.order.orderId
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if(res.data) {

				// Map the rx IDs to the item IDs
				let oMatches = {}
				for(let o of res.data) {
					oMatches[o.item_id] = o.ds_id;
				}

				// Set the new state
				matchesSet(oMatches);
			}
		});
	}

	// Create the patient account with DoseSpot
	function patientCreate() {
		DoseSpot.create(props.customerId).then(res => {
			ssoFetch(res);
			Events.trigger('patientCreate', res);
		}, error => {
			if(error.code === 1602) {
				Events.trigger('error', 'DoseSpot error: "' + error.msg + '"')
			} else {
				Events.trigger('error', JSON.stringify(error));
			}
		});
	}

	// Confirm the rx associated with each item
	function rxConfirm() {

		// If the number of items matches the set rxs, we're already done here
		if(props.order.items.length === Object.keys(matches).length) {
			Claimed.remove(props.customerId, 'approve').then(res => {
				Events.trigger('claimedRemove', props.customerId, true);
			}, error => {
				Events.trigger('error', JSON.stringify(error));
			});
			return;
		}

		// Init the list we will send to the server
		let lItems = [];

		// Keep track of prescriptions already used
		let lUsed = [];

		// Go through each item and get the value of the select
		for(let o of props.order.items) {

			// If there's no ref, skip it
			if(!(o.itemId in refItems.current)) {
				continue;
			}

			// Get the rx ID
			let iDsID = refItems.current[o.itemId].current.value;

			// If we already have it
			if(lUsed.includes(iDsID)) {
				Events.trigger('error', 'Same prescription used multiple times!');
				return;
			}

			// Mark it as used
			lUsed.push(iDsID);

			// Generate and add on the record to be sent
			lItems.push({item_id: o.itemId, ds_id: iDsID});
		}

		// No issues? Send it to the server
		Rest.create('providers', 'order/to/rx', {
			order_id: props.order.orderId,
			items: lItems
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if(res.data) {

				// We can successfully close this claim
				Claimed.remove(props.customerId, 'approve').then(res => {
					Events.trigger('claimedRemove', props.customerId, true);
				}, error => {
					Events.trigger('error', JSON.stringify(error));
				});
			}
		});
	}

	// Get all prescriptions
	function rxFetch(fromClose = false) {
		DoseSpot.prescriptions(props.patientId).then(res => {

			// Filter the data
			let lRX = rxFilter(res);

			// If there's none
			if(lRX.length === 0) {

				// If we requested a re-fetch
				if(fromClose) {
					Events.trigger('error', 'No RX found, re-opening DoseSpot.');
				}

				// Fetch SSO
				ssoFetch();
				return;
			}

			// Set the state
			prescriptionsSet(lRX);

		}, error => {
			if(error.code === 1602) {
				Events.trigger('error', 'DoseSpot error: "' + error.msg + '"')
			} else {
				Events.trigger('error', JSON.stringify(error));
			}
		});
	}

	// Filter out expired and inactive prescriptions
	function rxFilter(items) {
		return items.filter(rx => {

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
	}

	// Close the SSO iframe and fetch prescriptions
	function ssoClose() {
		ssoSet(false);
		rxFetch(true);
	}

	// Fetch the single sign-on link for DoseSpot
	function ssoFetch(patient_id=null) {
		if(!patient_id) {
			patient_id = props.patientId;
		}
		DoseSpot.sso(patient_id).then(res => {
			ssoSet(res);
		}, error => {
			if(error.code === 1602) {
				Events.trigger('error', 'DoseSpot error: "' + error.msg + '"')
			} else {
				Events.trigger('error', JSON.stringify(error));
			}
		});
	}

	// Prescription options
	let lRxOptions = [];
	for(let o of prescriptions) {
		lRxOptions.push(
			<option key={o.PrescriptionId} value={o.PrescriptionId}>{Utils.niceDate(o.WrittenDate, props.mobile ? 'short' : 'long')} - {o.DisplayName}</option>
		)
	}

	// Render
	return (
		<Box className="rxCurrent">
			{props.patientId ?
				<React.Fragment>
					{sso ?
						<Box className="sso">
							<iframe title={"DoseSpot SSO - " + props.patientId} src={sso} />
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
							{props.order.items.map((o,i) => {

								// Figure out if we need a select or to just
								//	display the rx
								let mItem = null;
								let iIndex = null;
								if(o.itemId in matches && (iIndex = afindi(prescriptions, 'PrescriptionId', matches[o.itemId])) > -1) {
									mItem = Utils.niceDate(prescriptions[iIndex].WrittenDate, props.mobile ? 'short' : 'long') + ' - ' + prescriptions[iIndex].DisplayName;
								} else {
									mItem = (
										<Select
											className='select'
											defaultValue={prescriptions[i] ? prescriptions[i].PrescriptionId : '0'}
											inputProps={{
												ref: refItems.current[o.itemId]
											}}
											native
											variant="outlined"
										>{lRxOptions}</Select>
									);
								}

								return (
									<Box key={o.itemId} className="section">
										<Grid container spacing={1}>
											<Grid item xs={12} sm={6}>{o.description}</Grid>
											<Grid item xs={12} sm={6}>{mItem}</Grid>
										</Grid>
									</Box>
								);
							})}
							<Grid container spacing={1}>
								<Grid item xs={6} className="left">
									<Button
										onClick={() => ssoFetch()}
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
	mobile: PropTypes.bool.isRequired,
	order: PropTypes.object.isRequired,
	patientId: PropTypes.number.isRequired
}
