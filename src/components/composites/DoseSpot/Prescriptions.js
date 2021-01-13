/**
 * Prescriptions
 *
 * Handles displaying the available products that can be used to make
 * prescriptions
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-01-11
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';

// Element components
import { GreenButton } from 'components/elements/Buttons';

// Shared data modules
import DS from 'shared/data/dosespot';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindo, clone } from 'shared/generic/tools';

/**
 * Prescriptions
 *
 * Displays drop downs to create prescriptions associated with the order items
 *
 * @name Prescriptions
 * @access public
 * @param Object props Attributes sent to the component
 * @extends React.Component
 */
export default function Prescriptions(props) {

	// State
	let [rx, rxSet] = useState(props.items.reduce((r,o) => ({...r, [o.productId]: {_id: '0'}}), {}));
	let [products, productsSet] = useState([]);
	let [refills, refillsSet] = useState(props.items.reduce((r,o) => ({...r, [o.productId]: '11'}), {}))

	// Component mounted effect
	useEffect(() => {
		DS.products(this.props.type).then(products => {
			productsSet(products);
		}, error => {
			Events.trigger('error', JSON.stringify(error));
		})
	}, []);

	function create() {

	}

	function refillsChanged(item_id, ev) {
		let oRefills = clone(refills);
		oRefills[item_id] = ev.currentTarget.value;
		refillsSet(oRefills);
	}

	function rxChanged(item_id, ev) {

		// Clone the current product IDs
		let oRx = clone(rx);

		// Find the product
		let o = afindo(products, '_id', ev.currentTarget.value);

		// If it's not found
		if(!o) {
			o = {_id: '0'};
		}

		// Update the list and set the state
		oRx[item_id] = o;
		rxSet(oRx);
	}

	// If we can remove
	let iGrid = props.onRemove ? 4 : 6;

	// Render
	return (
		<Box className="prescriptions">
			<Box className="section">
				<Typography className="title">Prescription</Typography>
				<Grid container spacing={2}>
					{props.items.map(o =>
						<React.Fragment key={o.productId}>
							<Grid item xs={12} sm={5} className="product">
								<Box><Box><Typography>{o.description}</Typography></Box></Box>
							</Grid>
							<Grid item xs={12} sm={7}>
								<Select
									className='select'
									native
									onChange={ev => rxChanged(o.productId, ev)}
									variant="outlined"
									value={this.state.product[o.productId]._id}
								>
									<option value="0">Manual Prescription</option>
									{this.state.products.map(o =>
										<option key={o._id} value={o._id}>{o.title}</option>
									)}
								</Select>
							</Grid>
							{rx[o.productId]._id === '0' ?
								<Grid item xs={12}>
									<Typography>You will be asked to manually create the prescription in DoseSpot after you approve. Used for non-standard prescriptions.</Typography>
								</Grid>
							:
								<React.Fragment>
									<Grid item xs={4} md={2} lg={1}><Typography><strong>Display</strong></Typography></Grid>
									<Grid item xs={8} md={4} lg={2}><Typography>{this.state.product[o.productId].display}</Typography></Grid>
									<Grid item xs={4} md={2} lg={2}><Typography><strong>Quanity</strong></Typography></Grid>
									<Grid item xs={8} md={4} lg={1}><Typography>{this.state.product[o.productId].quantity}</Typography></Grid>
									<Grid item xs={4} md={2} lg={2}><Typography><strong>Days Supply</strong></Typography></Grid>
									<Grid item xs={8} md={4} lg={1}><Typography>{this.state.product[o.productId].supply}</Typography></Grid>
									<Grid item xs={4} md={2} lg={1}><Typography><strong>Directions</strong></Typography></Grid>
									<Grid item xs={8} md={4} lg={2}><Typography>{this.state.product[o.productId].directions}</Typography></Grid>
									<Grid item xs={12} sm={4} md={2} lg={1}><Typography><strong>Refills</strong></Typography></Grid>
									<Grid item xs={12} sm={8} md={4} lg={2}>
										<Select
											className="select"
											native
											onChange={ev => refillsChanged(o.productId, ev)}
											variant="outlined"
											value={refills[o.productId]}
										>
											<option value="0">0</option><option value="1">1</option><option value="2">2</option>
											<option value="3">3</option><option value="4">4</option><option value="5">5</option>
											<option value="6">6</option><option value="7">7</option><option value="8">8</option>
											<option value="9">9</option><option value="10">10</option><option value="11">11</option>
										</Select>
									</Grid>
								</React.Fragment>
							}
						</React.Fragment>
					)}
				</Grid>
			</Box>
			<Grid container spacing={1}>
				{props.onRemove &&
					<Grid item xs={iGrid}>
						<Button
							color="secondary"
							onClick={props.onRemove}
							variant="contained"
						>{props.mobile ? 'x' : 'Remove Claim'}</Button>
					</Grid>
				}
				<Grid item xs={iGrid}>
					<Button
						onClick={props.onTransfer}
						variant="contained"
					>Transfer</Button>
				</Grid>
				<Grid item xs={iGrid}>
					<GreenButton
						onClick={create}
						variant="contained"
					>Create Prescriptions</GreenButton>
				</Grid>
			</Grid>
		</Box>
	);
}

// Valid props
Prescriptions.propTypes = {
	items: PropTypes.arrayOf(PropTypes.object).isRequired,
	onRemove: PropTypes.func,
	onTransfer: PropTypes.func.isRequired,
	patientId: PropTypes.number.isRequired,
	type: PropTypes.oneOf(['ed', 'hrt']).isRequired
}


