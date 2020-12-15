/**
 * ED SOAP
 *
 * Handles displaying the Subjective, Objective, Assessment, and Plan
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-11-09
 */

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';

const _PLANS = [
	["Sildenafil 100mg/2", "Cleared for Sildenafil. Patient instructed to break tab in half for initial dose to administer 50mg by mouth once daily 60 minutes prior to sexual activity as needed. If no results with the initial 50mg dose by first 60 minutes after administration patient may take other half tab dose for a total of 100mg. May increase to 100mg by mouth once daily as tolerated. Precautions and side effects reviewed with patient."],
	["Sildenafil 100mg", "Cleared for Sildenafil 100mg po qday prn sexual activity. Dose to be taken 60 minutes prior to anticipated sexual activity. Precautions and side effects reviewed with patient."],
	["Tadalafil 5mg", "Cleared for Tadalafil 5 mg po daily. Precautions given. Follow up as needed."],
	["Tadalafil 20mg", "Cleared for Generic Tadalafil 20mg po q72h prn sexual activity.  Dose to be taken 3-4 hours prior to anticipated sexual activity.  Precautions and side effects reviewed with patient."]
];

/**
 * SOAP
 *
 * Displays SOAP notes with the ability to edit them if need be
 *
 * @name SOAP
 * @extends React.Component
 */
export default class SOAP extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Initial state (not used in this component)
		this.state = {}

		// Refs
		this.subjective = React.createRef();
		this.objective = React.createRef();
		this.assessment = React.createRef();
		this.plan = React.createRef();

		// Bind methods
		this.setPlan = this.setPlan.bind(this);

		// Order items
		this.items = props.order.items.map(o => o.description).join(', ');
	}

	setPlan(ev) {
		// Blank out the plan if they choose "Choose Plan..." otherwise use the
		//	value from the const
		this.plan.current.value = (ev.target.value === '-1') ? '' :
									_PLANS[ev.target.value];
	}

	render() {
		let sSubjective = "Mr " + this.props.order.shipping.firstName + " " + this.props.order.shipping.lastName + " presents to the clinic requesting a prescription for erectile dysfuntion issues. He has " + (this.props.treated ? '' : 'not ') + "been treated for these issues prior.";
		let sObjective = "Intake reviewed. No contraindications found in medical or prescription history preventing use of medications for erectile dysfunction."
		let sAssessment = "Erectile Dysfunction";
		let sPlan = '', iPlan = -1;
		if(this.items.includes('Sildenafil')) {
			if(this.items.includes('100mg')) {
				iPlan = 1;
				sPlan = _PLANS[1][1];
			}
		} else if(this.items.includes('Tadalafil')) {
			if(this.items.includes('5mg')) {
				iPlan = 2;
				sPlan = _PLANS[2][1];
			} else if(this.items.includes('20mg')) {
				iPlan = 3;
				sPlan = _PLANS[3][1];
			}
		}

		return (
			<Box id="soap" className="section">
				<Typography className="title">SOAP Notes</Typography>
				<Grid container spacing={1}>
					<Grid item xs={12} md={6} lg={3}>
						<Typography><strong>Subjective</strong></Typography>
						<textarea defaultValue={sSubjective} ref={this.subjective} rows={7} />
					</Grid>
					<Grid item xs={12} md={6} lg={3}>
						<Typography><strong>Objective</strong></Typography>
						<textarea defaultValue={sObjective} ref={this.objective} rows={7} />
					</Grid>
					<Grid item xs={12} md={6} lg={3}>
						<Typography><strong>Assessment</strong></Typography>
						<textarea defaultValue={sAssessment} ref={this.assessment} rows={7} />
					</Grid>
					<Grid item xs={12} md={6} lg={3}>
						<Typography><strong>Plan</strong></Typography>
						<Select
							className='select'
							defaultValue={iPlan}
							native
							onChange={this.setPlan}
							variant="outlined"

						>
							<option key={-1} value={-1}>Choose Plan...</option>
							{_PLANS.map((l,i) =>
								<option key={i} value={i}>{l[0]}</option>
							)}
						</Select>
						<textarea defaultValue={sPlan} ref={this.plan} rows={4} />
					</Grid>
				</Grid>
			</Box>
		);
	}

	get value() {
		return "Subjective:\n   " + this.subjective.current.value +
				"\nObjective:\n   " + this.objective.current.value +
				"\nAssessment:\n   " + this.assessment.current.value +
				"\nPlan:\n   " + this.plan.current.value;
	}
}

// Valid props
SOAP.propTypes = {
	order: PropTypes.object.isRequired
}
