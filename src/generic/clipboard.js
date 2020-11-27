/**
 * Clipboard
 *
 * Handles adding text to the clipboard
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2018-11-24
 */

/**
 * Copy
 *
 * Attempts to add text to the clipboard
 *
 * @name copy
 * @access public
 * @param String text The text to add to the clipboard
 * @return Promise
 */
export function copy(text) {

	// If we find the api
	if(navigator.clipboard) {
		return navigator.clipboard.writeText(text);
	}

	// Else, fallback to copying from a textarea we create ourselves
	else {
		return new Promise((resolve, reject) => {

			// Create a text area to place the text in then select it
			let oEl = document.createElement("textarea");
			oEl.value = text;
			oEl.style.top = "0";
			oEl.style.left = "0";
			oEl.style.position = "fixed";
			document.body.appendChild(oEl);
			oEl.focus();
			oEl.select();

			// Try to copy the text to the clipboard
			let bRes = false;
			let mErr = null;
			try {
				bRes = document.execCommand('copy');
			} catch(err) {
				mErr = err;
			}

			// Remove the textarea and return the result
			document.body.removeChild(oEl);

			// Resolve or reject
			if(mErr) {
				reject(mErr);
			} else {
				resolve(bRes);
			}
		});
	}
}

export default {
	copy: copy
}
