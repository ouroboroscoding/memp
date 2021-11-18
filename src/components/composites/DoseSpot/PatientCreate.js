/**
 * Patient Create
 *
 * Handles displaying the form to create a new DoseSpot account for a customer
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-01-13
 */

// NPM modules
import Tree from 'format-oc/Tree';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

// Shared components
import Pharmacies from 'shared/components/DoseSpot/Pharmacies';
import { Parent } from 'shared/components/Format';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared data modules
import DS from 'shared/data/dosespot';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone } from 'shared/generic/tools';

// Load patient definition
import PatientDef from 'definitions/monolith/ds_patient';

// Create the patient Tree
const PatientTree = new Tree(clone(PatientDef));

/**
 * Details Clean
 *
 * Makes sure a valid value is returned for fields
 *
 * @name detailsClean
 * @access private
 * @param str value The value of the field
 * @param uint max The max number of characters
 * @return str
**/
function detailsClean(value, max) {
	if(typeof value !== 'string') {
		return ''
	} else if(value === '') {
		return ''
	} else {
		return value.substr(0, max);
	}
}

/**
 * Patient Create
 *
 * Displayed when there's no patient ID for the customer
 *
 * @name PatientCreate
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function PatientCreate(props) {

	// State
	let [customer, customerSet] = useState(process.env.REACT_APP_DS_HYBRID === 'true' ? {} : null);

	// Refs
	let refCreate = useRef();
	let refPharmacy = useRef();

	// Load effect
	useEffect(() => {
		if(customer) {
			Rest.read('konnektive', 'customer', {
				customerId: props.customerId
			}).done(res => {
				if(res.error && !res._handled) {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
				if(res.data) {
					customerSet(data => {
						return {
							firstName: detailsClean(res.data['shipping']['firstName'], 35),
							lastName: detailsClean(res.data['shipping']['lastName'], 35),
							gender: '1',
							email: detailsClean(res.data['email'], 255),
							address1: detailsClean(res.data['shipping']['address1'], 35),
							address2: detailsClean(res.data['shipping']['address2'], 35),
							city: detailsClean(res.data['shipping']['city'], 35),
							state: detailsClean(res.data['shipping']['state'], 35),
							zipCode: detailsClean(res.data['shipping']['postalCode'], 10),
							primaryPhone: detailsClean(res.data['phone'], 25),
							...data
						};
					});
				}
			});
			Rest.read('monolith', 'customer/dob', {
				customerId: props.customerId.toString()
			}).then(res => {
				if(res.error && !res._handled) {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
				if(res.data) {
					customerSet(data => {
						data['dateOfBirth'] = res.data
						return clone(data);
					})
				}
			});
		}
	// eslint-disable-next-line
	}, []);

	// Customer effect
	useEffect(() => {
		if(customer) {
			console.log(customer);
			refCreate.current.value = customer;
		}
	}, [customer]);

	// Create the patient account with DoseSpot
	function create() {

		// Get the default pharmacy
		let iPharmacy = refPharmacy.current.value;

		// If it's 0
		if(iPharmacy === 0) {
			iPharmacy = null;
			Events.trigger('error', 'Please select a default pharmacy for the patient');
			return;
		}

		// If we have a customer
		if(customer) {
			customer = refCreate.current.value;
		}

		// Create the patient
		DS.create(props.customerId, iPharmacy, customer).then(res => {
			props.onCreated(res);
		}, error => {
			if(error.code === 1001) {
				refCreate.current.error(error.msg);
			} else if(error.code === 1602) {
				Events.trigger('error', 'DoseSpot error: "' + error.msg + '"')
			} else {
				Events.trigger('error', Rest.errorMessage(error));
			}
		});
	}

	// If we can't remove
	let iGrid = (props.onRemove) ? 4 : 6

	// Render
	return (
		<Box className="create">
			<Box className="section">
				<Typography>No DoseSpot patient account found. Create one?</Typography>
				{customer &&
					<Box style={{padding: '10px'}}>
						<Parent
							name="Patient"
							node={PatientTree}
							noun=""
							ref={refCreate}
							service=""
							type="create"
							value={customer}
						/>
					</Box>
				}
				<Pharmacies defaultValue={56387} ref={refPharmacy} />&nbsp;
				<Button
					color="primary"
					onClick={create}
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
						onClick={() => props.onTransfer('agent')}
						variant="contained"
					>To Support</Button>
				</Grid>
				<Grid item xs={iGrid}>
					<Button
						onClick={() => props.onTransfer('provider')}
						variant="contained"
					>To Provider</Button>
				</Grid>
			</Grid>
		</Box>
	);
}

// Valid props
PatientCreate.propTypes = {
	customerId: PropTypes.number.isRequired,
	onCreated: PropTypes.func.isRequired,
	onRemove: PropTypes.func,
	onTransfer: PropTypes.func.isRequired
}
