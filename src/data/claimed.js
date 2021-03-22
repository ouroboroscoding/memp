/**
 * Claimed
 *
 * Functions to add or remove claims
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-14
 */

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';

/**
 * Add
 *
 * Sends a request to add a claim to a patient
 *
 * @name add
 * @public
 * @param Number customer_id The customer ID
 * @param String order_id The order ID
 * @param Boolean continuous Is the order a continuous one?
 * @return Promise
 */
export function add(customer_id, order_id, continuous=false) {

	// Return promise
	return new Promise((resolve, reject) => {

		// Send the claim  to the server
		Rest.create('monolith', 'order/claim', {
			customerId: customer_id,
			orderId: order_id,
			continuous: continuous
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
				// If we're at max claims
				if(res.error.code === 1505) {
					Events.trigger('error', 'You\'ve reached the maximum number of claims. Please resolve or unclaim previous claims.');
				} else {
					reject(res.error);
				}
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

/**
 * Fetch
 *
 * Sends a request to get all conversations claimed by the user
 *
 * @name fetch
 * @public
 * @return Promise
 */
export function fetch(customer_id) {

	// Return promise
	return new Promise((resolve, reject) => {

		// Fetch the claimed
		Rest.read('monolith', 'order/claimed', {}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
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

/**
 * Remove
 *
 * Sends a request to remove a claim to a conversation
 *
 * @name remove
 * @public
 * @param String customer_id The conversation phone customerId
 * @param String reason The reason for removing the claim
 * @return Promise
 */
export function remove(customer_id, reason) {

	// Return promise
	return new Promise((resolve, reject) => {

		// Send the removal to the server
		Rest.delete('monolith', 'order/claim', {
			customerId: customer_id,
			reason: reason
		}).done(res => {

			// If there's an error or warning
			if(res.error && !res._handled) {
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

/**
 * Transfer
 *
 * Transfers an order to an agent then removes the claim
 *
 * @name transfer
 * @param String customer_id The ID of the customer
 * @param Integer agent The memo ID of the agent
 * @param String note The note to add to the transfer
 * @return Promise
 */
export function transfer(customer_id, agent, note) {

	// Return promise
	return new Promise((resolve, reject) => {

		// Send the message to the server
		Rest.update('monolith', 'order/transfer', {
			agent: agent,
			customerId: customer_id,
			note: note
		}).done(res => {

			// If there's an error or a warning
			if(res.error && !res._handled) {
				reject(res.error);
			}
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If we're ok
			if(res.data) {

				// Remove the claim
				remove(customer_id, 'transferred').then(res => {
					resolve();
				}, error => {
					reject(error);
				});
			}
		});
	});
}

// Default export
const Claimed = {
	add: add,
	fetch: fetch,
	remove: remove,
	transfer: transfer
};
export default Claimed;
