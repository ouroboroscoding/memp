/**
 * ED Prescription
 *
 * Handles displaying the available products that can be used to make
 * a prescription
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-01-11
 */

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';

// Shared data modules
import DoseSpot from 'shared/data/dosespot';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindo } from 'shared/generic/tools';

/**
 * Prescription
 *
 * Displays SOAP notes with the ability to edit them if need be
 *
 * @name SOAP
 * @extends React.Component
 */
export default class Prescription extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Initial state (not used in this component)
		this.state = {
			product: {_id: '0'},
			products: [],
			refills: '11'
		}

		// Bind methods
		this.productChanged = this.productChanged.bind(this);
	}

	componentDidMount() {
		DoseSpot.products('ed').then(products => {
			this.setState({products: products});
		}, error => {
			Events.trigger('error', JSON.stringify(error));
		})
	}

	productChanged(ev) {

		// Find the product
		let oProduct = afindo(this.state.products, '_id', ev.currentTarget.value);

		// If it's not found
		if(!oProduct) {
			oProduct = {_id: '0'};
		}

		// Set the state
		this.setState({product: oProduct});
	}

	render() {
		return (
			<Box id="prescription" className="section">
				<Typography className="title">Prescription</Typography>
				<Select
					className='select'
					native
					onChange={this.productChanged}
					variant="outlined"
					value={this.state.product._id}
				>
					<option value="0">Manual Prescription</option>
					{this.state.products.map(o =>
						<option key={o._id} value={o._id}>{o.title}</option>
					)}
				</Select>
				<Box style={{margin: '10px 0'}}>
					{this.state.product._id === '0' ?
						<Typography>Create prescription in DoseSpot manually. Used for non-standard prescriptions.</Typography>
					:
						<Grid container spacing={2}>
							<Grid item xs={12} sm={4} md={2} lg={1}><Typography><strong>Display</strong></Typography></Grid>
							<Grid item xs={12} sm={8} md={4} lg={2}><Typography>{this.state.product.display}</Typography></Grid>
							<Grid item xs={12} sm={4} md={2} lg={1}><Typography><strong>Quanity</strong></Typography></Grid>
							<Grid item xs={12} sm={8} md={4} lg={2}><Typography>{this.state.product.quantity}</Typography></Grid>
							<Grid item xs={12} sm={4} md={2} lg={1}><Typography><strong>Days Supply</strong></Typography></Grid>
							<Grid item xs={12} sm={8} md={4} lg={2}><Typography>{this.state.product.supply}</Typography></Grid>
							<Grid item xs={12} sm={4} md={2} lg={1}><Typography><strong>Directions</strong></Typography></Grid>
							<Grid item xs={12} sm={8} md={4} lg={2}><Typography>{this.state.product.directions}</Typography></Grid>
							<Grid item xs={12} sm={4} md={2} lg={1}><Typography><strong>Refills</strong></Typography></Grid>
							<Grid item xs={12} sm={8} md={4} lg={2}>
								<Select
									className="select"
									native
									onChange={ev => this.setState({refills: ev.currentTarget.value})}
									variant="outlined"
									value={this.state.refills}
								>
									<option value="0">0</option><option value="1">1</option><option value="2">2</option>
									<option value="3">3</option><option value="4">4</option><option value="5">5</option>
									<option value="6">6</option><option value="7">7</option><option value="8">8</option>
									<option value="9">9</option><option value="10">10</option><option value="11">11</option>
								</Select>
							</Grid>
						</Grid>
					}
				</Box>
			</Box>
		);
	}
}

// Valid props
Prescription.propTypes = {
	order: PropTypes.object.isRequired
}
