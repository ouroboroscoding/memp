/**
 * ED
 *
 * Handles fetching an existing order and displaying data based on the current
 * state of the order
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-31
 */

// NPM modules
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// Material UI
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

// Page components
import MIP from './ED/MIP';

// Generic modules
import Events from '../../generic/events';
import Rest from '../../generic/rest';
//import { clone, empty } from '../../generic/tools';

// Local modules
import Utils from '../../utils';

// Data
import Encounters from '../../data/encounters';

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
	let [order, orderSet] = useState(null);
	let [encounter, encounterSet] = useState('');

	// Hooks
	let { customerId, orderId } = useParams();

	// Effects
	useEffect(() => {
		fetch();
	// eslint-disable-next-line
	}, [orderId]);

	// Fetch the order
	function fetch() {

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
				fetchEncounter(res.data.shipping.state);
			}
		});
	}

	// Fetch the encounter type
	function fetchEncounter(state) {

		// Request the encounter type from the server
		Rest.read('monolith', 'encounter', {
			state: state
		}, false).done(res => {

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

	// If we have no order
	if(order === null) {
		return <p>Loading Order...</p>
	}

	// Render
	return (
		<Box id="orderEd" className="page">
			<Grid container spacing={0} className="details">
				<Grid item xs={7} className="left">
					<Typography className="name">{order.shipping.lastName}, {order.shipping.firstName}</Typography>
					<Typography className="medication">{order.items.map(o => o.campaign).join(', ')}</Typography>
				</Grid>
				<Grid item xs={5} className="right">
					<Typography className="status">{order.status}</Typography>
					<Typography className="encounter">{Encounters[encounter]}</Typography>
				</Grid>
			</Grid>
			{order.status === 'PENDING' &&
				<MIP
					customerId={customerId}
				/>
			}
		</Box>
	);
}
