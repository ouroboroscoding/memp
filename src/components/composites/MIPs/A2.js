/**
 * MIP A2
 *
 * A2 ED MIP
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-11-03
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import Typography from '@material-ui/core/Typography';

// Element components
import { GreyButton } from 'components/elements/Buttons';

// Local modules
import Utils from 'utils';

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
 * A2
 *
 * Primary MIP type for ED customers
 *
 * @name A2
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function A2(props) {

	// State
	let [questions, questionsSet] = useState(null);

	// Data effect
	useEffect(() => {

		// Store the questions by ref
		let oQuestions = {}
		for(let o of props.questions) {
			oQuestions[o.ref] = {
				title: o.title,
				answer: o.answer
			}
		}
		questionsSet(oQuestions);

	}, [props.questions])

	// Avoid issues with missing questions
	function q(name) {
		if(!(name in questions) || !questions[name].answer) {
			console.log('MIP questions missing: ', name);
			return 'NO ANSWER!';
		}

		// Return the question's answer
		return questions[name].answer;
	}

	// Render
	if(questions === null) {
		return <span />
	} else {
		return (
			<Box className="mip">
				<Box className="section header">
					<Typography className="title">
						{props.form} - {Utils.niceDate(props.date, props.mobile ? 'short' : 'long')}
						<span> - <GreyButton variant="outlined" onClick={props.onChange}>{props.display ? 'Hide' : 'Display'}</GreyButton></span>
					</Typography>
				</Box>
				{props.display &&
					<React.Fragment>
						<Box className="section">
							<Grid container spacing={1}>
								<Grid item xs={6} md={3}><Typography><strong>Gender: </strong>{q('gender')}</Typography></Grid>
								<Grid item xs={6} md={3}><Typography><strong>DOB: </strong>{q('birthdate')} ({Utils.age(new Date(q('birthdate') + 'T00:00:00'))})</Typography></Grid>
								<Grid item xs={6} md={3}><Typography><strong>Height: </strong>{q('height').replace(' ft', "'").replace(' in', '"')}</Typography></Grid>
								<Grid item xs={6} md={3}><Typography><strong>Weight: </strong>{q('weight')} lbs</Typography></Grid>
							</Grid>
						</Box>
						<Box className="section">
							<Typography className="title">Previous ED Medication</Typography>
							{q('treatedForED') === 'No' ?
								<Typography>No</Typography>
							:
								<Grid container spacing={1}>
									{q('prescribedMeds').split('|').map(s => {
										let v = _ED_MEDS[s];
										let m = s === 'Other' ? q('prescribedMeds_other') : s;
										let sTaking = q(v + 'StopTakingIt');
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
													{sTaking === 'Yes' ?
														<Typography>No longer taking | {q(v + 'WhyStopTaking')}</Typography>
													:
														<Typography className="no">{sTaking === 'No' ? 'Still using medication' : 'Did not specify if still using medication'}</Typography>
													}
												</Grid>
											</React.Fragment>
										);
									})}
								</Grid>
							}
						</Box>
						<Box className="section">
							<Typography className="title">Nitrate Medications</Typography>
							{q('deathNitrates') === 'None Apply' ?
								<Typography>None Apply</Typography>
							:
								<Typography>{q('deathNitrates')} | {q('NitrateMed')}</Typography>
							}
						</Box>
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
							{q('bloodPressureMedication').includes('Other') &&
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
				}
			</Box>
		);
	}
}

// Valid props
A2.propTypes = {
	date: PropTypes.string.isRequired,
	display: PropTypes.bool.isRequired,
	form: PropTypes.string.isRequired,
	mobile: PropTypes.bool.isRequired,
	onChange: PropTypes.func.isRequired,
	questions: PropTypes.array.isRequired
}
