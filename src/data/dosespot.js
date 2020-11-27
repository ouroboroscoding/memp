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

/**
 * Create
 *
 * Create a new patient ID from a customer ID
 *
 * @name create
 * @access public
 * @param Number customer_id The ID of the customer to create a patient for
 * @return Number
 */
export function create(customer_id) {

	// If init not called
	if(!_clinicianId) {
		throw new Error('Must call init() before create().');
	}

	// Return promise
	return new Promise((resolve, reject) => {

		// Call the rest request
		Rest.create('monolith', 'customer/dsid', {
			clinician_id: _clinicianId,
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
			if(res.data) {
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
 * @return Number
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
			if(res.data) {
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
}

/**
 * Medications
 *
 * Fetches a list of medications associated with the patient
 *
 * @name medications
 * @access public
 * @param Number patient_id The ID of the patient to fetch the medications for
 * @return String
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
			if(res.data) {
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
 * @return String
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
 * @return String
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
			if(res.data) {
				resolve(res.data);
			}
		});
	});
}

// Export all
export default {
	create: create,
	fetch: fetch,
	init: init,
	medications: medications,
	prescriptions: prescriptions,
	sso: sso
}
