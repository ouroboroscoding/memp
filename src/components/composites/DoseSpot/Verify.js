/**
 * Verify
 *
 * Handles verifying prescriptions associated with order items
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-01-13
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
import { GreenButton } from 'components/elements/Buttons';

// Local components
import PatientPharmacyAdd from './PatientPharmacyAdd';
import PatientUpdate from './PatientUpdate';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared data modules
import DS from 'shared/data/dosespot';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi, clone, dateInc } from 'shared/generic/tools';

// Local modules
import Utils from 'utils';

/**
 * Verify
 *
 * Displayed when there's no patient ID for the customer
 *
 * @name Verify
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Verify(props) {

	// State
	let [itemToRx, itemToRxSet] = useState([]);
	let [rx, rxSet] = useState([]);
	let [selects, selectsSet] = useState({});
	let [patient, patientSet] = useState(false);

	// Refs
	let refItems = useRef(props.customer.items.reduce((r,o) => ({...r, [o.productId]: React.createRef()}), {}));

	// Component Mounted Effect
	useEffect(() => {
		rxFetch();
		itemToRxFetch();
	// eslint-disable-next-line
	}, [])

	// Prescriptions changed effect
	useEffect(() => {
		selectsUpdate();
	// eslint-disable-next-line
	}, [itemToRx, rx]);

	// Confirm the rx associated with each item
	function confirm() {

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
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if(res.data) {
				props.onVerified();
			}
		});
	}

	// Fetch any existing item -> rx records
	function itemToRxFetch() {

		// Request the records from the server
		Rest.read('providers', 'customer/to/rx', {
			customer_id: props.customer.customerId
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				itemToRxSet(res.data);
			}
		})
	}

	// Filter out expired and inactive prescriptions
	function rxFilter(items) {
		return items.filter(o => {

			// If the status is invalid
			//	Entered, Error, Deleted, Requested
			if([1,6,7,8].indexOf(o.Status) > -1) {
				return false;
			}

			// If the medication status is invalid
			//	Inactive, Discontinued, Deleted, CancelRequested,
			//	CancelPending, Cancelled, CancelDenied
			if([2,3,4,6,7,8,9].indexOf(o.MedicationStatus) > -1) {
				return false;
			}

			// If it's expired
			let oDate = new Date(o.EffectiveDate ? o.EffectiveDate : o.WrittenDate);
			if(oDate < dateInc(-365)) {
				return false;
			}

			// OK
			return true;
		});
	}

	// Get all prescriptions
	function rxFetch(fromClose = false) {
		DS.prescriptions(props.patientId).then(res => {

			// Filter the data
			let lRX = rxFilter(res);

			// If there's none
			if(lRX.length === 0) {
				Events.trigger('error', 'No valid prescriptions pulled from DoseSpot.');
				return;
			}

			// Set the state
			rxSet(lRX);

		}, error => {
			if(error.code === 1602) {
				Events.trigger('error', 'DoseSpot error: "' + error.msg + '"')
			} else {
				Events.trigger('error', Rest.errorMessage(error));
			}
		});
	}

	// Called when one of the selects (drop downs) changes
	function selectChange(productId, rxId) {
		let dSelects = clone(selects);
		dSelects[productId] = rxId;
		selectsSet(dSelects);
	}

	// Called when the list of prescriptions changes
	function selectsUpdate() {

		// Clone the current hash of select values
		let oSelects = clone(selects);

		for(let oItem of props.customer.items) {

			// Does item exist in the existing items to rx?
			let i = afindi(itemToRx, 'product_id', parseInt(oItem.productId, 10));
			if(i > -1) {

				console.log('oItemToRx:', itemToRx[i]);

				// Did the prescription come back?
				if(afindi(rx, 'PrescriptionId', itemToRx[i].ds_id) > -1) {
					oSelects[oItem.productId] = itemToRx[i].ds_id;
				}
			}
		}

		// Set the state
		selectsSet(oSelects);
	}

	// Prescription options
	let lRxOptions = [
		<option key={0} value="0">Select Prescription...</option>
	];
	for(let o of rx) {
		lRxOptions.push(
			<option key={o.PrescriptionId} value={o.PrescriptionId}>{Utils.niceDate(o.WrittenDate, props.mobile ? 'short' : 'long')} - {o.PharmacyName} - {o.DisplayName}</option>
		)
	}

	// If remove is not allowed
	let iGrid = props.onRemove ? 3 : 4

	// Render
	return (
		<Box className="verify">
			{process.env.REACT_APP_DS_HYBRID === 'true' &&
				<React.Fragment>
					{patient === 'update' &&
						<PatientUpdate
							customerId={props.customer.customerId}
							onCancel={() => patientSet(false)}
							onUpdated={() => patientSet(false)}
						/>
					}
					{patient === 'pharmacy' &&
						<PatientPharmacyAdd
							patientId={props.patientId}
							onCancel={() => patientSet(false)}
							onAdded={() => patientSet(false)}
						/>
					}
					{patient === false &&
						<Grid container spacing={2}>
							<Grid item xs={12} md={6}>
								<Button variant="contained" onClick={() => patientSet('update')} style={{width: '100%'}}>Update Patient Data</Button>
							</Grid>
							<Grid item xs={12} md={6}>
								<Button variant="contained" onClick={() => patientSet('pharmacy')} style={{width: '100%'}}>Add Pharmacy to Patient</Button>
							</Grid>
						</Grid>
					}
				</React.Fragment>
			}
			{props.customer.items.map(o =>
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
								value={selects[o.productId] ? selects[o.productId].toString() : '0'}
								variant="outlined"
							>{lRxOptions}</Select>
						</Grid>
					</Grid>
				</Box>
			)}
			<Grid container spacing={1} className="rta">
				<Grid item xs={iGrid}>
					<Button
						onClick={props.onSSO}
						variant="contained"
					>{props.mobile ? 'DS' : 'Open DoseSpot'}</Button>
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
						onClick={() => props.onTransfer('agent')}
						variant="contained"
					>To Support</Button>
				</Grid>
				<Grid item xs={iGrid}>
					<GreenButton
						onClick={confirm}
						variant="contained"
					>Confirm</GreenButton>
				</Grid>
			</Grid>
		</Box>
	);
}

// Valid props
Verify.propTypes = {
	customer: PropTypes.object.isRequired,
	onRemove: PropTypes.func,
	onSSO: PropTypes.func.isRequired,
	onTransfer: PropTypes.func.isRequired,
	onVerified: PropTypes.func.isRequired,
	patientId: PropTypes.number.isRequired
}
