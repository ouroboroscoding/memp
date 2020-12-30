/**
 * Utils
 *
 * Shared utilities
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-04-04
 */

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
const Utils = {

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
	}
}
export default Utils;
