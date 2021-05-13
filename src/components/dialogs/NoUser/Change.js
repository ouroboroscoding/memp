/**
 * Change
 *
 * Handles changing a forgotten password
 *
 * @author Chris Nasr <bast@maleexcel.com>
 * @copyright MaleExcelMedical
 * @created 2020-10-14
 */

// NPM modules
import React, { useRef, useState } from 'react';

// Material UI
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import Hash from 'shared/generic/hash';

// Theme
const useStyles = makeStyles((theme) => ({
	dialog: {
		"& .MuiFormControl-root": {
			marginTop: '10px',
			width: '100%'
		}
	}
}));

// Sign In
export default function Change(props) {

	// Styles
	const classes = useStyles();

	// State
	let [errors, errorsSet] = useState({})

	// Refs
	let passRef = useRef();
	let confirmRef = useRef();

	function keyPressed(ev) {
		if(ev.key === 'Enter') {
			change();
		} else {
			errorsSet({});
		}
	}

	function change() {

		// Verify the two passwords match
		if(passRef.current.value !== confirmRef.current.value) {
			Events.trigger('error', 'Passwords do not match');
			errorsSet({"confirm": "Passwords do not match"});
			return;
		}

		// Call the signin
		Rest.update('patient', 'account/forgot', {
			"key": props.keyVal,
			"passwd": passRef.current.value
		}, {"session": false}).done(res => {

			// If there's an error
			if(res.error && !res._handled) {
				switch(res.error.code) {
					case 1001:
						// Go through each message and mark the error
						let errors = {};
						for(let i in res.error.msg) {
							errors[i] = res.error.msg[i];
						}
						errorsSet(errors);
						break;
					case 1903:
						Events.trigger('error', 'Key or account no longer valid');
						Hash.set('key', null);
						break;
					case 1904:
						Events.trigger('error', 'New password not strong enough');
						errorsSet({"key": 'Must contain at least one uppercase, lowercase, and numeric character'});
						break;
					default:
						Events.trigger('error', JSON.stringify(res.error));
						break;
				}
			}

			// If there's a warning
			if(res.warning) {
				Events.trigger('warning', JSON.stringify(res.warning));
			}

			// If there's data
			if(res.data) {

				// Notify success
				Events.trigger('success', 'Password successfully changed');

				// Remove the has key so we go to sign in
				Hash.set('key', null);
			}
		});
	}

	return (
		<React.Fragment>
			<DialogTitle id="confirmation-dialog-title">Set New Password</DialogTitle>
			<DialogContent className={classes.dialog} dividers>
				<div><TextField
					error={errors.passwd ? true : false}
					helperText={errors.passwd || ''}
					inputRef={passRef}
					label="New Password"
					onKeyPress={keyPressed}
					type="password"
				/></div>
				<div><TextField
					error={errors.confirm ? true : false}
					helperText={errors.confirm || ''}
					inputRef={confirmRef}
					label="Confirm Password"
					onKeyPress={keyPressed}
					type="password"
				/></div>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" color="primary" onClick={change}>
					Change Password
				</Button>
			</DialogActions>
		</React.Fragment>
	);
}
