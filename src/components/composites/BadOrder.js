/**
 * Bad Order
 *
 * Used on orders that can't be approved/declined that somehow ended up in
 * someone's claims
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-12-15
 */

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

// Data modules
import Claimed from '../../data/claimed';

// Generic modules
import Events from '../../generic/events';

/**
 * Bad Order
 *
 * Used when an order is neither pending or complete
 *
 * @name BadOrder
 * @access private
 * @param Object props Attributes sent to the component
 */
export default function BadOrder(props) {

	// Unclaim the customer
	function unclaim() {
		Claimed.remove(props.customerId, 'x').then(res => {
			Events.trigger('claimedRemove', parseInt(props.customerId, 10), true);
		}, error => {
			Events.trigger('error', JSON.stringify(error));
		});
	}

	return (
		<Box className="badOrder">
			<Typography style={{padding: '10px'}}>Someone transferred you an order that can't be approved.</Typography>
			<Box style={{padding: '0 10px'}}>
				<Button color="secondary" onClick={unclaim} variant="contained">Remove Claim</Button>
			</Box>
		</Box>
	)
}

// Valid props
BadOrder.propTypes = {
	customerId: PropTypes.string.isRequired
}
