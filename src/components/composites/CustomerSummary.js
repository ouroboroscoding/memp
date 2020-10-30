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

// Site modules
import Utils from '../../utils';

// Encounter types
const _encounter = {
	A: 'Audio',
	AS: 'Asynchronous',
	NA: 'Not Available',
	V: 'Video'
}

// CustomerSummary component
export default function CustomerSummary(props) {

	function claim() {
		props.onClaim(props);
	}

	// If we're the one who claimed it
	let sClaimedBy = (props.userId === props.user.id) ? 'You' : props.claimedBy;

	// Order label
	let lLabel = props.orderLabel.split(' - ');
	let sLabel = (props.attentionRole === 'Doctor' ? 'Provider' : props.attentionRole) +
				(lLabel.length === 2 ? ' - ' + lLabel[1] : '')

	// Render
	return (
		<Paper className="summary">
			<Grid container spacing={3}>
				<Grid item xs={12} sm={2}>
					{props.claimedAt ?
						<p>Claimed by {sClaimedBy}</p>
					:
						<p><Button variant="contained" color="primary" size="large" onClick={claim}>Claim</Button></p>
					}
				</Grid>
				<Grid item xs={12} sm={5}>
					<Typography variant="h6">Customer</Typography>
					<p><strong>ID:</strong> {props.customerId}</p>
					<p><strong>Name:</strong> {props.customerName}</p>
					<p><strong>Location:</strong> {props.shipCity + ', ' + props.shipState}</p>
					<p><strong>Encounter:</strong> {props.type !== '' && _encounter[props.type]}</p>
				</Grid>
				<Grid item xs={12} sm={5} className="messages">
					<Typography variant="h6">Order</Typography>
					<p><strong>ID:</strong> {props.orderId}</p>
					<p><strong>Label:</strong> {sLabel}</p>
					<p><strong>Created:</strong> {Utils.niceDate(props.dateCreated)}</p>
				</Grid>
			</Grid>
		</Paper>
	);
}

// Force props
CustomerSummary.propTypes = {
	"onClaim": PropTypes.func.isRequired
}

// Default props
CustomerSummary.defaultTypes = {}
