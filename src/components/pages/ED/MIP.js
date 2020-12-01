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
import Hidden from '@material-ui/core/Hidden';
import Typography from '@material-ui/core/Typography';

// Composite components
import PreviousMeds from '../../composites/PreviousMeds';
import Transfer from '../../composites/Transfer';

// Element components
import { GreenButton, GreyButton } from '../../elements/Buttons';

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

// Mapping of full ED med names to variable names
const _ED_MEDS = {
	"Viagra (sildenafil)": 'viagra',
	"Cialis (tadalafil)": 'cialis',
	"Levitra (vardenafil)": 'levitra',
	"Other": 'other'
}

// Mapping of full condition names to variable names
const _CONDITIONS = {
	"Cardiovascular disease (Heart) (Excluding Blood Pressure)": 'cardiovascular',
	"Diabetes": 'diabetes',
	"Thyroid": 'thyroid',
	"Cholesterol": 'cholesterol',
	"Lung (Breathing)": 'lung',
	"Gastroesophageal reflux": 'reflux',
	"Attention deficit hyperactivity disorder (ADHD)": 'adhd',
	"Other": 'other'
}

/**
 * A1
 *
 * Primary MIP type for ED customers
 *
 * @name ATwo
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
function AOne(props) {
	return props.mip.questions.map(o =>
		<Box className="section">
			<Typography className="title">{o.title}</Typography>
			<Typography>{o.answer}</Typography>
		</Box>
	);
}

/**
 * A2
 *
 * Primary MIP type for ED customers
 *
 * @name ATwo
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
function ATwo(props) {

	// Avoid issues with missing questions
	function q(name) {
		if(!(name in props.mip.questions) || !props.mip.questions[name].answer) {
			console.log('MIP questions missing: ', name);
			return 'NO ANSWER!';
		}

		// Return the question's answer
		return props.mip.questions[name].answer;
	}

	// Render
	return (
		<React.Fragment>
			<Box className="section">
				<Grid container spacing={1}>
					<Grid item xs={6} md={3}><Typography><strong>Gender: </strong>{q('gender')}</Typography></Grid>
					<Grid item xs={6} md={3}><Typography><strong>Age: </strong>{Utils.age(new Date(q('birthdate') + 'T00:00:00'))}</Typography></Grid>
					<Grid item xs={6} md={3}><Typography><strong>Height: </strong>{q('height').replace(' ft', "'").replace(' in', '"')}</Typography></Grid>
					<Grid item xs={6} md={3}><Typography><strong>Weight: </strong>{q('weight')} lbs</Typography></Grid>
				</Grid>
			</Box>
			<Box className="section">
				<Typography className="title">Previous ED Medication</Typography>
				{q('treatedForED') === 'No' ?
					<Typography className="no">No</Typography>
				:
					<Grid container spacing={1}>
						{q('prescribedMeds').split('|').map(s => {
							let v = _ED_MEDS[s];
							let m = s === 'Other' ? q('prescribedMeds_other') : s;
							return (
								<React.Fragment key={v}>
									<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>{m}</strong></Typography></Grid>
									<Grid item xs={12} sm={8} md={9} lg={10}>
										<Typography>{q(v + 'MedsDose')}</Typography>
										<Typography>
											{q(v + 'SideEffects') === 'No' ?
												'No side effects'
											:
												q(v + 'SideEffectsDescription').split('|').join(', ') +
												(q(v + 'SideEffectsDescription_other') !== '' ?
													(' | ' + q(v + 'SideEffectsDescription_other')) :
													''
												)
											}
										</Typography>
										{q(v + 'StopTakingIt') === 'Yes' &&
											<Typography>No longer taking | {q(v + 'WhyStopTaking')}</Typography>
										}
									</Grid>
								</React.Fragment>
							);
						})}
					</Grid>
				}
			</Box>
			{q('deathNitrates') !== 'None Apply' &&
				<Box className="section">
					<Typography className="title">Nitrate Medications</Typography>
					<Typography>{q('deathNitrates')} | {q('NitrateMed')}</Typography>
				</Box>
			}
			{q('deathRecreationalDrugs') !== 'None Apply' &&
				<Box className="section">
					<Typography className="title">Recreational Drug Use</Typography>
					<Grid container spacing={1}>
						<Grid item xs={2}><strong>{q('deathRecreationalDrugs')}: </strong></Grid>
						<Grid item xs={10}>{q('recreationalUse')}</Grid>
					</Grid>
				</Box>
			}
			<Box className="section">
				<Typography className="title">Blood Pressure</Typography>
				<Typography>{q('bloodPressure')}</Typography>
				{q('bloodPressure') === 'Controlled with Medicine' &&
					<Typography>{q('bloodPressureMedication').split('|').join(', ')}</Typography>
				}
				{q('bloodPressureMedication') === 'Other' &&
					<Typography>{q('bloodPressureMedication_other')}</Typography>
				}
			</Box>
			{q('overTheCounterDrugs') === 'Yes' &&
				<Box className="section">
					<Typography className="title">Other Prescriptions or Over The Counter Medication</Typography>
					<Grid container spacing={1}>
						{q('conditionsTreated').split('|').map(s => {
							let v = _CONDITIONS[s];
							let m = s === 'Other' ? q('conditionsTreated_other') : s;
							return (
								<React.Fragment key={v}>
									<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>{m}</strong></Typography></Grid>
									<Grid item xs={12} sm={8} md={9} lg={10}>
										<Typography>
											{q(v + 'Medication').split('|').map(s =>
												s === 'Other' ? 
													(v === 'Other' ?
														'' :
														q(v + 'Medication_other')
													) : s
											).join(', ')}
										</Typography>
										{v === 'diabetes' && q('diabetesLevel') !== '' &&
											<Typography>{q('diabetesLevel')}</Typography>
										}
									</Grid>
								</React.Fragment>
							);
						})}
					</Grid>
				</Box>
			}
			{q('allergies').toLowerCase() !== 'none' &&
				<Box className="section">
					<Typography className="title">Medication Allergies</Typography>
					<Typography>{q('allergies')}</Typography>
				</Box>
			}
			{q('malePatternBaldness') === 'Yes' && q('malePatternBaldnessDrugs') !== 'None of the above' &&
				<Box className="section">
					<Typography className="title">Drug for Baldness</Typography>
					<Typography>{q('malePatternBaldnessDrugs')}</Typography>
				</Box>
			}
			{(q('additionalMeds').toLowerCase() !== 'none' || q('additionalDetails').toLowerCase() !== 'no') &&
				<Box className="section">
					<Typography className="title">Other Medical / Medicinal mentions</Typography>
					{q('additionalMeds') !== 'None' &&
						<Typography>{q('additionalMeds')}</Typography>
					}
					{q('additionalDetails') !== 'None' &&
						<Typography>{q('additionalDetails')}</Typography>
					}
				</Box>
			}
			<Box className="section">
				<Typography className="title">ED Details</Typography>
				<Grid container spacing={1} className="mipEdDetails">
					<Hidden mdDown>
						<Grid item lg={1}>&nbsp;</Grid>
					</Hidden>
					<Grid item xs={12} md={4} lg={2}>
						<Typography><strong>Confidence</strong></Typography>
						<Typography>{q('erectionConfidence')}</Typography>
					</Grid>
					<Grid item xs={12} md={4} lg={2}>
						<Typography><strong>Penetration</strong></Typography>
						<Typography>{q('erectionHardnessBefore')}</Typography>
					</Grid>
					<Grid item xs={12} md={4} lg={2}>
						<Typography><strong>Maintained</strong></Typography>
						<Typography>{q('erectionHardnessAfter')}</Typography>
					</Grid>
					<Grid item xs={12} md={4} lg={2}>
						<Typography><strong>Difficulty</strong></Typography>
						<Typography>{q('erectionCompletion')}</Typography>
					</Grid>
					<Grid item xs={12} md={4} lg={2}>
						<Typography><strong>Satisfactory</strong></Typography>
						<Typography>{q('sexSatisfaction')}</Typography>
					</Grid>
					<Hidden mdDown>
						<Grid item lg={1}>&nbsp;</Grid>
					</Hidden>
				</Grid>
			</Box>
			{props.oxytocin &&
				<Box className="section">
					<Typography className="title">Oxytocin</Typography>
					<Grid container spacing={1}>
						<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>Increased Intensity</strong></Typography></Grid>
						<Grid item xs={12} sm={8} md={9} lg={10}>{q('betterAfterED')}</Grid>
						<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>Increased Intimacy</strong></Typography></Grid>
						<Grid item xs={12} sm={8} md={9} lg={10}>{q('increasedIntimacy')}</Grid>
						<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>Migraines?</strong></Typography></Grid>
						<Grid item xs={12} sm={8} md={9} lg={10}>{q('sufferFrom')}</Grid>
						<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>Migraine Cause</strong></Typography></Grid>
						<Grid item xs={12} sm={8} md={9} lg={10}>{q('headacheCause')}</Grid>
						<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>Haloperidol?</strong></Typography></Grid>
						<Grid item xs={12} sm={8} md={9} lg={10}>{q('haloperidol')}</Grid>
						<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>Misoprostol?</strong></Typography></Grid>
						<Grid item xs={12} sm={8} md={9} lg={10}>{q('misoprostol')}</Grid>
					</Grid>
				</Box>
			}
		</React.Fragment>
	);
}

/**
 * Continuous ED
 *
 * Displays follow up questions/answers for an customer who already had a
 * prescription
 *
 * @name CED
 * @access private
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
function CED(props) {

	// Avoid issues with missing questions
	function q(name) {
		if(!(name in props.mip.questions) || !props.mip.questions[name].answer) {
			console.log('MIP questions missing: ', name);
			return 'NO ANSWER!';
		}

		// Return the question's answer
		return props.mip.questions[name].answer;
	}

	// Render
	return (
		<React.Fragment>
			<Box className="section">
				<Typography className="title">Did the prescriber medication work?</Typography>
				<Typography>{q('medicationEffectiveness')}</Typography>
			</Box>
			<Box className="section">
				<Typography className="title">Were there side-effects?</Typography>
				<Typography>{q('sideEffectsCED') === 'Yes' ? q('sideEffectsTextCED') : 'No' }</Typography>
			</Box>
			<Box className="section">
				<Typography className="title">Change in medical conditions</Typography>
				<Typography>{q('medicalChangesCED') === 'Yes' ? q('medicalChangesTextCED') : 'No' }</Typography>
			</Box>
			<Box className="section">
				<Typography className="title">Change in medications</Typography>
				<Typography>{q('medicationChangesCED') === 'Yes' ? q('medicationChangesTextCED') : 'No' }</Typography>
			</Box>
			<Box className="section">
				<Typography className="title">Chest pains or shortness of breath</Typography>
				<Typography>{q('cpsobCED')}</Typography>
			</Box>
		</React.Fragment>
	);
}

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
			lMips[iIndex].display = true;

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
		Rest.update('monolith', 'order/approve', {
			orderId: props.order.orderId,
			soap: refSOAP.current.value
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				if(res.error.code === 1103) {
					Events.trigger('error', 'Failed to update order status in Konnektive, please try again or contact support');
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
		Rest.update('monolith', 'order/decline', {
			orderId: props.order.orderId
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				if(res.error.code === 1103) {
					Events.trigger('error', 'Failed to update order status in Konnektive, please try again or contact support');
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
				Claimed.remove(props.customerId, 'decline').then(res => {
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
		Claimed.remove(props.customerId, 'transfer').then(res => {
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
	let bTreatedForEd = false;

	if(mips !== 0) {
		for(let o of props.order.items) {
			if(o.description.toLowerCase().search('oxytocin') > -1) {
				bOxytocin = true;
				break;
			}
		}
		for(let o of mips) {
			if(o.form === 'MIP-CED' ||
				(o.form === 'MIP-A2' && o.questions['treatedForED'].answer === 'Yes')) {
				bTreatedForEd = true;
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
						case 'MIP-A1': Child = AOne; break;
						case 'MIP-A2': Child = ATwo; break;
						case 'MIP-CED': Child = CED; break;
						default: throw new Error('Invalid MIP form type');
					}
					return (
						<Box className="mip">
							<Box className="section header">
								<Typography className="title">
									{o.form} - {Utils.niceDate(o.date, props.mobile ? 'short' : 'long')}
									{!o.display &&
										<span> - <GreyButton variant="outlined" onClick={() => mipDisplay(o.id)}>Display</GreyButton></span>
									}
								</Typography>
							</Box>
							{o.display &&
								<Child key={o.id} mip={o} oxytocin={bOxytocin} />
							}
						</Box>
					);
				})
			}
			<PreviousMeds
				customerId={props.customerId}
				patientId={props.patientId}
			/>
			<SOAP
				order={props.order}
				ref={refSOAP}
				treated={bTreatedForEd}
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
