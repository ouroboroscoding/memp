/**
 * Patient Pharmacy Add
 *
 * Handles displaying the form to add a pharmacy to an existing DoseSpot account
 * for a customer
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2021-05-27
 */

// NPM modules
import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';

// Material UI
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

// Composites components
import Pharmacies from 'components/elements/Pharmacies';

// Shared communications modules
import Rest from 'shared/communication/rest';

// Shared data modules
import DS from 'shared/data/dosespot';

// Shared generic modules
import Events from 'shared/generic/events';
import { clone } from 'shared/generic/tools';

// Shared components
import RadioButtons from 'shared/components/RadioButtons';

/**
 * Patient Pharmacy Add
 *
 * Allows adding a new pharmacy to a patient
 *
 * @name PatientPharmacyAdd
 * @access public
 * @param Object props Attributes sent to the component
 * @return React.Component
 */
export default function PatientPharmacyAdd(props) {

	// State
	let [type, typeSet] = useState('existing');
	let [pharmacy, pharmacySet] = useState('');
	let [results, resultsSet] = useState(null);
	let [searchFields, searchFieldsSet] = useState({});

	// Refs
	let refPharmacy = useRef();

	// Update the patient account with DoseSpot
	function add() {

		// If we're in existing mode
		let iPharmacyID = (type === 'existing') ?
							refPharmacy.current.value :
							pharmacy;

		// Add the pharmacy
		DS.pharmacyAdd(props.patientId, parseInt(iPharmacyID, 10)).then(res => {
			Events.trigger('success', 'Pharmacy Added');
			props.onAdded(res);
		}, error => {
			if(error.code === 1602) {
				Events.trigger('error', 'DoseSpot error: "' + error.msg + '"')
			} else {
				Events.trigger('error', Rest.errorMessage(error));
			}
		});
	}

	// Searches for Pharmacies on DoseSpot
	function search() {

		// Search
		DS.pharmacySearch(searchFields).then(data => {
			resultsSet(data);
		}, error => {
			if(error.code === 1602) {
				Events.trigger('error', 'DoseSpot error: "' + error.msg + '"')
			} else {
				Events.trigger('error', Rest.errorMessage(error));
			}
		})
	}

	// Sets a specific field in the search values
	function searchSet(field, value) {
		let oFields = clone(searchFields);
		if(value.trim === '') {
			delete oFields[field];
		} else {
			oFields[field] = value;
		}
		searchFieldsSet(oFields);
	}

	// Render
	return (
		<Paper style={{padding: '10px'}}>
			<Typography style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px'}}>Add a Pharmacy</Typography>
			<RadioButtons
				buttonProps={{style: {width: '100%'}}}
						gridContainerProps={{spacing: 2}}
						gridItemProps={{xs: 12, md: 6}}
				onChange={val => typeSet(val)}
				options={[
					{value: 'existing', title: 'Known Pharmacies'},
					{value: 'search', title: 'Search'}
				]}
				value={type}
				variant="grid"
			/>
			<br />
			{type === 'existing' ?
				<Pharmacies defaultValue={56387} ref={refPharmacy} />
			:
				<React.Fragment>
					<Grid container spacing={2} className="nodeParent">
						{['name', 'address', 'city', 'state', 'zip', 'phoneOrFax'].map(s =>
							<Grid key={s} item xs={12} sm={6} md={4} lg={3} className="field">
								<TextField onChange={ev => searchSet(s, ev.target.value)} value={searchFields[s] || ''} placeholder={s} label={s} variant="outlined" />
							</Grid>
						)}
						<Grid item xs={12} sm={6} md={4} lg={3} className="field">
							<Select
								native
								onChange={ev => searchSet('specialty', ev.target.value)}
								value={searchFields['specialty'] || ''}
								variant="outlined"
							>
								<option value="">Any</option>
								<option value="2048">EPCS</option>
								<option value="64">24 Hour</option>
								<option value="32">Long Term Care</option>
								<option value="1">Mail Order</option>
								<option value="8">Retail</option>
								<option value="16">Speciality</option>
							</Select>
						</Grid>
						<Grid item xs={12} sm={6} md={4} lg={3}>
							<Button color="primary" onClick={search} variant="contained">Search Pharmacies</Button>
						</Grid>
					</Grid>
					{results != null &&
						(results.length === 0 ?
							<Typography>Nothing found</Typography>
						:
							<React.Fragment>
								<Typography style={{fontWeight: 'bold'}}>Found:</Typography>
								<Select
									className="Pharmacies_Select"
									native
									onChange={ev => pharmacySet(ev.target.value)}
									value={pharmacy}
									variant="outlined"
								>
									<option value="0">Select pharmacy...</option>
									{results.map(o =>
										<option key={o.pharmacyId} value={o.pharmacyId}>{o.name}</option>
									)}
								</Select>
							</React.Fragment>
						)
					}
				</React.Fragment>
			}
			<Box className="actions">
				<br />
				<Button color="secondary" onClick={props.onCancel} variant="contained">Cancel</Button>
				<Button color="primary" onClick={add} variant="contained">Add Pharmacy</Button>
			</Box>
		</Paper>
	);
}

// Valid props
PatientPharmacyAdd.propTypes = {
	patientId: PropTypes.number.isRequired,
	onCancel: PropTypes.func.isRequired,
	onAdded: PropTypes.func.isRequired
}
