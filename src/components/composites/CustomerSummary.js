/**
 * Customer Summary
 *
 * Shows SMS conversations
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-05-26
 */

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

// Shared generic modules
import { clone } from 'shared/generic/tools';

// Site modules
import Utils from 'utils';

// Data
import Encounters from 'data/encounters';

// CustomerSummary component
export default function CustomerSummary(props) {

	function claim() {
		props.onClaim(clone(props));
	}

	// Order label
	let lLabel = props.orderLabel.split(' - ');
	let sLabel = (props.attentionRole === 'Doctor' ? 'Provider' : props.attentionRole) +
				(lLabel.length === 2 ? ' - ' + lLabel[1] : '')

	// Render
	return (
		<Paper className="summary">
			<Grid container spacing={3}>
				<Grid item xs={12} sm={2}>
					<Typography><Button variant="contained" color="primary" size="large" onClick={claim}>Claim</Button></Typography>
				</Grid>
				<Grid item xs={12} sm={5}>
					<Typography variant="h6">Customer</Typography>
					<Typography><strong>ID:</strong> {props.customerId}</Typography>
					<Typography><strong>Name:</strong> {props.customerName}</Typography>
					<Typography><strong>Location:</strong> {props.shipCity + ', ' + props.shipState}</Typography>
					<Typography><strong>Encounter:</strong> {props.encounter !== '' && Encounters.map[props.encounter]}</Typography>
				</Grid>
				<Grid item xs={12} sm={5} className="messages">
					<Typography variant="h6">Order</Typography>
					<Typography><strong>ID:</strong> {props.orderId}</Typography>
					<Typography><strong>Label:</strong> {sLabel}</Typography>
					<Typography><strong>Created:</strong> {Utils.niceDate(props.dateCreated)}</Typography>
				</Grid>
			</Grid>
		</Paper>
	);
}

// Force props
CustomerSummary.propTypes = {
	attentionRole: PropTypes.string.isRequired,
	customerId: PropTypes.number.isRequired,
	customerName: PropTypes.string.isRequired,
	dateCreated: PropTypes.string.isRequired,
	encounter: PropTypes.string.isRequired,
	onClaim: PropTypes.func.isRequired,
	orderId: PropTypes.string.isRequired,
	orderLabel: PropTypes.string.isRequired,
	shipCity: PropTypes.string.isRequired,
	shipState: PropTypes.string.isRequired
}

// Default props
CustomerSummary.defaultTypes = {}
