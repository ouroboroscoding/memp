/**
 * ED MIP
 *
 * Handles fetching all MIPs and displaying the relevant data
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-12-11
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';

// Composite components
import MIPs from 'components/composites/MIPs';
import PreviousMeds from 'components/composites/PreviousMeds';
import Transfer from 'components/composites/Transfer';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

/**
 * MIP
 *
 * Displays a MIP based on its current state
 *
 * @name MIP
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function MIP(props) {

	// State
	let [mips, mipsSet] = useState(null);
	let [transfer, transferSet] = useState(false);

	// Effects
	useEffect(() => {
		if(props.user) {
			mipsFetch();
		} else {
			mipsSet(null);
		}
	// eslint-disable-next-line
	}, [props.customerId, props.user]);

	// Fetch the mips
	function mipsFetch() {

		// Request the order info from the server
		Rest.read('monolith', 'customer/mips', {
			customerId: props.customerId
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// Set the MIPs
			mipsSet(res.data || 0);
		});
	}

	// Remove the claim
	function customerTransfer() {
		transferSet(false);
		Events.trigger('claimedRemove', parseInt(props.customerId, 10), true);
	}

	// If we don't have the MIP yet
	if(mips === null) {
		return <p style={{padding: '10px'}}>Loading...</p>
	}

	// Render
	return (
		<Box className="mips">
			<MIPs
				forms={mips === 0 ? [] : mips}
				mobile={props.mobile}
				oxytocin={true}
			/>
			<PreviousMeds
				customerId={props.customerId}
				patientId={props.patientId}
				pharmacyId={56387}
			/>
			<Grid container spacing={1} className="rta">
				<Grid item xs={6}>
					<Button
						color="secondary"
						onClick={props.onRemove}
						variant="contained"
					>Remove Claim</Button>
				</Grid>
				<Grid item xs={6}>
					<Button onClick={() => transferSet(true)} variant="contained">Transfer</Button>
				</Grid>
			</Grid>
			{transfer &&
				<Transfer
					agent={props.user.agent}
					customerId={props.customerId}
					onClose={() => transferSet(false)}
					onTransfer={customerTransfer}
				/>
			}
		</Box>
	);
}

// Valid props
MIP.propTypes = {
	customerId: PropTypes.string.isRequired,
	mobile: PropTypes.bool.isRequired,
	patientId: PropTypes.number.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
