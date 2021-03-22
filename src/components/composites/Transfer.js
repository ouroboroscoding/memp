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
import React, { useEffect, useRef, useState } from 'react';

// Material UI
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

// Shared generic modules
import Events from 'shared/generic/events';
import { omap } from 'shared/generic/tools';

// Transfer
export default function Transfer(props) {

	// State
	let [agents, agentsSet] = useState({});
	let [agent, agentSet] = useState(props.agent);

	// Refs
	let refNote = useRef();

	// Load Effect
	useEffect(() => {
		agentsFetch();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Fetch agents we can transfer to
	function agentsFetch() {

		// Make the request to the service
		Rest.read('csr', 'agent/names', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
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
	function submit() {

		// Check for notes
		let content = (refNote.current.value).trim();
		if(content === '') {
			Events.trigger('error', 'Please add a note for the Agent to explain the issue.');
			return;
		}

		// Transfer the claim
		Claimed.transfer(props.customerId, agent, content).then(res => {
			props.onTransfer();
		}, error => {
			Events.trigger('error', JSON.stringify(error));
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
				<p><TextField
					label="Note"
					multiline
					inputRef={refNote}
					rows="4"
					variant="outlined"
				/></p>
				<p><FormControl variant="outlined">
					<InputLabel htmlFor="transfer-agent">Transfer To</InputLabel>
					<Select
						inputProps={{
							id: 'transfer-agent',
						}}
						label="Transfer To"
						native
						onChange={ev => agentSet(parseInt(ev.currentTarget.value))}
						value={agent.toString()}
					>
						<option value="0">Auto-Select Available Agent</option>
						{omap(agents, (o,k) =>
							<option key={k} value={k}>{o.firstName + ' ' + o.lastName}</option>
						)}
					</Select>
				</FormControl></p>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="secondary" onClick={props.onClose}>
					Cancel
				</Button>
				<Button variant="contained" color="primary" onClick={submit}>
					Transfer
				</Button>
			</DialogActions>
		</Dialog>
	);
}

// Valid props
Transfer.propTypes = {
	agent: PropTypes.number.isRequired,
	customerId: PropTypes.number.isRequired,
	onClose: PropTypes.func.isRequired,
	onTransfer: PropTypes.func.isRequired
}
