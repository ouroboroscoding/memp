/**
 * Utils
 *
 * Shared utilities
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-04
 */

// Generic modules
import Events from './generic/events';
import Rest from './generic/rest';

// Regex
const rePhone = /^1?(\d{3})(\d{3})(\d{4})$/

// Rights
const oRights = {
	"create": 0x04,
	"delete": 0x08,
	"read": 0x01,
	"update": 0x02
}

/**
 * Utils
 */
export default {

	age: function(dob) {
		let ageDifMs = Date.now() - dob.getTime();
		let ageDate = new Date(ageDifMs); // miliseconds from epoch
		return Math.abs(ageDate.getUTCFullYear() - 1970);
	},

	date: function(ts, separator='/') {
		if(typeof ts === 'number') {
			ts = new Date(ts*1000);
		}
		var Y = '' + ts.getFullYear();
		var M = '' + (ts.getMonth() + 1);
		if(M.length === 1) M = '0' + M;
		var D = '' + ts.getDate();
		if(D.length === 1) D = '0' + D;
		return Y + separator + M + separator + D;
	},

	datetime: function(ts) {
		if(typeof ts === 'number') {
			ts = new Date(ts*1000);
		}
		var t = ['', '', ''];
		t[0] += ts.getHours();
		if(t[0].length === 1) t[0] = '0' + t[0];
		t[1] += ts.getMinutes();
		if(t[1].length === 1) t[1] = '0' + t[1];
		t[2] += ts.getSeconds();
		if(t[2].length === 1) t[2] = '0' + t[2];
		return this.date(ts) + ' ' + t.join(':')
	},

	errorTree: function(errors) {

		// Init the return
		var oRet = {}

		// Go through each error
		for(let i = 0; i < errors.length; ++i) {

			// If the error field has a period
			if(errors[i][0].includes('.')) {

				// Split it
				let lField = errors[i][0].split(/\.(.*)/)

				// If we don't have the field already
				if(!oRet[lField[0]]) {
					oRet[lField[0]] = []
				}

				// Add the rest
				oRet[lField[0]].push([lField[1], errors[i][1]]);
			}

			// Else it's a flat field
			else {
				oRet[errors[i][0]] = errors[i][1];
			}
		}

		// Go through all the errors we found
		for(let k in oRet) {

			// If we find an array
			if(Array.isArray(oRet[k])) {

				// Recurse
				oRet[k] = this.errorTree(oRet[k]);
			}
		}

		// Return the Tree
		return oRet;
	},

	hasRight: function(user, name, type) {

		// If we have no user
		if(!user) {
			return false;
		}

		// If the user doesn't have the right
		if(!(name in user.permissions)) {
			return false;
		}

		// Return on the right having the type
		return (user.permissions[name].rights & oRights[type]) ? true : false;
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

	nicePhone: function(val) {
		let lMatch = rePhone.exec(val);
		if(!lMatch) {
			return val;
		}
		return '(' + lMatch[1] + ') ' + lMatch[2] + '-' + lMatch[3];
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
	},

	restError: function(err) {

		// What error is it?
		switch(err.code) {

			// No Session
			case 102:

				// Clear session
				Rest.session(null);

				// Nothing else to do
				return true;

			case 207:

				// Notify the user
				Events.trigger('error', 'Request to ' + err.msg + ' failed. Please contact support');

				// Nothing else to do
				return true;

			// Insufficient rights
			case 1000:

				// Notify the user
				Events.trigger('error', 'You lack the necessary rights to do the requested action');

				// Nothing else to do
				return true;

			// Invalid fields
			case 1001:

				// Rebuild the error message
				err.msg = this.errorTree(err.msg);

				// But allow the child to deal with the messages themselves
				return false;

			// no default
		}

		// Failed to process error
		return false;
	}
}
