/**
 * Pharmacies
 *
 * Shows a drop down of the current active pharmacies that can be used as
 * defaults when creating a new patient
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-12-02
 */

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material-UI
import Select from '@material-ui/core/Select';

// Shared data modules
import DS from 'shared/data/dosespot';

// Generic modules
import Events from 'shared/generic/events';

/**
 * Pharmacies
 *
 * Select drop down
 *
 * @name Pharmacies
 * @access public
 * @extends React.Component
 */
export default class Pharmacies extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Init state
		this.state = {
			id: props.defaultValue.toString(),
			list: []
		}

		// Bind methods
		this.change = this.change.bind(this);
	}

	componentDidMount() {
		DS.pharmacies().then(data => {
			this.setState({list: data});
		}, error => {
			Events.trigger('error', Rest.errorMessage(error));
		});
	}

	change(ev) {
		this.setState({id: ev.currentTarget.value});
	}

	render() {
		return (
			<Select
				className="Pharmacies_Select"
				native
				onChange={this.change}
				value={this.state.id}
				variant="outlined"
			>
				<option value="0">Select default pharmacy...</option>
				{this.state.list.map(o =>
					<option key={o._id} value={o.pharmacyId}>{o.name}</option>
				)}
			</Select>
		);
	}

	get value() {
		return parseInt(this.state.id, 10);
	}

	set value(val) {
		this.setState({id: val.toString()});
	}
}

// Valid props
Pharmacies.propTypes = {
	defaultValue: PropTypes.number
}

// Default props
Pharmacies.defaultProps = {
	defaultValue: 0
}
