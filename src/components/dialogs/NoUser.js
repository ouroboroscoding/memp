/**
 * No User
 *
 * Dialog when there's no user
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-14
 */

// NPM modules
import React, { useEffect, useState } from 'react';

// Material UI
import Dialog from '@material-ui/core/Dialog';

// Generic modules
import Hash from '../../generic/hash';

// Child components
import Change from './nouser/Change';
import Forgot from './nouser/Forgot';
import SignIn from './nouser/SignIn';

// Hooks
import useLocationHash from '../../hooks/hash.js';

// Key types
const keyTypes = {
	"f": "forgot",
	"c": "change"
}

// Sign In
export default function Signin(props) {

	// State
	let [key, keySet] = useState(null);

	// Hooks
	useLocationHash('key', keyChange);

	// Init only effect
	useEffect(() => {

		// See if we have a forgot or setup key
		let sKey = Hash.get('key');

		// If we got a key, figure out the type
		keySet(sKey === null ? null : {"type": keyTypes[sKey.charAt(0)], "value": sKey.substr(1)});
	}, []);

	function keyChange(value) {
		keySet(value === null ? null : {"type": keyTypes[value.charAt(0)], "value": value.substr(1)});
	}

	let type = key === null ? 'signin' : key.type;

	return (
		<Dialog
			disableBackdropClick
			disableEscapeKeyDown
			fullWidth={true}
			maxWidth="sm"
			open={true}
			aria-labelledby="confirmation-dialog-title"
		>
			{type === 'signin' &&
				<SignIn />
			}
			{type === 'change' &&
				<Change keyVal={key.value} />
			}
			{type === 'forgot' &&
				<Forgot />
			}
		</Dialog>
	);
}
