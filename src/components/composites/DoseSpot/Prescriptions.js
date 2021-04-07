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
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Element components
import { GreenButton } from 'components/elements/Buttons';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared data modules
import DS from 'shared/data/dosespot';

// Shared generic modules
import Events from 'shared/generic/events';
import { afindo, clone, date } from 'shared/generic/tools';

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
	let [items, itemsSet] = useState(props.customer.items.reduce((r,o) => ({...r, [o.productId]: {
		product: {_id: '0'},
		effective: date(new Date(), '-'),
		refills: 11
	}}), {}));
	let [products, productsSet] = useState([]);

	// Component mounted effect
	useEffect(() => {
		DS.products(props.type).then(products => {
			productsSet(products);
		}, error => {
			Events.trigger('error', JSON.stringify(error));
		})
	}, [props.type]);

	// Called to create the prescriptions
	function create() {

		// Generate the product data for the request
		let lProducts = []
		for(let productId in items) {
			if(items[productId].product._id !== '0') {
				lProducts.push({
					item_id: productId,
					effective: items[productId].effective,
					product_id: items[productId].product._id,
					refills: items[productId].refills
				});
			}
		}

		// If we have no products, do nothing and just notify the parent we're
		//	done
		if(lProducts.length === 0) {
			props.onCreated();
			return;
		}

		// Send the request to the server
		Rest.create('providers', 'prescriptions', {
			clinician_id: DS.clinicianId(),
			customer_id: props.customer.customerId,
			patient_id: props.patientId,
			products: lProducts
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				Events.trigger('error', JSON.stringify(res.error));
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Notify the provider
				Events.trigger('success', 'Prescriptions created, please approve each one in DoseSpot.');

				// Notify the parent we're done
				props.onCreated();
			}
		});
	}

	// Called when any of the refill selects is changed
	function itemChanged(item_id, type, ev) {
		let oItems = clone(items);
		oItems[item_id][type] = ev.currentTarget.value;
		itemsSet(oItems);
	}

	// Called when any of the products is changed
	function productChanged(item_id, ev) {

		// Clone the current product IDs
		let oItems = clone(items);

		// Find the product
		let o = afindo(products, '_id', ev.currentTarget.value);

		// If it's not found
		if(!o) {
			o = {_id: '0'};
		}

		// Update the list and set the state
		oItems[item_id].product = o;
		itemsSet(oItems);
	}

	// If we can remove
	let iGrid = props.onRemove ? 4 : 6;

	// Render
	return (
		<Box className="prescriptions">
			<Box className="section">
				<Typography className="title">Prescription</Typography>
				<Grid container spacing={2}>
					{props.customer.items.map(o =>
						<React.Fragment key={o.productId}>
							<Grid item xs={12} sm={5} className="product">
								<Box><Box><Typography>{o.description}</Typography></Box></Box>
							</Grid>
							<Grid item xs={12} sm={7}>
								<Select
									className='select'
									native
									onChange={ev => productChanged(o.productId, ev)}
									variant="outlined"
									value={items[o.productId].product._id}
								>
									<option value="0">Manual Prescription</option>
									<optgroup label="Favourites">
										{products.map(o =>
											<option key={o._id} value={o._id}>{o.title}</option>
										)}
									</optgroup>
								</Select>
							</Grid>
							{items[o.productId].product._id === '0' ?
								<Grid item xs={12}>
									<Typography>You will be asked to manually create the prescription in DoseSpot after you approve. Used for non-standard prescriptions.</Typography>
								</Grid>
							:
								<React.Fragment>
									<Grid item xs={4} md={2} lg={1}><Typography><strong>Display</strong></Typography></Grid>
									<Grid item xs={8} md={4} lg={2}><Typography>{items[o.productId].product.display}</Typography></Grid>
									<Grid item xs={4} md={2} lg={2}><Typography><strong>Quanity</strong></Typography></Grid>
									<Grid item xs={8} md={4} lg={1}><Typography>{items[o.productId].product.quantity}</Typography></Grid>
									<Grid item xs={4} md={2} lg={2}><Typography><strong>Days Supply</strong></Typography></Grid>
									<Grid item xs={8} md={4} lg={1}><Typography>{items[o.productId].product.supply}</Typography></Grid>
									<Grid item xs={4} md={2} lg={1}><Typography><strong>Directions</strong></Typography></Grid>
									<Grid item xs={8} md={4} lg={2}><Typography>{items[o.productId].product.directions}</Typography></Grid>
									<Grid item xs={12} sm={4} md={2} lg={1}><Typography><strong>Refills</strong></Typography></Grid>
									<Grid item xs={12} sm={8} md={4} lg={2}>
										<Select
											className="select"
											native
											onChange={ev => itemChanged(o.productId, 'refills', ev)}
											variant="outlined"
											value={items[o.productId].refills}
										>
											<option value="0">0</option><option value="1">1</option><option value="2">2</option>
											<option value="3">3</option><option value="4">4</option><option value="5">5</option>
											<option value="6">6</option><option value="7">7</option><option value="8">8</option>
											<option value="9">9</option><option value="10">10</option><option value="11">11</option>
										</Select>
									</Grid>
									<Grid item xs={12} sm={4} md={2} lg={1}><Typography><strong>Effective</strong></Typography></Grid>
									<Grid item xs={12} sm={8} md={4} lg={2}>
										<TextField
											onChange={ev => itemChanged(o.productId, 'effective', ev)}
											type="date"
											value={items[o.productId].effective}
											variant="outlined"
										/>
									</Grid>
								</React.Fragment>
							}
						</React.Fragment>
					)}
				</Grid>
			</Box>
			<Grid container spacing={1} className="rta">
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
	customer: PropTypes.object.isRequired,
	onRemove: PropTypes.func,
	onCreated: PropTypes.func.isRequired,
	onTransfer: PropTypes.func.isRequired,
	patientId: PropTypes.number.isRequired,
	type: PropTypes.oneOf(['ed', 'hrt']).isRequired
}


