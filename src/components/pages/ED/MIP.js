/**
 * ED MIP
 *
 * Handles fetching the correct MIP and displaying the relevant data
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-31
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
import SOAP from 'components/composites/ED-SOAP';

// Dialog components
import TransferAgent from 'components/dialogs/TransferAgent';
import TransferProvider from 'components/dialogs/TransferProvider';

// Element components
import { GreenButton } from 'components/elements/Buttons';

// Data modules
import Claimed from 'data/claimed';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared data modules
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindo } from 'shared/generic/tools';

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
				Events.trigger('error', Rest.errorMessage(res.error));
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
		Rest.update('monolith', 'order/approve', {
			customerId: props.order.customerId,
			orderId: props.order.orderId,
			soap: refSOAP.current.value
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				if(res.error.code === 1103) {

					// Create a ticket
					Tickets.create(props.order.phone, props.customerId, 'Provider').then(ticket_id => {

						// Auto transfer the order to an agent
						Claimed.transferToAgent(ticket_id, props.customerId, 0, res.error.msg).then(res => {
							Events.trigger('claimedRemove', parseInt(props.customerId, 10), true);
							Events.trigger('error', 'Failed to update order status, order was transferred to an Agent');
						}, error => {
							Events.trigger('error', Rest.errorMessage(error));
						});

					}, error => {
						Events.trigger('error', Rest.errorMessage(error));
					});

				} else {
					Events.trigger('error', Rest.errorMessage(res.error));
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Notify provider
				Events.trigger('success', 'Order approved, please create prescriptions.');

				// Notify parent
				props.onApprove();
			}
		});
	}

	// Decline the order we're on
	function orderDecline() {
		Rest.update('monolith', 'order/decline', {
			orderId: props.order.orderId,
			reason: 'Medical'
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				if(res.error.code === 1103) {
					Events.trigger('error', 'Failed to update order status in Konnektive, please try again or contact support');
				} else {
					Events.trigger('error', Rest.errorMessage(res.error));
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
					Events.trigger('error', Rest.errorMessage(error));
				});
			}
		});
	}

	// If we don't have the MIP yet
	if(mips === null) {
		return <p style={{padding: '10px'}}>Loading...</p>
	}

	// Check for oxytocin and treated for ED
	let bOxytocin = false;
	let bTreatedForEd = false;

	if(mips !== 0) {
		for(let o of props.order.items) {
			if(o.description.toLowerCase().search('oxytocin') > -1) {
				bOxytocin = true;
				break;
			}
		}
		for(let o of mips) {
			if(o.form === 'MIP-A2') {
				let q = afindo(o.questions, 'ref', 'treatedForED');
				if(q && q.answer === 'Yes') {
					bTreatedForEd = true;
					break;
				}
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
				<SOAP
					order={props.order}
					ref={refSOAP}
					treated={bTreatedForEd}
				/>
			</Box>
			<Box className="rta">
				<Grid container spacing={1}>
					<Grid item xs={3}>
						<Button color="secondary" onClick={orderDecline} variant="contained">Decline</Button>
					</Grid>
					<Grid item xs={3}>
						<Button onClick={() => transferSet('agent')} variant="contained">To Support</Button>
					</Grid>
					<Grid item xs={3}>
						<Button onClick={() => transferSet('provider')} variant="contained">To Provider</Button>
					</Grid>
					<Grid item xs={3}>
						<GreenButton onClick={orderApprove} variant="contained">Approve</GreenButton>
					</Grid>
				</Grid>
			</Box>
			{transfer === 'agent' &&
				<TransferAgent
					agent={props.user.agent}
					customerId={props.customerId}
					customerPhone={props.order.phone}
					onClose={() => transferSet(false)}
					onTransfer={() => transferSet(false)}
					user={props.user}
				/>
			}
			{transfer === 'provider' &&
				<TransferProvider
					customerId={props.customer.customerId}
					onClose={() => transferSet(false)}
					onTransfer={() => transferSet(false)}
					user={props.user}
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
	order: PropTypes.object.isRequired,
	patientId: PropTypes.number.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}
