/**
 * Transfer
 *
 * Handles transfer dialog
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

/**
 * Transfer
 *
 * Handles dialog for transferring a customer to a CS agent
 *
 * @name Transfer
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function Transfer(props) {

	// State
	let [agents, agentsSet] = useState([]);
	let [agent, agentSet] = useState(props.agent.toString());
	let [note, noteSet] = useState('');
	let [ticket, ticketSet] = useState(null);

	// Load Effect
	useEffect(() => {
		agentsFetch();
		ticketSet(Tickets.current());
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Fetch agents we can transfer to
	function agentsFetch() {

		// Make the request to the service
		Rest.read('csr', 'agent/names', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', Rest.errorMessage(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we're ok
			if(res.data) {
				agentsSet(res.data);
			}
		});
	}

	// Submite notes / resolve conversation
	function submitTicket() {

		// If there's no ticket
		if(ticket === null) {

			// Create the ticket
			Tickets.create(
				props.customerPhone,
				props.customerId.toString(),
				'Provider'
			).then(data => {

				// Submit the claim transfer
				submitTransfer(data);

			}, error => {
				Events.trigger('error', Rest.errorMessage(error));
			});
		} else {

			// Add the action to the existing ticket
			Tickets.action('Transferred', 'Agent/PA Required');

			// Submit the claim transfer
			submitTransfer(ticket);
		}
	}

	// Submit Transfer
	function submitTransfer(ticket_id) {

		// Transfer the claim
		Claimed.transfer(ticket_id, props.customerId, parseInt(agent, 10), note).then(data => {

			// Remove the claim
			Events.trigger('claimedRemove', parseInt(props.customerId, 10), true);

			// Add the item to the ticket
			Tickets.item('note', data, ticket_id);

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
			<DialogTitle id="confirmation-dialog-title">Transfer</DialogTitle>
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
						<InputLabel htmlFor="transfer-agent">Transfer To</InputLabel>
						<Select
							inputProps={{
								id: 'transfer-agent',
							}}
							label="Transfer To"
							native
							onChange={ev => agentSet(ev.target.value)}
							value={agent}
						>
							<option value="0">Auto-Select Available Agent</option>
							{agents.map(o =>
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
				{note.trim() !== '' &&
					<Button variant="contained" color="primary" onClick={submitTicket}>
						Transfer
					</Button>
				}
			</DialogActions>
		</Dialog>
	);
}

// Valid props
Transfer.propTypes = {
	agent: PropTypes.number.isRequired,
	customerId: PropTypes.number.isRequired,
	customerPhone: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired,
	onTransfer: PropTypes.func.isRequired
}
