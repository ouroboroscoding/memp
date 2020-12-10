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
import Typography from '@material-ui/core/Typography';

// Composite components
import A1 from '../../composites/MIPs/A1';
import A2 from '../../composites/MIPs/A2';
import CED from '../../composites/MIPs/CED';
import PreviousMeds from '../../composites/PreviousMeds';
import Transfer from '../../composites/Transfer';

// Element components
import { GreenButton } from '../../elements/Buttons';

// Sibling components
import SOAP from './SOAP';

// Data modules
import Claimed from '../../../data/claimed';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';
import { afindi, clone } from '../../../generic/tools';

// Local modules
import Utils from '../../../utils';

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

	// Display a hidden mip
	function mipDisplay(id) {

		// Find the mip
		let iIndex = afindi(mips, 'id', id);

		// If found
		if(iIndex > -1) {

			// Clone the mips
			let lMips = clone(mips);

			// Change the display
			lMips[iIndex].display = !lMips[iIndex].display;

			// Set the new state
			mipsSet(lMips);
		}
	}

	// Fetch the mips
	function mipsFetch() {

		// Request the order info from the server
		Rest.read('monolith', 'customer/mips', {
			customerId: props.customerId,
			form: ['MIP-A1', 'MIP-A2', 'MIP-CED']
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Go through each landing
				for(let i in res.data) {

					// Set the display
					res.data[i].display = (i === '0');

					// If it's an A2 or CED
					if(['MIP-A2', 'MIP-CED'].includes(res.data[i].form)) {

						// Store the questions by ref
						let oQuestions = {}
						for(let o of res.data[i].questions) {
							oQuestions[o.ref] = {
								title: o.title,
								answer: o.answer
							}
						}
						res.data[i].questions = oQuestions;
					}
				}

				// Set the state
				mipsSet(res.data);
			}

			// No MIPs
			else {
				mipsSet(0);
			}
		});
	}

	// Approve the order we're on
	function orderApprove() {

	}

	// Decline the order we're on
	function orderDecline() {

	}

	// Remove the claim
	function orderTransfer() {
		Claimed.remove(props.customerId, 'transferred').then(res => {
			Events.trigger('claimedRemove', parseInt(props.customerId, 10), true);
		}, error => {
			Events.trigger('error', JSON.stringify(error));
		});
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
			{mips === 0 ?
				<Box className="mip">
					<Box className="section header">
						<Typography className="title">No MIP(s) found for customer</Typography>
					</Box>
				</Box>
			:
				mips.map(o => {
					let Child = null;
					switch(o.form) {
						case 'MIP-A1': Child = A1; break;
						case 'MIP-A2': Child = A2; break;
						case 'MIP-CED': Child = CED; break;
						default: throw new Error('Invalid MIP form type');
					}
					return <Child
								key={o.id}
								mobile={props.mobile}
								onChange={() => mipDisplay(o.id)}
								oxytocin={bOxytocin}
								{...o}
							/>
				})
			}
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
			<Grid container spacing={1} className="rta">
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
	onApprove: PropTypes.func.isRequired,
	order: PropTypes.object.isRequired,
	patientId: PropTypes.number.isRequired,
	user: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]).isRequired
}