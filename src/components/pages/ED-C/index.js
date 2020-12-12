/**
 * Continuous ED
 *
 * Handles fetching a continuous (non Konnektive) order and displaying data
 * based on the current state of the order
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-11-03
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
import { clone } from '../../../generic/tools';

// Local modules
import Utils from '../../../utils';

// Note types
const _NOTES = {
	'0': '',
	'1': 'notes',
	'2': 'sms'
}

/**
 * ED
 *
 * Displays an ED order based on its current state
 *
 * @name ED
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function ED(props) {

	// State
	let [encounter, encounterSet] = useState('');
	let [order, orderSet] = useState(null);
	let [patientId, patientSet] = useState(0);
	let [tab, tabSet] = useState(0);

	// Hooks
	let { customerId, orderId } = useParams();

	// Page load effects
	useEffect(() => {
		Events.add('patientCreate', patientCreate);
		return () => Events.remove('patientCreate', patientCreate)
	}, []);

	// Order effects
	useEffect(() => {
		if(props.user) {
			orderFetch();
			patientFetch();
		} else {
			orderSet(null);
			patientSet(0);
		}
	// eslint-disable-next-line
	}, [props.user, customerId, orderId]);

	// Fetch the encounter type
	function encounterFetch(state) {

		// Request the encounter type from the server
		Rest.read('monolith', 'encounter', {
			state: state
		}, {session: false}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if(res.data) {
				encounterSet(res.data);
			}
		})
	}

	// If the order was approved in MIP tab
	function orderApprove() {
		let oOrder = clone(order);
		oOrder.status = 'COMPLETE';
		orderSet(oOrder);
	}

	// Fetch the order
	function orderFetch() {

		// Request the order info from the server
		Rest.read('konnektive', 'order', {
			orderId: orderId
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
				orderSet(res.data);

				// Get the encounter type
				encounterFetch(res.data.shipping.state);
			}
		});
	}

	// Fetch the customer's DoseSpot patient ID
	function patientFetch() {
		DoseSpot.fetch(customerId).then(res => {
			patientSet(res);
		}, error => {
			Events.trigger('error', JSON.stringify(error));
		});
	}

	function patientCreate(id) {
		patientSet(id);
	}

	// If we have no order
	if(order === null) {
		return <p style={{padding: '10px'}}>Loading Order...</p>
	}

	// Child
	let Child = null, sTab = 'Order';
	if(order.status === 'PENDING') {
		Child = MIP;
		sTab = 'MIPs';
	}
	else if(order.status === 'COMPLETE') {
		Child = DS;
		sTab = 'DoseSpot';
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
					<Tab label={sTab} />
					<Tab label="Notes" />
					<Tab label="SMS" />
				</Tabs>
			</AppBar>
			<Grid container spacing={0} className="details">
				<Grid item xs={7} sm={8} md={9} className="left">
					<Typography className="name">{order.shipping.lastName}, {order.shipping.firstName}</Typography>
					<Typography className="medication">{order.items.map(o => o.description).join(', ')}</Typography>
				</Grid>
				<Grid item xs={5} sm={4} md={3} className="right">
					<Typography className="status">{order.status}</Typography>
					<Typography className="encounter">{Encounters[encounter]}</Typography>
				</Grid>
			</Grid>
			<Box className="tabSection" style={{display: tab === 0 ? 'block' : 'none'}}>
				{Child &&
					<Child
						customerId={customerId}
						mobile={props.mobile}
						onApprove={orderApprove}
						order={order}
						patientId={patientId}
						user={props.user}
					/>
				}
			</Box>
			<Box className="tabSection" style={{display: tab > 0 ? 'block' : 'none'}}>
				<Notes
					mobile={props.mobile}
					customer={order}
					type={_NOTES[tab]}
				/>
			</Box>
		</Box>
	);
}

// Valid props
ED.propTypes = {
	mobile: PropTypes.bool.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
