/**
 * View
 *
 * Handles fetching a customer and all available data
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-12-11
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// Material UI
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';

// Composite/Shared components
import Notes from '../../composites/Notes';

// Page components
import DS from './DS';
import MIP from './MIP';

// Data modules
import DoseSpot from '../../../data/dosespot';
import Encounters from '../../../data/encounters';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';

// Local modules
import Utils from '../../../utils';

// Note types
const _NOTES = {
	'0': '',
	'1': '',
	'2': 'notes',
	'3': 'sms'
}

/**
 * View
 *
 * Displays a customer and all their MIPs with the ability to visit DoseSpot
 *
 * @name View
 * @access public
 * @param Object props Attributes passed to the component
 * @return React.Component
 */
export default function View(props) {

	// State
	let [customer, customerSet] = useState(null);
	let [encounter, encounterSet] = useState('');
	let [patientId, patientSet] = useState(0);
	let [tab, tabSet] = useState(0);

	// Hooks
	let { customerId } = useParams();

	// Page load effects
	useEffect(() => {
		Events.add('patientCreate', patientCreate);
		return () => Events.remove('patientCreate', patientCreate)
	}, []);

	// Order effects
	useEffect(() => {
		if(props.user) {
			customerFetch();
			patientFetch();
		} else {
			customerSet(null);
			patientSet(0);
		}
	// eslint-disable-next-line
	}, [props.user, customerId]);

	// Fetch customer details from Konnektive
	function customerFetch() {

		// Request the customer info from the server
		Rest.read('konnektive', 'customer', {
			customerId: customerId
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
				customerSet(res.data);

				// Get the encounter type
				Encounters.fetch(res.data.shipping.state).then(encounter => {
					encounterSet(encounter);
				}, error => {
					Events.trigger('error', JSON.stringify(error));
				});
			}
		});
	}

	// Set the patient ID
	function patientCreate(id) {
		patientSet(id);
	}

	// Fetch the customer's DoseSpot patient ID
	function patientFetch() {
		DoseSpot.fetch(customerId).then(res => {
			patientSet(res);
		}, error => {
			Events.trigger('error', JSON.stringify(error));
		});
	}

	// If we have no customer
	if(customer === null) {
		return <p style={{padding: '10px'}}>Loading Patient...</p>
	}

	// Render
	return (
		<Box id="orderEd" className="page">
			<AppBar position="static" color="default">
				<Tabs
					onChange={(ev, tab) => tabSet(tab)}
					value={tab}
					variant="fullWidth"
				>
					<Tab label="MIPs" />
					<Tab label="DoseSpot" />
					<Tab label="Notes" />
					<Tab label="SMS" />
				</Tabs>
			</AppBar>
			<Grid container spacing={0} className="details">
				<Grid item xs={7} sm={8} md={9} className="left">
					<Typography className="name">{customer.shipping.lastName}, {customer.shipping.firstName}</Typography>
				</Grid>
				<Grid item xs={5} sm={4} md={3} className="right">
					<Typography className="encounter">{encounter}</Typography>
				</Grid>
			</Grid>
			<Box className="tabSection" style={{display: tab === 0 ? 'block' : 'none'}}>
				<MIP
					customerId={customerId}
					mobile={props.mobile}
					patientId={patientId}
					user={props.user}
				/>
			</Box>
			<Box className="tabSection" style={{display: tab === 1 ? 'block' : 'none'}}>
				<DS
					customerId={customerId}
					mobile={props.mobile}
					patientId={patientId}
					user={props.user}
				/>
			</Box>
			<Box className="tabSection" style={{display: tab > 1 ? 'block' : 'none'}}>
				<Notes
					mobile={props.mobile}
					customer={customer}
					type={_NOTES[tab]}
				/>
			</Box>
		</Box>
	);
}

// Valid props
View.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
