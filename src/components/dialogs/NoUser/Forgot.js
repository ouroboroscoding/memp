/**
 * Forgot
 *
 * Allows the user to request a password change
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
import Link from '@material-ui/core/Link';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

// Shared communication modules
import Rest from 'shared/communication/rest';

// Shared generic modules
import Events from 'shared/generic/events';
import Hash from 'shared/generic/hash';

// Theme
const useStyles = makeStyles((theme) => ({
	forgot: {
		flexGrow: 1,
		textAlign: 'center',
	},
	dialog: {
		"& .MuiFormControl-root": {
			marginTop: '10px',
			width: '100%'
		}
	}
}));

// Sign In
export default function Forgot(props) {

	// Styles
	const classes = useStyles();

	// State
	let [errors, errorsSet] = useState({})

	// Refs
	let emailRef = useRef();

	function keyPressed(ev) {
		if(ev.key === 'Enter') {
			forgot();
		} else {
			errorsSet({});
		}
	}

	function forgot() {

		// Call the signin
		Rest.create('patient', 'account/forgot', {
			"email": emailRef.current.value,
			"url": 'https://' + process.env.REACT_APP_SELF_DOMAIN + '/#key=c'
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
			if('data' in res) {

				// Notify success
				Events.trigger('success', 'Thank you, if the e-mail is valid in our system, you will received a link to change your password.');

				// Remove the has key so we go to sign in
				Hash.set('key', null);
			}
		});
	}

	return (
		<React.Fragment>
			<DialogTitle id="confirmation-dialog-title">Forgot Password</DialogTitle>
			<DialogContent className={classes.dialog} dividers>
				<p>
					Please enter the email associated with your
					account and we will send you a link to reset
					your password.
				</p>
				<TextField
					error={errors.email ? true : false}
					helperText={errors.email || ''}
					inputRef={emailRef}
					label="E-mail Address"
					onKeyPress={keyPressed}
					type="text"
				/>
			</DialogContent>
			<DialogActions>
				<div className={classes.forgot}>
					<Link color="secondary" href="#">Return to Sign In</Link>
				</div>
				<Button variant="contained" color="primary" onClick={forgot}>
					Request Password Change
				</Button>
			</DialogActions>
		</React.Fragment>
	);
}
