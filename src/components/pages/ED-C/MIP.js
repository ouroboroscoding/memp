/**
 * Continuous ED MIP
 *
 * Handles fetching the correct MIP and displaying the relevant data
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-11-03
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';

// Composite components
import MIPs from 'components/composites/MIPs';
import PreviousMeds from 'components/composites/PreviousMeds';
import SOAP from 'components/composites/ED-SOAP';
import Transfer from 'components/composites/Transfer';

// Element components
import { GreenButton } from 'components/elements/Buttons';

// Data modules
import Claimed from 'data/claimed';

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

	// Refs
	let refSOAP = useRef();

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
			customerId: props.customerId,
			form: ['MIP-A1', 'MIP-A2', 'MIP-CED', 'MIP-H1', 'MIP-H2']
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

	// Approve the order we're on
	function orderApprove() {
		Rest.update('monolith', 'order/continuous/approve', {
			customerId: props.customerId,
			orderId: props.order.orderId,
			soap: refSOAP.current.value
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				if(res.error.code === 1515) {
					Events.trigger('error', 'Order no longer PENDING');
					props.onReload()
				} else {
					Events.trigger('error', JSON.stringify(res.error));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {
				props.onApprove();
			}
		});
	}

	// Decline the order we're on
	function orderDecline() {
		Rest.update('monolith', 'order/continuous/decline', {
			customerId: props.customerId,
			orderId: props.order.orderId,
			reason: 'Medical'
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				if(res.error.code === 1103) {
					Events.trigger('error', 'Failed to cancel purchase in Konnektive, please try again or contact support');
				} else if(res.error.code === 1515) {
					Events.trigger('error', 'Order no longer PENDING');
					props.onReload()
				} else {
					Events.trigger('error', JSON.stringify(res.error));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Remove the claim
				Claimed.remove(props.customerId, 'declined').then(res => {
					Events.trigger('claimedRemove', parseInt(props.customerId, 10), true);
					Events.trigger('success', 'Order Declined!');
				}, error => {
					Events.trigger('error', JSON.stringify(error));
				});
			}
		});
	}

	// Remove the claim
	function orderTransfer() {
		transferSet(false);
		Events.trigger('claimedRemove', parseInt(props.customerId, 10), true);
	}

	// If we don't have the MIP yet
	if(mips === null) {
		return <p style={{padding: '10px'}}>Loading...</p>
	}

	// Check for oxytocin and treated for ED
	let bOxytocin = false;

	if(mips !== 0) {
		for(let o of props.order.items) {
			if(o.description.toLowerCase().search('oxytocin') > -1) {
				bOxytocin = true;
				break;
			}
		}
	}

	// Render
	return (
		<Box className="mips">
			<Box className="scroll">
				<MIPs
					forms={mips === 0 ? [] : mips}
					mobile={props.mobile}
					oxytocin={bOxytocin}
				/>
				<PreviousMeds
					customerId={props.customerId}
					patientId={props.patientId}
					pharmacyId={56387}
				/>
				<SOAP
					order={props.order}
					ref={refSOAP}
					treated={true}
				/>
			</Box>
			<Box className="rta">
				<Grid container>
					<Grid item xs={4}>
						<Button color="secondary" onClick={orderDecline} variant="contained">Decline</Button>
					</Grid>
					<Grid item xs={4}>
						<Button onClick={() => transferSet(true)} variant="contained">Transfer</Button>
					</Grid>
					<Grid item xs={4}>
						<GreenButton onClick={orderApprove} variant="contained">Approve</GreenButton>
					</Grid>
				</Grid>
			</Box>
			{transfer &&
				<Transfer
					agent={props.user.agent}
					customerId={props.customerId}
					onClose={() => transferSet(false)}
					onTransfer={orderTransfer}
				/>
			}
		</Box>
	);
}

// Valid props
MIP.propTypes = {
	customerId: PropTypes.string.isRequired,
	mobile: PropTypes.bool.isRequired,
	onApprove: PropTypes.func.isRequired,
	onReload: PropTypes.func.isRequired,
	order: PropTypes.object.isRequired,
	patientId: PropTypes.number.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
