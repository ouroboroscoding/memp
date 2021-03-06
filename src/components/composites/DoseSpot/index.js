/**
 * ED RX
 *
 * Handles creating, fetching, selecting and entering prescriptions for the
 * patient based on an approved order
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-11-12
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

// Dialog components
import TransferAgent from 'components/dialogs/TransferAgent';
import TransferProvider from 'components/dialogs/TransferProvider';

// Local components
import PatientCreate from './PatientCreate';
import Prescriptions from './Prescriptions';
import Verify from './Verify';

// Data modules
import Claimed from 'data/claimed';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared data modules
import DS from 'shared/data/dosespot';
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';

/**
 * DoseSpot
 *
 * Displays DoseSpot info
 *
 * @name DoseSpot
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function DoseSpot(props) {

	// State
	let [mode, modeSet] = useState(props.initialMode);
	let [transfer, transferSet] = useState(false);
	let [sso, ssoSet] = useState(false);

	// Patient ID effect
	useEffect(() => {

		// If we have an ID
		if(props.patientId) {
			if(mode === 'sso') {
				ssoFetch();
			}
		} else {
			ssoSet(false);
		}

	// eslint-disable-next-line
	}, [props.patientId, mode]);

	function prescriptionsCreated() {
		modeSet('sso');
	}

	// Close the SSO iframe and fetch prescriptions
	function ssoClose() {
		ssoSet(false);
		modeSet('verify');
	}

	// Fetch the single sign-on link for DoseSpot
	function ssoFetch() {
		DS.sso(props.patientId).then(res => {
			ssoSet(res);
		}, error => {
			if(error.code === 1602) {
				Events.trigger('error', 'DoseSpot error: "' + error.msg + '"')
			} else {
				Events.trigger('error', Rest.errorMessage(error));
			}
		});
	}

	function verified() {

		// Convert the customer ID to an int
		let iCustID = parseInt(props.customer.customerId, 10);

		// If we have a ticket
		if(Tickets.current()) {

			// Resolve the ticket
			Tickets.resolve('Resolved', 'Provider Confirmed Prescription');
		}

		// We can successfully close this claim
		Claimed.remove(iCustID, 'approved').then(res => {
			Events.trigger('claimedRemove', iCustID, true);
			Events.trigger('success', 'Prescriptions verified and confirmed. Thank you!');
		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	// Init content
	let Content = null;

	// If we are still fetching the customer's DoseSpot patient ID
	if(props.patientId === -1) {
		Content = <Typography>Loading...</Typography>
	}

	// Else, if the customer has no DoseSpot patient ID yet
	else if(props.patientId === 0) {
		Content = (
			<PatientCreate
				customerId={props.customer.customerId}
				onCreated={id => Events.trigger('patientCreate', id)}
				onRemove={props.onRemove}
				onTransfer={type => transferSet(type)}
			/>
		);
	}

	// Else, the customer has a DoseSpot patient ID
	else {

		// If we are showing the SSO
		if(mode === 'sso') {
			Content = sso ? (
				<Box className="sso">
					<iframe title={"DoseSpot SSO - " + props.patientId} src={sso} />
					<Box className="close">
						<Button
							color="primary"
							onClick={ssoClose}
							variant="contained"
						>Close DoseSpot and reload RX</Button>
					</Box>
				</Box>
			) : (
				<Typography>Fetching SSO...</Typography>
			);
		}

		// Else, if we're verifying
		else if(mode === 'verify') {
			Content = <Verify
				customer={props.customer}
				existing={props.existing}
				onSSO={() => modeSet('sso')}
				onRemove={props.onRemove}
				onTransfer={type => transferSet(type)}
				onVerified={verified}
				patientId={props.patientId}
			/>
		}

		// Else, if we're in create mode
		else if(mode === 'create') {
			Content = <Prescriptions
				customer={props.customer}
				patientId={props.patientId}
				onRemove={props.onRemove}
				onTransfer={type => transferSet(type)}
				onCreated={prescriptionsCreated}
			/>
		}
	}

	// Render
	return (
		<Box id="DoseSpot">
			{Content}
			{transfer === 'agent' &&
				<TransferAgent
					agent={props.user.agent}
					customerId={props.customer.customerId}
					customerPhone={props.customer.phone}
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
	)
}

// Valid props
DS.propTypes = {
	customer: PropTypes.object.isRequired,
	initialMode: PropTypes.oneOf(['create', 'sso', 'verify']).isRequired,
	mobile: PropTypes.bool.isRequired,
	onRemove: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
	patientId: PropTypes.number.isRequired,
	type: PropTypes.oneOf(['ed', 'hrt']).isRequired,
	user: PropTypes.object.isRequired
}

// Default props
DS.defaultProps = {
	onRemove: false
}
