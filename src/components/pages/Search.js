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
import Tree from 'format-oc/Tree'
import React, { useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

// Format components
import SearchComponent from '../format/Search';

// Data modules
import Claimed from '../../data/claimed';

// Generic modules
import Events from '../../generic/events';
import { clone } from '../../generic/tools';

// Definitions
import KtCustomerDef from '../../definitions/monolith/kt_customer';
KtCustomerDef['__react__'] = {
	search: ["customerId", "firstName", "lastName", "phoneNumber", "emailAddress"]
}
KtCustomerDef.customerId.__react__.type = 'number'

// Generate the user Tree
const KtCustomerTree = new Tree(clone(KtCustomerDef));

function Customer(props) {

	function claim() {
		props.onClaim({
			customerId: parseInt(props.customerId, 10),
			customerName: props.firstName + ' ' + props.lastName,
			continuous: false,
			type: 'view'
		});
	}

	// Render
	return (
		<Paper className="summary">
			<Grid container spacing={3}>
				<Grid item xs={12} sm={2}>
					<p><Button variant="contained" color="primary" size="large" onClick={claim}>Claim</Button></p>
				</Grid>
				<Grid item xs={12} sm={10}>
					<Typography variant="h6">Customer</Typography>
					<p>{props.customerId}</p>
					<p>{props.firstName} {props.lastName}</p>
					<p>{props.shipCity + ', ' + props.shipState}</p>
				</Grid>
			</Grid>
		</Paper>
	);
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
		Claimed.add(customer.customerId, null).then(res => {
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
								{...o}
							/>
						)
					}
				</Box>
			}
		</Box>
	);
}
