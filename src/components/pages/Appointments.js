/**
 * Appointments
 *
 * Displays the provider's upcoming appointments
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-22
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

// Data modules
import Claimed from 'data/claimed';
import Encounters from 'data/encounters';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import { date, datetime, isToday } from 'shared/generic/tools';

// Local modules
import Utils from 'utils';

/**
 * Order
 *
 * Displays a single order
 *
 * @name Order
 * @access private
 * @param Object props Attributes passed to the component
 * @returns React.Component
 */
function Order(props) {

	// Claim Order
	function claim() {
		props.onClaim({
			orderId: props.orderId,
			type: props.type,
			continuous: props.continuous
		});
	}

	// If we're the one who claimed it
	let sClaimedBy = (props.claimedUser === props.user.id) ? 'You' : props.claimedName;

	// Order label
	let lLabel = props.orderLabel.split(' - ');
	let sLabel = (props.attentionRole === 'Doctor' ? 'Provider' : props.attentionRole) +
				(lLabel.length === 2 ? ' - ' + lLabel[1] : '')

	// Render
	return (
		<React.Fragment>
			<Grid item xs={1}>&nbsp;</Grid>
			<Grid item xs={2}>
				{props.claimedUser !== null ?
					<Typography>Order already claimed by {sClaimedBy}</Typography>
				:
					<Button variant="contained" color="primary" size="large" onClick={claim}>Claim</Button>
				}
			</Grid>
			<Grid item xs={9}>
				<Typography><strong>Order:</strong> {props.orderId}</Typography>
				<Typography><strong>Type:</strong> {props.continuous ? 'C-' : ''}{props.type.toUpperCase()} - {props.encounter !== '' && Encounters.map[props.encounter]}</Typography>
				<Typography><strong>Label:</strong> {sLabel}</Typography>
				<Typography><strong>Created:</strong> {Utils.niceDate(props.dateCreated)}</Typography>
			</Grid>
		</React.Fragment>
	)
}

// Valid props
Order.propTypes = {
	continuous: PropTypes.bool.isRequired,
	dateCreated: PropTypes.string.isRequired,
	encounter: PropTypes.string.isRequired,
	onClaim: PropTypes.func.isRequired,
	orderId: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
	user: PropTypes.object.isRequired
}

/**
 * Appointment
 *
 * Displays a single appointment
 *
 * @name Appointment
 * @access private
 * @param Object props Attributes passed to the component
 * @returns React.Component
 */
function Appointment(props) {

	// Claim Order
	function orderClaim(claim) {
		claim.customerId = parseInt(props.customerId, 10);
		claim.customerName = props.name;
		props.onClaim(claim);
	}

	// Render
	return (
		<Grid container spacing={2}>
			<Grid item xs={4}>{props.type.toUpperCase()} - {props.event}</Grid>
			<Grid item xs={4}>{props.name}</Grid>
			<Grid item xs={2}>{datetime(props.start, '-').split(' ')[1]}</Grid>
			<Grid item xs={2}>{datetime(props.end, '-').split(' ')[1]}</Grid>
			{props.orders !== false && props.orders.map(o =>
				<Order
					continuous={false}
					key={o.orderId}
					onClaim={orderClaim}
					user={props.user}
					{...o}
				/>
			)}
			{props.continuous !== false && props.continuous.map(o =>
				<Order
					continuous={true}
					key={o.orderId}
					onClaim={orderClaim}
					user={props.user}
					{...o}
				/>
			)}
		</Grid>
	);
}

// Valid props
Appointment.propTypes = {
	customerId: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	onClaim: PropTypes.func.isRequired,
	user: PropTypes.object.isRequired
}

/**
 * Appointments
 *
 * List by day of appointments
 *
 * @name Appointments
 * @access public
 * @param Object props Attributes passed to the component
 * @returns React.Component
 */
export default function Appointments(props) {

	// State
	let [past, pastSet] = useState(false);
	let [records, recordsSet] = useState([]);

	// User Effect
	useEffect(() => {

		// If we have a user
		if(props.user) {
			fetch();
		} else {
			recordsSet([]);
		}
	// eslint-disable-next-line
	}, [props.user]); // React to user changes

	// Past effect
	useEffect(() => {
		fetch();
	// eslint-disable-next-line
	}, [past]);

	// Store by day
	function byDay(l) {

		// Results
		let lReturn = [];

		// Current date
		let sDate = null;
		let lDates = null;

		// Go through each appointment found
		for(let o of l) {

			// Convert the start time to a date
			let sStart = date(o.start, '-');

			// If the date doesn't match the previous one
			if(sStart !== sDate) {

				// If we have a list
				if(lDates) {
					lReturn.push([sDate, lDates]);
				}

				// Reset the list
				lDates = [];

				// Store the new date
				sDate = sStart;
			}

			// Add the item to the current list
			lDates.push(o);
		}

		// If we have a list
		if(lDates) {
			lReturn.push([sDate, lDates]);
		}

		// Return the new list of lists
		return lReturn;
	}

	// Claim
	function claim(customer) {

		// Get the claimed add promise
		Claimed.add(customer.customerId, customer.orderId).then(res => {
			Events.trigger('claimedAdd', customer);
		}, error => {
			// If we got a duplicate
			if(error.code === 1101) {
				Events.trigger('error', 'Patient has already been claimed.');
			} else {
				Events.trigger('error', JSON.stringify(error));
			}
		});
	}

	// Fetch
	function fetch() {

		// Get the appointments from the server
		Rest.read('monolith', 'provider/calendly', {
			new_only: !past
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Sort into days, then store the appointments
				recordsSet(byDay(res.data));
			}
		});
	}

	// Render
	return (
		<Box id="appointments" className="page">
			<Box className="page_header">
				<Typography className="title">Calendly Appointments</Typography>
				<Box>
					<FormControlLabel
						control={<Checkbox checked={past} color="primary" onChange={ev => pastSet(ev.target.checked)} />}
						label="Show Historical"
					/>
				</Box>
			</Box>
			{records.length > 0 && records.map(l =>
				<Paper className="padded">
					<Typography variant="h4">{isToday(l[0]) ? 'Today' : Utils.niceDate(l[0] + 'T00:00:00')}</Typography>
					{l[1].map((o,i) =>
						<React.Fragment key={i}>
							{i !== 0 &&
								<hr />
							}
							<Appointment
								onClaim={claim}
								user={props.user}
								{...o}
							/>
						</React.Fragment>
					)}
				</Paper>
			)}
			{records.length === 0 &&
				<Typography>No Appointments found</Typography>
			}
		</Box>
	);
}
