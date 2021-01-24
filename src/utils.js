/**
 * Utils
 *
 * Shared utilities
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-04
 */

/**
 * Utils
 */
const Utils = {

	age: function(dob) {
		let ageDifMs = Date.now() - dob.getTime();
		let ageDate = new Date(ageDifMs); // miliseconds from epoch
		return Math.abs(ageDate.getUTCFullYear() - 1970);
	},

	niceDate: function(d, text='long') {

		// Convert if not a date
		if(typeof d === 'number') {
			d = new Date(d*1000);
		}
		else if(typeof d === 'string') {
			d = new Date(d);
		}

		// Return locale date
		return d.toLocaleDateString('en-US', {
			day: 'numeric',
			month: text,
			weekday: text,
			year: 'numeric'
		});
	},

	parsePath(path) {
		// Split the path by /
		return path.substr(1).split('/');
	},

	path(order) {
		let sType = order.type;
		if(order.continuous) {
			sType += '-c';
		}

		// Generate the base URI
		let sURI = '/' + sType + '/' + order.customerId;

		// If there's an order ID
		if(order.orderId) {
			sURI += '/' + order.orderId;
		}

		// Return the URI
		return sURI;
	}
}
export default Utils;
