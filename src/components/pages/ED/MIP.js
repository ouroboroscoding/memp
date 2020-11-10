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
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import Typography from '@material-ui/core/Typography';

// Composite components
import PreviousMeds from '../../composites/PreviousMeds';

// Sibling components
import SOAP from './SOAP';

// Generic modules
import Events from '../../../generic/events';
import Rest from '../../../generic/rest';

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
	let [mip, mipSet] = useState(null);
	let [patient, patientSet] = useState(0);

	// Refs
	let refSOAP = useRef();

	// Effects
	useEffect(() => {
		fetchMIP();
		fetchPatientId();
		// eslint-disable-next-line
	}, [props.customerId]);

	// Fetch the mip
	function fetchMIP() {

		// Request the order info from the server
		Rest.read('monolith', 'customer/mip', {
			customerId: props.customerId,
			form: ['MIP-A1', 'MIP-A2']
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {

				// Store the questions by ref
				let oQuestions = {}
				for(let o of res.data.questions) {
					oQuestions[o.ref] = {
						title: o.title,
						answer: o.answer
					}
				}
				res.data.questions = oQuestions
				console.log(res.data.questions);

				// Set the state
				mipSet(res.data);
			}
		});
	}

	// Fetch the customer's DoseSpot patient ID
	function fetchPatientId() {

		// Request the order info from the server
		Rest.read('monolith', 'customer/dsid', {
			customerId: props.customerId
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if(res.data) {
				patientSet(res.data);
			}
		});
	}

	// If we don't have the MIP yet
	if(mip === null) {
		return <p>Loading...</p>
	}

	// If we got no MIP
	if(mip === 0) {
		return <p>No MIP found for customer!</p>
	}

	// Shorten
	let q = mip.questions;

	// Check for oxytocin
	let bOxytocin = false;
	for(let o of props.order.items) {
		if(o.description.toLowerCase().search('oxytocin') > -1) {
			bOxytocin = true;
			break;
		}
	}

	// Render
	return (
		<Box className="mipCurrent">
			<Box className="section">
				{/*<Typography className="title">Details</Typography>*/}
				<Grid container spacing={1}>
					<Grid item xs={6} md={3}><Typography><strong>Gender: </strong>{q['gender'].answer}</Typography></Grid>
					<Grid item xs={6} md={3}><Typography><strong>Age: </strong>{Utils.age(new Date(q['birthdate'].answer + 'T00:00:00'))}</Typography></Grid>
					<Grid item xs={6} md={3}><Typography><strong>Height: </strong>{q['height'].answer.replace(' ft', "'").replace(' in', '"')}</Typography></Grid>
					<Grid item xs={6} md={3}><Typography><strong>Weight: </strong>{q['weight'].answer} lbs</Typography></Grid>
				</Grid>
			</Box>
			<Box className="section">
				<Typography className="title">Previous ED Medication</Typography>
				{q['treatedForED'].answer === 'No' ?
					<Typography className="no">No</Typography>
				:
					<Grid container spacing={1}>
						{q['prescribedMeds'].answer.split('|').map(s => {
							let v = _ED_MEDS[s];
							let m = s === 'Other' ? q['prescribedMeds_other'].answer : s;
							return (
								<React.Fragment key={v}>
									<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>{m}</strong></Typography></Grid>
									<Grid item xs={12} sm={8} md={9} lg={10}>
										<Typography>{q[v + 'MedsDose'].answer}</Typography>
										<Typography>
											{q[v + 'SideEffects'].answer === 'No' ?
												'No side effects'
											:
												q[v + 'SideEffectsDescription'].answer.split('|').join(', ') +
												(q[v + 'SideEffectsDescription_other'].answer !== '' ?
													(' | ' + q[v + 'SideEffectsDescription_other'].answer) :
													''
												)
											}
										</Typography>
										{q[v + 'StopTakingIt'].answer === 'Yes' &&
											<Typography>No longer taking | {q[v + 'WhyStopTaking'].answer}</Typography>
										}
									</Grid>
								</React.Fragment>
							);
						})}
					</Grid>
				}
			</Box>
			{q['deathNitrates'].answer !== 'None Apply' &&
				<Box className="section">
					<Typography className="title">Nitrate Medications</Typography>
					<Typography>{q['deathNitrates'].answer} | {q['NitrateMed'].answer}</Typography>
				</Box>
			}
			{q['deathRecreationalDrugs'].answer !== 'None Apply' &&
				<Box className="section">
					<Typography className="title">Recreational Drug Use</Typography>
					<Grid container spacing={1}>
						<Grid item xs={2}><strong>{q['deathRecreationalDrugs'].answer}: </strong></Grid>
						<Grid item xs={10}>{q['deathRecreationalDrugs'].answer}</Grid>
					</Grid>
				</Box>
			}
			<Box className="section">
				<Typography className="title">Blood Pressure</Typography>
				<Typography>{q['bloodPressure'].answer}</Typography>
				{q['bloodPressure'].answer === 'Controlled with Medicine' &&
					<Typography>{q['bloodPressureMedication'].answer.split('|').join(', ')}</Typography>
				}
				{q['bloodPressureMedication'].answer === 'Other' &&
					<Typography>{q['bloodPressureMedication_other'].answer}</Typography>
				}
			</Box>
			{q['overTheCounterDrugs'].answer === 'Yes' &&
				<Box className="section">
					<Typography className="title">Other Prescriptions or Over The Counter Medication</Typography>
					<Grid container spacing={1}>
						{q['conditionsTreated'].answer.split('|').map(s => {
							let v = _CONDITIONS[s];
							return (
								<React.Fragment key={v}>
									<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>{s}</strong></Typography></Grid>
									<Grid item xs={12} sm={8} md={9} lg={10}>
										<Typography>
											{q[v + 'Medication'].answer.split('|').map(s =>
												s === 'Other' ? q[v + 'Medication_other'].answer : s
											)}
										</Typography>
										{v === 'diabetes' && q['diabetesMedication_other'].answer !== '' &&
											<Typography>{q['diabetesMedication_other'].answer}</Typography>
										}
									</Grid>
								</React.Fragment>
							);
						})}
					</Grid>
				</Box>
			}
			{q['allergies'].answer.toLowerCase() !== 'none' &&
				<Box className="section">
					<Typography className="title">Medication Allergies</Typography>
					<Typography>{q['allergies'].answer}</Typography>
				</Box>
			}
			{q['malePatternBaldness'].answer === 'Yes' && q['malePatternBaldnessDrugs'].answer !== 'None of the above' &&
				<Box className="section">
					<Typography className="title">Drug for Baldness</Typography>
					<Typography>{q['malePatternBaldnessDrugs'].answer}</Typography>
				</Box>
			}
			{(q['additionalMeds'].answer.toLowerCase() !== 'none' || q['additionalDetails'].answer.toLowerCase() !== 'no') &&
				<Box className="section">
					<Typography className="title">Other Medical / Medicinal mentions</Typography>
					{q['additionalMeds'].answer !== 'None' &&
						<Typography>{q['additionalMeds'].answer}</Typography>
					}
					{q['additionalDetails'].answer !== 'None' &&
						<Typography>{q['additionalDetails'].answer}</Typography>
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
						<Typography>{q['erectionConfidence'].answer}</Typography>
					</Grid>
					<Grid item xs={12} md={4} lg={2}>
						<Typography><strong>Penetration</strong></Typography>
						<Typography>{q['erectionHardnessBefore'].answer}</Typography>
					</Grid>
					<Grid item xs={12} md={4} lg={2}>
						<Typography><strong>Maintained</strong></Typography>
						<Typography>{q['erectionHardnessAfter'].answer}</Typography>
					</Grid>
					<Grid item xs={12} md={4} lg={2}>
						<Typography><strong>Difficulty</strong></Typography>
						<Typography>{q['erectionCompletion'].answer}</Typography>
					</Grid>
					<Grid item xs={12} md={4} lg={2}>
						<Typography><strong>Satisfactory</strong></Typography>
						<Typography>{q['sexSatisfaction'].answer}</Typography>
					</Grid>
					<Hidden mdDown>
						<Grid item lg={1}>&nbsp;</Grid>
					</Hidden>
				</Grid>
			</Box>
			{bOxytocin &&
				<Box className="section">
					<Typography className="title">Oxytocin</Typography>
					<Grid container spacing={1}>
						<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>Increased Intensity</strong></Typography></Grid>
						<Grid item xs={12} sm={8} md={9} lg={10}>{q['betterAfterED'].answer}</Grid>
						<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>Increased Intimacy</strong></Typography></Grid>
						<Grid item xs={12} sm={8} md={9} lg={10}>{q['increasedIntimacy'].answer}</Grid>
						<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>Migraines?</strong></Typography></Grid>
						<Grid item xs={12} sm={8} md={9} lg={10}>{q['sufferFrom'].answer}</Grid>
						<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>Migraine Cause</strong></Typography></Grid>
						<Grid item xs={12} sm={8} md={9} lg={10}>{q['headacheCause'].answer}</Grid>
						<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>Haloperidol?</strong></Typography></Grid>
						<Grid item xs={12} sm={8} md={9} lg={10}>{q['haloperidol'].answer}</Grid>
						<Grid item xs={12} sm={4} md={3} lg={2}><Typography><strong>Misoprostol?</strong></Typography></Grid>
						<Grid item xs={12} sm={8} md={9} lg={10}>{q['misoprostol'].answer}</Grid>
					</Grid>
				</Box>
			}
			<PreviousMeds
				customerId={props.customerId}
				onPatientCreate={id => patientSet(id)}
				patientId={patient}
				user={props.user}
			/>
			<SOAP
				order={props.order}
				ref={refSOAP}
				treated={q['treatedForED'].answer === 'No' ? false : true}
			/>
		</Box>
	);
}

// Valid props
MIP.propTypes = {
	customerId: PropTypes.string.isRequired,
	order: PropTypes.object.isRequired
}
