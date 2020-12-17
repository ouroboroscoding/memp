/**
 * MIP CED
 *
 * Continuous ED MIP
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
import Typography from '@material-ui/core/Typography';

// Element components
import { GreyButton } from '../../elements/Buttons';

// Local modules
import Utils from '../../../utils';

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
export default function CED(props) {

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
							<Typography className="title">Did the prescribed medication work?</Typography>
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
				}
			</Box>
		);
	}
}

// Valid props
CED.propTypes = {
	date: PropTypes.string.isRequired,
	display: PropTypes.bool.isRequired,
	form: PropTypes.string.isRequired,
	mobile: PropTypes.bool.isRequired,
	onChange: PropTypes.func.isRequired,
	questions: PropTypes.object.isRequired
}
