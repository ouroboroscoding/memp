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

// Compisite components
import Transfer from './Transfer';

// Element components
import { GreenButton } from '../elements/Buttons';
import Pharmacies from '../elements/Pharmacies';

// Data modules
import Claimed from '../../data/claimed';
import DoseSpot from '../../data/dosespot';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
import { afindi, clone, dateInc } from '../../generic/tools';

// Site modules
import Utils from '../../utils';

/**
 * DS
 *
 * Displays DoseSpot info
 *
 * @name DS
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function DS(props) {

	// State
	let [matches, matchesSet] = useState({})
	let [prescriptions, prescriptionsSet] = useState([]);
	let [transfer, transferSet] = useState(false);
	let [selects, selectsSet] = useState([]);
	let [sso, ssoSet] = useState(false);

	// Refs
	let refItems = useRef(props.customer.items.reduce((r,o) => ({...r, [o.productId]: React.createRef()}), {}));
	let refPharmacy = useRef();

	// Patient ID effect
	useEffect(() => {

		// If we have an ID
		if(props.patientId) {
			if(props.start === 'sso') {
				ssoFetch();
			} else if(props.start === 'matches') {
				rxFetch();
			}

		} else {
			ssoSet(false);
			prescriptionsSet([]);
		}

	// eslint-disable-next-line
	}, [props.patientId]);

	// Matches or Prescriptions effect
	useEffect(() => {
		selectsSet(
			processSelects(
				matches,
				prescriptions
			)
		);
	// eslint-disable-next-line
	}, [matches, prescriptions]);

	// Component load effect
	useEffect(() => {
		matchesFetch();
	// eslint-disable-next-line
	}, []);

	// Remove the claim
	function customerTransfer() {
		transferSet(false);

		Claimed.remove(props.customer.customerId, 'transferred').then(res => {
			Events.trigger('claimedRemove', parseInt(props.customerId, 10), true);
		}, error => {
			Events.trigger('error', JSON.stringify(error));
		});
	}

	// Fetch matches of customer products to prescription IDs
	function matchesFetch() {
		Rest.read('providers', 'customer/to/rx', {
			customer_id: props.customer.customerId
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
					oMatches[o.product_id] = o.ds_id;
				}

				// Set the new state
				matchesSet(oMatches);
			}
		});
	}

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
		DoseSpot.create(props.customer.customerId, iPharmacy).then(res => {
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

	// Go through each product and match up the select values
	function processSelects(m, p) {

		// Init the return list
		let dRet = {}

		// Copy the list of items
		let lItems = clone(props.customer.items);

		// Create a list of prescriptions not used
		let lRXs = p.map(o => o.PrescriptionId);

		// Go through each existing match
		for(let iProdId in m) {

			// Does the item exist in the order?
			let i = afindi(lItems, 'productId', iProdId);
			if(i > -1) {

				// Store the prescription ID
				let iRX = m[iProdId];

				// Does it still exist (it might have expired or been
				//	deactivated)
				let j = lRXs.indexOf(iRX)
				if(j > -1) {

					// Store it in the return
					dRet[iProdId] = iRX;

					// Delete the RX from the list
					lRXs.splice(j, 1);

					// Delete the product from the items
					lItems.splice(i, 1);
				}
			}
		}

		// Now go through the remaining items
		for(let o of lItems) {

			// Do we (not) have enough prescriptions?
			if(lRXs.length === 0) {
				dRet[o.productId] = 0;
				continue;
			}

			// Grab the first prescription and then remove it from the list
			dRet[o.productId] = lRXs[0];
			lRXs.splice(0, 1);
		}

		// Return the processed list of product IDs to prescription IDs
		return dRet;
	}

	// Confirm the rx associated with each item
	function rxConfirm() {

		// Init the list we will send to the server
		let lProducts = [];

		// Keep track of prescriptions already used
		let lUsed = [];

		// Go through each item and get the value of the select
		for(let o of props.customer.items) {

			// Get the rx ID
			let iDsID = parseInt(refItems.current[o.productId].current.value, 10);

			// If we already have it
			if(lUsed.includes(iDsID)) {
				Events.trigger('error', 'Same prescription used multiple times!');
				return;
			}

			// If it's not valid
			if(iDsID === 0) {
				Events.trigger('error', 'Must set prescriptions for all items!');
				return;
			}

			// Mark it as used
			lUsed.push(iDsID);

			// Generate and add on the record to be sent
			lProducts.push({product_id: parseInt(o.productId, 10), ds_id: iDsID});
		}

		// No issues? Send it to the server
		Rest.update('providers', 'customer/to/rx', {
			customer_id: props.customer.customerId,
			products: lProducts
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

				// Convert the customer ID to an int
				let iCustID = parseInt(props.customer.customerId, 10);

				// We can successfully close this claim
				Claimed.remove(iCustID, 'approved').then(res => {
					Events.trigger('claimedRemove', iCustID, true);
					Events.trigger('success', 'Customer approved!');
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
			//	Entered, Error, Deleted, Requested
			if([1,6,7,8].indexOf(rx.Status) > -1) {
				return false;
			}

			// If the medication status is invalid
			//	Inactive, Discontinued, Deleted, CancelRequested,
			//	CancelPending, Cancelled, CancelDenied
			if([2,3,4,6,7,8,9].indexOf(rx.MedicationStatus) > -1) {
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

	// Called when one of the selects (drop downs) changes
	function selectChange(productId, rxId) {
		let dSelects = clone(selects);
		dSelects[productId] = rxId;
		selectsSet(dSelects);
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
	let lRxOptions = [
		<option key={0} value={0}>Select Prescription...</option>
	];
	for(let o of prescriptions) {
		lRxOptions.push(
			<option key={o.PrescriptionId} value={o.PrescriptionId}>{Utils.niceDate(o.WrittenDate, props.mobile ? 'short' : 'long')} - {o.PharmacyName} - {o.DisplayName}</option>
		)
	}

	// Grid size
	let iGrid = (props.onRemove) ? 3 : 4

	// Render
	return (
		<Box id="DoseSpot">
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
							{props.customer.items.map((o,i) =>
								<Box key={o.productId} className="section">
									<Grid container spacing={1}>
										<Grid item xs={12} sm={5} className="product">
											<Box><Box><Typography>{o.description}</Typography></Box></Box>
										</Grid>
										<Grid item xs={12} sm={7} className="prescription">
											<Select
												className='select'
												inputProps={{
													ref: refItems.current[o.productId]
												}}
												native
												onChange={ev => selectChange(o.productId, ev.currentTarget.value)}
												value={selects[o.productId]}
												variant="outlined"
											>{lRxOptions}</Select>
										</Grid>
									</Grid>
								</Box>
							)}
							<Grid container spacing={1}>
								<Grid item xs={iGrid}>
									<Button
										onClick={() => ssoFetch()}
										variant="contained"
									>Open {props.mobile ? 'DS' : 'DoseSpot'}</Button>
								</Grid>
								{props.onRemove &&
									<Grid item xs={iGrid}>
										<Button
											color="secondary"
											onClick={props.onRemove}
											variant="contained"
										>{props.mobile ? 'x' : 'Remove Claim'}</Button>
									</Grid>
								}
								<Grid item xs={iGrid}>
									<Button
										onClick={() => transferSet(true)}
										variant="contained"
									>Transfer</Button>
								</Grid>
								<Grid item xs={iGrid}>
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
						<Pharmacies defaultValue={56387} ref={refPharmacy} />&nbsp;
						<Button
							color="primary"
							onClick={patientCreate}
							variant="contained"
						>Create</Button>
					</Box>
					<Grid container spacing={1} className="actions">
						<Grid item xs={6}>
							{props.onRemove &&
								<Button
									color="secondary"
									onClick={props.onRemove}
									variant="contained"
								>Remove Claim</Button>
							}
						</Grid>
						<Grid item xs={6}>
							<Button
								onClick={() => transferSet(true)}
								variant="contained"
							>Transfer</Button>
						</Grid>
					</Grid>
				</Box>

			}
			{transfer &&
				<Transfer
					agent={props.user.agent}
					customerId={props.customer.customerId}
					onClose={() => transferSet(false)}
					onTransfer={customerTransfer}
				/>
			}
		</Box>
	)
}

// Valid props
DS.propTypes = {
	customer: PropTypes.object.isRequired,
	mobile: PropTypes.bool.isRequired,
	onRemove: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
	patientId: PropTypes.number.isRequired,
	start: PropTypes.oneOf(['sso', 'matches']).isRequired,
	user: PropTypes.object.isRequired
}

// Default props
DS.defaultProps = {
	onRemove: false
}
