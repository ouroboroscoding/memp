/**
 * DoseSpot
 *
 * Functions to deal with dosespot
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-11-13
 */

// Generic modules
import Events from '../generic/events';
import Rest from '../generic/rest';

// Local modules
import Utils from '../utils';

// Module data
let _clinicianId = null;
let _pharmacies = null;

/**
 * Create
 *
 * Create a new patient ID from a customer ID
 *
 * @name create
 * @access public
 * @param Number customer_id The ID of the customer to create a patient for
 * @param Number [varname] [description]
 * @return Promise(Number)
 */
export function create(customer_id, pharmacy_id=null) {

	// If init not called
	if(!_clinicianId) {
		throw new Error('Must call init() before create().');
	}

	// Return promise
	return new Promise((resolve, reject) => {

		// Init the data
		let dData = {
			clinician_id: _clinicianId,
			customerId: customer_id
		}

		// If a pharmacy was passed
		if(pharmacy_id) {
			dData['pharmacy_id'] = pharmacy_id;
		}

		// Call the rest request
		Rest.create('monolith', 'customer/dsid', dData).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				switch(res.error.code) {
					case 1104:
						if(res.error.msg === 'mip') {
							Events.trigger('error', 'No DOB found for customer');
						} else {
							Events.trigger('error', 'The page or item you requested does not exist');
						}
						break;
					case 1910:
						Events.trigger('error', 'No DOB found for customer');
						break;
					default:
						reject(res.error);
				}
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if('data' in res) {
				resolve(res.data);
			}
		});
	});
}

/**
 * Details
 *
 * Fetches patient details
 *
 * @name details
 * @access public
 * @param Number patient_id The ID of the patient to fetch the details for
 * @return Promise(Object)
 */
export function details(patient_id) {

	// If init not called
	if(!_clinicianId) {
		throw new Error('Must call DoseSpot.init() before details().');
	}

	// Return promise
	return new Promise((resolve, reject) => {

		// Call the rest request
		Rest.read('prescriptions', 'patient', {
			clinician_id: _clinicianId,
			patient_id: patient_id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				reject(res.error);
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if('data' in res) {
				resolve(res.data);
			}
		});
	});
}

/**
 * Fetch
 *
 * Fetch the Patient ID from a customer ID
 *
 * @name fetch
 * @access public
 * @param Number customer_id The ID of the customer to fetch the patient for
 * @return Promise(Number)
 */
export function fetch(customer_id) {

	// Return promise
	return new Promise((resolve, reject) => {

		// Call the rest request
		Rest.read('monolith', 'customer/dsid', {
			customerId: customer_id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				reject(res.error);
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if('data' in res) {
				resolve(res.data);
			}
		});
	});
}

/**
 * Init
 *
 * Stores the clinician ID so it doesn't need to be passed around to components
 *
 * @name init
 * @access public
 * @param Number clinician_id A clinician ID associated with the logged in user
 * @return void
 */
export function init(clinician_id) {

	// Convert if necessary
	if(typeof clinician_id === 'number') {
		_clinicianId = clinician_id;
	} else {
		_clinicianId = parseInt(clinician_id, 10);
	}

	// Reset the pharmacies
	_pharmacies = null;
}

/**
 * Medications
 *
 * Fetches a list of medications associated with the patient
 *
 * @name medications
 * @access public
 * @param Number patient_id The ID of the patient to fetch the medications for
 * @return Promise(Array)
 */
export function medications(patient_id) {

	// If init not called
	if(!_clinicianId) {
		throw new Error('Must call DoseSpot.init() before medications().');
	}

	// Return promise
	return new Promise((resolve, reject) => {

		// Call the rest request
		Rest.read('prescriptions', 'patient/medications', {
			clinician_id: _clinicianId,
			patient_id: patient_id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				reject(res.error);
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we got data
			if('data' in res) {
				resolve(res.data);
			}
		});
	});
}

/**
 * Pharmacies
 *
 * Fetches a list of active pharmacies used
 *
 * @name pharmacies
 * @access public
 * @return Promise(Array)
 */
export function pharmacies(patient_id) {

	// Return promise
	return new Promise((resolve, reject) => {

		// If we already have the data
		if(_pharmacies !== null) {
			resolve(_pharmacies);
		}

		// Call the rest request
		Rest.read('prescriptions', 'pharmacies', {}, {background: true}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				reject(res.error);
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {
				resolve(res.data);
			}
		});
	});
}

/**
 * Prescriptions
 *
 * Fetches a list of prescriptions associated with the patient
 *
 * @name prescriptions
 * @access public
 * @param Number patient_id The ID of the patient to fetch the prescriptions for
 * @return Promise(Array)
 */
export function prescriptions(patient_id) {

	// If init not called
	if(!_clinicianId) {
		throw new Error('Must call DoseSpot.init() before prescriptions().');
	}

	// Return promise
	return new Promise((resolve, reject) => {

		// Call the rest request
		Rest.read('prescriptions', 'patient/prescriptions', {
			clinician_id: _clinicianId,
			patient_id: patient_id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				reject(res.error);
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {
				resolve(res.data);
			}
		});
	});
}

/**
 * SSO
 *
 * Fetches an SSO link for the given patient
 *
 * @name sso
 * @access public
 * @param Number patient_id The ID of the patient to fetch the URL for
 * @return Promise(String)
 */
export function sso(patient_id) {

	// If init not called
	if(!_clinicianId) {
		throw new Error('Must call DoseSpot.init() before any other methods.');
	}

	// Return promise
	return new Promise((resolve, reject) => {

		// Call the rest request
		Rest.read('prescriptions', 'patient/sso', {
			clinician_id: _clinicianId,
			patient_id: patient_id
		}).done(res => {

			// If there's an error or warning
			if(res.error && !Utils.restError(res.error)) {
				reject(res.error);
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if('data' in res) {
				resolve(res.data);
			}
		});
	});
}

// Export all
export default {
	create: create,
	details: details,
	fetch: fetch,
	init: init,
	medications: medications,
	pharmacies: pharmacies,
	prescriptions: prescriptions,
	sso: sso
}
