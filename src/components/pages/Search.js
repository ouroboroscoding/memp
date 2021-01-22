/**
 * Search
 *
 * Page to search for customers
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-12-14
 */

// NPM modules
import PropTypes from 'prop-types';
import Tree from 'format-oc/Tree'
import React, { useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

// Format components
import SearchComponent from 'shared/components/format/Search';

// Data modules
import Claimed from 'data/claimed';
import Encounters from 'data/encounters';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone } from 'shared/generic/tools';

// Site modules
import Utils from 'utils';

// Definitions
import KtCustomerDef from 'definitions/monolith/kt_customer';
KtCustomerDef['__react__'] = {
	search: ["customerId", "firstName", "lastName", "phoneNumber", "emailAddress"]
}
KtCustomerDef.customerId.__react__.type = 'number'

// Generate the user Tree
const KtCustomerTree = new Tree(clone(KtCustomerDef));

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
			type: props.type
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
				<Typography><strong>Type:</strong> {props.type.toUpperCase()} - {props.encounter !== '' && Encounters.map[props.encounter]}</Typography>
				<Typography><strong>Label:</strong> {sLabel}</Typography>
				<Typography><strong>Created:</strong> {Utils.niceDate(props.dateCreated)}</Typography>
			</Grid>
		</React.Fragment>
	)
}

// Valid props
Order.propTypes = {
	dateCreated: PropTypes.string.isRequired,
	encounter: PropTypes.string.isRequired,
	onClaim: PropTypes.func.isRequired,
	orderId: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
	user: PropTypes.object.isRequired
}

/**
 * Customer
 *
 * Displays a single customer
 *
 * @name Customer
 * @access private
 * @param Object props Attributes passed to the component
 * @returns React.Component
 */
function Customer(props) {

	// Claim Customer
	function claim() {
		props.onClaim({
			orderId: null,
			customerId: parseInt(props.customerId, 10),
			customerName: props.firstName + ' ' + props.lastName,
			continuous: false,
			type: 'view'
		});
	}

	// Claim Order
	function orderClaim(claim) {
		claim.customerId = parseInt(props.customerId, 10);
		claim.customerName = props.firstName + ' ' + props.lastName;
		claim.continuous = false;
		props.onClaim(claim);
	}

	// Render
	return (
		<Paper className="summary">
			<Grid container spacing={3}>
				<Grid item xs={12} sm={2}>
					<Button variant="contained" size="large" onClick={claim}>View</Button>
				</Grid>
				<Grid item xs={12} sm={10}>
					<Typography variant="h6"><strong>{props.firstName} {props.lastName}</strong> ({props.customerId})</Typography>
					<Typography>{props.shipCity + ', ' + props.shipState}</Typography>
				</Grid>
				{props.orders && props.orders.map(o =>
					<Order
						key={o.orderId}
						onClaim={orderClaim}
						user={props.user}
						{...o}
					/>
				)}
				{props.orders === false &&
					<Grid item xs={12}>
						<Typography>No PENDING orders associated with this customer.</Typography>
					</Grid>
				}
			</Grid>
		</Paper>
	);
}

// Valid props
Customer.propTypes = {
	customerId: PropTypes.string.isRequired,
	firstName: PropTypes.string.isRequired,
	lastName: PropTypes.string.isRequired,
	onClaim: PropTypes.func.isRequired,
	shipCity: PropTypes.string.isRequired,
	shipState: PropTypes.string.isRequired,
	user: PropTypes.object.isRequired
}

/**
 * Search
 *
 * Search for customers and display them
 *
 * @name Search
 * @extends React.Component
 */
export default function Search(props) {

	// State
	let [results, resultsSet] = useState(null);

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

	// Render
	return (
		<Box id="search" className="page">
			<SearchComponent
				hash="search"
				name="search"
				noun="customer/search"
				service="monolith"
				success={res => resultsSet(res)}
				tree={KtCustomerTree}
			/>
			{results &&
				<Box className="results">
					{results.length === 0 ?
						<Typography>No results found</Typography>
					:
						results.map(o =>
							<Customer
								key={o.id}
								onClaim={claim}
								user={props.user}
								{...o}
							/>
						)
					}
				</Box>
			}
		</Box>
	);
}
