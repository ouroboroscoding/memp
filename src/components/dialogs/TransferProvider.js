/**
 * Transfer Provider
 *
 * Handles transfer dialog from provider to provider
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-11-20
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';

// Data modules
import Claimed from 'data/claimed';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared data modules
import Tickets from 'shared/data/tickets';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindi } from 'shared/generic/tools';

/**
 * TransferProvider
 *
 * Handles dialog for transferring a customer to another Provider
 *
 * @name TransferProvider
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function TransferProvider(props) {

	// State
	let [providers, providersSet] = useState([]);
	let [provider, providerSet] = useState('');
	let [note, noteSet] = useState('');

	// Load Effect
	useEffect(() => {
		providersFetch();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Fetch providers we can transfer to
	function providersFetch() {

		// Make the request to the service
		Rest.read('providers', 'provider/names', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we're ok
			if(res.data) {

				// Look for the current provider
				let iIndex = afindi(res.data, 'memo_id', props.user.id);

				// If it exists, remove it
				if(iIndex > -1) {
					res.data.splice(iIndex, 1);
				}

				// Set the list
				providersSet(res.data);
			}
		});
	}

	// Submit Transfer
	function submitTransfer(ticket_id) {

		// Transfer the claim
		Claimed.transfer(props.customerId, parseInt(provider, 10), note).then(data => {

			// Remove the claim
			Events.trigger('claimedRemove', parseInt(props.customerId, 10), true);

			// Add the Note to the current ticket (if there is one)
			if(Tickets.current()) {
				Tickets.item('note', 'outgoing', data, props.user.id);
			}

			// Notify the parent
			props.onTransfer();

		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	// Render
	return (
		<Dialog
			fullWidth={true}
			maxWidth="sm"
			open={true}
			onClose={props.onClose}
			PaperProps={{
				className: "resolve"
			}}
		>
			<DialogTitle id="confirmation-dialog-title">Transfer to Provider</DialogTitle>
			<DialogContent dividers>
				<Box className="field">
					<TextField
						label="Issue Details"
						multiline
						onChange={ev => noteSet(ev.currentTarget.value)}
						rows="4"
						value={note}
						variant="outlined"
					/>
				</Box>
				<br />
				<Box className="field">
					<FormControl variant="outlined">
						<InputLabel htmlFor="transfer-provider">Transfer To</InputLabel>
						<Select
							inputProps={{
								id: 'transfer-provider',
							}}
							label="Transfer To"
							native
							onChange={ev => providerSet(ev.target.value)}
							value={provider}
						>
							<option aria-label="None" value="" />
							{providers.map(o =>
								<option key={o.memo_id} value={o.memo_id}>{o.firstName + ' ' + o.lastName}</option>
							)}
						</Select>
					</FormControl>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="secondary" onClick={props.onClose}>
					Cancel
				</Button>
				{provider !== '0' && note.trim() !== '' &&
					<Button variant="contained" color="primary" onClick={submitTransfer}>
						Transfer
					</Button>
				}
			</DialogActions>
		</Dialog>
	);
}

// Valid props
TransferProvider.propTypes = {
	customerId: PropTypes.number.isRequired,
	onClose: PropTypes.func.isRequired,
	onTransfer: PropTypes.func.isRequired,
	user: PropTypes.object.isRequired
}
