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
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';

// Composite/Shared components
import DoseSpot from 'components/composites/DoseSpot';
import Notes from 'components/composites/Notes';

// Page components
import MIP from './MIP';

// Data modules
import Claimed from 'data/claimed';
import Encounters from 'data/encounters';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared data modules
import DS from 'shared/data/dosespot';
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';
import { nicePhone } from 'shared/generic/tools';

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
	let [customer, customerSet] = useState(-1);
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
			customerSet(-1);
			patientSet(0);
		}
	// eslint-disable-next-line
	}, [props.user, customerId]);

	// Fetch customer details from Konnektive
	function customerFetch() {

		// Request the customer info from the server
		Rest.read('konnektive', 'customer/purchases', {
			customerId: customerId
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

				// Init the customer
				let oCustomer = null;

				// Go through each purchase
				for(let o of res.data) {

					// If it's not active
					if(!['ACTIVE','TRIAL'].includes(o.status)) {
						continue;
					}

					// If we don't have a customer yet
					if(!oCustomer) {
						oCustomer = o;
						oCustomer.items = [];
					}

					// Append the item
					oCustomer.items.push({
						campaign: o.product.name,
						description: o.product.name,
						productId: o.product.id,
						price: o.price,
						shipping: o.shippingPrice
					});
				}

				// Set the state
				customerSet(oCustomer);

				// If we have any purchases
				if(oCustomer) {

					// Get the encounter type
					Encounters.fetch(oCustomer.shipping.state).then(encounter => {
						encounterSet(encounter);
					}, error => {
						Events.trigger('error', Rest.errorMessage(error));
					});
				}
			}
		});
	}

	// Set the patient ID
	function patientCreate(id) {
		patientSet(id);
	}

	// Fetch the customer's DoseSpot patient ID
	function patientFetch() {
		DS.fetch(customerId).then(res => {
			patientSet(res);
		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	// Close the ticket
	function ticketClose() {

		// If we a ticket
		if(Tickets.current()) {

			// Add a note about the issue
			Rest.create('monolith', 'customer/note', {
				action: 'Save Notes',
				content: 'No purchase info for the customer',
				customerId: customerId
			}).done(res => {

				// If we're ok
				if(res.data) {

					// Add the note to the current ticket if there is one
					Tickets.item('note', 'outgoing', res.data, props.user.id);
				}

				// Close the ticket
				Tickets.resolve('Invalid Transfer: No Purchase Information').then(data => {

					// Unclaim the ticket
					unclaim();
				})
			});
		} else {
			unclaim();
		}
	}

	// Unclaim the customer
	function unclaim() {

		Claimed.remove(customerId, 'closed').then(res => {
			Events.trigger('claimedRemove', parseInt(customerId, 10), true);
		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	// If we haven't finished getting info on the customer yet
	if(customer === -1) {
		return <Typography style={{padding: '10px'}}>Loading Patient...</Typography>
	}

	// If there was no info on the customer
	if(customer === null) {
		return (
			<Box id="view" className="page">
				<Typography style={{padding: '10px'}}>No purchase infomation found for this customer.</Typography>
				<Box style={{padding: '0 10px'}}>
					<Button color="secondary" onClick={ticketClose} variant="contained">Remove Claim</Button>
				</Box>
			</Box>
		);
	}

	// Render
	return (
		<Box id="view" className="page">
			<AppBar position="static" color="default">
				<Tabs
					onChange={(ev, tab) => tabSet(tab)}
					value={tab}
					variant="fullWidth"
				>
					<Tab label="DoseSpot" />
					<Tab label="MIPs" />
					<Tab label="Notes" />
					<Tab label="SMS" />
				</Tabs>
			</AppBar>
			<Grid container spacing={0} className="details">
				<Grid item xs={7} sm={8} md={9} className="left">
					<Typography className="name">{customer.shipping.lastName}, {customer.shipping.firstName}</Typography>
					<Typography className="medication">{customer.items.map(o => o.description).join(', ')}</Typography>
				</Grid>
				<Grid item xs={5} sm={4} md={3} className="right">
					<Typography className="encounter">{encounter} / <nobr>{nicePhone(customer.phone)}</nobr></Typography>
				</Grid>
			</Grid>
			<Box className="tabSection" style={{display: tab === 0 ? 'block' : 'none'}}>
				<DoseSpot
					customer={customer}
					initialMode="verify"
					mobile={props.mobile}
					onRemove={Tickets.current() ? false : unclaim}
					patientId={patientId}
					user={props.user}
				/>
			</Box>
			<Box className="tabSection" style={{display: tab === 1 ? 'block' : 'none'}}>
				<MIP
					customerId={customerId}
					customerPhone={customer.phone}
					mobile={props.mobile}
					onRemove={unclaim}
					patientId={patientId}
					user={props.user}
				/>
			</Box>
			<Box className="tabSection" style={{display: tab > 1 ? 'block' : 'none'}}>
				<Notes
					mobile={props.mobile}
					customer={customer}
					type={_NOTES[tab]}
					user={props.user}
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
